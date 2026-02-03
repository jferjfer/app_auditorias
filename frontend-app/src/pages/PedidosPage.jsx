import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function PedidosPage() {
    const [searchParams] = useSearchParams();
    const documento = searchParams.get('documento');
    const bodega = searchParams.get('bodega');
    const [pedidos, setPedidos] = useState([]);
    const [selectedPedidos, setSelectedPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [iniciando, setIniciando] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (documento) {
            loadPedidos();
        }
    }, [documento]);

    const loadPedidos = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/pedidos?documento=${documento}&bodega=${encodeURIComponent(bodega)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPedidos(data);
            // Seleccionar solo pedidos pendientes por defecto
            const pendientes = data.filter(p => p.estado === 'pendiente').map(p => p.numero_pedido);
            setSelectedPedidos(pendientes);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePedido = (numeroPedido) => {
        setSelectedPedidos(prev =>
            prev.includes(numeroPedido)
                ? prev.filter(p => p !== numeroPedido)
                : [...prev, numeroPedido]
        );
    };

    const handleIniciarAuditoria = async () => {
        if (selectedPedidos.length === 0) {
            alert('Selecciona al menos un pedido');
            return;
        }

        setIniciando(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/iniciar-auditoria`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documento_domiciliario: documento,
                    bodega: bodega,
                    pedidos_seleccionados: selectedPedidos
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error');
            }

            const data = await response.json();
            navigate(`/ultima-milla/auditar/${data.auditoria_id}`);
        } catch (error) {
            alert('Error al iniciar auditoría: ' + error.message);
        } finally {
            setIniciando(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente');
    const pedidosAuditados = pedidos.filter(p => p.estado === 'auditado');

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>📦 Pedidos del Domiciliario</h2>
                    <p className="text-muted">Selecciona los pedidos a auditar</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    ← Volver
                </button>
            </div>

            {pedidosPendientes.length > 0 && (
                <>
                    <h4 className="mb-3">Pedidos Pendientes</h4>
                    <div className="list-group mb-4">
                        {pedidosPendientes.map((pedido, index) => (
                            <div key={index} className="list-group-item">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedPedidos.includes(pedido.numero_pedido)}
                                        onChange={() => handleTogglePedido(pedido.numero_pedido)}
                                        id={`pedido-${index}`}
                                    />
                                    <label className="form-check-label w-100" htmlFor={`pedido-${index}`}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-1">Pedido #{pedido.numero_pedido}</h5>
                                                <small className="text-muted">
                                                    {pedido.total_productos} SKU | {pedido.total_unidades} unidades
                                                </small>
                                            </div>
                                            <span className="badge bg-warning text-dark">Pendiente</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="d-grid gap-2 mb-4">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleIniciarAuditoria}
                            disabled={selectedPedidos.length === 0 || iniciando}
                        >
                            {iniciando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Iniciando...
                                </>
                            ) : (
                                `🚀 Iniciar Auditoría (${selectedPedidos.length} pedidos)`
                            )}
                        </button>
                    </div>
                </>
            )}

            {pedidosAuditados.length > 0 && (
                <>
                    <h4 className="mb-3 text-success">Pedidos Auditados</h4>
                    <div className="list-group">
                        {pedidosAuditados.map((pedido, index) => (
                            <div key={index} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-1">Pedido #{pedido.numero_pedido}</h5>
                                        <small className="text-muted">
                                            {pedido.total_productos} SKU | {pedido.total_unidades} unidades
                                        </small>
                                    </div>
                                    <span className="badge bg-success">✓ Auditado</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {pedidos.length === 0 && (
                <div className="alert alert-warning">
                    No hay pedidos para este domiciliario.
                </div>
            )}
        </div>
    );
}

export default PedidosPage;

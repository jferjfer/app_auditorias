import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function DomiciliariosPage() {
    const [searchParams] = useSearchParams();
    const bodega = searchParams.get('bodega');
    const [domiciliarios, setDomiciliarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (bodega) {
            loadDomiciliarios();
        }
    }, [bodega]);

    const loadDomiciliarios = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/domiciliarios?bodega=${encodeURIComponent(bodega)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setDomiciliarios(data);
        } catch (error) {
            console.error('Error cargando domiciliarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDomiciliario = (domiciliario) => {
        navigate(`/ultima-milla/pedidos?documento=${domiciliario.documento}&bodega=${encodeURIComponent(bodega)}`);
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>👤 Domiciliarios - {bodega}</h2>
                    <p className="text-muted">Selecciona un domiciliario para ver sus pedidos</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/ultima-milla/bodegas')}>
                    ← Volver a Bodegas
                </button>
            </div>

            {domiciliarios.length === 0 ? (
                <div className="alert alert-warning">
                    No hay domiciliarios en esta bodega.
                </div>
            ) : (
                <div className="list-group">
                    {domiciliarios.map((domiciliario, index) => (
                        <div
                            key={index}
                            className="list-group-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelectDomiciliario(domiciliario)}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1">{domiciliario.nombre}</h5>
                                    <small className="text-muted">CC: {domiciliario.documento}</small>
                                </div>
                                <div className="text-end">
                                    <span className="badge bg-primary me-2">
                                        {domiciliario.total_pedidos} pedidos
                                    </span>
                                    <span className="badge bg-warning text-dark me-2">
                                        {domiciliario.pedidos_pendientes} pendientes
                                    </span>
                                    <span className="badge bg-success">
                                        {domiciliario.pedidos_auditados} auditados
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DomiciliariosPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function BodegasPage() {
    const [bodegas, setBodegas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [selectedBodega, setSelectedBodega] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmError, setConfirmError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadBodegas();
    }, []);

    const loadBodegas = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/bodegas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBodegas(data);
        } catch (error) {
            console.error('Error cargando bodegas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBodega = (bodega) => {
        setSelectedBodega(bodega);
        setShowConfirmModal(true);
        setPassword('');
        setConfirmError('');
    };

    const handleConfirm = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/confirmar-auditor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error');
            }
            
            setShowConfirmModal(false);
            navigate(`/ultima-milla/domiciliarios?bodega=${encodeURIComponent(selectedBodega.bodega)}`);
        } catch (error) {
            setConfirmError(error.message || 'Contraseña incorrecta');
        }
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
                <h2>📍 Seleccionar Bodega</h2>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/ultima-milla')}>
                    ← Volver
                </button>
            </div>

            {bodegas.length === 0 ? (
                <div className="alert alert-warning">
                    No hay bodegas cargadas. Por favor carga un archivo Excel primero.
                </div>
            ) : (
                <div className="row">
                    {bodegas.map((bodega, index) => (
                        <div key={index} className="col-md-6 mb-3">
                            <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer' }}
                                 onClick={() => handleSelectBodega(bodega)}>
                                <div className="card-body">
                                    <h4 className="card-title">{bodega.bodega}</h4>
                                    <hr />
                                    <div className="row text-center">
                                        <div className="col-4">
                                            <h5 className="text-primary">{bodega.total_domiciliarios}</h5>
                                            <small className="text-muted">Domiciliarios</small>
                                        </div>
                                        <div className="col-4">
                                            <h5 className="text-warning">{bodega.pedidos_pendientes}</h5>
                                            <small className="text-muted">Pendientes</small>
                                        </div>
                                        <div className="col-4">
                                            <h5 className="text-success">{bodega.pedidos_auditados}</h5>
                                            <small className="text-muted">Auditados</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">🔐 Confirmar Auditor</h5>
                                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Bodega seleccionada:</strong> {selectedBodega?.bodega}</p>
                                <p className="text-muted">Ingresa tu contraseña para confirmar</p>
                                
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                                />

                                {confirmError && (
                                    <div className="alert alert-danger mt-2 mb-0">{confirmError}</div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                                    Cancelar
                                </button>
                                <button className="btn btn-primary" onClick={handleConfirm} disabled={!password}>
                                    Confirmar y Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BodegasPage;

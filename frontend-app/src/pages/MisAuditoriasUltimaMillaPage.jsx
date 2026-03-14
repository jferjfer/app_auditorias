import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function MisAuditoriasUltimaMillaPage() {
    const [auditorias, setAuditorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAuditorias();
    }, []);

    const loadAuditorias = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/mis-auditorias`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setAuditorias(data);
        } catch (error) {
            console.error('Error cargando auditorías:', error);
        } finally {
            setLoading(false);
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
                <h2>📋 Mis Auditorías de Última Milla</h2>
                <div>
                    <button className="btn btn-primary me-2" onClick={() => navigate('/ultima-milla')}>
                        + Nueva Auditoría
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/auditor')}>
                        ← Volver
                    </button>
                </div>
            </div>

            {auditorias.length === 0 ? (
                <div className="alert alert-info">
                    No tienes auditorías de última milla. 
                    <button className="btn btn-link" onClick={() => navigate('/ultima-milla')}>
                        Crear una nueva
                    </button>
                </div>
            ) : (
                <div className="row">
                    {auditorias.map((auditoria) => {
                        const progreso = auditoria.total_productos > 0 
                            ? (auditoria.productos_auditados / auditoria.total_productos * 100).toFixed(1)
                            : 0;
                        
                        return (
                            <div key={auditoria.auditoria_id} className="col-md-6 mb-3">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="card-title">
                                                Auditoría #{auditoria.auditoria_id}
                                            </h5>
                                            <span className={`badge bg-${
                                                auditoria.estado === 'finalizada' ? 'success' : 
                                                auditoria.estado === 'en_progreso' ? 'warning' : 'secondary'
                                            }`}>
                                                {auditoria.estado === 'finalizada' ? '✓ Finalizada' : 
                                                 auditoria.estado === 'en_progreso' ? '⏳ En Progreso' : auditoria.estado}
                                            </span>
                                        </div>
                                        
                                        <p className="mb-1"><strong>Bodega:</strong> {auditoria.bodega}</p>
                                        <p className="mb-1"><strong>Domiciliario:</strong> {auditoria.nombre_domiciliario}</p>
                                        <p className="mb-1"><strong>CC:</strong> {auditoria.documento_domiciliario}</p>
                                        <p className="mb-1"><strong>Pedidos:</strong> {auditoria.total_pedidos}</p>
                                        
                                        <hr />
                                        
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                Progreso: {auditoria.productos_auditados} / {auditoria.total_productos} productos
                                            </small>
                                            <div className="progress" style={{ height: '20px' }}>
                                                <div 
                                                    className={`progress-bar ${auditoria.estado === 'finalizada' ? 'bg-success' : ''}`}
                                                    style={{ width: `${progreso}%` }}
                                                >
                                                    {progreso}%
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {auditoria.estado === 'finalizada' && auditoria.porcentaje_cumplimiento !== null && (
                                            <div className="alert alert-success mb-2 py-2">
                                                <strong>Cumplimiento:</strong> {auditoria.porcentaje_cumplimiento}%
                                            </div>
                                        )}
                                        
                                        <small className="text-muted d-block mb-2">
                                            Creada: {new Date(auditoria.creada_en).toLocaleString('es-CO')}
                                        </small>
                                        
                                        <button 
                                            className={`btn btn-${auditoria.estado === 'finalizada' ? 'info' : 'primary'} w-100`}
                                            onClick={() => navigate(`/ultima-milla/auditar/${auditoria.auditoria_id}`)}
                                        >
                                            {auditoria.estado === 'finalizada' ? '👁️ Ver Detalles' : '▶️ Continuar Auditoría'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MisAuditoriasUltimaMillaPage;

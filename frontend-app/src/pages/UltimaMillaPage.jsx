import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function UltimaMillaPage() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [cleaningPending, setCleaningPending] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleCleanPending = async () => {
        if (!window.confirm('¿Eliminar TODOS los pedidos pendientes? Esta acción no se puede deshacer.')) {
            return;
        }
        
        setCleaningPending(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/limpiar-pendientes`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al limpiar pedidos');
            }
            
            const data = await response.json();
            setMessage(`✅ ${data.message}`);
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setCleaningPending(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Por favor selecciona un archivo');
            return;
        }

        setLoading(true);
        setMessage('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('access_token');
            const url = `${API_BASE_URL}/api/ultima-milla/upload`;
            console.log('📤 Subiendo archivo:', file.name);
            console.log('📍 URL:', url);
            console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            console.log('📥 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                let errorDetail;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetail = errorJson.detail || 'Error al cargar archivo';
                } catch {
                    errorDetail = errorText || 'Error al cargar archivo';
                }
                throw new Error(errorDetail);
            }

            const data = await response.json();
            console.log('✅ Respuesta exitosa:', data);
            setMessage(`✅ ${data.message}\n📦 ${data.pedidos} pedidos | ${data.productos} productos\n🏢 Bodegas: ${data.bodegas?.join(', ')}`);
            setFile(null);
            
            setTimeout(() => {
                navigate('/ultima-milla/bodegas');
            }, 2000);
        } catch (error) {
            console.error('❌ Error completo:', error);
            if (error.name === 'AbortError') {
                setMessage('❌ Timeout: El archivo tardó más de 5 minutos. Intenta con un archivo más pequeño o contacta al administrador.');
            } else {
                setMessage(`❌ Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">📦 Auditoría Última Milla</h3>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>Formato del archivo Excel:</strong>
                                <ul className="mb-0 mt-2">
                                    <li>bodega</li>
                                    <li>documento domiciliario</li>
                                    <li>nombre domiciliario</li>
                                    <li>sku</li>
                                    <li>numero de pedido</li>
                                    <li>descripcion</li>
                                    <li>gramaje</li>
                                    <li>cantidad</li>
                                </ul>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Seleccionar archivo Excel</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                    key={file ? file.name : 'empty'}
                                />
                                {file && (
                                    <small className="text-success mt-1 d-block">
                                        ✅ {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </small>
                                )}
                            </div>

                            {message && (
                                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Cargando...
                                        </>
                                    ) : (
                                        '📤 Cargar Pedidos'
                                    )}
                                </button>

                                <button
                                    className="btn btn-info"
                                    onClick={() => navigate('/ultima-milla/mis-auditorias')}
                                >
                                    📋 Mis Auditorías
                                </button>

                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/ultima-milla/bodegas')}
                                >
                                    Ver Bodegas Cargadas
                                </button>
                                
                                <button
                                    className="btn btn-danger"
                                    onClick={handleCleanPending}
                                    disabled={cleaningPending}
                                >
                                    {cleaningPending ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Limpiando...
                                        </>
                                    ) : (
                                        '🗑️ Limpiar Pedidos Pendientes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UltimaMillaPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function UltimaMillaPage() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Por favor selecciona un archivo');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('access_token');
            const url = `${API_BASE_URL}/api/ultima-milla/upload`;
            console.log('Enviando a:', url);
            console.log('Token:', token ? 'Existe' : 'No existe');
            console.log('Archivo:', file.name, file.size, 'bytes');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al cargar archivo');
            }

            const data = await response.json();
            console.log('Respuesta:', data);
            setMessage(`✅ ${data.message}`);
            setTimeout(() => {
                navigate('/ultima-milla/bodegas');
            }, 1500);
        } catch (error) {
            console.error('Error completo:', error);
            setMessage(`❌ Error: ${error.message}`);
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
                                />
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UltimaMillaPage;

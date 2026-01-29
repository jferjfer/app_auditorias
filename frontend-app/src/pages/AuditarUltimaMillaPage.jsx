import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import CameraScanner from '../components/CameraScanner';

let selectedVoice = null;
let voicesLoaded = false;

if ('speechSynthesis' in window) {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 && !voicesLoaded) {
      selectedVoice = voices.find(v => v.lang === 'es-CO' || v.lang === 'es-MX') || 
                      voices.find(v => v.lang.startsWith('es')) || 
                      voices[0];
      voicesLoaded = true;
    }
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const speak = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.lang = 'es-CO';
  utterance.rate = 1.3;
  utterance.pitch = 1.1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
};

function AuditarUltimaMillaPage() {
    const { auditoriaId } = useParams();
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [finalizando, setFinalizando] = useState(false);
    const [skuBusqueda, setSkuBusqueda] = useState('');
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [lastScannedSku, setLastScannedSku] = useState(null);
    const [lastScannedProduct, setLastScannedProduct] = useState(null);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const autoSaveTimerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadProductos();
        setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, [auditoriaId]);

    const loadProductos = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/auditoria/${auditoriaId}/productos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProductos(data);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActualizarProducto = async (productoId, data) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/api/ultima-milla/producto/${productoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            loadProductos();
        } catch (error) {
            alert('Error al actualizar producto: ' + error.message);
        }
    };

    const handleScanSku = (e) => {
        if (e.key === 'Enter' && skuBusqueda.trim()) {
            procesarEscaneo(skuBusqueda.trim());
            setSkuBusqueda('');
        }
    };

    // 🚀 DOBLE ESCANEO INTELIGENTE
    const procesarEscaneo = async (sku) => {
        const producto = productos.find(p => 
            p.sku.toLowerCase().includes(sku.toLowerCase())
        );
        
        if (!producto) {
            speak('Producto no encontrado');
            return;
        }

        // Si es el mismo SKU escaneado 2 veces
        if (lastScannedSku === sku && lastScannedProduct?.id === producto.id) {
            // 2do escaneo: Abrir modal rápido
            speak('Confirmar cantidad');
            setShowQuickModal(true);
            setLastScannedProduct(producto);
        } else {
            // 1er escaneo: Auto-guardar el anterior si existe
            if (lastScannedProduct && lastScannedProduct.cantidad_fisica === null) {
                await autoGuardarProducto(lastScannedProduct.id, lastScannedProduct.cantidad_pedida);
            }

            // Marcar nuevo producto
            speak(`${producto.cantidad_pedida}`);
            setLastScannedSku(sku);
            setLastScannedProduct(producto);
            document.getElementById(`producto-${producto.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Iniciar timer de auto-guardado (15 segundos)
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(() => {
                autoGuardarProducto(producto.id, producto.cantidad_pedida);
            }, 15000);
        }
    };

    // ⚡ AUTO-GUARDADO
    const autoGuardarProducto = async (productoId, cantidadEsperada) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/api/ultima-milla/producto/${productoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cantidad_fisica: cantidadEsperada,
                    novedad: 'sin_novedad',
                    observaciones: 'Auto-guardado'
                })
            });
            speak('Guardado automático');
            loadProductos();
        } catch (error) {
            console.error('Error en auto-guardado:', error);
        }
    };

    const buscarYEnfocarProducto = (sku) => {
        procesarEscaneo(sku);
    };

    const handleCameraScan = (decodedText) => {
        setShowCameraScanner(false);
        procesarEscaneo(decodedText.trim());
    };

    const handleQuickModalConfirm = async (cantidad, novedad, observaciones) => {
        if (!lastScannedProduct) return;
        
        await handleActualizarProducto(lastScannedProduct.id, {
            cantidad_fisica: cantidad,
            novedad: novedad || 'sin_novedad',
            observaciones: observaciones || ''
        });
        
        setShowQuickModal(false);
        setLastScannedSku(null);
        setLastScannedProduct(null);
        speak('Guardado');
    };

    const handleFinalizar = async () => {
        if (!window.confirm('¿Finalizar auditoría?')) return;

        setFinalizando(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/auditoria/${auditoriaId}/finalizar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            alert(`✅ Auditoría finalizada\nCumplimiento: ${data.porcentaje_cumplimiento}%`);
            navigate('/ultima-milla/bodegas');
        } catch (error) {
            alert('Error al finalizar: ' + error.message);
        } finally {
            setFinalizando(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    const productosAuditados = productos.filter(p => p.cantidad_fisica !== null).length;
    const progreso = productos.length > 0 ? (productosAuditados / productos.length * 100).toFixed(1) : 0;

    return (
        <div className="container-fluid mt-3" style={{maxWidth: '1400px', margin: '0 auto'}}>
            {/* HEADER CON PROGRESO */}
            <div className="card shadow-sm mb-3" style={{borderRadius: '15px', border: 'none'}}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 className="mb-1" style={{fontWeight: '700', color: '#2c3e50'}}>🚚 Auditoría Última Milla</h3>
                            <p className="mb-0 text-muted">Auditoría #{auditoriaId}</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-lg btn-success shadow-sm" 
                                onClick={handleFinalizar} 
                                disabled={finalizando}
                                style={{borderRadius: '10px', fontWeight: '600'}}
                            >
                                {finalizando ? '⏳ Finalizando...' : '✅ Finalizar'}
                            </button>
                            <button 
                                className="btn btn-lg btn-outline-secondary" 
                                onClick={() => navigate('/ultima-milla/bodegas')}
                                style={{borderRadius: '10px'}}
                            >
                                ← Volver
                            </button>
                        </div>
                    </div>
                    
                    {/* ESTADÍSTICAS */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <div className="p-3" style={{backgroundColor: '#e3f2fd', borderRadius: '10px'}}>
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{fontSize: '2rem'}}>📦</div>
                                    <div>
                                        <div style={{fontSize: '0.85rem', color: '#666'}}>Total Productos</div>
                                        <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#1976d2'}}>{productos.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-3" style={{backgroundColor: '#e8f5e9', borderRadius: '10px'}}>
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{fontSize: '2rem'}}>✅</div>
                                    <div>
                                        <div style={{fontSize: '0.85rem', color: '#666'}}>Auditados</div>
                                        <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#388e3c'}}>{productosAuditados}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-3" style={{backgroundColor: '#fff3e0', borderRadius: '10px'}}>
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{fontSize: '2rem'}}>⏳</div>
                                    <div>
                                        <div style={{fontSize: '0.85rem', color: '#666'}}>Pendientes</div>
                                        <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#f57c00'}}>{productos.length - productosAuditados}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div className="progress" style={{ height: '30px', borderRadius: '15px', backgroundColor: '#e0e0e0' }}>
                        <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            style={{ 
                                width: `${progreso}%`,
                                backgroundColor: progreso === 100 ? '#4caf50' : '#2196f3',
                                fontSize: '1rem',
                                fontWeight: '700'
                            }}
                        >
                            {progreso}% Completado
                        </div>
                    </div>
                </div>
            </div>

            {/* ESCÁNER */}
            <div className="card shadow-sm mb-3" style={{borderRadius: '15px', border: 'none', backgroundColor: '#f8f9fa'}}>
                <div className="card-body p-3">
                    <div className="input-group input-group-lg">
                        <span className="input-group-text" style={{backgroundColor: '#fff', border: '2px solid #dee2e6', borderRadius: '10px 0 0 10px'}}>
                            <span style={{fontSize: '1.5rem'}}>🔍</span>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Escanear código de barras o SKU..."
                            value={skuBusqueda}
                            onChange={(e) => setSkuBusqueda(e.target.value)}
                            onKeyPress={handleScanSku}
                            style={{
                                border: '2px solid #dee2e6',
                                fontSize: '1.1rem',
                                fontWeight: '500'
                            }}
                            autoFocus
                        />
                        {isMobile && (
                            <button 
                                className="btn btn-primary btn-lg" 
                                onClick={() => setShowCameraScanner(true)}
                                type="button"
                                style={{borderRadius: '0 10px 10px 0', fontWeight: '600'}}
                            >
                                📷 Cámara
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS EN TARJETAS */}
            <div className="row g-3">
                {productos.map((producto) => (
                    <ProductoCard
                        key={producto.id}
                        producto={producto}
                        onActualizar={handleActualizarProducto}
                        speak={speak}
                    />
                ))}
            </div>

            {showCameraScanner && (
                <CameraScanner 
                    onScan={handleCameraScan}
                    onClose={() => setShowCameraScanner(false)}
                    continuousMode={true}
                />
            )}

            {showQuickModal && lastScannedProduct && (
                <QuickNoveltyModal
                    producto={lastScannedProduct}
                    onConfirm={handleQuickModalConfirm}
                    onClose={() => {
                        setShowQuickModal(false);
                        setLastScannedSku(null);
                    }}
                />
            )}
        </div>
    );
}

// 🎨 TARJETA DE PRODUCTO (DISEÑO AMIGABLE)
function ProductoCard({ producto, onActualizar, speak }) {
    const [cantidadFisica, setCantidadFisica] = useState(producto.cantidad_fisica || '');
    const [novedad, setNovedad] = useState(producto.novedad || 'sin_novedad');
    const [observaciones, setObservaciones] = useState(producto.observaciones || '');
    const [guardando, setGuardando] = useState(false);
    const [editando, setEditando] = useState(false);

    const handleGuardar = async () => {
        if (cantidadFisica === '') {
            alert('⚠️ Ingresa la cantidad física');
            return;
        }

        setGuardando(true);
        await onActualizar(producto.id, {
            cantidad_fisica: parseInt(cantidadFisica),
            novedad,
            observaciones
        });
        speak('Guardado');
        setGuardando(false);
        setEditando(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGuardar();
        }
    };

    const isAuditado = producto.cantidad_fisica !== null;

    const getNovedadColor = () => {
        switch(novedad) {
            case 'sin_novedad': return '#4caf50';
            case 'faltante': return '#ff9800';
            case 'sobrante': return '#2196f3';
            case 'averia': return '#f44336';
            case 'vencido': return '#9c27b0';
            case 'fecha_corta': return '#ff5722';
            default: return '#757575';
        }
    };

    const getNovedadIcon = () => {
        switch(novedad) {
            case 'sin_novedad': return '✅';
            case 'faltante': return '⚠️';
            case 'sobrante': return '📦';
            case 'averia': return '💔';
            case 'vencido': return '⏰';
            case 'fecha_corta': return '📅';
            default: return '❓';
        }
    };

    return (
        <div className="col-12 col-md-6 col-lg-4">
            <div 
                id={`producto-${producto.id}`}
                className="card shadow-sm h-100" 
                style={{
                    borderRadius: '15px',
                    border: isAuditado ? '3px solid #4caf50' : '2px solid #e0e0e0',
                    backgroundColor: isAuditado ? '#f1f8f4' : '#fff',
                    transition: 'all 0.3s ease'
                }}
            >
                <div className="card-body p-3">
                    {/* HEADER */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <span className="badge" style={{backgroundColor: '#6c757d', fontSize: '0.75rem'}}>
                                {producto.numero_pedido || 'N/A'}
                            </span>
                            {isAuditado && (
                                <span className="badge bg-success ms-2" style={{fontSize: '0.75rem'}}>✓ Auditado</span>
                            )}
                        </div>
                        <div style={{fontSize: '1.5rem'}}>{getNovedadIcon()}</div>
                    </div>

                    {/* SKU Y DESCRIPCIÓN */}
                    <div className="mb-3">
                        <div style={{fontSize: '1.3rem', fontWeight: '700', color: '#2c3e50'}}>
                            {producto.sku}
                        </div>
                        <div style={{fontSize: '0.9rem', color: '#666', marginTop: '5px'}}>
                            {producto.descripcion}
                        </div>
                        {producto.gramaje && (
                            <div style={{fontSize: '0.85rem', color: '#999', marginTop: '3px'}}>
                                📏 {producto.gramaje}
                            </div>
                        )}
                    </div>

                    {/* CANTIDADES */}
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <div className="p-2 text-center" style={{backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
                                <div style={{fontSize: '0.75rem', color: '#666'}}>Pedida</div>
                                <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#1976d2'}}>
                                    {producto.cantidad_pedida}
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2 text-center" style={{backgroundColor: '#e8f5e9', borderRadius: '8px'}}>
                                <div style={{fontSize: '0.75rem', color: '#666'}}>Física</div>
                                <input
                                    type="number"
                                    className="form-control form-control-lg text-center"
                                    id={`cantidad-${producto.id}`}
                                    value={cantidadFisica}
                                    onChange={(e) => {
                                        setCantidadFisica(e.target.value);
                                        setEditando(true);
                                    }}
                                    onKeyPress={handleKeyPress}
                                    disabled={guardando}
                                    min="0"
                                    placeholder="0"
                                    style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: '#388e3c',
                                        padding: '0'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* NOVEDAD */}
                    <div className="mb-3">
                        <label style={{fontSize: '0.85rem', fontWeight: '600', color: '#666', marginBottom: '5px'}}>Novedad</label>
                        <select
                            className="form-select"
                            value={novedad}
                            onChange={(e) => setNovedad(e.target.value)}
                            disabled={guardando}
                            style={{
                                borderRadius: '8px',
                                border: `2px solid ${getNovedadColor()}`,
                                fontWeight: '600',
                                color: getNovedadColor()
                            }}
                        >
                            <option value="sin_novedad">✅ Sin Novedad</option>
                            <option value="faltante">⚠️ Faltante</option>
                            <option value="sobrante">📦 Sobrante</option>
                            <option value="averia">💔 Avería</option>
                            <option value="vencido">⏰ Vencido</option>
                            <option value="fecha_corta">📅 Fecha Corta</option>
                        </select>
                    </div>

                    {/* OBSERVACIONES */}
                    {novedad !== 'sin_novedad' && (
                        <div className="mb-3">
                            <label style={{fontSize: '0.85rem', fontWeight: '600', color: '#666', marginBottom: '5px'}}>Observaciones</label>
                            <textarea
                                className="form-control"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                disabled={guardando}
                                placeholder="Detalles..."
                                rows="2"
                                style={{borderRadius: '8px', fontSize: '0.9rem'}}
                            />
                        </div>
                    )}

                    {/* BOTÓN GUARDAR */}
                    <button
                        className="btn btn-lg w-100"
                        onClick={handleGuardar}
                        disabled={guardando || cantidadFisica === ''}
                        style={{
                            borderRadius: '10px',
                            fontWeight: '700',
                            backgroundColor: isAuditado ? '#4caf50' : '#2196f3',
                            color: '#fff',
                            border: 'none',
                            padding: '12px'
                        }}
                    >
                        {guardando ? '⏳ Guardando...' : isAuditado ? '✅ Actualizar' : '💾 Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 🎯 MODAL SIMPLIFICADO DE NOVEDADES
function QuickNoveltyModal({ producto, onConfirm, onClose }) {
    const [cantidad, setCantidad] = useState(producto.cantidad_pedida);
    const [novedad, setNovedad] = useState('sin_novedad');
    const [observaciones, setObservaciones] = useState('');

    const handleConfirm = () => {
        onConfirm(cantidad, novedad, observaciones);
    };

    const handleQuickButton = (nov, obs) => {
        setNovedad(nov);
        setObservaciones(obs);
        onConfirm(cantidad, nov, obs);
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">⚡ Confirmar Producto</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <strong>SKU:</strong> {producto.sku}<br/>
                            <strong>Descripción:</strong> {producto.descripcion}<br/>
                            <strong>Cantidad Esperada:</strong> <span className="badge bg-info">{producto.cantidad_pedida}</span>
                        </div>

                        <div className="mb-3">
                            <label className="form-label"><strong>Cantidad Física:</strong></label>
                            <input
                                type="number"
                                className="form-control form-control-lg"
                                value={cantidad}
                                onChange={(e) => setCantidad(parseInt(e.target.value))}
                                min="0"
                                autoFocus
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label"><strong>Botones Rápidos:</strong></label>
                            <div className="d-grid gap-2">
                                <button 
                                    className="btn btn-success btn-lg"
                                    onClick={() => handleQuickButton('sin_novedad', 'OK')}
                                >
                                    ✓ Todo OK (Cantidad Correcta)
                                </button>
                                <button 
                                    className="btn btn-warning"
                                    onClick={() => handleQuickButton('faltante', 'Faltante detectado')}
                                >
                                    ⚠️ Faltante
                                </button>
                                <button 
                                    className="btn btn-info"
                                    onClick={() => handleQuickButton('sobrante', 'Sobrante detectado')}
                                >
                                    📦 Sobrante
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => handleQuickButton('averia', 'Producto averiado')}
                                >
                                    💔 Avería
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Observaciones (opcional):</label>
                            <textarea
                                className="form-control"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                rows="2"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleConfirm}>💾 Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuditarUltimaMillaPage;

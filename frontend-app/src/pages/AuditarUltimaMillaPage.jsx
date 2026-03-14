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
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPedidoSelectorModal, setShowPedidoSelectorModal] = useState(false);
    const [productosConMismoSku, setProductosConMismoSku] = useState([]);
    const [cantidadesPorProducto, setCantidadesPorProducto] = useState({});
    const [currentAudit, setCurrentAudit] = useState(null);
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
            
            // Cargar info de la auditoría
            const auditResponse = await fetch(`${API_BASE_URL}/api/audits/${auditoriaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const auditData = await auditResponse.json();
            setCurrentAudit(auditData);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActualizarProducto = async (productoId, data) => {
        console.log('📤 Enviando actualización:', { productoId, data });
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/ultima-milla/producto/${productoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error del servidor:', errorData);
                throw new Error(errorData.detail || 'Error al actualizar');
            }
            
            const result = await response.json();
            console.log('✅ Respuesta del servidor:', result);
            
            // Solo recargar si no es un escaneo rápido (para mantener sincronización)
            // await loadProductos();
        } catch (error) {
            console.error('❌ Error completo:', error);
            throw error; // Re-lanzar para que procesarEscaneo pueda revertir
        }
    };

    const handleScanSku = (e) => {
        if (e.key === 'Enter' && skuBusqueda.trim()) {
            procesarEscaneo(skuBusqueda.trim());
            setSkuBusqueda('');
        }
    };

    // 🚀 ESCANEO CON AUTO-INCREMENTO INMEDIATO
    const procesarEscaneo = async (sku) => {
        const productosEncontrados = productos.filter(p => 
            p.sku.toLowerCase().includes(sku.toLowerCase())
        );
        
        if (productosEncontrados.length === 0) {
            console.log('❌ Producto no encontrado:', sku);
            return;
        }

        // Si hay múltiples productos con el mismo SKU, mostrar selector
        if (productosEncontrados.length > 1) {
            console.log('🔍 Múltiples productos encontrados:', productosEncontrados.length);
            setProductosConMismoSku(productosEncontrados);
            // Inicializar cantidades con valores actuales
            const cantidadesIniciales = {};
            productosEncontrados.forEach(p => {
                cantidadesIniciales[p.id] = p.cantidad_fisica || '';
            });
            setCantidadesPorProducto(cantidadesIniciales);
            setShowPedidoSelectorModal(true);
            return;
        }

        // Si solo hay uno, procesar directamente
        const producto = productosEncontrados[0];
        incrementarProducto(producto);
    };

    const handleGuardarPedidosSeleccionados = async () => {
        const productosAActualizar = productosConMismoSku.filter(p => 
            cantidadesPorProducto[p.id] !== '' && cantidadesPorProducto[p.id] !== null
        );

        if (productosAActualizar.length === 0) {
            alert('⚠️ Ingresa al menos una cantidad física');
            return;
        }

        for (const producto of productosAActualizar) {
            const cantidad = parseInt(cantidadesPorProducto[producto.id]);
            await handleActualizarProducto(producto.id, {
                cantidad_fisica: cantidad,
                novedades: [{ tipo: 'sin_novedad', cantidad: cantidad, observaciones: '' }],
                observaciones: ''
            });
        }

        await loadProductos();
        setShowPedidoSelectorModal(false);
        setProductosConMismoSku([]);
        setCantidadesPorProducto({});
    };

    const incrementarProducto = async (producto) => {
        console.log('✅ Producto encontrado:', producto.sku, 'Cantidad actual:', producto.cantidad_fisica);

        // Incrementar cantidad física automáticamente
        const cantidadActual = producto.cantidad_fisica || 0;
        const nuevaCantidad = cantidadActual + 1;
        
        console.log('📊 Incrementando de', cantidadActual, 'a', nuevaCantidad);
        
        // ACTUALIZAR INMEDIATAMENTE EN EL ESTADO LOCAL (optimistic update)
        setProductos(prevProductos => 
            prevProductos.map(p => 
                p.id === producto.id 
                    ? { ...p, cantidad_fisica: nuevaCantidad }
                    : p
            )
        );
        
        // Luego actualizar en backend (sin esperar)
        handleActualizarProducto(producto.id, {
            cantidad_fisica: nuevaCantidad,
            novedades: [{ tipo: 'sin_novedad', cantidad: nuevaCantidad, observaciones: '' }],
            observaciones: ''
        }).catch(error => {
            // Si falla, revertir el cambio
            console.error('❌ Error, revirtiendo cambio');
            setProductos(prevProductos => 
                prevProductos.map(p => 
                    p.id === producto.id 
                        ? { ...p, cantidad_fisica: cantidadActual }
                        : p
                )
            );
        });
        
        setLastScannedSku(producto.sku);
        setLastScannedProduct(producto);
        document.getElementById(`producto-${producto.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                    novedades: [{ tipo: 'sin_novedad', cantidad: cantidadEsperada, observaciones: '' }],
                    observaciones: 'Auto-guardado'
                })
            });
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
            novedades: [{ tipo: novedad || 'sin_novedad', cantidad: cantidad, observaciones: observaciones || '' }],
            observaciones: observaciones || ''
        });
        
        setShowQuickModal(false);
        setLastScannedSku(null);
        setLastScannedProduct(null);
    };

    const handleVerificarNovedades = async () => {
        if (!window.confirm('¿Calcular novedades automáticamente? Esto comparará cantidades físicas vs pedidas.')) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            
            for (const producto of productos) {
                if (producto.cantidad_fisica === null) continue;
                
                let novedad = 'sin_novedad';
                let observaciones = '';
                
                if (producto.cantidad_fisica < producto.cantidad_pedida) {
                    novedad = 'faltante';
                    observaciones = `Faltante: ${producto.cantidad_pedida - producto.cantidad_fisica} unidades`;
                } else if (producto.cantidad_fisica > producto.cantidad_pedida) {
                    novedad = 'sobrante';
                    observaciones = `Sobrante: ${producto.cantidad_fisica - producto.cantidad_pedida} unidades`;
                }
                
                await fetch(`${API_BASE_URL}/api/ultima-milla/producto/${producto.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cantidad_fisica: producto.cantidad_fisica,
                        novedades: [{ tipo: novedad, cantidad: producto.cantidad_fisica, observaciones }],
                        observaciones
                    })
                });
            }
            
            await loadProductos();
            alert('✅ Novedades calculadas automáticamente');
        } catch (error) {
            alert('Error calculando novedades: ' + error.message);
        } finally {
            setLoading(false);
        }
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
    const esFinalizada = currentAudit?.estado === 'finalizada';

    // Obtener info del domiciliario (del primer producto)
    const infoDomiciliario = productos.length > 0 ? {
        bodega: currentAudit?.ubicacion_origen?.nombre || 'N/A',
        numero_pedido: productos[0].numero_pedido,
    } : null;

    // Calcular estadísticas de novedades
    const estadisticasNovedades = productos.reduce((acc, p) => {
        if (p.novedades && p.novedades.length > 0) {
            p.novedades.forEach(nov => {
                if (!acc[nov.tipo]) acc[nov.tipo] = 0;
                acc[nov.tipo] += nov.cantidad;
            });
        }
        return acc;
    }, {});

    // Filtrar productos por búsqueda
    const productosFiltrados = searchQuery.trim() === '' 
        ? productos 
        : productos.filter(p => 
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="container-fluid mt-3" style={{maxWidth: '1400px', margin: '0 auto'}}>
            {/* HEADER CON PROGRESO */}
            <div className="card shadow-sm mb-3" style={{borderRadius: '15px', border: 'none'}}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 className="mb-1" style={{fontWeight: '700', color: '#2c3e50'}}>
                                {esFinalizada ? '📋 Resumen de Auditoría' : '🚚 Auditoría Última Milla'}
                            </h3>
                            <p className="mb-0 text-muted">Auditoría #{auditoriaId}</p>
                        </div>
                        <div className="d-flex gap-2">
                            {!esFinalizada && (
                                <>
                                    <button 
                                        className="btn btn-lg btn-warning shadow-sm" 
                                        onClick={handleVerificarNovedades}
                                        disabled={loading}
                                        style={{borderRadius: '10px', fontWeight: '600'}}
                                    >
                                        {loading ? '⏳ Calculando...' : '🔍 Verificar Novedades'}
                                    </button>
                                    <button 
                                        className="btn btn-lg btn-success shadow-sm" 
                                        onClick={handleFinalizar} 
                                        disabled={finalizando}
                                        style={{borderRadius: '10px', fontWeight: '600'}}
                                    >
                                        {finalizando ? '⏳ Finalizando...' : '✅ Finalizar'}
                                    </button>
                                </>
                            )}
                            <button 
                                className="btn btn-lg btn-outline-secondary" 
                                onClick={() => navigate('/ultima-milla/bodegas')}
                                style={{borderRadius: '10px'}}
                            >
                                ← Volver
                            </button>
                        </div>
                    </div>
                    
                    {/* INFORMACIÓN DEL DOMICILIARIO (solo si está finalizada) */}
                    {esFinalizada && infoDomiciliario && (
                        <div className="alert alert-info mb-3">
                            <div className="row">
                                <div className="col-md-4">
                                    <strong>🏢 Bodega:</strong> {infoDomiciliario.bodega}
                                </div>
                                <div className="col-md-4">
                                    <strong>📊 Cumplimiento:</strong> {currentAudit.porcentaje_cumplimiento}%
                                </div>
                                <div className="col-md-4">
                                    <strong>📅 Finalizada:</strong> {new Date(currentAudit.finalizada_en).toLocaleString('es-CO')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ESTADÍSTICAS DE NOVEDADES (solo si está finalizada) */}
                    {esFinalizada && Object.keys(estadisticasNovedades).length > 0 && (
                        <div className="card mb-3" style={{backgroundColor: '#fff3cd', border: 'none'}}>
                            <div className="card-body">
                                <h5 className="mb-3">🚨 Resumen de Novedades</h5>
                                <div className="row">
                                    {Object.entries(estadisticasNovedades).map(([tipo, cantidad]) => (
                                        <div key={tipo} className="col-md-3 mb-2">
                                            <div className="d-flex align-items-center">
                                                <span style={{fontSize: '1.5rem', marginRight: '10px'}}>
                                                    {tipo === 'sin_novedad' ? '✅' : 
                                                     tipo === 'faltante' ? '⚠️' : 
                                                     tipo === 'sobrante' ? '📦' : 
                                                     tipo === 'averia' ? '💔' : 
                                                     tipo === 'vencido' ? '⏰' : '📅'}
                                                </span>
                                                <div>
                                                    <div style={{fontSize: '0.85rem', color: '#666'}}>{tipo.replace('_', ' ')}</div>
                                                    <div style={{fontSize: '1.3rem', fontWeight: '700'}}>{cantidad}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
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
            {!esFinalizada && (
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
            )}

            {/* LISTA DE PRODUCTOS EN TARJETAS */}
            <div className="row g-3">
                {productosFiltrados.map((producto) => (
                    <ProductoCard
                        key={producto.id}
                        producto={producto}
                        onActualizar={handleActualizarProducto}
                        speak={speak}
                        esFinalizada={esFinalizada}
                    />
                ))}
            </div>

            {/* BOTONES FLOTANTES MÓVILES */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    zIndex: 1000
                }}>
                    {/* Botón de Búsqueda */}
                    <button
                        onClick={() => setShowSearchModal(true)}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#2196f3',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            cursor: 'pointer'
                        }}
                    >
                        🔍
                    </button>

                    {/* Botón de Cámara */}
                    <button
                        onClick={() => setShowCameraScanner(true)}
                        style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            backgroundColor: '#4caf50',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            cursor: 'pointer'
                        }}
                    >
                        📷
                    </button>
                </div>
            )}

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

            {/* MODAL DE SELECCIÓN DE PEDIDO */}
            {showPedidoSelectorModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title">⚠️ Múltiples Pedidos con el mismo SKU</h5>
                                <button type="button" className="btn-close" onClick={() => {
                                    setShowPedidoSelectorModal(false);
                                    setProductosConMismoSku([]);
                                    setCantidadesPorProducto({});
                                }}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3"><strong>Ingresa la cantidad física para cada pedido:</strong></p>
                                <div className="list-group">
                                    {productosConMismoSku.map((producto) => (
                                        <div key={producto.id} className="list-group-item">
                                            <div className="row align-items-center">
                                                <div className="col-md-7">
                                                    <h6 className="mb-1">📦 Pedido #{producto.numero_pedido}</h6>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <strong>SKU:</strong> {producto.sku}<br/>
                                                        <strong>Descripción:</strong> {producto.descripcion}<br/>
                                                        <strong>Cantidad Pedida:</strong> {producto.cantidad_pedida}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Cantidad Física</label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-lg"
                                                        value={cantidadesPorProducto[producto.id] || ''}
                                                        onChange={(e) => setCantidadesPorProducto(prev => ({
                                                            ...prev,
                                                            [producto.id]: e.target.value
                                                        }))}
                                                        min="0"
                                                        placeholder="0"
                                                        style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                                    />
                                                </div>
                                                <div className="col-md-2 text-end">
                                                    {producto.cantidad_fisica !== null ? (
                                                        <span className="badge bg-success">✓ Auditado</span>
                                                    ) : (
                                                        <span className="badge bg-warning text-dark">⏳ Pendiente</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => {
                                    setShowPedidoSelectorModal(false);
                                    setProductosConMismoSku([]);
                                    setCantidadesPorProducto({});
                                }}>
                                    Cancelar
                                </button>
                                <button className="btn btn-primary btn-lg" onClick={handleGuardarPedidosSeleccionados}>
                                    💾 Guardar Cantidades
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE BÚSQUEDA */}
            {showSearchModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">🔍 Buscar Producto</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => {
                                    setShowSearchModal(false);
                                    setSearchQuery('');
                                }}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control form-control-lg mb-3"
                                    placeholder="Buscar por SKU o descripción..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    style={{ fontSize: '1.1rem' }}
                                />
                                
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {productosFiltrados.length === 0 ? (
                                        <div className="alert alert-warning">No se encontraron productos</div>
                                    ) : (
                                        productosFiltrados.map((producto) => (
                                            <div
                                                key={producto.id}
                                                className="card mb-2"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    document.getElementById(`producto-${producto.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    setShowSearchModal(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong>{producto.sku}</strong>
                                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                                {producto.descripcion}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {producto.cantidad_fisica !== null ? (
                                                                <span className="badge bg-success">✓</span>
                                                            ) : (
                                                                <span className="badge bg-warning">⏳</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 🎨 TARJETA DE PRODUCTO CON NOVEDADES MÚLTIPLES
function ProductoCard({ producto, onActualizar, speak, esFinalizada }) {
    const [cantidadFisica, setCantidadFisica] = useState(producto.cantidad_fisica || '');
    const [novedades, setNovedades] = useState(
        producto.novedades && producto.novedades.length > 0
            ? producto.novedades
            : [{ tipo: 'sin_novedad', cantidad: producto.cantidad_fisica || 0, observaciones: '' }]
    );
    const [observaciones, setObservaciones] = useState(producto.observaciones || '');
    const [guardando, setGuardando] = useState(false);
    const [editando, setEditando] = useState(false);
    const [showNovedadesModal, setShowNovedadesModal] = useState(false);

    // Sincronizar con cambios del servidor
    useEffect(() => {
        console.log('🔄 Producto actualizado desde servidor:', producto.cantidad_fisica);
        setCantidadFisica(producto.cantidad_fisica || '');
        
        if (producto.novedades && producto.novedades.length > 0) {
            setNovedades(producto.novedades);
        } else if (producto.cantidad_fisica) {
            setNovedades([{ tipo: 'sin_novedad', cantidad: producto.cantidad_fisica, observaciones: '' }]);
        }
        
        setObservaciones(producto.observaciones || '');
    }, [producto.cantidad_fisica, producto.novedades, producto.observaciones]);

    // AUTO-GUARDADO en tiempo real cuando cambia cantidad física
    useEffect(() => {
        if (cantidadFisica && cantidadFisica !== producto.cantidad_fisica) {
            const timer = setTimeout(() => {
                const fisica = parseInt(cantidadFisica);
                const pedida = producto.cantidad_pedida;
                
                let novedadesCalculadas = [];
                if (fisica === pedida) {
                    novedadesCalculadas = [{ tipo: 'sin_novedad', cantidad: fisica, observaciones: '' }];
                } else if (fisica < pedida) {
                    const faltante = pedida - fisica;
                    novedadesCalculadas = [
                        { tipo: 'sin_novedad', cantidad: fisica, observaciones: '' },
                        { tipo: 'faltante', cantidad: faltante, observaciones: `Faltante: ${faltante} unidades` }
                    ];
                } else {
                    const sobrante = fisica - pedida;
                    novedadesCalculadas = [
                        { tipo: 'sin_novedad', cantidad: pedida, observaciones: '' },
                        { tipo: 'sobrante', cantidad: sobrante, observaciones: `Sobrante: ${sobrante} unidades` }
                    ];
                }
                
                setNovedades(novedadesCalculadas);
                onActualizar(producto.id, {
                    cantidad_fisica: fisica,
                    novedades: novedadesCalculadas,
                    observaciones
                });
            }, 1000); // Espera 1 segundo después de dejar de escribir
            
            return () => clearTimeout(timer);
        }
    }, [cantidadFisica]);

    const handleGuardar = async () => {
        if (cantidadFisica === '') {
            alert('⚠️ Ingresa la cantidad física');
            return;
        }

        const fisica = parseInt(cantidadFisica);
        const pedida = producto.cantidad_pedida;

        // Calcular novedades automáticamente
        let novedadesCalculadas = [];
        
        if (fisica === pedida) {
            // Todo OK
            novedadesCalculadas = [{ tipo: 'sin_novedad', cantidad: fisica, observaciones: '' }];
        } else if (fisica < pedida) {
            // Hay faltante
            const faltante = pedida - fisica;
            novedadesCalculadas = [
                { tipo: 'sin_novedad', cantidad: fisica, observaciones: '' },
                { tipo: 'faltante', cantidad: faltante, observaciones: `Faltante: ${faltante} unidades` }
            ];
        } else {
            // Hay sobrante
            const sobrante = fisica - pedida;
            novedadesCalculadas = [
                { tipo: 'sin_novedad', cantidad: pedida, observaciones: '' },
                { tipo: 'sobrante', cantidad: sobrante, observaciones: `Sobrante: ${sobrante} unidades` }
            ];
        }

        setGuardando(true);
        await onActualizar(producto.id, {
            cantidad_fisica: fisica,
            novedades: novedadesCalculadas,
            observaciones
        });
        setGuardando(false);
        setEditando(false);
        setShowNovedadesModal(false);
    };

    const handleAgregarNovedad = () => {
        setNovedades([...novedades, { tipo: 'averia', cantidad: 0, observaciones: '' }]);
    };

    const handleEliminarNovedad = (index) => {
        if (novedades.length > 1) {
            setNovedades(novedades.filter((_, i) => i !== index));
        }
    };

    const handleNovedadChange = (index, field, value) => {
        const nuevasNovedades = [...novedades];
        nuevasNovedades[index][field] = value;
        setNovedades(nuevasNovedades);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGuardar();
        }
    };

    const isAuditado = producto.cantidad_fisica !== null;

    const getNovedadColor = (tipo) => {
        switch(tipo) {
            case 'sin_novedad': return '#4caf50';
            case 'faltante': return '#ff9800';
            case 'sobrante': return '#2196f3';
            case 'averia': return '#f44336';
            case 'vencido': return '#9c27b0';
            case 'fecha_corta': return '#ff5722';
            default: return '#757575';
        }
    };

    const getNovedadIcon = (tipo) => {
        switch(tipo) {
            case 'sin_novedad': return '✅';
            case 'faltante': return '⚠️';
            case 'sobrante': return '📦';
            case 'averia': return '💔';
            case 'vencido': return '⏰';
            case 'fecha_corta': return '📅';
            default: return '❓';
        }
    };

    const sumaNovedades = novedades.reduce((sum, n) => sum + (parseInt(n.cantidad) || 0), 0);
    const novedadesValidas = cantidadFisica && sumaNovedades === parseInt(cantidadFisica);

    return (
        <>
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
                            {producto.novedades && producto.novedades.length > 0 && (
                                <div style={{fontSize: '1.5rem'}}>
                                    {producto.novedades.map((n, i) => (
                                        <span key={i}>{getNovedadIcon(n.tipo)}</span>
                                    ))}
                                </div>
                            )}
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
                                        disabled={guardando || esFinalizada}
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

                        {/* BOTÓN GESTIONAR NOVEDADES */}
                        {!esFinalizada && (
                            <button
                                className="btn btn-outline-primary w-100 mb-3"
                                onClick={() => setShowNovedadesModal(true)}
                                disabled={!cantidadFisica || guardando}
                                style={{borderRadius: '10px', fontWeight: '600'}}
                            >
                                🔍 Gestionar Novedades Manualmente {novedades.length > 1 && `(${novedades.length})`}
                            </button>
                        )}

                        {/* RESUMEN DE NOVEDADES */}
                        {novedades.length > 0 && cantidadFisica && (
                            <div className="mb-3" style={{fontSize: '0.85rem'}}>
                                {novedades.map((nov, idx) => (
                                    nov.cantidad > 0 && (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                                            <span style={{color: getNovedadColor(nov.tipo)}}>
                                                {getNovedadIcon(nov.tipo)} {nov.tipo.replace('_', ' ')}
                                            </span>
                                            <span className="badge" style={{backgroundColor: getNovedadColor(nov.tipo)}}>
                                                {nov.cantidad}
                                            </span>
                                        </div>
                                    )
                                ))}
                                {!novedadesValidas && (
                                    <div className="alert alert-warning py-1 px-2 mt-2 mb-0" style={{fontSize: '0.75rem'}}>
                                        ⚠️ Suma: {sumaNovedades} ≠ Física: {cantidadFisica}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* OBSERVACIONES GENERALES */}
                        <div className="mb-3">
                            <label style={{fontSize: '0.85rem', fontWeight: '600', color: '#666', marginBottom: '5px'}}>Observaciones</label>
                            <textarea
                                className="form-control"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                disabled={guardando || esFinalizada}
                                placeholder="Observaciones generales..."
                                rows="2"
                                style={{borderRadius: '8px', fontSize: '0.9rem'}}
                            />
                        </div>

                        {/* BOTÓN GUARDAR - Ahora solo para forzar guardado manual */}
                        {!esFinalizada && (
                            <>
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
                                    {guardando ? '⏳ Guardando...' : isAuditado ? '✅ Actualizar' : '💾 Guardar Manualmente'}
                                </button>
                                <small className="text-muted text-center d-block mt-2">
                                    💡 Se guarda automáticamente al escribir
                                </small>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE NOVEDADES */}
            {showNovedadesModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">🔍 Gestionar Novedades - {producto.sku}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNovedadesModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info mb-3">
                                    <strong>Cantidad Física Total:</strong> {cantidadFisica} unidades<br/>
                                    <strong>Cantidad Pedida:</strong> {producto.cantidad_pedida} unidades<br/>
                                    <strong>Suma de Novedades:</strong> {sumaNovedades} unidades
                                    {novedadesValidas ? ' ✅' : ' ⚠️ Debe coincidir con física'}
                                </div>

                                <div className="alert alert-warning mb-3">
                                    💡 <strong>Tip:</strong> Si solo ingresas cantidad física y guardas, el sistema calculará automáticamente faltantes/sobrantes.
                                </div>

                                {novedades.map((novedad, index) => (
                                    <div key={index} className="card mb-3">
                                        <div className="card-body">
                                            <div className="row g-2">
                                                <div className="col-md-5">
                                                    <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600'}}>Tipo</label>
                                                    <select
                                                        className="form-select"
                                                        value={novedad.tipo}
                                                        onChange={(e) => handleNovedadChange(index, 'tipo', e.target.value)}
                                                        style={{borderColor: getNovedadColor(novedad.tipo)}}
                                                    >
                                                        <option value="sin_novedad">✅ Sin Novedad</option>
                                                        <option value="faltante">⚠️ Faltante</option>
                                                        <option value="sobrante">📦 Sobrante</option>
                                                        <option value="averia">💔 Avería</option>
                                                        <option value="vencido">⏰ Vencido</option>
                                                        <option value="fecha_corta">📅 Fecha Corta</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600'}}>Cantidad</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={novedad.cantidad}
                                                        onChange={(e) => handleNovedadChange(index, 'cantidad', e.target.value)}
                                                        min="0"
                                                        max={cantidadFisica}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600'}}>Acciones</label>
                                                    <button
                                                        className="btn btn-danger w-100"
                                                        onClick={() => handleEliminarNovedad(index)}
                                                        disabled={novedades.length === 1}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600'}}>Observaciones</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={novedad.observaciones || ''}
                                                        onChange={(e) => handleNovedadChange(index, 'observaciones', e.target.value)}
                                                        placeholder="Detalles de esta novedad..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    className="btn btn-outline-primary w-100"
                                    onClick={handleAgregarNovedad}
                                >
                                    ➕ Agregar Novedad
                                </button>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowNovedadesModal(false)}>
                                    Cancelar
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => {
                                        // Guardar con novedades manuales
                                        const sumaNovedades = novedades.reduce((sum, n) => sum + (parseInt(n.cantidad) || 0), 0);
                                        if (sumaNovedades !== parseInt(cantidadFisica)) {
                                            alert(`⚠️ La suma de novedades (${sumaNovedades}) debe ser igual a cantidad física (${cantidadFisica})`);
                                            return;
                                        }
                                        
                                        setGuardando(true);
                                        onActualizar(producto.id, {
                                            cantidad_fisica: parseInt(cantidadFisica),
                                            novedades: novedades.map(n => ({
                                                tipo: n.tipo,
                                                cantidad: parseInt(n.cantidad) || 0,
                                                observaciones: n.observaciones || ''
                                            })),
                                            observaciones
                                        }).then(() => {
                                            setGuardando(false);
                                            setEditando(false);
                                            setShowNovedadesModal(false);
                                        });
                                    }}
                                    disabled={!novedadesValidas || guardando}
                                >
                                    {guardando ? '⏳ Guardando...' : '💾 Guardar con Novedades Manuales'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
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

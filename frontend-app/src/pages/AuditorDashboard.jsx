import React, { useState, useEffect, useMemo, useRef } from 'react';
import { uploadAuditFiles, fetchAudits, iniciarAuditoria, fetchAuditDetails, updateProduct, finishAudit } from '../services/api';
import { getCurrentUser } from '../services/auth';
import CollaboratorModal from '../components/CollaboratorModal';
import CameraScanner from '../components/CameraScanner';
import AuditHistory from '../components/AuditHistory';
import ToastContainer, { toast } from '../components/Toast';
import ConfirmModal, { confirm } from '../components/ConfirmModal';
import { API_BASE_URL } from '../services/api';

let voiceReady = null;

const speak = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1;
  utterance.volume = 1;
  if (voiceReady) utterance.voice = voiceReady;
  window.speechSynthesis.speak(utterance);
};

export default function AuditorDashboard() {
  const [audits, setAudits] = useState([]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [selectedAuditForCollab, setSelectedAuditForCollab] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [skuIndex, setSkuIndex] = useState({});
  const [scanHistory, setScanHistory] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNovedad, setFilterNovedad] = useState('all');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lockedProducts, setLockedProducts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const wsRef = useRef(null);
  const user = getCurrentUser();

  useEffect(() => {
    loadAudits();
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        voiceReady = voices.find(v => v.lang.startsWith('es')) || voices[0];
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (!currentAudit) return;
    
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/${currentAudit.id}?token=${token}`;
    console.log('Connecting to:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => console.log('✅ WebSocket connected');
    wsRef.current.onerror = (err) => console.error('❌ WebSocket error:', err);
    
    wsRef.current.onmessage = (event) => {
      console.log('📨 Raw WS message:', event.data);
      const data = JSON.parse(event.data);
      console.log('📦 Parsed WS data:', data);
      
      if (data.type === 'ping') return;
      
      if (data.type === 'product_locked') {
        console.log('🔒 Product locked:', data);
        setLockedProducts(prev => ({...prev, [data.product_id]: data.user}));
        addNotification(`⚠️ ${data.user} está editando un producto`);
      } else if (data.type === 'product_unlocked') {
        console.log('🔓 Product unlocked:', data);
        setLockedProducts(prev => {const n = {...prev}; delete n[data.product_id]; return n;});
      } else if (data.type === 'product_updated') {
        console.log('✏️ Product updated:', data);
        setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
        if (data.user !== user.nombre) {
          addNotification(`✅ ${data.user} actualizó ${data.product.sku}`);
        }
      }
    };
    
    return () => wsRef.current?.close();
  }, [currentAudit]);

  const loadAudits = async () => {
    try {
      const data = await fetchAudits();
      setAudits(data);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return toast.warning('Selecciona archivos');
    setLoading(true);
    try {
      const result = await uploadAuditFiles(selectedFiles);
      toast.success(`Auditoría #${result.audit_id} creada exitosamente`);
      setSelectedFiles([]);
      e.target.reset();
      loadAudits();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = async (auditId) => {
    try {
      await iniciarAuditoria(auditId);
      loadAudits();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleVerAuditoria = async (auditId) => {
    try {
      const data = await fetchAuditDetails(auditId);
      setCurrentAudit(data);
      const prods = data.productos || [];
      setProducts(prods);
      const index = {};
      prods.forEach(p => {
        const normalizedSku = String(p.sku).toUpperCase().replace(/^0+/, '').substring(0, 50);
        index[normalizedSku] = p;
      });
      setSkuIndex(index);
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scannedSku = scanInput.trim().toUpperCase().replace(/^0+/, '');
      
      if (!scannedSku) return;
      
      const product = skuIndex[scannedSku];
      
      if (!product) {
        speak('Producto no encontrado');
        setScanInput('');
        return;
      }

      // Caso 1: Escaneo repetido del mismo SKU = HAY NOVEDAD
      if (lastScanned && lastScanned.sku === product.sku) {
        setLastScanned(null);
        setScanInput('');
        speak('Ingrese novedad');
        setTimeout(() => {
          document.getElementById(`qty-${product.id}`)?.focus();
          document.getElementById(`qty-${product.id}`)?.select();
        }, 50);
        return;
      }

      // Caso 2: Escaneo de SKU diferente = anterior SIN NOVEDAD
      if (lastScanned && lastScanned.sku !== product.sku) {
        const lastProduct = products.find(p => p.sku === lastScanned.sku);
        if (lastProduct) {
          try {
            await updateProduct(currentAudit.id, lastProduct.id, {
              cantidad_fisica: lastProduct.cantidad_documento,
              novedad: 'sin_novedad',
              observaciones: 'sin novedad'
            });
            setProducts(prev => prev.map(p => 
              p.id === lastProduct.id 
                ? { ...p, cantidad_fisica: lastProduct.cantidad_documento, novedad: 'sin_novedad', observaciones: 'sin novedad' }
                : p
            ));
            speak('Guardado');
          } catch (err) {
            console.error('Error guardando producto anterior:', err);
          }
        }
      }

      // Guardar como último escaneado y solo anunciar cantidad
      setLastScanned({ sku: product.sku, id: product.id });
      setScanHistory(prev => [{ sku: product.sku, nombre: product.nombre_articulo, time: new Date() }, ...prev.slice(0, 4)]);
      setScannedCount(prev => prev + 1);
      
      // Feedback visual
      const row = document.querySelector(`tr[data-product-id="${product.id}"]`);
      if (row) {
        row.classList.add('scan-flash');
        setTimeout(() => row.classList.remove('scan-flash'), 1000);
      }
      
      speak(`${product.cantidad_documento}`);
      setScanInput('');
    }
  };

  const handleQuantityChange = async (productId, cantidad) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let novedad = 'sin_novedad';
    let observaciones = '';
    const diferencia = Math.abs(cantidad - product.cantidad_documento);
    
    if (cantidad < product.cantidad_documento) {
      novedad = 'faltante';
      observaciones = `${diferencia} faltante`;
    } else if (cantidad > product.cantidad_documento) {
      novedad = 'sobrante';
      observaciones = `${diferencia} sobrante`;
    }

    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, cantidad_fisica: cantidad, novedad, observaciones } : p
    ));

    speak('Guardado');
    updateProduct(currentAudit.id, productId, { cantidad_fisica: cantidad, novedad, observaciones }).catch(err => console.error('Error:', err));
  };

  const handleUpdateProduct = async (productId, field, value) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
    
    updateProduct(currentAudit.id, productId, { [field]: value }).catch(err => console.error('Error:', err));
  };

  const handleFinish = async () => {
    const confirmed = await confirm('¿Finalizar auditoría?');
    if (!confirmed) return;
    try {
      await finishAudit(currentAudit.id);
      toast.success('Auditoría finalizada');
      setCurrentAudit(null);
      setProducts([]);
      loadAudits();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleOpenCollaboratorModal = (audit) => {
    setSelectedAuditForCollab(audit);
    setShowCollaboratorModal(true);
  };

  const handleCollaboratorSuccess = () => {
    toast.success('Colaboradores asignados exitosamente');
    loadAudits();
  };

  const handleCameraScan = (decodedText) => {
    setScanInput(decodedText);
    const event = { key: 'Enter', preventDefault: () => {} };
    handleScan(event);
    setShowCameraScanner(false);
  };

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, {id, msg}]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const lockProduct = async (productId) => {
    try {
      await fetch(`${API_BASE_URL}/api/collaboration/${currentAudit.id}/products/${productId}/lock`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${localStorage.getItem('access_token')}`}
      });
    } catch (err) {
      console.error('Error locking:', err);
    }
  };

  const unlockProduct = async (productId) => {
    try {
      await fetch(`${API_BASE_URL}/api/collaboration/${currentAudit.id}/products/${productId}/unlock`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${localStorage.getItem('access_token')}`}
      });
    } catch (err) {
      console.error('Error unlocking:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return products.filter(p => {
      if (searchTerm && !p.sku.toLowerCase().includes(searchLower) && !p.nombre_articulo.toLowerCase().includes(searchLower)) {
        return false;
      }
      if (filterNovedad !== 'all' && p.novedad !== filterNovedad) {
        return false;
      }
      return true;
    });
  }, [products, searchTerm, filterNovedad]);

  const cumplimientoActual = useMemo(() => {
    if (!products.length) return 0;
    const totalDocumento = products.reduce((sum, p) => sum + (p.cantidad_documento || 0), 0);
    if (totalDocumento === 0) return 100;
    const cumplidas = products.reduce((sum, p) => {
      if (p.cantidad_fisica !== null && p.cantidad_fisica !== undefined) {
        return sum + Math.min(p.cantidad_fisica, p.cantidad_documento);
      }
      return sum;
    }, 0);
    return Math.round((cumplidas / totalDocumento) * 100);
  }, [products]);

  return (
    <div style={{width: '100%', padding: '20px', margin: '0', boxSizing: 'border-box'}}>
      <div style={{position: 'fixed', top: '70px', right: '20px', zIndex: 9999, maxWidth: '350px'}}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '10px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-out',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {n.msg}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <h1 className="h3 mb-3">Dashboard del Auditor</h1>

      {/* Carga de archivos */}
      <div style={{width: '100%', marginBottom: '15px'}}>
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Cargar Archivos Excel</h5>
              <form onSubmit={handleUpload}>
                <div className="input-group">
                  <input 
                    type="file" 
                    className="form-control" 
                    accept=".xlsx,.xls" 
                    multiple 
                    onChange={handleFileSelect}
                  />
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    <i className="bi bi-upload"></i> {loading ? 'Subiendo...' : 'Subir'}
                  </button>
                </div>
                {selectedFiles.length > 0 && (
                  <small className="text-muted">{selectedFiles.length} archivo(s) seleccionado(s)</small>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de auditorías */}
      <div style={{width: '100%', marginBottom: '15px'}}>
        <div>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Mis Auditorías</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ubicación</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(audit => (
                      <tr key={audit.id}>
                        <td>{audit.id}</td>
                        <td>{audit.ubicacion_destino}</td>
                        <td>{new Date(audit.creada_en).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${audit.estado === 'finalizada' ? 'success' : audit.estado === 'en_progreso' ? 'warning' : 'secondary'}`}>
                            {audit.estado}
                          </span>
                        </td>
                        <td>
                          {audit.estado === 'pendiente' && (
                            <>
                              <button className="btn btn-sm btn-primary me-2" onClick={() => handleIniciar(audit.id)}>
                                Iniciar
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenCollaboratorModal(audit)}>
                                <i className="bi bi-people"></i>
                              </button>
                            </>
                          )}
                          {audit.estado === 'en_progreso' && (
                            <>
                              <button className="btn btn-sm btn-info me-2" onClick={() => handleVerAuditoria(audit.id)}>
                                Ver
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenCollaboratorModal(audit)}>
                                <i className="bi bi-people"></i>
                              </button>
                            </>
                          )}
                          {audit.estado === 'finalizada' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleVerAuditoria(audit.id)}>
                              <i className="bi bi-eye"></i> Ver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productos de auditoría activa */}
      {currentAudit && (
        <>
          <div style={{width: '100%', marginBottom: '15px'}}>
            <div>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Escanear Producto</h5>
                    {scannedCount > 0 && (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle"></i> {scannedCount} escaneados
                      </span>
                    )}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-qr-code-scan"></i></span>
                    <input 
                      id="scan-input"
                      type="text" 
                      className="form-control" 
                      placeholder="Escanea el SKU..." 
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleScan}
                      autoFocus
                    />
                    {isMobile && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setShowCameraScanner(true)}
                        type="button"
                      >
                        <i className="bi bi-camera"></i>
                      </button>
                    )}
                  </div>
                  {scanHistory.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Últimos escaneos:</small>
                      <div style={{fontSize: '12px', marginTop: '5px'}}>
                        {scanHistory.map((item, idx) => (
                          <div key={idx} style={{opacity: 1 - (idx * 0.2)}}>
                            <i className="bi bi-check-circle-fill text-success"></i> {item.sku} - {item.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{width: '100%', marginBottom: '15px'}}>
            <div>
              <div className="card" style={{margin: '0'}}>
                <div className="card-body" style={{padding: '15px'}}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">
                      Productos - {currentAudit.ubicacion_destino}
                      {currentAudit.estado === 'finalizada' ? (
                        <>
                          <span className="badge bg-success ms-2">Finalizada</span>
                          <span className="badge bg-primary ms-2">{currentAudit.porcentaje_cumplimiento}% Cumplimiento</span>
                        </>
                      ) : (
                        <span className="badge bg-info ms-2">{cumplimientoActual}% Cumplimiento</span>
                      )}
                    </h5>
                    <div>
                      <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setShowHistory(true)}>
                        <i className="bi bi-clock-history"></i> Historial
                      </button>
                      {currentAudit.estado !== 'finalizada' && (
                        <button className="btn btn-success" onClick={handleFinish}>
                          <i className="bi bi-check-circle"></i> Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive" style={{width: '100%'}}>
                    <table className="table table-sm table-hover" style={{fontSize: '0.9rem', width: '100%', marginBottom: '0'}}>
                      <thead>
                        <tr>
                          <th colSpan="6">
                            <div className="d-flex gap-2 mb-2">
                              <input 
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="🔍 Buscar por SKU o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              <select 
                                className="form-select form-select-sm"
                                style={{maxWidth: '200px'}}
                                value={filterNovedad}
                                onChange={(e) => setFilterNovedad(e.target.value)}
                              >
                                <option value="all">Todas las novedades</option>
                                <option value="sin_novedad">Sin Novedad</option>
                                <option value="faltante">Faltante</option>
                                <option value="sobrante">Sobrante</option>
                                <option value="averia">Avería</option>
                              </select>
                            </div>
                          </th>
                        </tr>
                        <tr>
                          <th>SKU</th>
                          <th>Nombre</th>
                          <th>Cant. Doc</th>
                          <th>Cant. Física</th>
                          <th>Novedad</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr key={product.id} data-product-id={product.id}>
                            <td>{product.sku}</td>
                            <td>{product.nombre_articulo}</td>
                            <td>{product.cantidad_documento}</td>
                            <td>
                              {lockedProducts[product.id] && lockedProducts[product.id] !== user.nombre && (
                                <span className="badge bg-warning text-dark" style={{fontSize: '10px', marginRight: '5px'}}>
                                  🔒 {lockedProducts[product.id]}
                                </span>
                              )}
                              <input 
                                id={`qty-${product.id}`}
                                type="number" 
                                className="form-control form-control-sm" 
                                style={{width: '80px'}}
                                value={product.cantidad_fisica || ''}
                                onChange={(e) => setProducts(prev => prev.map(p => p.id === product.id ? {...p, cantidad_fisica: parseInt(e.target.value) || 0} : p))}
                                onFocus={() => lockProduct(product.id)}
                                onBlur={() => unlockProduct(product.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuantityChange(product.id, parseInt(e.target.value) || 0);
                                    setTimeout(() => document.getElementById('scan-input')?.focus(), 50);
                                  }
                                }}
                                disabled={currentAudit.estado === 'finalizada' || (lockedProducts[product.id] && lockedProducts[product.id] !== user.nombre)}
                              />
                            </td>
                            <td>
                              <select 
                                className="form-select form-select-sm" 
                                style={{width: '140px'}}
                                value={product.novedad}
                                onChange={(e) => handleUpdateProduct(product.id, 'novedad', e.target.value)}
                                disabled={currentAudit.estado === 'finalizada'}
                              >
                                <option value="sin_novedad">Sin Novedad</option>
                                <option value="faltante">Faltante</option>
                                <option value="sobrante">Sobrante</option>
                                <option value="averia">Avería</option>
                                <option value="fecha_corta">Fecha Corta</option>
                                <option value="contaminado">Contaminado</option>
                                <option value="vencido">Vencido</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                value={product.observaciones || ''}
                                onChange={(e) => handleUpdateProduct(product.id, 'observaciones', e.target.value)}
                                placeholder="Observaciones..."
                                disabled={currentAudit.estado === 'finalizada'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de colaboradores */}
      <CollaboratorModal 
        show={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        auditId={selectedAuditForCollab?.id}
        onSuccess={handleCollaboratorSuccess}
      />

      {/* Modal de escáner de cámara */}
      {showCameraScanner && (
        <CameraScanner 
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      <AuditHistory 
        auditId={currentAudit?.id}
        show={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}
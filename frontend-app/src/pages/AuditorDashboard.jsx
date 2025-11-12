import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchAudits,
  uploadAuditFiles,
  iniciarAuditoria,
  fetchAuditDetails,
  updateProduct,
  finishAudit,
  fetchNoveltiesBySku
} from '../services/api';
import { getCurrentUser } from '../services/auth';
import CollaboratorModal from '../components/CollaboratorModal';
import CameraScanner from '../components/CameraScanner';
import AuditHistory from '../components/AuditHistory';
import NovedadModal from '../components/NovedadModal';
import ToastContainer, { toast } from '../components/Toast';
import ConfirmModal, { confirm } from '../components/ConfirmModal';
import { API_BASE_URL } from '../services/api';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useSessionKeepAlive } from '../hooks/useSessionKeepAlive';
import { offlineDB } from '../utils/offlineDB';

let selectedVoice = null;
let voicesLoaded = false;

// Precargar voces inmediatamente
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
  
  // Si el texto es solo un número, agregar "cantidad" para mejor pronunciación
  let spokenText = text;
  if (/^\d+$/.test(String(text).trim())) {
    spokenText = `cantidad ${text}`;
  }
  
  const utterance = new SpeechSynthesisUtterance(spokenText);
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.lang = 'es-CO';
  utterance.rate = 1.3;
  utterance.pitch = 1.1;
  utterance.volume = 1;
  
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterNovedad, setFilterNovedad] = useState('all');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lockedProducts, setLockedProducts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [noveltiesBySku, setNoveltiesBySku] = useState([]);
  const [showNovedadModal, setShowNovedadModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [otSearch, setOtSearch] = useState('');
  const wsRef = useRef(null);
  const wsThrottleRef = useRef(null);
  const abortControllerRef = useRef(null);
  const user = getCurrentUser();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync(currentAudit?.id);
  useSessionKeepAlive(30000); // Ping cada 30 segundos
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadAudits();
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!currentAudit) return;
    
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/${currentAudit.id}?token=${token}`;
    console.log('Connecting to WebSocket for audit:', currentAudit.id);
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => console.log('✅ WebSocket connected');
    wsRef.current.onerror = (err) => console.error('❌ WebSocket error:', err);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'ping') return;
      
      // Throttle: agrupar mensajes cada 500ms
      clearTimeout(wsThrottleRef.current);
      wsThrottleRef.current = setTimeout(() => {
        if (data.type === 'product_locked') {
          setLockedProducts(prev => ({...prev, [data.product_id]: data.user}));
          addNotification(`⚠️ ${data.user} está editando un producto`);
        } else if (data.type === 'product_unlocked') {
          setLockedProducts(prev => {const n = {...prev}; delete n[data.product_id]; return n;});
        } else if (data.type === 'product_updated') {
          setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
          if (data.user !== user.nombre) {
            addNotification(`✅ ${data.user} actualizó ${data.product.sku}`);
          }
        }
      }, 500);
    };
    
    return () => {
      clearTimeout(wsThrottleRef.current);
      wsRef.current?.close();
    };
  }, [currentAudit]);

  const loadAudits = async () => {
    try {
      const data = await fetchAudits();
      setAudits(data);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
    }
  };

  const handleOtSearch = async (e) => {
    e.preventDefault();
    if (!otSearch.trim()) {
      toast.warning('Ingresa una OT para buscar');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/audits/search-by-ot/${encodeURIComponent(otSearch.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error(`No se encontró auditoría con OT ${otSearch}`);
        } else {
          throw new Error('Error en la búsqueda');
        }
        return;
      }
      
      const auditData = await response.json();
      
      // Mostrar la auditoría encontrada como único resultado
      setAudits([{
        id: auditData.id,
        ubicacion_destino: `${auditData.ubicacion_destino} (Filtrado: ${otSearch})`,
        auditor_id: auditData.auditor_id,
        creada_en: auditData.creada_en,
        estado: auditData.estado,
        porcentaje_cumplimiento: auditData.porcentaje_cumplimiento
      }]);
      
      toast.success(`Auditoría encontrada con ${auditData.productos.length} producto(s) de OT ${otSearch}`);
    } catch (err) {
      toast.error('Error: ' + err.message);
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

  const handleVerAuditoria = async (auditId, isFiltered = false) => {
    try {
      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      await offlineDB.init();
      
      let data, prods;
      
      if (isOnline) {
        // Si es búsqueda filtrada, usar el endpoint de búsqueda
        if (isFiltered && otSearch) {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${API_BASE_URL}/api/audits/search-by-ot/${otSearch.trim()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          data = await response.json();
        } else {
          // Online: cargar desde API normal
          data = await fetchAuditDetails(auditId);
        }
        prods = data.productos || [];
        // Guardar en background sin bloquear UI
        offlineDB.saveProducts(auditId, prods).catch(err => console.error('Error saving offline:', err));
      } else {
        // Offline: cargar desde IndexedDB
        prods = await offlineDB.getProducts(auditId);
        if (!prods || prods.length === 0) {
          toast.error('No hay datos offline para esta auditoría');
          return;
        }
        // Reconstruir objeto audit básico
        const audit = audits.find(a => a.id === auditId);
        data = { ...audit, productos: prods };
      }
      
      setCurrentAudit(data);
      setProducts(prods);
      setCurrentPage(0);
      
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

      // Caso 1: Escaneo repetido del mismo SKU consecutivo = ABRIR MODAL
      if (lastScanned && lastScanned.sku === product.sku) {
        setLastScanned(null);
        setScanInput('');
        speak('Ingrese novedad');
        setSelectedProduct(product);
        setShowNovedadModal(true);
        return;
      }

      // Caso 2: Escaneo de SKU diferente = guardar anterior
      if (lastScanned && lastScanned.sku !== product.sku) {
        const lastProduct = products.find(p => p.sku === lastScanned.sku);
        if (lastProduct) {
          const changes = {
            cantidad_fisica: lastProduct.cantidad_documento,
            novedad: 'sin_novedad',
            observaciones: 'sin novedad'
          };
          setProducts(prev => prev.map(p => 
            p.id === lastProduct.id ? { ...p, ...changes } : p
          ));
          
          if (isOnline) {
            updateProduct(currentAudit.id, lastProduct.id, changes).catch(err => console.error('Error:', err));
          } else {
            offlineDB.savePendingChange(currentAudit.id, lastProduct.id, changes).then(() => {
              window.dispatchEvent(new Event('pendingChangesUpdated'));
            });
          }
          speak('Guardado');
        }
      }

      // Caso 3: SKU ya tiene novedad previa - abrir modal para modificar
      const updatedProduct = products.find(p => p.id === product.id);
      if (updatedProduct && 
          updatedProduct.cantidad_fisica !== null && 
          updatedProduct.cantidad_fisica !== undefined &&
          updatedProduct.novedad !== 'sin_novedad') {
        setLastScanned({ sku: updatedProduct.sku, id: updatedProduct.id });
        setScanInput('');
        const diferencia = Math.abs(updatedProduct.cantidad_fisica - updatedProduct.cantidad_documento);
        const mensaje = updatedProduct.novedad === 'faltante' ? `Faltante ${diferencia}` : 
                       updatedProduct.novedad === 'sobrante' ? `Sobrante ${diferencia}` : updatedProduct.novedad;
        speak(mensaje);
        setSelectedProduct(updatedProduct);
        setShowNovedadModal(true);
        return;
      }

      // Caso 4: Primera vez o sin novedad especial - anunciar cantidad
      setLastScanned({ sku: product.sku, id: product.id });
      setScannedCount(prev => prev + 1);
      speak(`${product.cantidad_documento}`);
      setScanInput('');
    }
  };

  const handleQuantityChange = async (productId, cantidad) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Validar que la cantidad sea razonable (máximo 2 mil millones)
    if (cantidad > 2147483647) {
      toast.error('Cantidad demasiado grande. Máximo: 2,147,483,647');
      return;
    }

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

    const changes = { cantidad_fisica: cantidad, novedad, observaciones };
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...changes } : p
    ));

    speak('Guardado');
    
    if (isOnline) {
      updateProduct(currentAudit.id, productId, changes).catch(err => console.error('Error:', err));
    } else {
      await offlineDB.savePendingChange(currentAudit.id, productId, changes);
      window.dispatchEvent(new Event('pendingChangesUpdated'));
    }
  };

  const handleEditClick = (product) => {
    if (currentAudit.estado === 'finalizada') return;
    setEditingProductId(product.id);
    setEditingQuantity(product.cantidad_fisica !== null && product.cantidad_fisica !== undefined ? String(product.cantidad_fisica) : '');
  };

  const handleEditSave = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && String(product.cantidad_fisica) === editingQuantity) {
      setEditingProductId(null);
      return;
    }

    const quantity = parseInt(editingQuantity, 10);
    if (!isNaN(quantity)) {
      handleQuantityChange(productId, quantity);
    }
    setEditingProductId(null);
  };

  const handleUpdateProduct = async (productId, field, value) => {
    const changes = { [field]: value };
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...changes } : p
    ));
    
    try {
      if (isOnline) {
        await updateProduct(currentAudit.id, productId, changes);
      } else {
        await offlineDB.savePendingChange(currentAudit.id, productId, changes);
        toast.info('💾 Guardado offline');
        window.dispatchEvent(new Event('pendingChangesUpdated'));
      }
    } catch (err) {
      await offlineDB.savePendingChange(currentAudit.id, productId, changes);
      window.dispatchEvent(new Event('pendingChangesUpdated'));
    }
  };

  const handleSave = async () => {
    try {
      await fetchAuditDetails(currentAudit.id);
      toast.success('Progreso guardado correctamente');
    } catch (err) {
      toast.error('Error guardando: ' + err.message);
    }
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

  const handleNovedadSave = async (changes) => {
    if (!selectedProduct) return;
    
    // Calcular automáticamente faltante/sobrante si no se especificó otra novedad
    if (changes.novedad === 'sin_novedad' && changes.cantidad_fisica !== selectedProduct.cantidad_documento) {
      const diferencia = Math.abs(changes.cantidad_fisica - selectedProduct.cantidad_documento);
      if (changes.cantidad_fisica < selectedProduct.cantidad_documento) {
        changes.novedad = 'faltante';
        changes.observaciones = changes.observaciones || `${diferencia} faltante`;
      } else if (changes.cantidad_fisica > selectedProduct.cantidad_documento) {
        changes.novedad = 'sobrante';
        changes.observaciones = changes.observaciones || `${diferencia} sobrante`;
      }
    }
    
    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id ? { ...p, ...changes } : p
    ));

    speak('Guardado');
    
    if (isOnline) {
      updateProduct(currentAudit.id, selectedProduct.id, changes).catch(err => console.error('Error:', err));
    } else {
      await offlineDB.savePendingChange(currentAudit.id, selectedProduct.id, changes);
      window.dispatchEvent(new Event('pendingChangesUpdated'));
    }
    
    setShowNovedadModal(false);
    setSelectedProduct(null);
    setTimeout(() => document.getElementById('scan-input')?.focus(), 100);
  };

  const handleCameraScan = (decodedText) => {
    setShowCameraScanner(false);
    
    const scannedSku = decodedText.trim().toUpperCase().replace(/^0+/, '');
    if (!scannedSku) return;
    
    const product = skuIndex[scannedSku];
    if (!product) {
      speak('Producto no encontrado');
      return;
    }

    // Caso 1: Escaneo repetido del mismo SKU consecutivo = ABRIR MODAL
    if (lastScanned && lastScanned.sku === product.sku) {
      setLastScanned(null);
      speak('Ingrese novedad');
      setSelectedProduct(product);
      setShowNovedadModal(true);
      return;
    }

    // Caso 2: Escaneo de SKU diferente = guardar anterior
    if (lastScanned && lastScanned.sku !== product.sku) {
      const lastProduct = products.find(p => p.sku === lastScanned.sku);
      if (lastProduct) {
        const changes = {
          cantidad_fisica: lastProduct.cantidad_documento,
          novedad: 'sin_novedad',
          observaciones: 'sin novedad'
        };
        setProducts(prev => prev.map(p => 
          p.id === lastProduct.id ? { ...p, ...changes } : p
        ));
        
        if (isOnline) {
          updateProduct(currentAudit.id, lastProduct.id, changes).catch(err => console.error('Error:', err));
        } else {
          offlineDB.savePendingChange(currentAudit.id, lastProduct.id, changes).then(() => {
            window.dispatchEvent(new Event('pendingChangesUpdated'));
          });
        }
        speak('Guardado');
      }
    }

    // Caso 3: SKU ya tiene novedad previa - abrir modal para modificar
    const updatedProduct = products.find(p => p.id === product.id);
    if (updatedProduct && 
        updatedProduct.cantidad_fisica !== null && 
        updatedProduct.cantidad_fisica !== undefined &&
        updatedProduct.novedad !== 'sin_novedad') {
      setLastScanned({ sku: updatedProduct.sku, id: updatedProduct.id });
      const diferencia = Math.abs(updatedProduct.cantidad_fisica - updatedProduct.cantidad_documento);
      const mensaje = updatedProduct.novedad === 'faltante' ? `Faltante ${diferencia}` : 
                     updatedProduct.novedad === 'sobrante' ? `Sobrante ${diferencia}` : updatedProduct.novedad;
      speak(mensaje);
      setSelectedProduct(updatedProduct);
      setShowNovedadModal(true);
      return;
    }

    // Caso 4: Primera vez o sin novedad especial - anunciar cantidad
    setLastScanned({ sku: product.sku, id: product.id });
    setScannedCount(prev => prev + 1);
    speak(`${product.cantidad_documento}`);
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
    let filtered = products;
    
    if (debouncedSearch || filterNovedad !== 'all') {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = products.filter(p => {
        if (debouncedSearch && !p.sku.toLowerCase().includes(searchLower) && !p.nombre_articulo.toLowerCase().includes(searchLower)) {
          return false;
        }
        if (filterNovedad !== 'all' && p.novedad !== filterNovedad) {
          return false;
        }
        return true;
      });
    }
    
    // Paginación
    const start = currentPage * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [products, debouncedSearch, filterNovedad, currentPage]);
  
  const totalPages = useMemo(() => {
    let count = products.length;
    if (debouncedSearch || filterNovedad !== 'all') {
      const searchLower = debouncedSearch.toLowerCase();
      count = products.filter(p => {
        if (debouncedSearch && !p.sku.toLowerCase().includes(searchLower) && !p.nombre_articulo.toLowerCase().includes(searchLower)) return false;
        if (filterNovedad !== 'all' && p.novedad !== filterNovedad) return false;
        return true;
      }).length;
    }
    return Math.ceil(count / ITEMS_PER_PAGE);
  }, [products, debouncedSearch, filterNovedad]);

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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Dashboard del Auditor</h1>
        
        {/* Indicador Online/Offline */}
        <div className="d-flex align-items-center gap-2">
          {isOnline ? (
            <span className="badge bg-success" style={{fontSize: '14px', padding: '8px 12px'}}>
              <i className="bi bi-wifi"></i> Online
            </span>
          ) : (
            <span className="badge bg-danger" style={{fontSize: '14px', padding: '8px 12px'}}>
              <i className="bi bi-wifi-off"></i> Offline
            </span>
          )}
          
          {/* Contador de cambios pendientes */}
          {pendingCount > 0 && (
            <span className="badge bg-warning text-dark" style={{fontSize: '14px', padding: '8px 12px'}}>
              <i className="bi bi-cloud-upload"></i> {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              {isSyncing && <span className="spinner-border spinner-border-sm ms-2"></span>}
            </span>
          )}
          
          {/* Botón sincronizar manual */}
          {pendingCount > 0 && isOnline && (
            <button 
              className="btn btn-sm btn-warning" 
              onClick={syncNow}
              disabled={isSyncing}
            >
              <i className="bi bi-arrow-repeat"></i> Sincronizar
            </button>
          )}
        </div>
      </div>

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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Mis Auditorías (Últimas 6)</h5>
                <form onSubmit={handleOtSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar por OT (ej: VE23456)"
                    value={otSearch}
                    onChange={(e) => setOtSearch(e.target.value)}
                    style={{width: '250px'}}
                  />
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="bi bi-search"></i>
                  </button>
                  {otSearch && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setOtSearch('');
                        loadAudits();
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </form>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr style={{textAlign: 'center'}}>
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
                        <td>{new Date(audit.creada_en).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
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
                              <button className="btn btn-sm btn-info me-2" onClick={() => handleVerAuditoria(audit.id, audit.ubicacion_destino.includes('Filtrado:'))}>
                                Ver
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenCollaboratorModal(audit)}>
                                <i className="bi bi-people"></i>
                              </button>
                            </>
                          )}
                          {audit.estado === 'finalizada' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleVerAuditoria(audit.id, audit.ubicacion_destino.includes('Filtrado:'))}>
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
                        <>
                          <button className="btn btn-primary me-2" onClick={handleSave}>
                            <i className="bi bi-save"></i> Guardar
                          </button>
                          <button className="btn btn-warning me-2" onClick={() => {
                            setShowVerifyModal(true);
                            
                            // Combinar novedades del array Y del campo único
                            const localNovelties = products
                              .filter(p => 
                                (p.novelties && p.novelties.length > 0) || 
                                (p.novedad && p.novedad !== 'sin_novedad')
                              )
                              .reduce((acc, p) => {
                                if (!acc[p.sku]) {
                                  acc[p.sku] = {
                                    sku: p.sku,
                                    nombre_articulo: p.nombre_articulo,
                                    cantidad_documento: p.cantidad_documento,
                                    novelties: []
                                  };
                                }
                                
                                // Agregar novedades del array (avería, vencido, etc.)
                                if (p.novelties && p.novelties.length > 0) {
                                  p.novelties.forEach(nov => {
                                    acc[p.sku].novelties.push({
                                      tipo: nov.novedad_tipo,
                                      cantidad: nov.cantidad,
                                      observaciones: nov.observaciones
                                    });
                                  });
                                }
                                
                                // Agregar novedad del campo único (faltante/sobrante)
                                if (p.novedad && p.novedad !== 'sin_novedad') {
                                  acc[p.sku].novelties.push({
                                    tipo: p.novedad,
                                    cantidad: p.cantidad_fisica,
                                    observaciones: p.observaciones
                                  });
                                }
                                
                                return acc;
                              }, {});
                            setNoveltiesBySku(Object.values(localNovelties));
                          }}>
                            <i className="bi bi-exclamation-triangle"></i> Verificar
                          </button>
                          <button className="btn btn-success" onClick={handleFinish}>
                            <i className="bi bi-check-circle"></i> Finalizar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive" style={{width: '100%', margin: '0 auto'}}>
                    <table className="table table-sm table-hover" style={{fontSize: '0.85rem', width: '100%', marginBottom: '0'}}>
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
                        <tr style={{textAlign: 'center'}}>
                          <th style={{width: '80px'}}>OT</th>
                          <th style={{width: '120px'}}>SKU</th>
                          <th>Nombre</th>
                          <th style={{width: '80px'}}>Doc</th>
                          <th style={{width: '80px'}}>Física</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr key={product.id} data-product-id={product.id}>
                            <td style={{fontSize: '0.75rem'}}><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{product.orden_traslado_original}</span></td>
                            <td style={{fontWeight: '500'}}>{product.sku}</td>
                            <td style={{fontSize: '0.8rem'}}>{product.nombre_articulo}</td>
                            <td style={{textAlign: 'center'}}>{product.cantidad_documento}</td>
                            <td style={{textAlign: 'center'}}>
                              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  key={product.id}
                                  defaultValue={product.cantidad_fisica ?? ''}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    const newQuantity = value === '' ? null : parseInt(value, 10);
                                    if (newQuantity !== product.cantidad_fisica) {
                                      handleQuantityChange(product.id, newQuantity);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.target.blur();
                                    }
                                  }}
                                  disabled={currentAudit.estado === 'finalizada'}
                                  style={{ width: '80px', margin: 'auto' }}
                                />
                                {product.novedad && product.novedad !== 'sin_novedad' && (
                                  <span className={`badge bg-${
                                    product.novedad === 'faltante' ? 'danger' :
                                    product.novedad === 'sobrante' ? 'warning' :
                                    product.novedad === 'averia' ? 'dark' : 'secondary'
                                  } ms-1`} style={{fontSize: '10px'}}>
                                    ⚠️
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Controles de paginación */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        <i className="bi bi-chevron-left"></i> Anterior
                      </button>
                      <span className="text-muted">
                        Página {currentPage + 1} de {totalPages}
                      </span>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Siguiente <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de colaboradores */}
      {showCollaboratorModal && <CollaboratorModal 
        show={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        auditId={selectedAuditForCollab?.id}
        onSuccess={handleCollaboratorSuccess}
      />}

      {/* Modal de escáner de cámara */}
      {showCameraScanner && (
        <CameraScanner 
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {showHistory && <AuditHistory 
        auditId={currentAudit?.id}
        show={showHistory}
        onClose={() => setShowHistory(false)}
      />}

      {/* Modal de Verificación */}
      {showVerifyModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-warning"></i> Verificación de Auditoría
                </h5>
                <button className="btn-close" onClick={() => setShowVerifyModal(false)}></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const productsNotScanned = products.filter(p => 
                    (p.cantidad_fisica === null || p.cantidad_fisica === undefined) &&
                    p.cantidad_documento > 0
                  );
                  
                  if (noveltiesBySku.length === 0 && productsNotScanned.length === 0) {
                    return (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle"></i> Todos los productos están escaneados sin novedades
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {noveltiesBySku.length > 0 && (
                        <>
                          <div className="alert alert-warning">
                            <strong>{noveltiesBySku.length}</strong> SKU(s) con novedades registradas
                          </div>
                          <div className="table-responsive mb-3">
                            <table className="table table-sm table-hover">
                              <thead>
                                <tr>
                                  <th>SKU</th>
                                  <th>Nombre</th>
                                  <th>Cant. Doc</th>
                                  <th>Novedades</th>
                                </tr>
                              </thead>
                              <tbody>
                                {noveltiesBySku.map((item, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{item.sku}</strong></td>
                                    <td>{item.nombre_articulo}</td>
                                    <td>{item.cantidad_documento}</td>
                                    <td>
                                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                        {item.novelties.map((nov, nIdx) => (
                                          <div key={nIdx} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <span className={`badge bg-${
                                              nov.tipo === 'faltante' ? 'danger' :
                                              nov.tipo === 'sobrante' ? 'warning' :
                                              nov.tipo === 'averia' ? 'dark' :
                                              nov.tipo === 'vencido' ? 'danger' :
                                              nov.tipo === 'fecha_corta' ? 'info' : 'secondary'
                                            }`} style={{minWidth: '90px'}}>
                                              {nov.tipo}
                                            </span>
                                            <strong style={{fontSize: '0.9rem'}}>x {nov.cantidad}</strong>
                                            {nov.observaciones && (
                                              <small className="text-muted" style={{fontSize: '0.75rem'}}>({nov.observaciones})</small>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                      
                      {productsNotScanned.length > 0 && (
                        <>
                          <div className="alert alert-danger">
                            <strong>{productsNotScanned.length}</strong> producto(s) sin escanear
                          </div>
                          <div className="table-responsive">
                            <table className="table table-sm table-hover">
                              <thead>
                                <tr>
                                  <th>SKU</th>
                                  <th>Nombre</th>
                                  <th>Cant. Doc</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productsNotScanned.map(p => (
                                  <tr key={p.id}>
                                    <td><strong>{p.sku}</strong></td>
                                    <td>{p.nombre_articulo}</td>
                                    <td>{p.cantidad_documento}</td>
                                    <td>
                                      <span className="badge bg-danger">Sin escanear</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NovedadModal 
        show={showNovedadModal}
        product={selectedProduct}
        onSave={handleNovedadSave}
        onClose={() => {
          setShowNovedadModal(false);
          setSelectedProduct(null);
          setTimeout(() => document.getElementById('scan-input')?.focus(), 100);
        }}
      />

      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}
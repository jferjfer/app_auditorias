# CAMBIOS NECESARIOS EN AuditorDashboard.jsx

## 1. Agregar estados para modo contraparte

Agregar después de la línea ~90 (donde están los otros estados):

```javascript
const [modoContraparte, setModoContraparte] = useState(false);
const [showDiscrepanciasModal, setShowDiscrepanciasModal] = useState(false);
const [discrepancias, setDiscrepancias] = useState([]);
const [contraparteSubida, setContraparteSubida] = useState(false);
```

## 2. Modificar handleModoSelected (línea ~250)

Cambiar:
```javascript
const handleModoSelected = async (modo) => {
  setModoConteoRapido(modo === 'conteo_rapido');
  setModoContraparte(modo === 'contraparte');  // AGREGAR ESTA LÍNEA
  setShowModoModal(false);
  try {
    await iniciarAuditoria(pendingAuditId, modo === 'conteo_rapido' ? 'conteo_rapido' : modo === 'contraparte' ? 'contraparte' : 'normal');
    loadAudits();
    setPendingAuditId(null);
  } catch (err) {
    toast.error('Error: ' + err.message);
  }
};
```

## 3. Agregar función para subir contraparte (después de handleUpload, línea ~230)

```javascript
const handleUploadContraparte = async (e) => {
  e.preventDefault();
  if (selectedFiles.length === 0) return toast.warning('Selecciona archivos de contraparte');
  setLoading(true);
  
  try {
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/audits/${currentAudit.id}/upload-contraparte`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error subiendo contraparte');
    }
    
    const result = await response.json();
    toast.success(result.message);
    
    setDiscrepancias(result.discrepancias || []);
    setContraparteSubida(true);
    setSelectedFiles([]);
    e.target.reset();
    
    if (result.discrepancias && result.discrepancias.length > 0) {
      setShowDiscrepanciasModal(true);
    }
    
    // Recargar auditoría
    await handleVerAuditoria(currentAudit.id);
  } catch (err) {
    toast.error('Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

## 4. Agregar función para resolver discrepancias

```javascript
const handleResolverDiscrepancia = async (productId, cantidadCorrecta, observaciones) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/audits/${currentAudit.id}/resolver-discrepancia?product_id=${productId}&cantidad_correcta=${cantidadCorrecta}&observaciones=${encodeURIComponent(observaciones || '')}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Error resolviendo discrepancia');
    }
    
    toast.success('Discrepancia resuelta');
    
    // Marcar como resuelta en el estado local
    setDiscrepancias(prev => prev.map(d => 
      d.product_id === productId ? { ...d, resuelta: true } : d
    ));
    
    // Recargar productos
    await handleVerAuditoria(currentAudit.id);
  } catch (err) {
    toast.error('Error: ' + err.message);
  }
};
```

## 5. Modificar la sección de carga de archivos (línea ~800)

Agregar después del formulario de carga normal:

```javascript
{/* Carga de contraparte (solo en modo contraparte) */}
{currentAudit && modoContraparte && currentAudit.estado === 'pendiente_contraparte' && !contraparteSubida && (
  <div style={{width: '100%', marginBottom: '15px'}}>
    <div className="col-12">
      <div className="card border-warning">
        <div className="card-body">
          <h5 className="card-title text-warning">
            <i className="bi bi-exclamation-triangle"></i> Subir Contraparte (Auditor 2)
          </h5>
          <p className="text-muted">La auditoría está pendiente de contraparte. Sube los archivos del segundo auditor para comparar.</p>
          <form onSubmit={handleUploadContraparte}>
            <div className="input-group">
              <input 
                type="file" 
                className="form-control" 
                accept=".xlsx,.xls" 
                multiple 
                onChange={handleFileSelect}
              />
              <button className="btn btn-warning" type="submit" disabled={loading}>
                <i className="bi bi-upload"></i> {loading ? 'Subiendo...' : 'Subir Contraparte'}
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
)}
```

## 6. Agregar botón "Verificar Discrepancias" en la sección de productos (línea ~1100)

Modificar la sección de botones donde está "Guardar", "Verificar", "Finalizar":

```javascript
{currentAudit.estado !== 'finalizada' && (
  <>
    {modoContraparte && contraparteSubida && discrepancias.length > 0 && (
      <button 
        className="btn btn-warning me-2" 
        onClick={() => setShowDiscrepanciasModal(true)}
      >
        <i className="bi bi-exclamation-triangle"></i> Verificar Discrepancias ({discrepancias.filter(d => !d.resuelta).length})
      </button>
    )}
    <button className="btn btn-primary me-2" onClick={handleSave}>
      <i className="bi bi-save"></i> Guardar
    </button>
    {/* ... resto de botones ... */}
  </>
)}
```

## 7. Agregar el modal de discrepancias al final (antes de ToastContainer, línea ~1500)

```javascript
<DiscrepanciasModal
  show={showDiscrepanciasModal}
  onClose={() => setShowDiscrepanciasModal(false)}
  discrepancias={discrepancias}
  onResolve={handleResolverDiscrepancia}
/>
```

## 8. Importar el componente al inicio del archivo

```javascript
import DiscrepanciasModal from '../components/DiscrepanciasModal';
```

## 9. Modificar condición de finalización (línea ~1050)

Cambiar la función handleFinish para validar que no haya discrepancias pendientes:

```javascript
const handleFinish = async () => {
  // Validar discrepancias en modo contraparte
  if (modoContraparte) {
    const pendientes = discrepancias.filter(d => !d.resuelta).length;
    if (pendientes > 0) {
      toast.error(`No puedes finalizar. Hay ${pendientes} discrepancia(s) sin resolver`);
      setShowDiscrepanciasModal(true);
      return;
    }
    if (!contraparteSubida) {
      toast.error('Debes subir la contraparte antes de finalizar');
      return;
    }
  }
  
  const confirmed = await confirm('¿Finalizar auditoría?');
  if (!confirmed) return;
  
  try {
    await finishAudit(currentAudit.id);
    toast.success('Auditoría finalizada');
    setCurrentAudit(null);
    setProducts([]);
    setModoConteoRapido(false);
    setModoContraparte(false);
    setContraparteSubida(false);
    setDiscrepancias([]);
    loadAudits();
  } catch (err) {
    toast.error('Error: ' + err.message);
  }
};
```

## 10. Agregar badge de estado en la tabla de auditorías (línea ~900)

Modificar la columna de estado para mostrar "Pendiente Contraparte":

```javascript
<td style={{textAlign: 'center'}}>
  <span className={`badge bg-${
    audit.estado === 'finalizada' ? 'success' : 
    audit.estado === 'en_progreso' ? 'warning' : 
    audit.estado === 'pendiente_contraparte' ? 'info' :
    audit.estado === 'con_contraparte' ? 'primary' :
    'secondary'
  }`}>
    {audit.estado === 'pendiente_contraparte' ? 'Pendiente Contraparte' :
     audit.estado === 'con_contraparte' ? 'Con Contraparte' :
     audit.estado}
  </span>
</td>
```

---

## RESUMEN DE CAMBIOS:

1. ✅ Agregar estados para modo contraparte
2. ✅ Modificar handleModoSelected
3. ✅ Agregar handleUploadContraparte
4. ✅ Agregar handleResolverDiscrepancia
5. ✅ Agregar formulario de carga de contraparte
6. ✅ Agregar botón "Verificar Discrepancias"
7. ✅ Agregar modal de discrepancias
8. ✅ Importar componente DiscrepanciasModal
9. ✅ Validar discrepancias antes de finalizar
10. ✅ Actualizar badges de estado

**IMPORTANTE:** Estos cambios deben aplicarse en el orden indicado para mantener la coherencia del código.

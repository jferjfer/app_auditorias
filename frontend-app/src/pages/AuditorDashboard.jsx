import React, { useState, useEffect } from 'react';
import { uploadAuditFiles, fetchAudits, iniciarAuditoria, fetchAuditDetails, updateProduct, finishAudit } from '../services/api';
import { getCurrentUser } from '../services/auth';

export default function AuditorDashboard() {
  const [audits, setAudits] = useState([]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const user = getCurrentUser();

  useEffect(() => {
    loadAudits();
  }, []);

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
    if (selectedFiles.length === 0) return alert('Selecciona archivos');
    setLoading(true);
    try {
      await uploadAuditFiles(selectedFiles);
      alert('Archivos subidos exitosamente');
      setSelectedFiles([]);
      e.target.reset();
      loadAudits();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = async (auditId) => {
    try {
      await iniciarAuditoria(auditId);
      loadAudits();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleVerAuditoria = async (auditId) => {
    try {
      const data = await fetchAuditDetails(auditId);
      setCurrentAudit(data);
      setProducts(data.productos || []);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sku = scanInput.trim().toLowerCase();
      const product = products.find(p => 
        p.sku.toLowerCase() === sku || 
        p.sku.toLowerCase().replace(/^0+/, '') === sku.replace(/^0+/, '')
      );
      if (product) {
        document.getElementById(`qty-${product.id}`)?.focus();
      } else {
        alert('Producto no encontrado');
      }
      setScanInput('');
    }
  };

  const handleUpdateProduct = async (productId, field, value) => {
    try {
      await updateProduct(currentAudit.id, productId, { [field]: value });
      const updated = await fetchAuditDetails(currentAudit.id);
      setProducts(updated.productos || []);
      setCurrentAudit(updated);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleFinish = async () => {
    if (!confirm('¿Finalizar auditoría?')) return;
    try {
      await finishAudit(currentAudit.id);
      alert('Auditoría finalizada');
      setCurrentAudit(null);
      setProducts([]);
      loadAudits();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h2 mb-4">Dashboard del Auditor</h1>

      {/* Carga de archivos */}
      <div className="row mb-4">
        <div className="col-md-12">
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
      <div className="row mb-4">
        <div className="col-md-12">
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
                            <button className="btn btn-sm btn-primary me-2" onClick={() => handleIniciar(audit.id)}>
                              Iniciar
                            </button>
                          )}
                          {audit.estado === 'en_progreso' && (
                            <button className="btn btn-sm btn-info" onClick={() => handleVerAuditoria(audit.id)}>
                              Ver
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
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Escanear Producto</h5>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-qr-code-scan"></i></span>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Escanea el SKU..." 
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleScan}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Productos - {currentAudit.ubicacion_destino}</h5>
                    <button className="btn btn-success" onClick={handleFinish}>
                      <i className="bi bi-check-circle"></i> Finalizar
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
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
                        {products.map(product => (
                          <tr key={product.id}>
                            <td>{product.sku}</td>
                            <td>{product.nombre_articulo}</td>
                            <td>{product.cantidad_documento}</td>
                            <td>
                              <input 
                                id={`qty-${product.id}`}
                                type="number" 
                                className="form-control form-control-sm" 
                                style={{width: '80px'}}
                                value={product.cantidad_fisica || ''}
                                onChange={(e) => handleUpdateProduct(product.id, 'cantidad_fisica', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <select 
                                className="form-select form-select-sm" 
                                style={{width: '140px'}}
                                value={product.novedad}
                                onChange={(e) => handleUpdateProduct(product.id, 'novedad', e.target.value)}
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
    </div>
  );
}
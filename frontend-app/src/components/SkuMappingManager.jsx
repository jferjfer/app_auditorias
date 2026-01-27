import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { toast } from './Toast';

export default function SkuMappingManager() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No hay token de autenticación');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/sku-mappings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        console.log('No autorizado - verifica que seas administrador');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setMappings(data);
      }
    } catch (err) {
      console.error('Error cargando mapeos:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar extensión
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
        e.target.value = '';
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar 5MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.warning('Selecciona un archivo Excel');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/sku-mappings/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error subiendo archivo');
      }
      
      const result = await response.json();
      
      // Mostrar resumen
      let mensaje = `✅ ${result.creados} creados`;
      if (result.actualizados > 0) mensaje += `, ${result.actualizados} actualizados`;
      if (result.errores > 0) mensaje += `, ⚠️ ${result.errores} errores`;
      
      toast.success(mensaje);
      
      if (result.detalles_errores && result.detalles_errores.length > 0) {
        console.log('Errores:', result.detalles_errores);
      }
      
      // Limpiar y recargar
      setSelectedFile(null);
      e.target.reset();
      loadMappings();
      
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (mappingId, currentState) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/sku-mappings/${mappingId}/toggle?activo=${!currentState}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success(!currentState ? 'Mapeo activado' : 'Mapeo desactivado');
        loadMappings();
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async (mappingId) => {
    if (!window.confirm('¿Eliminar este mapeo?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/sku-mappings/${mappingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Mapeo eliminado');
        loadMappings();
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  // Paginación
  const totalPages = Math.ceil(mappings.length / ITEMS_PER_PAGE);
  const paginatedMappings = mappings.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="row g-3 mb-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">
              <i className="bi bi-arrow-left-right"></i> Mapeo de SKUs
            </h5>
            <p className="text-muted small">
              Carga un archivo Excel con columnas: <strong>SKU ANTIGUO</strong> (físico) y <strong>SKU NUEVO</strong> (sistema)
            </p>
            
            {/* Formulario de carga */}
            <form onSubmit={handleUpload} className="mb-3">
              <div className="input-group">
                <input 
                  type="file" 
                  className="form-control" 
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading || !selectedFile}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload"></i> Subir Mapeos
                    </>
                  )}
                </button>
              </div>
              {selectedFile && (
                <small className="text-muted">
                  Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </small>
              )}
            </form>

            {/* Tabla de mapeos */}
            {mappings.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>SKU Antiguo (Físico)</th>
                        <th>SKU Nuevo (Sistema)</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th style={{width: '150px'}}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMappings.map(mapping => (
                        <tr key={mapping.id}>
                          <td><code>{mapping.sku_antiguo}</code></td>
                          <td><code>{mapping.sku_nuevo}</code></td>
                          <td>
                            <small className="text-muted">
                              {new Date(mapping.fecha_creacion).toLocaleDateString('es-CO')}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${mapping.activo ? 'bg-success' : 'bg-secondary'}`}>
                              {mapping.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className={`btn btn-sm ${mapping.activo ? 'btn-warning' : 'btn-success'} me-1`}
                              onClick={() => handleToggle(mapping.id, mapping.activo)}
                              title={mapping.activo ? 'Desactivar' : 'Activar'}
                            >
                              <i className={`bi ${mapping.activo ? 'bi-pause' : 'bi-play'}`}></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(mapping.id)}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
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
                      Página {currentPage + 1} de {totalPages} ({mappings.length} mapeos)
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
              </>
            ) : (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No hay mapeos de SKU cargados. Sube un archivo Excel para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

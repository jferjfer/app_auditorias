import React, { useState } from 'react';
import { addOtToAudit } from '../services/api';
import { toast } from './Toast';

export default function AddOtModal({ show, auditId, onClose, onSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.warning('Selecciona al menos un archivo');
      return;
    }

    setLoading(true);
    try {
      const result = await addOtToAudit(auditId, selectedFiles);
      toast.success(`${result.productos_agregados} productos agregados exitosamente`);
      setSelectedFiles([]);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Agregar OT Adicional</h5>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              style={{fontSize: '1.2rem', padding: '0.25rem 0.5rem'}}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Archivos Excel</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={handleFileSelect}
                />
                {selectedFiles.length > 0 && (
                  <small className="text-muted">
                    {selectedFiles.length} archivo(s) seleccionado(s)
                  </small>
                )}
              </div>
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> Los productos de la nueva OT se agregarán a esta auditoría.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Agregando...' : 'Agregar OT'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

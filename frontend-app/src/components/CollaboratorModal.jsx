import React, { useState, useEffect } from 'react';
import { fetchAuditors, addCollaborators } from '../services/api';

export default function CollaboratorModal({ show, onClose, auditId, onSuccess }) {
  const [auditors, setAuditors] = useState([]);
  const [selectedAuditors, setSelectedAuditors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      loadAuditors();
    }
  }, [show]);

  const loadAuditors = async () => {
    try {
      const data = await fetchAuditors();
      setAuditors(data);
    } catch (err) {
      console.error('Error cargando auditores:', err);
    }
  };

  const toggleAuditor = (auditorId) => {
    setSelectedAuditors(prev => 
      prev.includes(auditorId) 
        ? prev.filter(id => id !== auditorId)
        : [...prev, auditorId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAuditors.length === 0) {
      alert('Selecciona al menos un auditor');
      return;
    }

    setLoading(true);
    try {
      await addCollaborators(auditId, selectedAuditors);
      onSuccess?.();
      handleClose();
    } catch (err) {
      alert('Error asignando colaboradores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAuditors([]);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-people-fill me-2"></i>
              Asignar Colaboradores
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="text-muted mb-3">
                Selecciona los auditores que colaborarán en esta auditoría:
              </p>
              <div className="list-group">
                {auditors.map(auditor => (
                  <label 
                    key={auditor.id} 
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    style={{cursor: 'pointer'}}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input me-3"
                      checked={selectedAuditors.includes(auditor.id)}
                      onChange={() => toggleAuditor(auditor.id)}
                    />
                    <div>
                      <div className="fw-bold">{auditor.nombre}</div>
                      <small className="text-muted">{auditor.correo}</small>
                    </div>
                  </label>
                ))}
              </div>
              {selectedAuditors.length > 0 && (
                <div className="alert alert-info mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  {selectedAuditors.length} auditor(es) seleccionado(s)
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || selectedAuditors.length === 0}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Asignando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Asignar Colaboradores
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

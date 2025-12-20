import React, { useState } from 'react';

export default function AuditConfirmModal({ show, auditData, onConfirm, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  if (!show || !auditData) return null;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-check-circle-fill me-2"></i>
              Auditoría Creada Exitosamente
            </h5>
          </div>
          <div className="modal-body">
            <div className="alert alert-info mb-3">
              <strong>Por favor, verifica que la información sea correcta antes de continuar.</strong>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-3 text-muted">Detalles de la Auditoría</h6>
                    
                    <div className="mb-2">
                      <strong>ID de Auditoría:</strong> #{auditData.audit_id}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Origen:</strong> {auditData.origen || 'N/A'}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Destino:</strong> {auditData.destino || 'N/A'}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Total de Productos:</strong> {auditData.productos_procesados}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Órdenes de Traslado:</strong> {auditData.numero_ordenes}
                    </div>
                    
                    {auditData.ordenes_procesadas && auditData.ordenes_procesadas.length > 0 && (
                      <div className="mt-3">
                        <strong>OTs Procesadas:</strong>
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {auditData.ordenes_procesadas.map((ot, idx) => (
                            <span key={idx} className="badge bg-secondary">{ot}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="alert alert-warning mt-3 mb-0">
              <small>
                <i className="bi bi-exclamation-triangle me-1"></i>
                Si hay algún error, puedes eliminar esta auditoría y volver a cargar los archivos correctos.
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-danger" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Eliminando...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Eliminar - Hay un Error
                </>
              )}
            </button>
            <button 
              className="btn btn-success" 
              onClick={onConfirm}
              disabled={deleting}
            >
              <i className="bi bi-check-circle me-2"></i>
              Confirmar - Todo Correcto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

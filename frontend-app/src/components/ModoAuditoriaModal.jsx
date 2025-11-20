import React from 'react';

export default function ModoAuditoriaModal({ show, onClose, onSelect }) {
  if (!show) return null;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Selecciona el Tipo de Auditoría</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="d-grid gap-3">
              <button 
                className="btn btn-outline-primary btn-lg text-start"
                onClick={() => onSelect('normal')}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-gear-fill fs-2 me-3"></i>
                  <div>
                    <strong>Auditoría Normal</strong>
                    <p className="mb-0 small text-muted">Valida contra documento, escaneo inteligente con novedades</p>
                  </div>
                </div>
              </button>
              
              <button 
                className="btn btn-outline-success btn-lg text-start"
                onClick={() => onSelect('conteo_rapido')}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-lightning-fill fs-2 me-3"></i>
                  <div>
                    <strong>Conteo Rápido</strong>
                    <p className="mb-0 small text-muted">Pistolero puro - cuenta todo, calcula novedades al verificar</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

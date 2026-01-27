import React, { useState } from 'react';

export default function DiscrepanciasModal({ show, onClose, discrepancias, onResolve }) {
  const [resolviendo, setResolviendo] = useState(null);
  const [cantidadCorrecta, setCantidadCorrecta] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!show) return null;

  const handleResolverClick = (disc) => {
    setResolviendo(disc);
    setCantidadCorrecta('');
    setObservaciones('');
  };

  const handleGuardarResolucion = () => {
    if (!cantidadCorrecta) {
      alert('Ingresa la cantidad correcta');
      return;
    }
    
    onResolve(resolviendo.product_id, parseInt(cantidadCorrecta), observaciones);
    setResolviendo(null);
    setCantidadCorrecta('');
    setObservaciones('');
  };

  const discrepanciasNoResueltas = discrepancias.filter(d => !d.resuelta);
  const todasResueltas = discrepanciasNoResueltas.length === 0;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle"></i> Verificación de Discrepancias
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {discrepancias.length === 0 ? (
              <div className="alert alert-success">
                <i className="bi bi-check-circle"></i> No hay discrepancias - Todas las cantidades coinciden
              </div>
            ) : (
              <>
                <div className="alert alert-warning">
                  <strong>{discrepanciasNoResueltas.length}</strong> discrepancia(s) detectada(s)
                  {todasResueltas && <span className="ms-2 badge bg-success">Todas resueltas ✓</span>}
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Primera Auditoría</th>
                        <th>Contraparte</th>
                        <th>Diferencia</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discrepancias.map((disc, idx) => (
                        <tr key={idx} className={disc.resuelta ? 'table-success' : 'table-warning'}>
                          <td><span className="badge bg-secondary">{disc.ot}</span></td>
                          <td><strong>{disc.sku}</strong></td>
                          <td>{disc.nombre}</td>
                          <td className="text-center">{disc.cantidad_fisica}</td>
                          <td className="text-center">{disc.cantidad_contraparte}</td>
                          <td className="text-center">
                            <span className={`badge ${disc.diferencia > 0 ? 'bg-warning' : 'bg-danger'}`}>
                              {disc.diferencia > 0 ? '+' : ''}{disc.diferencia}
                            </span>
                          </td>
                          <td>
                            {disc.resuelta ? (
                              <span className="badge bg-success">✓ Resuelta</span>
                            ) : (
                              <span className="badge bg-warning">Pendiente</span>
                            )}
                          </td>
                          <td>
                            {!disc.resuelta && (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleResolverClick(disc)}
                              >
                                Resolver
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>

      {/* Modal de resolución */}
      {resolviendo && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Resolver Discrepancia - {resolviendo.sku}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setResolviendo(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Primera Auditoría:</strong> {resolviendo.cantidad_fisica} unidades<br/>
                  <strong>Contraparte:</strong> {resolviendo.cantidad_contraparte} unidades<br/>
                  <strong>Diferencia:</strong> {resolviendo.diferencia} unidades
                </div>

                <div className="mb-3">
                  <label className="form-label">Cantidad Correcta *</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={cantidadCorrecta}
                    onChange={(e) => setCantidadCorrecta(e.target.value)}
                    placeholder="Ingresa la cantidad correcta"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Explica por qué hay diferencia (opcional)"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setResolviendo(null)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleGuardarResolucion}
                >
                  <i className="bi bi-check-circle"></i> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

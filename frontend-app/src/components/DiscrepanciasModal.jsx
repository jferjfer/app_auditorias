import React from 'react';

export default function DiscrepanciasModal({ show, onClose, discrepancias }) {
  if (!show) return null;

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
                  <strong>{discrepancias.length}</strong> discrepancia(s) detectada(s)
                </div>

                {/* Resumen de novedades */}
                {(() => {
                  const totalSobrantes = discrepancias.filter(d => d.diferencia < 0).length;
                  const totalFaltantes = discrepancias.filter(d => d.diferencia > 0).length;
                  const cantidadSobrantes = discrepancias
                    .filter(d => d.diferencia < 0)
                    .reduce((sum, d) => sum + Math.abs(d.diferencia), 0);
                  const cantidadFaltantes = discrepancias
                    .filter(d => d.diferencia > 0)
                    .reduce((sum, d) => sum + d.diferencia, 0);
                  
                  return (
                    <div className="row g-2 mb-3">
                      {totalFaltantes > 0 && (
                        <div className="col-md-6">
                          <div className="card bg-danger text-white">
                            <div className="card-body text-center py-2">
                              <h4 className="mb-0">{cantidadFaltantes}</h4>
                              <small>Unidades Faltantes Físicas ({totalFaltantes} producto{totalFaltantes !== 1 ? 's' : ''})</small>
                            </div>
                          </div>
                        </div>
                      )}
                      {totalSobrantes > 0 && (
                        <div className="col-md-6">
                          <div className="card bg-warning text-dark">
                            <div className="card-body text-center py-2">
                              <h4 className="mb-0">{cantidadSobrantes}</h4>
                              <small>Unidades Sobrantes Físicas ({totalSobrantes} producto{totalSobrantes !== 1 ? 's' : ''})</small>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Doc</th>
                        <th>Primera Aud.</th>
                        <th>Contraparte</th>
                        <th>Novedad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discrepancias.map((disc, idx) => (
                        <tr key={idx}>
                          <td><span className="badge bg-secondary">{disc.ot}</span></td>
                          <td><strong>{disc.sku}</strong></td>
                          <td>{disc.nombre}</td>
                          <td className="text-center">{disc.cantidad_documento || 0}</td>
                          <td className="text-center">{disc.cantidad_fisica}</td>
                          <td className="text-center">{disc.cantidad_contraparte}</td>
                          <td className="text-center">
                            {disc.diferencia < 0 ? (
                              <span className="badge bg-warning text-dark">Sobrante físico {Math.abs(disc.diferencia)}</span>
                            ) : disc.diferencia > 0 ? (
                              <span className="badge bg-danger">Faltante físico {disc.diferencia}</span>
                            ) : (
                              <span className="badge bg-success">Sin diferencia</span>
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
    </div>
  );
}

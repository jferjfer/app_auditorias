import React, { useMemo } from 'react';

export default function VerificarConteoModal({ show, onClose, products, onSave, onFinish }) {
  const novedadesAgrupadas = useMemo(() => {
    const grupos = {
      sin_novedad: [],
      faltantes: [],
      sobrantes: [],
      no_referenciados: [],
      sin_escanear: []
    };

    products.forEach(p => {
      const fisico = p.cantidad_fisica || 0;
      const documento = p.cantidad_documento || 0;

      // Si es producto nuevo (no referenciado)
      if (p.isNew) {
        grupos.no_referenciados.push(p);
      } else if (fisico === 0 && documento > 0) {
        grupos.sin_escanear.push(p);
      } else if (fisico < documento) {
        grupos.faltantes.push(p);
      } else if (fisico > documento) {
        grupos.sobrantes.push(p);
      } else if (fisico === documento && fisico > 0) {
        grupos.sin_novedad.push(p);
      }
    });

    return grupos;
  }, [products]);

  if (!show) return null;

  const total = products.length;
  const { sin_novedad, faltantes, sobrantes, no_referenciados, sin_escanear } = novedadesAgrupadas;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-check2-square text-success"></i> Verificación de Conteo
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Resumen */}
            <div className="row g-2 mb-4">
              <div className="col-md-2">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-0">{sin_novedad.length}</h3>
                    <small>Sin Novedad</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-danger text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-0">{faltantes.length}</h3>
                    <small>Faltantes</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-warning text-dark">
                  <div className="card-body text-center">
                    <h3 className="mb-0">{sobrantes.length}</h3>
                    <small>Sobrantes</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-0">{no_referenciados.length}</h3>
                    <small>No Referenciados</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-secondary text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-0">{sin_escanear.length}</h3>
                    <small>Sin Escanear</small>
                  </div>
                </div>
              </div>
            </div>

            {/* No Referenciados */}
            {no_referenciados.length > 0 && (
              <div className="mb-4">
                <h6 className="text-info">🆕 NO REFERENCIADOS ({no_referenciados.length})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Cant. Física</th>
                      </tr>
                    </thead>
                    <tbody>
                      {no_referenciados.map(p => (
                        <tr key={p.id}>
                          <td><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{p.orden_traslado_original}</span></td>
                          <td><strong>{p.sku}</strong></td>
                          <td>{p.nombre_articulo}</td>
                          <td><span className="badge bg-info">{p.cantidad_fisica}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Faltantes */}
            {faltantes.length > 0 && (
              <div className="mb-4">
                <h6 className="text-danger">❌ FALTANTES ({faltantes.length})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Doc</th>
                        <th>Física</th>
                        <th>Falta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faltantes.map(p => (
                        <tr key={p.id}>
                          <td><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{p.orden_traslado_original}</span></td>
                          <td><strong>{p.sku}</strong></td>
                          <td>{p.nombre_articulo}</td>
                          <td>{p.cantidad_documento}</td>
                          <td>{p.cantidad_fisica || 0}</td>
                          <td><span className="badge bg-danger">{p.cantidad_documento - (p.cantidad_fisica || 0)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sobrantes */}
            {sobrantes.length > 0 && (
              <div className="mb-4">
                <h6 className="text-warning">⚠️ SOBRANTES ({sobrantes.length})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Doc</th>
                        <th>Física</th>
                        <th>Sobra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sobrantes.map(p => (
                        <tr key={p.id}>
                          <td><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{p.orden_traslado_original}</span></td>
                          <td><strong>{p.sku}</strong></td>
                          <td>{p.nombre_articulo}</td>
                          <td>{p.cantidad_documento}</td>
                          <td>{p.cantidad_fisica}</td>
                          <td><span className="badge bg-warning text-dark">{p.cantidad_fisica - p.cantidad_documento}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sin Escanear */}
            {sin_escanear.length > 0 && (
              <div className="mb-4">
                <h6 className="text-secondary">⏸️ SIN ESCANEAR ({sin_escanear.length})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>OT</th>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Cant. Doc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sin_escanear.map(p => (
                        <tr key={p.id}>
                          <td><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{p.orden_traslado_original}</span></td>
                          <td><strong>{p.sku}</strong></td>
                          <td>{p.nombre_articulo}</td>
                          <td><span className="badge bg-secondary">{p.cantidad_documento}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {total === 0 && (
              <div className="alert alert-warning">
                No hay productos para verificar
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary" onClick={onSave}>
              <i className="bi bi-save"></i> Guardar
            </button>
            <button className="btn btn-success" onClick={onFinish}>
              <i className="bi bi-check-circle"></i> Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

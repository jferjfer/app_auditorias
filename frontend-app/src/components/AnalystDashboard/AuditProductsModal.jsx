import React from 'react'

export default function AuditProductsModal({ audit, onClose }) {
  if (!audit) return null

  console.log('Modal - Auditoría recibida:', audit)
  console.log('Modal - Productos:', audit.productos)
  console.log('Modal - Tipo de productos:', Array.isArray(audit.productos))
  console.log('Modal - Cantidad de productos:', audit.productos?.length)

  const productos = audit.productos || []

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Productos - Auditoría #{audit.id} - {audit.ubicacion_destino?.nombre || audit.ubicacion_destino || 'N/A'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {productos.length === 0 ? (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle"></i> No hay productos para mostrar.
                <br/>
                <small>Debug: {JSON.stringify(audit, null, 2)}</small>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th style={{textAlign: 'center'}}>OT</th>
                      <th style={{textAlign: 'center'}}>SKU</th>
                      <th style={{textAlign: 'left'}}>Descripción</th>
                      <th style={{textAlign: 'center'}}>Cant. Esperada</th>
                      <th style={{textAlign: 'center'}}>Cant. Física</th>
                      <th style={{textAlign: 'center'}}>Diferencia</th>
                      <th style={{textAlign: 'center'}}>Novedad</th>
                      <th style={{textAlign: 'left'}}>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map(prod => (
                      <tr key={prod.id}>
                        <td style={{textAlign: 'center'}}><span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{prod.orden_traslado_original || 'N/A'}</span></td>
                        <td style={{textAlign: 'center'}}><code>{prod.sku}</code></td>
                        <td style={{textAlign: 'left'}}>{prod.nombre_articulo}</td>
                        <td style={{textAlign: 'center'}}>{prod.cantidad_documento}</td>
                        <td style={{textAlign: 'center'}}>{prod.cantidad_fisica ?? '-'}</td>
                        <td style={{textAlign: 'center'}}>
                          {prod.cantidad_fisica !== null ? prod.cantidad_fisica - prod.cantidad_documento : '-'}
                        </td>
                        <td style={{textAlign: 'center'}}>
                          <span className={`badge bg-${(() => {
                            const nov = prod.novelties?.find(n => (n.novedad_tipo || n.tipo) !== 'sin_novedad');
                            return nov ? 'warning' : 'success';
                          })()}`}>
                            {(() => {
                              if (prod.novelties && prod.novelties.length > 0) {
                                const tipos = prod.novelties.map(n => (n.novedad_tipo || n.tipo)).filter(t => t !== 'sin_novedad');
                                return tipos.length > 0 ? tipos.join(', ').replace(/_/g, ' ') : 'sin novedad';
                              }
                              return prod.novedad?.replace('_', ' ') || 'sin novedad';
                            })()}
                          </span>
                        </td>
                        <td style={{textAlign: 'left'}}>{prod.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <span className="text-muted me-auto">Total: {productos.length} producto(s)</span>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

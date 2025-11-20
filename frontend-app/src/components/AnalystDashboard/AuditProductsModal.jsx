import React from 'react'

export default function AuditProductsModal({ audit, onClose }) {
  if (!audit) return null

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
                  {audit.productos?.map(prod => (
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
                        <span className={`badge bg-${prod.novedad === 'sin_novedad' ? 'success' : 'warning'}`}>
                          {prod.novedad?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{textAlign: 'left'}}>{prod.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

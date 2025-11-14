import React from 'react'

export default function AuditProductsModal({ audit, onClose }) {
  if (!audit) return null

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Productos - Auditoría #{audit.id} - {audit.ubicacion_destino}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Descripción</th>
                    <th className="text-end">Cant. Esperada</th>
                    <th className="text-end">Cant. Física</th>
                    <th className="text-end">Diferencia</th>
                    <th>Novedad</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.productos?.map(prod => (
                    <tr key={prod.id}>
                      <td><code>{prod.sku}</code></td>
                      <td>{prod.descripcion}</td>
                      <td className="text-end">{prod.cantidad_esperada}</td>
                      <td className="text-end">{prod.cantidad_fisica ?? '-'}</td>
                      <td className="text-end">
                        {prod.cantidad_fisica !== null ? prod.cantidad_fisica - prod.cantidad_esperada : '-'}
                      </td>
                      <td>
                        <span className={`badge bg-${prod.novedad === 'sin_novedad' ? 'success' : 'warning'}`}>
                          {prod.novedad?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{prod.observaciones || '-'}</td>
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

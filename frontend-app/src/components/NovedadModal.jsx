import React, { useState, useEffect } from 'react';

export default function NovedadModal({ show, product, onSave, onClose }) {
  const [cantidad, setCantidad] = useState('');
  const [novedad, setNovedad] = useState('sin_novedad');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (show && product) {
      setCantidad(product.cantidad_fisica || product.cantidad_documento || '');
      setNovedad(product.novedad || 'sin_novedad');
      setObservaciones(product.observaciones || '');
    }
  }, [show, product]);

  const handleSave = () => {
    const cantidadNum = parseInt(cantidad) || 0;
    onSave({
      cantidad_fisica: cantidadNum,
      novedad,
      observaciones
    });
  };

  if (!show || !product) return null;

  const novedades = [
    { value: 'sin_novedad', label: 'Sin Novedad', icon: '✓', color: 'success' },
    { value: 'faltante', label: 'Faltante', icon: '⚠️', color: 'danger' },
    { value: 'sobrante', label: 'Sobrante', icon: '📈', color: 'warning' },
    { value: 'averia', label: 'Avería', icon: '💔', color: 'dark' },
    { value: 'fecha_corta', label: 'Fecha Corta', icon: '📅', color: 'info' },
    { value: 'vencido', label: 'Vencido', icon: '☠️', color: 'danger' },
    { value: 'contaminado', label: 'Contaminado', icon: '🦠', color: 'secondary' }
  ];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              📦 {product.sku}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <strong>{product.nombre_articulo}</strong>
              <div className="text-muted">Cant. Documento: {product.cantidad_documento}</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Cantidad Física:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control form-control-lg"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Seleccione Novedad:</label>
              <div className="d-grid gap-2">
                {novedades.map(nov => (
                  <button
                    key={nov.value}
                    className={`btn btn-${novedad === nov.value ? nov.color : 'outline-' + nov.color}`}
                    onClick={() => setNovedad(nov.value)}
                    style={{ textAlign: 'left', fontSize: '16px', padding: '12px' }}
                  >
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>{nov.icon}</span>
                    {nov.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Observaciones (opcional):</label>
              <textarea
                className="form-control"
                rows="2"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

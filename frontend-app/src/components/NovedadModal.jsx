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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
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

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Cantidad Física:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: '1.2rem', padding: '10px', textAlign: 'center' }}
              />
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Seleccione Novedad:</label>
              <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {novedades.map(nov => (
                  <button
                    key={nov.value}
                    className={`btn btn-sm btn-${novedad === nov.value ? nov.color : 'outline-' + nov.color}`}
                    onClick={() => setNovedad(nov.value)}
                    style={{ textAlign: 'center', fontSize: '13px', padding: '8px 4px' }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '4px' }}>{nov.icon}</span>
                    <span style={{ fontSize: '11px' }}>{nov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Observaciones (opcional):</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles..."
                style={{ fontSize: '0.85rem' }}
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

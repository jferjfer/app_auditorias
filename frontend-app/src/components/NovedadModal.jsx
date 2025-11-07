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
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
        <div className="modal-content" style={{ fontSize: '0.85rem' }}>
          <div className="modal-header" style={{ padding: '10px 15px' }}>
            <h6 className="modal-title mb-0" style={{ fontSize: '0.9rem' }}>
              📦 {product.sku}
            </h6>
            <button className="btn-close btn-close-sm" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '15px' }}>
            <div className="mb-2" style={{ fontSize: '0.8rem' }}>
              <strong>{product.nombre_articulo}</strong>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Doc: {product.cantidad_documento}</div>
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>Cantidad:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control form-control-sm"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: '1.1rem', padding: '8px', textAlign: 'center' }}
              />
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>Novedad:</label>
              <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(2, 1fr)', fontSize: '0.75rem' }}>
                {novedades.map(nov => (
                  <button
                    key={nov.value}
                    className={`btn btn-sm btn-${novedad === nov.value ? nov.color : 'outline-' + nov.color}`}
                    onClick={() => setNovedad(nov.value)}
                    style={{ textAlign: 'center', fontSize: '11px', padding: '6px 2px' }}
                  >
                    <span style={{ fontSize: '14px', marginRight: '2px' }}>{nov.icon}</span>
                    <span style={{ fontSize: '10px' }}>{nov.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recuadro de diferencia */}
            {cantidad && parseInt(cantidad) !== product.cantidad_documento && (
              <div className="mb-2" style={{
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: parseInt(cantidad) < product.cantidad_documento ? '#fee' : 
                                 parseInt(cantidad) > product.cantidad_documento ? '#ffc' : '#efe',
                border: `1px solid ${parseInt(cantidad) < product.cantidad_documento ? '#fcc' : 
                                      parseInt(cantidad) > product.cantidad_documento ? '#ffb' : '#cfc'}`,
                textAlign: 'center'
              }}>
                <strong style={{ fontSize: '0.9rem' }}>
                  {parseInt(cantidad) < product.cantidad_documento ? '⚠️ Faltante: ' : '📈 Sobrante: '}
                  {Math.abs(parseInt(cantidad) - product.cantidad_documento)}
                </strong>
              </div>
            )}

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>Obs:</label>
              <textarea
                className="form-control form-control-sm"
                rows="1"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional..."
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '8px 15px' }}>
            <button className="btn btn-sm btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave} style={{ fontSize: '0.8rem' }}>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

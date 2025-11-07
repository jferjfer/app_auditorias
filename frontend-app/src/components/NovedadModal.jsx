import React, { useState, useEffect } from 'react';

export default function NovedadModal({ show, product, onSave, onClose }) {
  const [cantidadFisica, setCantidadFisica] = useState('');
  const [novelties, setNovelties] = useState({
    faltante: 0,
    sobrante: 0,
    averia: 0,
    fecha_corta: 0,
    vencido: 0,
    contaminado: 0
  });
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (show && product) {
      setCantidadFisica(product.cantidad_fisica || product.cantidad_documento || '');
      setObservaciones(product.observaciones || '');
      // Reset novelties
      setNovelties({
        faltante: 0,
        sobrante: 0,
        averia: 0,
        fecha_corta: 0,
        vencido: 0,
        contaminado: 0
      });
    }
  }, [show, product]);

  const handleSave = () => {
    const cantidadNum = parseInt(cantidadFisica) || 0;
    
    // Construir array de novedades
    const noveltiesArray = [];
    Object.entries(novelties).forEach(([tipo, cantidad]) => {
      if (cantidad > 0) {
        noveltiesArray.push({
          novedad_tipo: tipo,
          cantidad: cantidad,
          observaciones: observaciones
        });
      }
    });
    
    // Determinar novedad principal para compatibilidad
    let mainNovedad = 'sin_novedad';
    if (cantidadNum < product.cantidad_documento) mainNovedad = 'faltante';
    else if (cantidadNum > product.cantidad_documento) mainNovedad = 'sobrante';
    
    onSave({
      cantidad_fisica: cantidadNum,
      novedad: mainNovedad,
      observaciones,
      novelties: noveltiesArray
    });
  };

  if (!show || !product) return null;

  const novedades = [
    { value: 'faltante', label: 'Faltante', icon: '⚠️', color: 'danger' },
    { value: 'sobrante', label: 'Sobrante', icon: '📈', color: 'warning' },
    { value: 'averia', label: 'Avería', icon: '💔', color: 'dark' },
    { value: 'fecha_corta', label: 'Fecha Corta', icon: '📅', color: 'info' },
    { value: 'vencido', label: 'Vencido', icon: '☠️', color: 'danger' },
    { value: 'contaminado', label: 'Contaminado', icon: '🦠', color: 'secondary' }
  ];
  
  const handleNoveltyChange = (tipo, valor) => {
    const num = parseInt(valor) || 0;
    setNovelties(prev => ({ ...prev, [tipo]: num }));
  };

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
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>Cantidad Física Total:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control form-control-sm"
                value={cantidadFisica}
                onChange={(e) => setCantidadFisica(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: '1.1rem', padding: '8px', textAlign: 'center' }}
              />
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '3px' }}>Novedades (ingrese cantidades):</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {novedades.map(nov => (
                  <div key={nov.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', width: '24px' }}>{nov.icon}</span>
                    <label style={{ flex: 1, fontSize: '0.8rem', margin: 0 }}>{nov.label}:</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={novelties[nov.value]}
                      onChange={(e) => handleNoveltyChange(nov.value, e.target.value)}
                      style={{ width: '80px', textAlign: 'center', fontSize: '0.9rem' }}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Recuadro de diferencia */}
            {cantidadFisica && parseInt(cantidadFisica) !== product.cantidad_documento && (
              <div className="mb-2" style={{
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: parseInt(cantidadFisica) < product.cantidad_documento ? '#fee' : 
                                 parseInt(cantidadFisica) > product.cantidad_documento ? '#ffc' : '#efe',
                border: `1px solid ${parseInt(cantidadFisica) < product.cantidad_documento ? '#fcc' : 
                                      parseInt(cantidadFisica) > product.cantidad_documento ? '#ffb' : '#cfc'}`,
                textAlign: 'center'
              }}>
                <strong style={{ fontSize: '0.9rem' }}>
                  {parseInt(cantidadFisica) < product.cantidad_documento ? '⚠️ Faltante: ' : '📈 Sobrante: '}
                  {Math.abs(parseInt(cantidadFisica) - product.cantidad_documento)}
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

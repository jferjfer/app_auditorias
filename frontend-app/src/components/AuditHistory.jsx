import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

export default function AuditHistory({ auditId, show, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && auditId) loadHistory();
  }, [show, auditId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/collaboration/${auditId}/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">📜 Historial de Cambios</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{maxHeight: '500px', overflowY: 'auto'}}>
            {loading ? (
              <div className="text-center"><div className="spinner-border"></div></div>
            ) : history.length === 0 ? (
              <p className="text-muted">No hay cambios registrados</p>
            ) : (
              <table className="table table-sm">
                <thead>
                  <tr style={{textAlign: 'center'}}>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>OT</th>
                    <th>SKU</th>
                    <th>Descripción</th>
                    <th>Campo</th>
                    <th>Antes</th>
                    <th>Después</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{fontSize: '11px'}}>{new Date(h.modified_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                      <td>{h.user_name}</td>
                      <td><span className="badge bg-secondary">{h.ot}</span></td>
                      <td><code>{h.sku}</code></td>
                      <td style={{fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{h.descripcion}</td>
                      <td><code>{h.field_changed}</code></td>
                      <td><span className="badge bg-secondary">{h.old_value || '-'}</span></td>
                      <td><span className="badge bg-primary">{h.new_value || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

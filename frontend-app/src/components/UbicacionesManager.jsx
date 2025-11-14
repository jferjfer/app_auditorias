import React, { useState, useEffect } from 'react';
import { fetchUbicaciones, createUbicacion, deleteUbicacion, createUbicacionesBulk } from '../services/api';
import { toast } from './Toast';

export default function UbicacionesManager() {
  const [sedes, setSedes] = useState([]);
  const [newNombre, setNewNombre] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    try {
      const data = await fetchUbicaciones();
      setSedes(data);
    } catch (err) {
      toast.error('Error cargando sedes: ' + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    
    setLoading(true);
    try {
      await createUbicacion({
        nombre: newNombre.trim(),
        tipo: 'sede'
      });
      toast.success('Sede creada exitosamente');
      setNewNombre('');
      loadUbicaciones();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkText.trim()) return;
    
    const nombres = bulkText.split('\n').map(n => n.trim()).filter(n => n);
    if (nombres.length === 0) return;
    
    setLoading(true);
    try {
      const result = await createUbicacionesBulk(nombres);
      toast.success(`${result.created} sede(s) creada(s)`);
      if (result.duplicates > 0) {
        toast.warning(`${result.duplicates} duplicada(s): ${result.duplicate_names.join(', ')}`);
      }
      setBulkText('');
      setShowBulkModal(false);
      loadUbicaciones();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ubicación?')) return;
    
    try {
      await deleteUbicacion(id);
      toast.success('Ubicación eliminada');
      loadUbicaciones();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Gestión de Sedes ({sedes.length})</h5>
          <button className="btn btn-success" onClick={() => setShowBulkModal(true)}>
            <i className="bi bi-plus-square"></i> Crear Múltiples
          </button>
        </div>

        <form onSubmit={handleCreate} className="mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nueva sede..."
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <i className="bi bi-plus-circle"></i> Crear
            </button>
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th style={{width: '80px'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map(sede => (
                <tr key={sede.id}>
                  <td>{sede.id}</td>
                  <td>{sede.nombre}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(sede.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para carga masiva */}
      {showBulkModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Múltiples Sedes</h5>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowBulkModal(false)}
                  style={{fontSize: '1.2rem', padding: '0.25rem 0.5rem'}}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="modal-body">
                <label className="form-label">Ingresa los nombres (uno por línea):</label>
                <textarea
                  className="form-control"
                  rows="10"
                  placeholder="Sede Bogotá\nSede Medellín\nSede Cali\n..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleBulkCreate} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Todas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

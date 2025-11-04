import React, { useState, useEffect } from 'react';
import { fetchAllUsers, createUser, updateUser, deleteUser, fetchAudits } from '../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', correo: '', rol: 'auditor', contrasena: '' });

  useEffect(() => {
    loadUsers();
    loadAudits();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const loadAudits = async () => {
    try {
      const data = await fetchAudits();
      setAudits(data);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ nombre: user.nombre, correo: user.correo, rol: user.rol, contrasena: '' });
    } else {
      setEditingUser(null);
      setFormData({ nombre: '', correo: '', rol: 'auditor', contrasena: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ nombre: '', correo: '', rol: 'auditor', contrasena: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.contrasena) delete updateData.contrasena;
        await updateUser(editingUser.id, updateData);
        alert('Usuario actualizado');
      } else {
        await createUser(formData);
        alert('Usuario creado');
      }
      handleCloseModal();
      loadUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Eliminar usuario?')) return;
    try {
      await deleteUser(userId);
      alert('Usuario eliminado');
      loadUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h2 mb-4">Dashboard del Administrador</h1>

      {/* Gestión de usuarios */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Usuarios del Sistema</h5>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                  <i className="bi bi-plus-lg"></i> Agregar Usuario
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.nombre}</td>
                        <td>{user.correo}</td>
                        <td><span className="badge bg-info">{user.rol}</span></td>
                        <td>
                          <button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenModal(user)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auditorías del día */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Auditorías del Día</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ubicación</th>
                      <th>Auditor</th>
                      <th>Estado</th>
                      <th>% Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(audit => (
                      <tr key={audit.id}>
                        <td>{audit.id}</td>
                        <td>{audit.ubicacion_destino}</td>
                        <td>{audit.auditor_nombre || 'N/A'}</td>
                        <td>
                          <span className={`badge bg-${audit.estado === 'finalizada' ? 'success' : audit.estado === 'en_progreso' ? 'warning' : 'secondary'}`}>
                            {audit.estado}
                          </span>
                        </td>
                        <td>{audit.porcentaje_cumplimiento ? `${audit.porcentaje_cumplimiento}%` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar usuario */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={formData.correo}
                      onChange={(e) => setFormData({...formData, correo: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña {editingUser && '(dejar vacío para no cambiar)'}</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={formData.contrasena}
                      onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                      required={!editingUser}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select 
                      className="form-select" 
                      value={formData.rol}
                      onChange={(e) => setFormData({...formData, rol: e.target.value})}
                      required
                    >
                      <option value="auditor">Auditor</option>
                      <option value="analista">Analista</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingUser ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

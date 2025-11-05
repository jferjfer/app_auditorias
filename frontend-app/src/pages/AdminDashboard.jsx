import React, { useState, useEffect } from 'react';
import { fetchAllUsers, createUser, updateUser, deleteUser } from '../services/api';
import ToastContainer, { toast } from '../components/Toast';
import ConfirmModal, { confirm } from '../components/ConfirmModal';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', correo: '', rol: 'auditor', contrasena: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
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
        toast.success('Usuario actualizado exitosamente');
      } else {
        await createUser(formData);
        toast.success('Usuario creado exitosamente');
      }
      handleCloseModal();
      loadUsers();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = await confirm('¿Estás seguro de eliminar este usuario?');
    if (!confirmed) return;
    try {
      await deleteUser(userId);
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="container-fluid" style={{padding: '0', maxWidth: '100%'}}>
      <h1 className="h3 mb-3">Dashboard del Administrador</h1>

      {/* Gestión de usuarios */}
      <div className="row g-3 mb-3">
        <div className="col-12">
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
      
      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}


import React, { useState } from 'react';

const AddUserModal = ({ show, onHide, onAddUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('auditor');

  const handleSubmit = () => {
    // Basic validation
    if (!name || !email || !password) {
      alert('Por favor, rellene todos los campos.');
      return;
    }
    onAddUser({ name, email, password, role });
    onHide(); // Hide modal after submission
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Agregar Nuevo Usuario</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label htmlFor="new-user-name" className="form-label">Nombre</label>
                <input type="text" className="form-control" id="new-user-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="new-user-email" className="form-label">Correo Electrónico</label>
                <input type="email" className="form-control" id="new-user-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="new-user-password" className="form-label">Contraseña</label>
                <input type="password" className="form-control" id="new-user-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="new-user-role" className="form-label">Rol</label>
                <select className="form-select" id="new-user-role" value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="auditor">Auditor</option>
                  <option value="analista">Analista</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Agregar Usuario</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      
      // Verificar si hay cambios pendientes de sincronizar
      try {
        const { offlineDB } = await import('../utils/offlineDB');
        await offlineDB.init();
        const pending = await offlineDB.getPendingChanges();
        if (pending.length > 0) {
          window.dispatchEvent(new CustomEvent('loginSuccess', { detail: { hasPending: true } }));
        }
      } catch (offlineErr) {
        console.error('Error verificando pendientes:', offlineErr);
      }
      
      // Redirigir según rol
      if (data.user_role === 'auditor') {
        navigate('/auditor');
      } else if (data.user_role === 'analista') {
        navigate('/analyst');
      } else if (data.user_role === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">NEMESIS</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="correo_electronico" className="form-label">Correo Electrónico</label>
              <input 
                type="email" 
                className="form-control" 
                id="correo_electronico" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="mb-3">
              <label htmlFor="contrasena" className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                id="contrasena" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
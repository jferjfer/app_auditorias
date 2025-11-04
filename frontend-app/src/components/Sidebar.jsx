import React from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, getCurrentUser } from '../services/auth'

export default function Sidebar(){
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar compact">
      <h3 className="text-center mb-4">NEMESIS</h3>
      <ul className="nav flex-column">
        {user?.rol === 'auditor' && (
          <li className="nav-item">
            <a className="nav-link" href="/auditor" title="Dashboard">
              <i className="bi bi-speedometer2"></i>
            </a>
          </li>
        )}
        {(user?.rol === 'analista' || user?.rol === 'administrador') && (
          <li className="nav-item">
            <a className="nav-link" href="/analyst" title="Analista">
              <i className="bi bi-graph-up"></i>
            </a>
          </li>
        )}
        {user?.rol === 'administrador' && (
          <li className="nav-item">
            <a className="nav-link" href="/admin" title="Admin">
              <i className="bi bi-gear"></i>
            </a>
          </li>
        )}
        <li className="nav-item session-item">
          <a className="nav-link" href="#" onClick={handleLogout} title="Cerrar sesión">
            <i className="bi bi-box-arrow-right"></i>
          </a>
        </li>
      </ul>
    </aside>
  )
}

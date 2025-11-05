import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, getCurrentUser } from '../services/auth'

export default function Sidebar(){
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selected_theme', theme);
    setShowThemeMenu(false);
  };

  return (
    <aside className="sidebar">
      <h3 className="text-center mb-4">NEMESIS</h3>
      <ul className="nav flex-column">
        {user?.rol === 'auditor' && (
          <li className="nav-item">
            <a className="nav-link" href="/auditor">
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </a>
          </li>
        )}
        {(user?.rol === 'analista' || user?.rol === 'administrador') && (
          <li className="nav-item">
            <a className="nav-link" href="/analyst">
              <i className="bi bi-graph-up me-2"></i> Analista
            </a>
          </li>
        )}
        {user?.rol === 'administrador' && (
          <li className="nav-item">
            <a className="nav-link" href="/admin">
              <i className="bi bi-gear me-2"></i> Admin
            </a>
          </li>
        )}
      </ul>
    </aside>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/auth'
import ThemeSwitcher from './ThemeSwitcher'

export default function Topbar(){
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="topbar" style={{padding:'12px 20px', borderBottom:'1px solid var(--border-color)', background:'var(--bg-secondary-color)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:'30px'}}>
          <div style={{fontWeight:700, fontSize:'18px'}}>NEMESIS</div>
          <div style={{display:'flex', gap:'15px'}}>
            {user?.rol === 'auditor' && (
              <a href="/auditor" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-speedometer2"></i> Dashboard
              </a>
            )}
            {(user?.rol === 'analista' || user?.rol === 'administrador') && (
              <a href="/analyst" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-graph-up"></i> Analista
              </a>
            )}
            {user?.rol === 'administrador' && (
              <a href="/admin" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-gear"></i> Admin
              </a>
            )}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <ThemeSwitcher />
          <span style={{fontSize:'14px'}}>
            <i className="bi bi-person-circle"></i> {user?.nombre || 'Usuario'}
          </span>
          <span className="badge bg-secondary">{user?.rol || ''}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Salir
          </button>
        </div>
      </div>
    </nav>
  )
}

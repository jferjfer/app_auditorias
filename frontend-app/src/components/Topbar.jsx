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
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px', flexWrap:'wrap'}}>
          <div style={{fontWeight:700, fontSize:'18px'}}>NEMESIS</div>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            {user?.rol === 'auditor' && (
              <a href="/auditor" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-speedometer2"></i><span className="d-none d-md-inline"> Dashboard</span>
              </a>
            )}
            {(user?.rol === 'analista' || user?.rol === 'administrador') && (
              <a href="/analyst" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-graph-up"></i><span className="d-none d-md-inline"> Analista</span>
              </a>
            )}
            {user?.rol === 'administrador' && (
              <a href="/admin" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-gear"></i><span className="d-none d-md-inline"> Admin</span>
              </a>
            )}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
          <ThemeSwitcher />
          <span style={{fontSize:'14px'}}>
            <i className="bi bi-person-circle"></i> <span className="d-none d-sm-inline">{user?.nombre || 'Usuario'}</span>
          </span>
          <span className="badge bg-secondary">{user?.rol || ''}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i><span className="d-none d-sm-inline"> Salir</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

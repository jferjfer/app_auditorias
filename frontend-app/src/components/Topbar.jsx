import React from 'react'
import { getCurrentUser } from '../services/auth'

export default function Topbar(){
  const user = getCurrentUser();

  return (
    <div className="topbar" style={{padding:'8px 12px', borderBottom:'1px solid rgba(0,0,0,0.06)', background:'var(--bg-color, #fff)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontWeight:700}}>Sistema de Auditorías</div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'14px'}}>
            <i className="bi bi-person-circle"></i> {user?.nombre || 'Usuario'}
          </span>
          <span className="badge bg-secondary">{user?.rol || ''}</span>
        </div>
      </div>
    </div>
  )
}

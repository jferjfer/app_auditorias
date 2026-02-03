import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ProtectedRoute from './components/ProtectedRoute'

const AnalystDashboard = lazy(() => import('./components/AnalystDashboard/AnalystDashboard'))
const AuditorDashboard = lazy(() => import('./pages/AuditorDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Login = lazy(() => import('./pages/Login'))
const UltimaMillaPage = lazy(() => import('./pages/UltimaMillaPage'))
const BodegasPage = lazy(() => import('./pages/BodegasPage'))
const DomiciliariosPage = lazy(() => import('./pages/DomiciliariosPage'))
const PedidosPage = lazy(() => import('./pages/PedidosPage'))
const AuditarUltimaMillaPage = lazy(() => import('./pages/AuditarUltimaMillaPage'))
const MisAuditoriasUltimaMillaPage = lazy(() => import('./pages/MisAuditoriasUltimaMillaPage'))

export default function App(){
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-shell">
      {!isLoginPage && <Topbar />}
      <main className="main-content">
        <Suspense fallback={<div>Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/analyst" element={
              <ProtectedRoute allowedRoles={['analista', 'administrador']}>
                <AnalystDashboard />
              </ProtectedRoute>
            } />
            <Route path="/auditor" element={
              <ProtectedRoute allowedRoles={['auditor']}>
                <AuditorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla" element={
              <ProtectedRoute allowedRoles={['analista', 'auditor', 'administrador']}>
                <UltimaMillaPage />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla/mis-auditorias" element={
              <ProtectedRoute allowedRoles={['auditor', 'administrador']}>
                <MisAuditoriasUltimaMillaPage />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla/bodegas" element={
              <ProtectedRoute allowedRoles={['auditor', 'analista', 'administrador']}>
                <BodegasPage />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla/domiciliarios" element={
              <ProtectedRoute allowedRoles={['auditor', 'administrador']}>
                <DomiciliariosPage />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla/pedidos" element={
              <ProtectedRoute allowedRoles={['auditor', 'administrador']}>
                <PedidosPage />
              </ProtectedRoute>
            } />
            <Route path="/ultima-milla/auditar/:auditoriaId" element={
              <ProtectedRoute allowedRoles={['auditor', 'administrador']}>
                <AuditarUltimaMillaPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

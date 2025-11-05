import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ProtectedRoute from './components/ProtectedRoute'

const AnalystDashboard = lazy(() => import('./components/AnalystDashboard/AnalystDashboard'))
const AuditorDashboard = lazy(() => import('./pages/AuditorDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Login = lazy(() => import('./pages/Login'))

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
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

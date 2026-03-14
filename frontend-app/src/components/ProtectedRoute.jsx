import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getCurrentUser } from '../services/auth'

export default function ProtectedRoute({ children, allowedRoles }){
  if(!isAuthenticated()){
    return <Navigate to="/login" replace />
  }
  
  if(allowedRoles){
    const user = getCurrentUser();
    if(!user || !allowedRoles.includes(user.rol)){
      return <Navigate to="/login" replace />
    }
  }
  
  return children
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function login(email, password) {
  const url = `${API_BASE}/api/auth/login`;
  const body = new URLSearchParams({ username: email, password });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    
    if (!response.ok) {
      // Intentar leer el error del servidor
      try {
        const error = await response.json();
        
        // Errores de autenticación (401, 429)
        if (response.status === 401) {
          throw new Error('❌ Credenciales incorrectas');
        }
        if (response.status === 429) {
          throw new Error('⏱️ Demasiados intentos. Espera 1 minuto');
        }
        
        throw new Error(error.detail || 'Error al iniciar sesión');
      } catch (jsonError) {
        // Si no puede leer JSON, es error de servidor
        throw new Error('🔴 Error de servidor. Intenta más tarde');
      }
    }
    
    const data = await response.json();
    
    // Validar que tenemos todos los datos necesarios
    if (!data.access_token || !data.user_role || !data.user_name) {
      console.error('Respuesta incompleta del servidor:', data);
      throw new Error('Respuesta incompleta del servidor');
    }
    
    // Guardar en localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token || '');
    localStorage.setItem('current_user', JSON.stringify({
      id: data.user_id,
      nombre: data.user_name,
      rol: data.user_role
    }));
    
    // Verificar que se guardó correctamente
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('current_user');
    
    if (!savedToken || !savedUser) {
      console.error('Error guardando en localStorage');
      throw new Error('Error guardando credenciales localmente');
    }
    
    console.log('Credenciales guardadas exitosamente');
    return data;
    
  } catch (error) {
    // Error de red (servidor caído, sin internet, etc.)
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('🔴 No se puede conectar al servidor. Verifica tu conexión');
    }
    // Re-lanzar otros errores
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export function getCurrentUser() {
  try {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export default { login, logout, isAuthenticated, getCurrentUser };

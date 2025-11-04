const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function login(email, password) {
  const url = `${API_BASE}/api/auth/login`;
  const body = new URLSearchParams({ username: email, password });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login fallido');
  }
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('current_user', JSON.stringify({
    id: data.user_id,
    nombre: data.user_name,
    rol: data.user_role
  }));
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
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

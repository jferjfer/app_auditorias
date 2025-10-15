import { loginUser, fetchCurrentUser } from './api.js';
import { state } from './state.js';
import { showDashboard, loadDashboardData, updateSidebar, showToast } from './ui.js';

const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');

const roleMap = {
    analista: 'analyst-dashboard',
    auditor: 'auditor-dashboard',
    administrador: 'admin-dashboard'
};

function showLogin() {
    loginContainer.classList.remove('d-none');
    appContainer.classList.add('d-none');
}

function showApp() {
    loginContainer.classList.add('d-none');
    appContainer.classList.remove('d-none');
}

export function getToken() {
    return localStorage.getItem('access_token');
}

export function clearSession() {
    localStorage.clear();
    if (state.websocket) {
        state.websocket.close();
    }
    window.location.reload();
}

export function setupUserSession(user) {
    localStorage.setItem('user_role', user.rol);
    localStorage.setItem('user_name', user.nombre);
    localStorage.setItem('user_id', user.id);

    updateSidebar(user.rol); // Ajusta la UI según el rol

    const dashboardId = roleMap[user.rol];
    showDashboard(dashboardId);
    const titleElement = document.getElementById(`${user.rol}-title`);
    if (titleElement) titleElement.textContent = `Bienvenido, ${user.nombre}`;
    
    showApp();
    return user;
}

export async function checkAuth(initUserDashboard) {
    const token = getToken();
    if (!token) {
        showLogin();
        return;
    }
    try {
        const user = await fetchCurrentUser();
        // Validación robusta del objeto de usuario
        if (!user || !user.rol) {
            console.error("Usuario inválido o rol no definido recibido del backend.", user);
            throw new Error("Usuario inválido o rol no definido.");
        }
        const sessionUser = setupUserSession(user);
        initUserDashboard(sessionUser, token);
    } catch (error) {
        console.error('Error detailed in checkAuth:', error);
        showToast(`Error de autenticación: ${error.message}. Intenta iniciar sesión de nuevo.`, 'error');
        clearSession();
    }
}

export async function handleAuthFormSubmit(event, initUserDashboard) {
    event.preventDefault();
    const email = document.getElementById('correo_electronico').value;
    const password = document.getElementById('contrasena').value;

    try {
        const result = await loginUser(email, password);
        localStorage.setItem('access_token', result.access_token);
        const user = {
            nombre: result.user_name,
            rol: result.user_role,
            id: result.user_id
        };
        if (document.activeElement) document.activeElement.blur();
        
        const sessionUser = setupUserSession(user);
        initUserDashboard(sessionUser, result.access_token);
    } catch (error) {
        console.error('Auth Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}
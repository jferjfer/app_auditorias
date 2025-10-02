
import { checkAuth, handleAuthFormSubmit, clearSession, getToken } from './auth.js';
import { state, setEditingUserId, setCurrentAudit, setHtml5QrCode } from './state.js';
import * as ui from './ui.js';
import * as api from './api.js';
import { initGeneralWebSocket } from './websockets.js';

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initTheme();
    // Se pasa la función para inicializar el dashboard al verificar la autenticación
    checkAuth(initUserDashboard);
    setupGlobalListeners();
}

/**
 * Inicializa el dashboard del usuario, carga sus datos y establece la conexión WebSocket.
 * @param {object} user - El objeto de usuario que contiene el rol.
 * @param {string} token - El token de autenticación.
 */
function initUserDashboard(user, token) {
    if (user && user.rol && token) {
        ui.loadDashboardData(user.rol, token);
        // Inicializa la conexión WebSocket general para notificaciones
        initGeneralWebSocket(ui.loadDashboardData); 
    } else {
        console.error("No se pudo inicializar el dashboard: usuario, rol o token no válidos.", { user, token });
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('selected_theme') || 'dark-default';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-menu')?.addEventListener('click', (e) => {
        if (e.target.matches('[data-theme]')) {
            document.body.setAttribute('data-theme', e.target.getAttribute('data-theme'));
            localStorage.setItem('selected_theme', e.target.getAttribute('data-theme'));
        }
    });
}

function setupGlobalListeners() {
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
            document.body.classList.toggle('sidebar-active');
        });
    }

    // Se pasa la función de inicialización al manejar el envío del formulario de autenticación
    document.getElementById('auth-form').addEventListener('submit', (event) => {
        handleAuthFormSubmit(event, initUserDashboard);
    });

    document.querySelector('[data-target="logout"]').addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
    });

    document.querySelector('.sidebar').addEventListener('click', (e) => {
        const link = e.target.closest('.dashboard-link');
        if (link) {
            e.preventDefault();
            const targetDashboard = link.getAttribute('data-target');
            ui.showDashboard(targetDashboard);
        }
    });

    const analystForm = document.querySelector('#analyst-dashboard form');
    if(analystForm) {
        analystForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                status: document.getElementById('filterStatus').value,
                auditor_id: document.getElementById('filterAuditor').value,
                start_date: document.getElementById('filterStartDate').value,
                end_date: document.getElementById('filterEndDate').value
            };
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'Todos'));
            ui.loadDashboardData('analista', getToken(), cleanFilters);
        });
    }

    document.body.addEventListener('click', async function (e) {
        if (e.target.closest('.iniciar-auditoria-btn')) {
            const auditId = e.target.closest('.iniciar-auditoria-btn').getAttribute('data-audit-id');
            try {
                await api.iniciarAuditoria(auditId);
                ui.loadDashboardData('auditor', getToken());
            } catch (error) {
                alert(`Error al iniciar auditoría: ${error.message}`);
            }
        } else if (e.target.closest('.ver-auditoria-btn')) {
            const auditId = e.target.closest('.ver-auditoria-btn').getAttribute('data-audit-id');
            ui.verAuditoria(auditId);
        } else if (e.target.closest('.view-audit-btn')) {
            const auditId = e.target.closest('.view-audit-btn').getAttribute('data-audit-id');
            // This is for the analyst view, we can create a separate function if needed
            ui.verAuditoria(auditId); 
        } else if (e.target.closest('.edit-user-btn')) {
            const userId = e.target.closest('.edit-user-btn').getAttribute('data-user-id');
            setEditingUserId(userId);
            const user = await api.fetchUser(userId);
            document.getElementById('new-user-name').value = user.nombre;
            document.getElementById('new-user-email').value = user.correo;
            document.getElementById('new-user-role').value = user.rol;
            document.getElementById('new-user-password').value = '';
            document.getElementById('addUserModalLabel').textContent = 'Editar Usuario';
            document.getElementById('confirm-add-user').textContent = 'Actualizar Usuario';
            new bootstrap.Modal(document.getElementById('addUserModal')).show();
        } else if (e.target.closest('.delete-user-btn')) {
            const userId = e.target.closest('.delete-user-btn').getAttribute('data-user-id');
            if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${userId}?`)) {
                try {
                    await api.deleteUser(userId);
                    alert('Usuario eliminado.');
                    ui.loadDashboardData('administrador', getToken());
                } catch (error) {
                    alert(`Error al eliminar usuario: ${error.message}`);
                }
            }
        }
    });

    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('audit-file-input');
            const submitBtn = uploadForm.querySelector('button[type="submit"]');
            if (!fileInput.files || fileInput.files.length === 0) return alert("Selecciona al menos un archivo.");
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo...';
            try {
                const result = await api.uploadAuditFiles(fileInput.files);
                alert(`✅ Auditoría creada con éxito! ID: ${result.audit_id}`);
                ui.loadDashboardData('auditor', getToken());
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
            }
        });
    }
}

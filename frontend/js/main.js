import { checkAuth, handleAuthFormSubmit, clearSession, getToken } from './auth.js';
import { state, setEditingUserId } from './state.js';
import * as api from './api.js';
import { initGeneralWebSocket } from './websockets.js';

// Import shared UI functions
import { showDashboard } from './ui.js';
import { showToast } from './ui-helpers.js';

// Import role-specific UI modules
import { loadAdminDashboard } from './ui-admin.js';
import { loadAnalystDashboard, initAnalystEventListeners } from './ui-analyst.js';
import { loadAuditorDashboard, verAuditoria as verAuditoriaAuditor } from './ui-auditor.js';

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initTheme();
    initAnalystEventListeners(); // For report downloads, initialized once
    checkAuth(initUserDashboard);
    setupGlobalListeners();
}

function initUserDashboard(user, token) {
    if (!user || !user.rol || !token) {
        console.error("Cannot init dashboard: invalid user, role, or token.", { user, token });
        return;
    }

    const role = user.rol;
    // The function to reload data, passed to websockets
    const reloader = () => loadDashboardData(role, token);

    loadDashboardData(role, token);
    initGeneralWebSocket(reloader);
}

function loadDashboardData(role, token, filters = {}) {
    switch (role) {
        case 'administrador':
            loadAdminDashboard(token, filters);
            break;
        case 'analista':
            loadAnalystDashboard(token, filters);
            break;
        case 'auditor':
            loadAuditorDashboard(token);
            break;
        default:
            console.error(`Dashboard for role '${role}' not found.`);
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
    sidebarToggleBtn?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
        document.body.classList.toggle('sidebar-active');
    });

    document.getElementById('auth-form')?.addEventListener('submit', (event) => {
        handleAuthFormSubmit(event, initUserDashboard);
    });

    document.querySelector('[data-target="logout"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
    });

    document.querySelector('.sidebar')?.addEventListener('click', (e) => {
        const link = e.target.closest('.dashboard-link');
        if (link) {
            e.preventDefault();
            const targetDashboard = link.getAttribute('data-target');
            showDashboard(targetDashboard);
        }
    });

    const analystForm = document.querySelector('#analyst-dashboard form');
    analystForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const filters = {
            status: document.getElementById('filterStatus').value,
            auditor_id: document.getElementById('filterAuditor').value,
            start_date: document.getElementById('filterStartDate').value,
            end_date: document.getElementById('filterEndDate').value
        };
        const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'Todos'));
        loadDashboardData('analista', getToken(), cleanFilters);
    });

    document.body.addEventListener('click', async function (e) {
        const target = e.target;
        if (target.closest('.iniciar-auditoria-btn')) {
            const auditId = target.closest('.iniciar-auditoria-btn').dataset.auditId;
            try {
                await api.iniciarAuditoria(auditId);
                loadDashboardData('auditor', getToken());
            } catch (error) {
                showToast(`Error al iniciar auditoría: ${error.message}`, 'error');
            }
        } else if (target.closest('.ver-auditoria-btn') || target.closest('.view-audit-btn')) {
            const auditId = target.closest('[data-audit-id]').dataset.auditId;
            verAuditoriaAuditor(auditId); // This function is now in ui-auditor
        } else if (target.closest('.edit-user-btn')) {
            const userId = target.closest('.edit-user-btn').dataset.userId;
            setEditingUserId(userId);
            const user = await api.fetchUser(userId);
            document.getElementById('new-user-name').value = user.nombre;
            document.getElementById('new-user-email').value = user.correo;
            document.getElementById('new-user-role').value = user.rol;
            document.getElementById('new-user-password').value = '';
            document.getElementById('addUserModalLabel').textContent = 'Editar Usuario';
            document.getElementById('confirm-add-user').textContent = 'Actualizar Usuario';
            new bootstrap.Modal(document.getElementById('addUserModal')).show();
        } else if (target.closest('.delete-user-btn')) {
            const userId = target.closest('.delete-user-btn').dataset.userId;
            if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
                try {
                    await api.deleteUser(userId);
                    showToast('Usuario eliminado.', 'success');
                    loadDashboardData('administrador', getToken());
                } catch (error) {
                    showToast(`Error al eliminar usuario: ${error.message}`, 'error');
                }
            }
        }
    });

    const uploadForm = document.getElementById('uploadForm');
    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('audit-file-input');
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (!fileInput.files || fileInput.files.length === 0) return showToast("Selecciona al menos un archivo.", 'info');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo...';
        try {
            const result = await api.uploadAuditFiles(fileInput.files);
            showToast(`✅ Auditoría creada con éxito! ID: ${result.audit_id}`, 'success');
            loadDashboardData('auditor', getToken());
        } catch (error) {
            showToast(`❌ Error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
        }
    });

    const confirmAddUserBtn = document.getElementById('confirm-add-user');
    confirmAddUserBtn?.addEventListener('click', async () => {
        const isEditing = state.editingUserId;
        const userData = {
            nombre: document.getElementById('new-user-name').value,
            correo: document.getElementById('new-user-email').value,
            rol: document.getElementById('new-user-role').value,
        };
        const password = document.getElementById('new-user-password').value;
        if (password) {
            userData.contrasena = password;
        }

        try {
            if (isEditing) {
                await api.updateUser(isEditing, userData);
                showToast('Usuario actualizado con éxito.', 'success');
            } else {
                await api.createUser(userData);
                showToast('Usuario creado con éxito.', 'success');
            }
            
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modalInstance?.hide();
            
            document.getElementById('add-user-form').reset();
            setEditingUserId(null);
            document.getElementById('addUserModalLabel').textContent = 'Agregar Nuevo Usuario';
            confirmAddUserBtn.textContent = 'Agregar Usuario';

            loadDashboardData('administrador', getToken());

        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });
}

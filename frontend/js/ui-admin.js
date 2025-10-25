import { fetchAllUsers, fetchAudits } from './api.js';
import { renderSimpleAdminAuditsTable, renderUsersTable } from './ui-helpers.js';
import { ensureModal } from './ui-modals.js';

const adminDashboardHTML = `
<div id="admin-dashboard" class="dashboard-section">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4">
        <h1 id="admin-title" class="h2 fw-bold">Dashboard del Administrador</h1>
    </div>
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="card-title">Usuarios del Sistema</h5>
                        <button id="add-user-btn" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Agregar Usuario</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover table-dark">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo Electrónico</th>
                                    <th>Rol</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="admin-users-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Auditorías del Día</h5>
                    <div class="table-responsive">
                        <table class="table table-hover table-dark">
                            <thead>
                                <tr>
                                    <th>Orden de Traslado</th>
                                    <th>Auditor</th>
                                    <th>Estado</th>
                                    <th>% Cumplimiento</th>
                                </tr>
                            </thead>
                            <tbody id="admin-audits-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

export async function loadAdminDashboard(token, filters = {}) {
    document.querySelector('.main-content').innerHTML = adminDashboardHTML;

    document.getElementById('add-user-btn')?.addEventListener('click', () => {
        ensureModal('addUserModal');
        const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
        addUserModal.show();
    });

    try {
        const today = new Date().toISOString().split('T')[0];
        filters.date = today;
        const [audits, users] = await Promise.all([fetchAudits(filters), fetchAllUsers()]);
        renderSimpleAdminAuditsTable(audits, '#admin-audits-table-body');
        renderUsersTable(users, '#admin-users-table-body');
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        document.querySelector('.main-content').innerHTML = '<p class="text-danger">Error al cargar el dashboard. Intente de nuevo.</p>';
    }
}
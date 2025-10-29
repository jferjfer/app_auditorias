import { fetchAllUsers, fetchAudits } from './api.js';
import { renderSimpleAdminAuditsTable, renderUsersTable } from './ui-helpers.js';

export async function loadAdminDashboard(token, filters = {}) {
    try {
        const today = new Date().toISOString().split('T')[0];
        filters.date = today;
        const [audits, users] = await Promise.all([fetchAudits(filters), fetchAllUsers()]);
        renderSimpleAdminAuditsTable(audits, '#admin-audits-table-body');
        renderUsersTable(users, '#admin-users-table-body');
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}
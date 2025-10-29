import { fetchAudits, fetchAuditors } from './api.js';
import { renderAuditsTable, renderComplianceChart, renderNoveltiesChart, populateAuditorFilter } from './ui-helpers.js';

export async function loadAnalystDashboard(token, filters = {}) {
    try {
        const [audits, users] = await Promise.all([
            fetchAudits(filters),
            fetchAuditors()
        ]);
        renderAuditsTable(audits, '#analyst-audits-table-body');
        renderComplianceChart(audits);
        renderNoveltiesChart(audits);
        populateAuditorFilter(users);
    } catch (error) {
        console.error('Error loading analyst dashboard:', error);
    }
}
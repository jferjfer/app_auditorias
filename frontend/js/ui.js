import * as api from './api.js';

/**
 * Muestra un dashboard específico y oculta los demás.
 * @param {string} dashboardId - El ID del elemento del dashboard a mostrar.
 */
export function showDashboard(dashboardId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.add('d-none');
    });
    const activeDashboard = document.getElementById(dashboardId);
    if (activeDashboard) {
        activeDashboard.classList.remove('d-none');
    }
}

/**
 * Actualiza la visibilidad de los enlaces de la barra lateral según el rol del usuario.
 * @param {string} role - El rol del usuario (ej. 'administrador', 'analista').
 */
export function updateSidebar(role) {
    const analystLink = document.getElementById('link-analyst');
    const auditorLink = document.getElementById('link-auditor');
    const adminLink = document.getElementById('link-admin');
    const reporteriaMenu = document.getElementById('menu-reporteria');

    if (analystLink) analystLink.parentElement.classList.add('d-none');
    if (auditorLink) auditorLink.parentElement.classList.add('d-none');
    if (adminLink) adminLink.parentElement.classList.add('d-none');
    if (reporteriaMenu) reporteriaMenu.classList.add('d-none');

    switch (role) {
        case 'administrador':
            if (analystLink) analystLink.parentElement.classList.remove('d-none');
            if (auditorLink) auditorLink.parentElement.classList.remove('d-none');
            if (adminLink) adminLink.parentElement.classList.remove('d-none');
            if (reporteriaMenu) reporteriaMenu.classList.remove('d-none');
            break;
        case 'analista':
            if (analystLink) analystLink.parentElement.classList.remove('d-none');
            if (reporteriaMenu) reporteriaMenu.classList.remove('d-none');
            break;
        case 'auditor':
            if (auditorLink) auditorLink.parentElement.classList.remove('d-none');
            break;
    }
}

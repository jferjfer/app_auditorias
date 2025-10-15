import * as api from './api.js';

/**
 * Genera un sonido de 'beep' corto usando la Web Audio API.
 */
export function playBeep(frequency = 523.25, duration = 200, volume = 0.5) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, duration);
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
    }
}

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

    if (analystLink) analystLink.parentElement.classList.add('d-none');
    if (auditorLink) auditorLink.parentElement.classList.add('d-none');
    if (adminLink) adminLink.parentElement.classList.add('d-none');

    switch (role) {
        case 'administrador':
            if (analystLink) analystLink.parentElement.classList.remove('d-none');
            if (auditorLink) auditorLink.parentElement.classList.remove('d-none');
            if (adminLink) adminLink.parentElement.classList.remove('d-none');
            break;
        case 'analista':
            if (analystLink) analystLink.parentElement.classList.remove('d-none');
            break;
        case 'auditor':
            if (auditorLink) auditorLink.parentElement.classList.remove('d-none');
            break;
    }
}

/**
 * Actualiza el círculo de progreso del cumplimiento de la auditoría.
 * @param {number} auditId - El ID de la auditoría.
 */
export async function updateCompliancePercentage(auditId) {
    const complianceDiv = document.getElementById('compliance-percentage');
    if (!complianceDiv) return;
    try {
        const auditData = await api.fetchAuditDetails(auditId);
        const percentage = auditData.porcentaje_cumplimiento ?? 0;
        complianceDiv.textContent = `${percentage}%`;
        complianceDiv.style.background = `conic-gradient(#00c6ff ${percentage}%, transparent ${percentage}%)`;
    } catch (error) {
        console.error('Error al actualizar porcentaje:', error);
    }
}

/**
 * Utiliza la API de síntesis de voz del navegador para leer un texto.
 * @param {string} text - El texto a leer.
 */
export function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

/**
 * Muestra una notificación toast.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de toast ('success', 'error', 'info').
 * @param {number} duration - La duración en milisegundos.
 */
export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    const iconClass = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        info: 'bi-info-circle-fill'
    }[type];

    toast.innerHTML = `
        <i class="bi ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Animar la entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Ocultar y eliminar después de la duración
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }, duration);
}
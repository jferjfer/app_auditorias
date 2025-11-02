
import { API_URL } from './api.js';
import { getToken } from './auth.js';
import { setWebSocket } from './state.js';


export function initWebSocket(auditId) {
    const token = getToken();
    if (!token) return;
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/api/ws/${auditId}?token=${token}`);

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (data.type === 'product_updated') {
            const product = data.product;
            const row = document.querySelector(`tr[data-product-id="${product.id}"]`);
            if (row) {
                row.querySelector('.physical-count').value = product.cantidad_fisica;
                row.querySelector('.novelty-select').value = product.novedad;
                row.querySelector('.observations-area').value = product.observaciones;
                row.classList.add('table-info');
                setTimeout(() => row.classList.remove('table-info'), 2000);
            }
        }
    };

    setWebSocket(ws);
}

export function initGeneralWebSocket(loadDashboardDataCb, refreshAnalystCb) {
    const token = getToken();
    if (!token) return;
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const general_ws = new WebSocket(`${wsUrl}/api/ws?token=${token}`);

    general_ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
    // Ignore keepalive pings from the server to avoid console spam
    if (data && data.type === 'ping') return;
    console.debug('General WebSocket message received:', data);
        const userRole = localStorage.getItem('user_role');

        if (data.type === 'audit_updated' && userRole === 'administrador' && data.audit) {
            const audit = data.audit;
            const row = document.querySelector(`#admin-audits-table-body tr[data-audit-id="${audit.id}"]`);
            if (row) {
                const cumplimiento = audit.porcentaje_cumplimiento !== null ? Math.round(audit.porcentaje_cumplimiento) : 0;
                const progressBar = row.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${cumplimiento}%`;
                    progressBar.setAttribute('aria-valuenow', cumplimiento);
                    progressBar.textContent = `${cumplimiento}%`;
                }
            }
        } else if (data.type === 'new_audit' && (userRole === 'analista' || userRole === 'administrador')) {
            console.debug('New audit detected, reloading dashboard data.');
            try {
                if (userRole === 'analista') {
                    if (typeof refreshAnalystCb === 'function') refreshAnalystCb();
                } else {
                    if (typeof loadDashboardDataCb === 'function') loadDashboardDataCb(userRole, getToken());
                }
            } catch (err) {
                console.error('Error handling new_audit websocket message:', err);
            }
        }
    };
}

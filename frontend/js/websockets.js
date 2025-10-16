import { API_URL } from './api.js';
import { getToken } from './auth.js';
import { setWebSocket } from './state.js';

// Copied from ui-helpers.js because it is not exported
const noveltyOptions = [
    { value: 'sin_novedad', text: 'Sin Novedad' },
    { value: 'faltante', text: 'Faltante' },
    { value: 'sobrante', text: 'Sobrante' },
    { value: 'averia', text: 'Averá' } // Corrected unicode escape
];

function createNoveltyOptions(selectedValue) {
    return noveltyOptions.map(opt => `
        <option value="${opt.value}" ${selectedValue === opt.value ? 'selected' : ''}>
            ${opt.text}
        </option>
    `).join('');
}

function appendProductRow(product) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;

    const noProductsRow = tableBody.querySelector('td[colspan="8"]');
    if (noProductsRow) {
        noProductsRow.parentElement.remove();
    }

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-product-id', product.id);
    newRow.setAttribute('data-sku', product.sku);

    newRow.innerHTML = `
        <td data-sku="${product.sku}">${product.sku}</td>
        <td><strong>${product.orden_traslado_original || 'SIN_OT'}</strong></td>
        <td>${product.nombre_articulo || '--'}</td>
        <td class="doc-quantity">${product.cantidad_documento ?? '--'}</td>
        <td>
            <input type="number" class="form-control form-control-sm physical-count" value="${product.cantidad_fisica || ''}">
        </td>
        <td>
            <select class="form-select form-select-sm novelty-select">
                ${createNoveltyOptions(product.novedad || 'sin_novedad')}
            </select>
        </td>
        <td>
            <textarea class="form-control form-control-sm observations-area">${product.observaciones || ''}</textarea>
        </td>
        <td>
            <button class="btn btn-sm btn-success save-product-btn">
                <i class="bi bi-save"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
    
    newRow.classList.add('table-info');
    setTimeout(() => newRow.classList.remove('table-info'), 3000);
    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

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
                
                if (product.novedad === 'sin_novedad') {
                    row.classList.add('fade-out');
                    setTimeout(() => {
                        row.style.display = 'none';
                        row.classList.remove('fade-out');
                    }, 500);
                } else {
                    row.classList.add('table-info');
                    setTimeout(() => row.classList.remove('table-info'), 2000);
                }
            }
        } else if (data.type === 'product_added') {
            appendProductRow(data.product);
        }
    };

    setWebSocket(ws);
}

export function initGeneralWebSocket(loadDashboardData) {
    const token = getToken();
    if (!token) return;
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const general_ws = new WebSocket(`${wsUrl}/api/ws?token=${token}`);

    general_ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log('General WebSocket message received:', data);
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
            console.log('New audit detected, reloading dashboard data.');
            loadDashboardData(userRole, getToken());
        }
    };
}
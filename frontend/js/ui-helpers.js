import { setChartInstance } from './state.js';
import * as api from './api.js';

export function showToast(message, type = 'info') {
    const backgroundColor = {
        success: 'linear-gradient(to right, #00b09b, #96c93d)',
        error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
        info: '#4e54c8'
    }[type];

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: backgroundColor,
        },
    }).showToast();
}

const auditStatusMap = {
    pendiente: { text: 'Pendiente', color: '#ffc107', class: 'estado-pendiente' },
    en_progreso: { text: 'En Progreso', color: '#0dcaf0', class: 'estado-progreso' },
    finalizada: { text: 'Finalizada', color: '#198754', class: 'estado-completada' },
};

function getAuditStatus(status) {
    return auditStatusMap[status] || { text: status, color: '#6c757d', class: 'bg-secondary' };
}

export function renderAuditsTable(audits, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;

    if (!audits || audits.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay auditorías para mostrar.</td></tr>';
        return;
    }

    const rowsHtml = audits.map(audit => {
        const fecha = new Date(audit.creada_en).toLocaleDateString();
        const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
        const status = getAuditStatus(audit.estado);

        return `
            <tr data-audit-id="${audit.id}">
                <td>${audit.id}</td>
                <td>${audit.ubicacion_destino}</td>
                <td>${audit.auditor?.nombre ?? 'N/A'}</td>
                <td>${fecha}</td>
                <td>
                    <span class="badge rounded-pill" style="background-color: ${status.color};">${status.text}</span>
                </td>
                <td>${audit.productos_count ?? (audit.productos ? audit.productos.length : 0)}</td>
                <td>${cumplimiento}</td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}">
                        <i class="bi bi-eye"></i> Ver
                    </a>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
}

export function renderSimpleAdminAuditsTable(audits, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;

    if (!audits || audits.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay auditorías para el día de hoy.</td></tr>';
        return;
    }

    const rowsHtml = audits.map(audit => {
        const cumplimiento = audit.porcentaje_cumplimiento !== null ? Math.round(audit.porcentaje_cumplimiento) : 0;
        const status = getAuditStatus(audit.estado);

        return `
            <tr data-audit-id="${audit.id}">
                <td>${audit.ubicacion_destino}</td>
                <td>${audit.auditor?.nombre ?? 'N/A'}</td>
                <td>
                    <span class="badge rounded-pill" style="background-color: ${status.color};">${status.text}</span>
                </td>
                <td>
                    <div class="progress" style="height: 20px; background-color: #343a40;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: ${cumplimiento}%;" aria-valuenow="${cumplimiento}">
                            ${cumplimiento}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
}

export function renderAuditorAuditsTable(audits, tableSelector, mostrarFinalizadas = false) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;

    const filtradas = audits.filter(a => mostrarFinalizadas ? a.estado === 'finalizada' : a.estado !== 'finalizada');

    if (filtradas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No tienes auditorías ${mostrarFinalizadas ? 'finalizadas' : 'activas'}.</td></tr>`;
        return;
    }

    const getActionButtons = (audit) => {
        const buttons = {
            'pendiente': `<button class="btn btn-sm btn-primary iniciar-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-play-fill"></i> Iniciar</button>`,
            'en_progreso': `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`,
            'finalizada': `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`
        };
        return buttons[audit.estado] || '';
    };

    const rowsHtml = filtradas.map(audit => {
        const fecha = new Date(audit.creada_en).toLocaleDateString();
        const status = getAuditStatus(audit.estado);

        return `
            <tr data-audit-id="${audit.id}">
                <td>${audit.id}</td>
                <td>${audit.ubicacion_destino}</td>
                <td>${fecha}</td>
                <td>
                    <span class="badge ${status.class}">${status.text}</span>
                </td>
                <td>
                    ${getActionButtons(audit)}
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
}

const noveltyOptions = [
    { value: 'sin_novedad', text: 'Sin Novedad' },
    { value: 'faltante', text: 'Faltante' },
    { value: 'sobrante', text: 'Sobrante' },
    { value: 'averia', text: 'Avería' }
];

function createNoveltyOptions(selectedValue) {
    return noveltyOptions.map(opt => `
        <option value="${opt.value}" ${selectedValue === opt.value ? 'selected' : ''}>
            ${opt.text}
        </option>
    `).join('');
}

export function renderProductsTable(products) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;

    if (!products || products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No hay productos en esta auditoría.</td>
            </tr>`;
        return;
    }

    const rowsHtml = products.map(product => {
        const productId = product.id || product.product_id;
        const sku = product.sku ?? 'N/A';
        const ot = product.orden_traslado_original || 'SIN_OT';
        const name = product.nombre_articulo ?? '--';
        const docQuantity = product.cantidad_documento ?? '--';
        const physicalQuantity = product.cantidad_fisica || '';
        const novelty = product.novedad || 'sin_novedad';
        const observations = product.observaciones || '';

        return `
            <tr data-product-id="${productId}" data-sku="${sku}">
                <td data-sku="${sku}">${sku}</td>
                <td><strong>${ot}</strong></td>
                <td>${name}</td>
                <td class="doc-quantity">${docQuantity}</td>
                <td>
                    <input type="number" class="form-control form-control-sm physical-count" value="${physicalQuantity}">
                </td>
                <td>
                    <select class="form-select form-select-sm novelty-select">
                        ${createNoveltyOptions(novelty)}
                    </select>
                </td>
                <td>
                    <textarea class="form-control form-control-sm observations-area">${observations}</textarea>
                </td>
                <td>
                    <button class="btn btn-sm btn-success save-product-btn">
                        <i class="bi bi-save"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
}

export function renderUsersTable(users, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;

    const roleColors = { auditor: '#00c6ff', analista: '#28a745', administrador: '#ff0077' };

    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios para mostrar.</td></tr>';
        return;
    }

    const rowsHtml = users.map(user => {
        const userRole = user.rol || 'desconocido';
        const roleColor = roleColors[userRole] || '#6c757d';
        return `
            <tr data-user-id="${user.id}">
                <td>${user.nombre}</td>
                <td>${user.correo}</td>
                <td>
                    <span class="badge rounded-pill" style="background-color: ${roleColor};">${userRole}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info text-white edit-user-btn" data-user-id="${user.id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
}

export function populateAuditorFilter(users) {
    const filter = document.getElementById('filterAuditor');
    if (!filter) return;

    filter.innerHTML = ''; // Clear existing options

    // Add "Todos" option
    const todosOption = document.createElement('option');
    todosOption.value = '';
    todosOption.textContent = 'Todos';
    filter.appendChild(todosOption);

    const auditors = users.filter(u => u.rol === 'auditor');
    auditors.forEach(auditor => {
        const option = document.createElement('option');
        option.value = auditor.id;
        option.textContent = auditor.nombre;
        filter.appendChild(option);
    });
}

export function renderComplianceChart(audits) {
    const ctx = document.getElementById('complianceChart')?.getContext('2d');
    if (!ctx) return;

    setChartInstance('complianceChart', new Chart(ctx, {
        type: 'bar',
        data: {
            labels: audits.map(a => `Audit #${a.id}`),
            datasets: [{
                label: '% Cumplimiento',
                data: audits.map(a => a.porcentaje_cumplimiento || 0),
                backgroundColor: 'rgba(0, 198, 255, 0.6)',
                borderColor: 'rgba(0, 198, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    }));
}

export async function renderNoveltiesChart(audits) {
    const ctx = document.getElementById('noveltiesChart')?.getContext('2d');
    if (!ctx) return;

    const noveltyData = { faltante: 0, sobrante: 0, averia: 0 };
    for (const audit of audits) {
        if (audit.productos) {
            for (const product of audit.productos) {
                if (noveltyData.hasOwnProperty(product.novedad)) {
                    noveltyData[product.novedad]++;
                }
            }
        }
    }

    setChartInstance('noveltiesChart', new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Faltante', 'Sobrante', 'Avería'],
            datasets: [{
                label: 'Novedades',
                data: [noveltyData.faltante, noveltyData.sobrante, noveltyData.averia],
                backgroundColor: ['#ffc107', '#fd7e14', '#dc3545'],
            }]
        }
    }));
}

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


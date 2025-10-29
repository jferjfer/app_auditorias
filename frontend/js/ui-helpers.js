import { setChartInstance } from './state.js';

export function renderAuditsTable(audits, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    tableBody.innerHTML = audits.map(audit => {
        const fecha = new Date(audit.creada_en).toLocaleDateString();
        const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
        let estadoTexto, estadoColor;
        switch (audit.estado) {
            case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#ffc107'; break;
            case 'en_progreso': estadoTexto = 'En Progreso'; estadoColor = '#0dcaf0'; break;
            case 'finalizada': estadoTexto = 'Finalizada'; estadoColor = '#198754'; break;
            default: estadoTexto = audit.estado; estadoColor = '#6c757d';
        }
        return `<tr data-audit-id="${audit.id}">
            <td>${audit.id}</td>
            <td>${audit.ubicacion_destino}</td>
            <td>${audit.auditor?.nombre ?? 'N/A'}</td>
            <td>${fecha}</td>
            <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td>
            <td>${audit.productos_count ?? (audit.productos ? audit.productos.length : 0)}</td>
            <td>${cumplimiento}</td>
            <td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>
        </tr>`;
    }).join('');
}

export function renderSimpleAdminAuditsTable(audits, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    if (!audits || audits.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay auditorías para el día de hoy.</td></tr>`;
        return;
    }
    tableBody.innerHTML = audits.map(audit => {
        const cumplimiento = audit.porcentaje_cumplimiento !== null ? Math.round(audit.porcentaje_cumplimiento) : 0;
        let estadoTexto, estadoColor;
        switch (audit.estado) {
            case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#ffc107'; break;
            case 'en_progreso': estadoTexto = 'En Progreso'; estadoColor = '#0dcaf0'; break;
            case 'finalizada': estadoTexto = 'Finalizada'; estadoColor = '#198754'; break;
            default: estadoTexto = audit.estado; estadoColor = '#6c757d';
        }
        return `<tr data-audit-id="${audit.id}">
            <td>${audit.ubicacion_destino}</td>
            <td>${audit.auditor?.nombre ?? 'N/A'}</td>
            <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td>
            <td>
                <div class="progress" style="height: 20px; background-color: #343a40;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${cumplimiento}%;" aria-valuenow="${cumplimiento}">${cumplimiento}%</div>
                </div>
            </td>
        </tr>`;
    }).join('');
}

export function renderAuditorAuditsTable(audits, tableSelector, mostrarFinalizadas = false) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    const filtradas = audits.filter(a => mostrarFinalizadas ? a.estado === 'finalizada' : a.estado !== 'finalizada');

    if (!filtradas || filtradas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No tienes auditorías ${mostrarFinalizadas ? 'finalizadas' : 'activas'}.</td></tr>`;
        return;
    }
    tableBody.innerHTML = filtradas.map(audit => {
        const fecha = new Date(audit.creada_en).toLocaleDateString();
        let claseEstado = '', textoEstado = '';
        switch (audit.estado) {
            case 'pendiente': claseEstado = 'estado-pendiente'; textoEstado = 'Pendiente'; break;
            case 'en_progreso': claseEstado = 'estado-progreso'; textoEstado = 'En Progreso'; break;
            case 'finalizada': claseEstado = 'estado-completada'; textoEstado = 'Finalizada'; break;
            default: claseEstado = 'bg-secondary'; textoEstado = audit.estado;
        }
        const buttons = {
            'pendiente': `<button class="btn btn-sm btn-primary iniciar-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-play-fill"></i> Iniciar</button>`,
            'en_progreso': `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`,
            'finalizada': `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`
        };
        return `<tr data-audit-id="${audit.id}">
            <td>${audit.id}</td>
            <td>${audit.ubicacion_destino}</td>
            <td>${fecha}</td>
            <td><span class="badge ${claseEstado}">${textoEstado}</span></td>
            <td>
                ${buttons[audit.estado] || ''}
            </td>
        </tr>`;
    }).join('');
}

export function renderProductsTable(products) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;
    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay productos en esta auditoría.</td></tr>';
        return;
    }
    tableBody.innerHTML = products.map(product => `
        <tr data-product-id="${product.id || product.product_id}" data-sku="${product.sku}">
            <td data-sku="${product.sku}">${product.sku}</td>
            <td><strong>${product.orden_traslado_original || 'SIN_OT'}</strong></td>
            <td>${product.nombre_articulo ?? '--'}</td>
            <td class="doc-quantity">${product.cantidad_documento ?? '--'}</td>
            <td><input type="number" class="form-control form-control-sm physical-count" value="${product.cantidad_fisica || ''}"></td>
            <td><select class="form-select form-select-sm novelty-select">
                <option value="sin_novedad" ${product.novedad === 'sin_novedad' ? 'selected' : ''}>Sin Novedad</option>
                <option value="faltante" ${product.novedad === 'faltante' ? 'selected' : ''}>Faltante</option>
                <option value="sobrante" ${product.novedad === 'sobrante' ? 'selected' : ''}>Sobrante</option>
                <option value="averia" ${product.novedad === 'averia' ? 'selected' : ''}>Avería</option>
            </select></td>
            <td><textarea class="form-control form-control-sm observations-area">${product.observaciones || ''}</textarea></td>
            <td><button class="btn btn-sm btn-success save-product-btn"><i class="bi bi-save"></i></button></td>
        </tr>`).join('');
}

export function renderUsersTable(users, tableSelector) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    const roleColors = { auditor: '#00c6ff', analista: '#28a745', administrador: '#ff0077' };
    tableBody.innerHTML = users.map(user => {
        const rolColor = roleColors[user.rol] || '#6c757d';
        return `<tr data-user-id="${user.id}">
            <td>${user.nombre}</td>
            <td>${user.correo}</td>
            <td><span class="badge rounded-pill" style="background-color: ${rolColor};">${user.rol}</span></td>
            <td>
                <button class="btn btn-sm btn-info text-white edit-user-btn" data-user-id="${user.id}"><i class="bi bi-pencil-square"></i></button> 
                <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

export function populateAuditorFilter(users) {
    const filter = document.getElementById('filterAuditor');
    if (!filter) return;
    const auditors = users.filter(u => u.rol === 'auditor');
    filter.innerHTML = '<option value="">Todos</option>'; // Reset
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

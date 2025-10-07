
import { state, setChartInstance, setCurrentAudit, setAuditorAuditsList } from './state.js';
import * as api from './api.js';
import { getToken } from './auth.js';
import { initWebSocket } from './websockets.js';

const roleMap = {
    analista: 'analyst-dashboard',
    auditor: 'auditor-dashboard',
    administrador: 'admin-dashboard'
};

export function showDashboard(dashboardId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.add('d-none');
    });
    const activeDashboard = document.getElementById(dashboardId);
    if (activeDashboard) {
        activeDashboard.classList.remove('d-none');
    }
}

export function updateSidebar(role) {
    const analystLink = document.getElementById('link-analyst');
    const auditorLink = document.getElementById('link-auditor');
    const adminLink = document.getElementById('link-admin');

    // Ocultamos todos los enlaces de roles para empezar
    if (analystLink) analystLink.parentElement.classList.add('d-none');
    if (auditorLink) auditorLink.parentElement.classList.add('d-none');
    if (adminLink) adminLink.parentElement.classList.add('d-none');

    // Mostramos los enlaces basados en el rol del usuario
    switch (role) {
        case 'administrador':
            // El admin ve todos los dashboards
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



export async function loadDashboardData(role, token, filters = {}) {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        if (role === 'analista') {
            const [audits, users] = await Promise.all([
                api.fetchAudits(filters),
                api.fetchAuditors()
            ]);
            renderAuditsTable(audits, '#analyst-audits-table-body');
            renderComplianceChart(audits);
            renderNoveltiesChart(audits);
            populateAuditorFilter(users);
        } else if (role === 'auditor') {
            const auditorId = localStorage.getItem('user_id');
            const audits = await api.fetchAuditsByAuditor(auditorId);
            setAuditorAuditsList(audits);
            renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
            setupAuditorDashboard(audits);
        } else if (role === 'administrador') {
            const today = new Date().toISOString().split('T')[0];
            filters.date = today;
            const [audits, users] = await Promise.all([api.fetchAudits(filters), api.fetchAllUsers()]);
            renderSimpleAdminAuditsTable(audits, '#admin-audits-table-body');
            renderUsersTable(users, '#admin-users-table-body');
        }
    } catch (error) {
        console.error(`Error al cargar datos para ${role}:`, error);
    }
}

function renderAuditsTable(audits, tableSelector) {
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

function renderSimpleAdminAuditsTable(audits, tableSelector) {
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
                <option value="fecha_corta" ${product.novedad === 'fecha_corta' ? 'selected' : ''}>Fecha Corta</option>
                <option value="contaminado" ${product.novedad === 'contaminado' ? 'selected' : ''}>Contaminado</option>
                <option value="vencido" ${product.novedad === 'vencido' ? 'selected' : ''}>Vencido</option>
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

function populateAuditorFilter(users) {
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

function renderComplianceChart(audits) {
    const canvasId = 'complianceChart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    setChartInstance(canvasId, new Chart(ctx, {
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

async function renderNoveltiesChart(audits) {
    const canvasId = 'noveltiesChart';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

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

    setChartInstance(canvasId, new Chart(ctx, {
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

export async function verAuditoria(auditId) {
    try {
        const audit = await api.fetchAuditDetails(auditId);
        setCurrentAudit(audit);
        renderProductsTable(audit.productos);
        initWebSocket(auditId);
        setupAuditViewListeners(); // Call to setup listeners

        if (audit.estado === 'finalizada') {
            document.querySelectorAll('#auditor-products-table-body input, #auditor-products-table-body select, #auditor-products-table-body textarea, #auditor-products-table-body button').forEach(el => {
                el.disabled = true;
            });
            ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.classList.add('d-none');
            });
            const scanInput = document.getElementById('scan-input');
            if(scanInput) scanInput.disabled = true;
            const cameraBtn = document.getElementById('start-camera-scan-btn');
            if(cameraBtn) cameraBtn.disabled = true;
        } else {
            ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.classList.remove('d-none');
            });
            const scanInput = document.getElementById('scan-input');
            if(scanInput) scanInput.disabled = false;
            const cameraBtn = document.getElementById('start-camera-scan-btn');
            if(cameraBtn) cameraBtn.disabled = false;
            
            document.getElementById('scan-input')?.focus();
        }

        updateCompliancePercentage(auditId);

    } catch (error) {
        alert("Error de red.");
    }
}

function setupAuditViewListeners() {
    const productsTable = document.getElementById('auditor-products-table-body');
    if (productsTable) {
        productsTable.addEventListener('click', async (e) => {
            if (e.target.closest('.save-product-btn')) {
                const row = e.target.closest('tr');
                const productId = row.getAttribute('data-product-id');
                const physicalCount = row.querySelector('.physical-count').value;
                const novelty = row.querySelector('.novelty-select').value;
                const observations = row.querySelector('.observations-area').value;

                try {
                    await api.updateProduct(productId, {
                        cantidad_fisica: physicalCount,
                        novedad: novelty,
                        observaciones: observations
                    });
                    alert('Producto guardado con éxito.');
                    updateCompliancePercentage(state.currentAudit.id);
                } catch (error) {
                    alert(`Error al guardar el producto: ${error.message}`);
                }
            }
        });
    }

    const finishAuditBtn = document.getElementById('finish-audit-btn');
    if (finishAuditBtn) {
        finishAuditBtn.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que quieres finalizar esta auditoría?')) {
                try {
                    await api.finishAudit(state.currentAudit.id);
                    alert('Auditoría finalizada con éxito.');
                    loadDashboardData('auditor', getToken());
                    showDashboard('auditor-dashboard'); 
                } catch (error) {
                    alert(`Error al finalizar la auditoría: ${error.message}`);
                }
            }
        });
    }

    const collaborativeAuditBtn = document.getElementById('collaborative-audit-btn');
    if (collaborativeAuditBtn) {
        collaborativeAuditBtn.addEventListener('click', () => {
            // Logic for collaborative audit
            alert('Función de auditoría colaborativa aún no implementada.');
        });
    }

    const scanInput = document.getElementById('scan-input');
    if (scanInput) {
        scanInput.addEventListener('change', (e) => {
            const sku = e.target.value;
            const productRow = document.querySelector(`tr[data-sku="${sku}"]`);
            if (productRow) {
                productRow.querySelector('.physical-count').focus();
                productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                speak(`Producto ${sku} encontrado.`);
            } else {
                speak(`Producto ${sku} no encontrado en la lista.`);
            }
            e.target.value = '';
        });
    }
    
    const startCameraScanBtn = document.getElementById('start-camera-scan-btn');
    if(startCameraScanBtn) {
        startCameraScanBtn.addEventListener('click', () => {
            alert('Función de escaneo con cámara aún no implementada.');
        });
    }
}

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

export function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

export function setupAuditorDashboard(audits) {
    const btnShow = document.getElementById('show-finished-audits-btn');
    const btnHide = document.getElementById('hide-finished-audits-btn');
    if (btnShow) {
        btnShow.addEventListener('click', () => {
            renderAuditorAuditsTable(state.auditorAuditsList, '#auditor-audits-table-body', true)
            btnShow.classList.add('d-none');
            btnHide.classList.remove('d-none');
        });
    }
    if (btnHide) {
        btnHide.addEventListener('click', () => {
            renderAuditorAuditsTable(state.auditorAuditsList, '#auditor-audits-table-body', false)
            btnHide.classList.add('d-none');
            btnShow.classList.remove('d-none');
        });
    }
    renderAuditorAuditsTable(audits, '#auditor-audits-table-body', false);
}

import { state, setChartInstance, setCurrentAudit, setAuditorAuditsList, setAnalystAudits, setHtml5QrCode, setLastScanned } from './state.js';
import * as api from './api.js';
import { getToken } from './auth.js';
import { initWebSocket } from './websockets.js';

const roleMap = {
    analista: 'analyst-dashboard',
    auditor: 'auditor-dashboard',
    administrador: 'admin-dashboard'
};

/**
 * Genera un sonido de 'beep' corto usando la Web Audio API.
 * @param {number} frequency - La frecuencia del tono en Hz.
 * @param {number} duration - La duración del sonido en milisegundos.
 * @param {number} volume - El volumen del sonido (0.0 a 1.0).
 */
function playBeep(frequency = 523.25, duration = 200, volume = 0.5) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // C5 note
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
            setAnalystAudits(audits); // Guardar en el estado
            renderAuditsTable(audits, '#analyst-audits-table-body');
            renderComplianceChart(audits);
            renderNoveltiesChart(audits);
            populateAuditorFilter(users);
            setupAnalystDashboardListeners(filters); // Activar listeners
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

async function handleSkuScan(scannedSku, source = 'input') {
    const scanInput = document.getElementById('scan-input');
    if (!scannedSku) return;

    // Normalize SKU: trim whitespace, convert to uppercase, and remove leading zeros.
    scannedSku = scannedSku.trim().toUpperCase().replace(/^0+/, '');

    if (scanInput) scanInput.value = '';

    const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);
    if (!productRow) {
        speak(`Producto ${scannedSku} no encontrado.`);
        setLastScanned(null); // Limpiar el último escaneo si no se encuentra el producto
        return;
    }

    const lastScanned = state.lastScanned;
    const productId = productRow.getAttribute('data-product-id');

    // Flujo de Novedad: Escaneo repetido del mismo SKU
    if (lastScanned && lastScanned.sku === scannedSku) {
        // Detener el flujo rápido y activar la edición manual
        const physicalCountInput = productRow.querySelector('.physical-count');
        productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productRow.classList.add('highlight-manual'); // Resaltar la fila
        physicalCountInput.focus();
        physicalCountInput.select();
        
        // Limpiar el último escaneo para que el siguiente inicie un nuevo ciclo
        setLastScanned(null); 
        return; // Salir de la función para esperar la entrada manual
    }

    // Flujo Rápido (Sin Novedad): Escaneo de un nuevo SKU
    // Si hay un producto anteriormente escaneado y es diferente al actual, guárdalo.
    if (lastScanned && lastScanned.sku !== scannedSku) {
        const lastProductRow = document.querySelector(`tr[data-sku="${lastScanned.sku}"]`);
        if (lastProductRow) {
            const lastProductId = lastProductRow.getAttribute('data-product-id');
            const docQuantityStr = lastProductRow.querySelector('.doc-quantity').textContent;
            const docQuantity = parseInt(docQuantityStr, 10) || 0;

            try {
                // Guardar el producto anterior como "sin novedad" en segundo plano
                await api.updateProduct(state.currentAudit.id, lastProductId, {
                    cantidad_fisica: docQuantity,
                    novedad: 'sin_novedad',
                    observaciones: ''
                });
                lastProductRow.classList.add('is-saved');
                // Actualizar visualmente la fila guardada
                lastProductRow.querySelector('.physical-count').value = docQuantity;
                lastProductRow.querySelector('.novelty-select').value = 'sin_novedad';
                lastProductRow.querySelector('.observations-area').value = '';
                setTimeout(() => lastProductRow.classList.remove('is-saved'), 1200);
                updateCompliancePercentage(state.currentAudit.id);
            } catch (error) {
                // No alertar, solo loguear para no interrumpir el flujo
                console.error(`Error al autoguardar producto ${lastScanned.sku}: ${error.message}`);
                speak(`Error al guardar ${lastScanned.sku}`);
            }
        }
    }

    // Para el SKU actual (sea el primero o uno nuevo en la secuencia)
    // 1. Anunciar la cantidad
    const currentDocQuantity = productRow.querySelector('.doc-quantity').textContent;
    speak(`Cantidad: ${currentDocQuantity}`);

    // 2. Recordar este SKU como el último escaneado
    setLastScanned({ sku: scannedSku, productId: productId });

    // 3. Mantener el foco en el campo de escaneo principal
    if (scanInput) {
        scanInput.focus();
    }
}

function setupAuditViewListeners() {
    const productsTable = document.getElementById('auditor-products-table-body');
    if (productsTable) {

        // Listener para guardado manual con botón
        productsTable.addEventListener('click', async (e) => {
            if (e.target.closest('.save-product-btn')) {
                const row = e.target.closest('tr');
                const productId = row.getAttribute('data-product-id');
                const physicalCount = row.querySelector('.physical-count').value;
                const novelty = row.querySelector('.novelty-select').value;
                const observations = row.querySelector('.observations-area').value;

                try {
                    await api.updateProduct(state.currentAudit.id, productId, {
                        cantidad_fisica: physicalCount,
                        novedad: novelty,
                        observaciones: observations
                    });
                    speak('Guardado');
                    row.classList.add('is-saved');
                    setTimeout(() => row.classList.remove('is-saved'), 1200);
                    updateCompliancePercentage(state.currentAudit.id);
                } catch (error) {
                    alert(`Error al guardar el producto: ${error.message}`);
                }
            }
        });

        // Listener para entrada manual con Enter (Flujo 2)
        productsTable.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('physical-count')) {
                e.preventDefault();
                setLastScanned(null);

                const row = e.target.closest('tr');
                const scanInput = document.getElementById('scan-input');
                const physicalCountInput = e.target;
                const docQuantity = parseFloat(row.querySelector('.doc-quantity').textContent);
                const physicalCount = parseFloat(physicalCountInput.value);
                const noveltySelect = row.querySelector('.novelty-select');
                const observationsArea = row.querySelector('.observations-area');
                const productId = row.getAttribute('data-product-id');

                if (isNaN(physicalCount)) {
                    speak("Por favor, introduce un número válido.");
                    return;
                }

                let novelty = 'sin_novedad';
                let observations = '';
                const diff = physicalCount - docQuantity;

                if (diff < 0) {
                    novelty = 'faltante';
                    observations = `Faltan ${Math.abs(diff)}`;
                } else if (diff > 0) {
                    novelty = 'sobrante';
                    observations = `Sobran ${diff}`;
                }

                noveltySelect.value = novelty;
                observationsArea.value = observations;

                try {
                    await api.updateProduct(state.currentAudit.id, productId, {
                        cantidad_fisica: physicalCount,
                        novedad: novelty,
                        observaciones: observations
                    });
                    speak('Guardado');
                    row.classList.add('is-saved');
                    setTimeout(() => row.classList.remove('is-saved'), 1200);
                    updateCompliancePercentage(state.currentAudit.id);
                    
                    if (scanInput) {
                        scanInput.focus();
                    }
                } catch (error) {
                    alert(`Error al guardar el producto: ${error.message}`);
                    speak("Error al guardar.");
                }
            }
        });
    }

    const saveAllBtn = document.getElementById('save-all-btn');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', async () => {
            const productsTable = document.getElementById('auditor-products-table-body');
            const rows = productsTable.querySelectorAll('tr');
            const productsToUpdate = [];

            for (const row of rows) {
                const physicalCountInput = row.querySelector('.physical-count');
                if (physicalCountInput.value !== null && physicalCountInput.value !== '') {
                    productsToUpdate.push({
                        id: parseInt(row.getAttribute('data-product-id')),
                        cantidad_fisica: parseInt(physicalCountInput.value),
                        novedad: row.querySelector('.novelty-select').value,
                        observaciones: row.querySelector('.observations-area').value
                    });
                }
            }

            if (productsToUpdate.length === 0) {
                alert("No hay cambios para guardar.");
                return;
            }

            saveAllBtn.disabled = true;
            saveAllBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

            try {
                await api.bulkUpdateProducts(state.currentAudit.id, productsToUpdate);
                alert(`Guardado completado. ${productsToUpdate.length} productos actualizados.`);
                
                rows.forEach(row => {
                    const productId = parseInt(row.getAttribute('data-product-id'));
                    if (productsToUpdate.some(p => p.id === productId)) {
                        row.classList.add('is-saved');
                        setTimeout(() => row.classList.remove('is-saved'), 1200);
                    }
                });

                if (state.currentAudit) {
                    updateCompliancePercentage(state.currentAudit.id);
                }

            } catch (error) {
                alert(`Error al guardar los cambios: ${error.message}`);
            } finally {
                saveAllBtn.disabled = false;
                saveAllBtn.innerHTML = '<i class="bi bi-save"></i> Guardar Auditoría';
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
        collaborativeAuditBtn.addEventListener('click', async () => {
            const panel = document.getElementById('collaborative-panel');
            const select = document.getElementById('collaborative-auditors-select');
            if (!panel || !select) return;

            try {
                const users = await api.fetchAuditors();
                const currentUserId = localStorage.getItem('user_id');
                const existingCollaboratorIds = new Set((state.currentAudit.collaborators || []).map(c => c.id));

                const availableAuditors = users.filter(user => 
                    user.id.toString() !== currentUserId && !existingCollaboratorIds.has(user.id)
                );

                select.innerHTML = ''; // Clear previous options
                availableAuditors.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.nombre;
                    select.appendChild(option);
                });

                panel.classList.remove('d-none');
            } catch (error) {
                alert(`Error al cargar auditores: ${error.message}`);
            }
        });
    }

    const confirmCollaborativeBtn = document.getElementById('confirm-collaborative-audit');
    if (confirmCollaborativeBtn) {
        confirmCollaborativeBtn.addEventListener('click', async () => {
            const select = document.getElementById('collaborative-auditors-select');
            const selectedIds = Array.from(select.selectedOptions).map(opt => opt.value);

            if (selectedIds.length === 0) {
                alert('Por favor, selecciona al menos un auditor.');
                return;
            }

            try {
                await api.addCollaborators(state.currentAudit.id, selectedIds);
                alert('Colaboradores agregados con éxito.');
                document.getElementById('collaborative-panel').classList.add('d-none');
                verAuditoria(state.currentAudit.id); // Refresh view
            } catch (error) {
                alert(`Error al agregar colaboradores: ${error.message}`);
            }
        });
    }

    const cancelCollaborativeBtn = document.getElementById('cancel-collaborative-audit');
    if (cancelCollaborativeBtn) {
        cancelCollaborativeBtn.addEventListener('click', () => {
            document.getElementById('collaborative-panel').classList.add('d-none');
        });
    }

    const scanInput = document.getElementById('scan-input');
    if (scanInput) {
        scanInput.addEventListener('change', (e) => handleSkuScan(e.target.value, 'input'));
    }
    
    const startCameraScanBtn = document.getElementById('start-camera-scan-btn');
    if(startCameraScanBtn) {
        startCameraScanBtn.addEventListener('click', () => {
            const scannerContainer = document.getElementById('scanner-container');
            if (!scannerContainer) return;

            scannerContainer.classList.remove('d-none');
            const html5QrCode = new Html5Qrcode("reader");
            setHtml5QrCode(html5QrCode);

            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                playBeep();
                handleSkuScan(decodedText, 'camera');
                if (state.html5QrCode) {
                    state.html5QrCode.stop().then(() => {
                        document.getElementById('scanner-container').classList.add('d-none');
                        setHtml5QrCode(null);
                    }).catch(err => console.error("Failed to stop scanner.", err));
                }
            };

            const config = {
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.UPC_A
                ]
            }; 

            html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
                .catch(err => {
                    console.error("Unable to start scanning.", err);
                    alert("No se pudo iniciar el escáner. Asegúrate de dar permiso para usar la cámara.");
                    scannerContainer.classList.add('d-none');
                });
        });
    }

    const closeScannerBtn = document.getElementById('close-scanner-btn');
    if (closeScannerBtn) {
        closeScannerBtn.addEventListener('click', () => {
            if (state.html5QrCode) {
                state.html5QrCode.stop().then(() => {
                    document.getElementById('scanner-container').classList.add('d-none');
                    setHtml5QrCode(null);
                }).catch(err => console.error("Failed to stop scanner.", err));
            }
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

// --- Funciones para Generación de Informes (Analista) ---

async function prepareReportData(reportType, filters) {
    const filteredAuditsSummaries = state.analystAudits.filter(audit => {
        const auditDate = new Date(audit.creada_en);
        
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        if (startDate) startDate.setUTCHours(0, 0, 0, 0); 

        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        if (endDate) endDate.setUTCHours(23, 59, 59, 999);
        
        const statusMatch = !filters.status || filters.status === 'Todos' || audit.estado === filters.status.toLowerCase().replace(' ', '_');
        const auditorMatch = !filters.auditorId || audit.auditor_id == filters.auditorId;
        const startDateMatch = !startDate || auditDate >= startDate;
        const endDateMatch = !endDate || auditDate <= endDate;

        return statusMatch && auditorMatch && startDateMatch && endDateMatch;
    });

    if (filteredAuditsSummaries.length === 0) {
        return { products: [], totalPedidos: 0, totalProductos: 0, noveltyCounts: {} };
    }

    const detailedAudits = await Promise.all(
        filteredAuditsSummaries.map(audit => api.fetchAuditDetails(audit.id))
    );

    let allProducts = [];
    detailedAudits.forEach(audit => {
        if (audit.productos && audit.productos.length > 0) {
            const productsWithContext = audit.productos.map(p => ({
                ...p,
                orden_traslado: audit.ubicacion_destino,
                audit_id: audit.id,
                auditor_nombre: audit.auditor?.nombre ?? 'N/A',
                audit_fecha: new Date(audit.creada_en).toLocaleDateString()
            }));
            allProducts.push(...productsWithContext);
        }
    });

    if (reportType === 'novedades') {
        allProducts = allProducts.filter(p => p.novedad && p.novedad !== 'sin_novedad');
    }

    const totalPedidos = allProducts.length;
    const totalProductos = allProducts.reduce((sum, p) => sum + (p.cantidad_fisica || 0), 0);
    
    const noveltyCounts = allProducts.reduce((acc, p) => {
        if (p.novedad && p.novedad !== 'sin_novedad') {
            acc[p.novedad] = (acc[p.novedad] || 0) + 1;
        }
        return acc;
    }, {});

    return { products: allProducts, totalPedidos, totalProductos, noveltyCounts };
}

function setupAnalystDashboardListeners() {
    const downloadOptions = [
        { id: 'download-general-excel', type: 'general', format: 'excel' },
        { id: 'download-general-pdf', type: 'general', format: 'pdf' },
        { id: 'download-novelties-excel', type: 'novedades', format: 'excel' },
        { id: 'download-novelties-pdf', type: 'novedades', format: 'pdf' },
    ];

    downloadOptions.forEach(option => {
        const element = document.getElementById(option.id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            newElement.addEventListener('click', async (e) => {
                e.preventDefault();

                const currentFilters = {
                    status: document.getElementById('filterStatus').value,
                    auditorId: document.getElementById('filterAuditor').value,
                    startDate: document.getElementById('filterStartDate').value,
                    endDate: document.getElementById('filterEndDate').value,
                };

                const reportData = await prepareReportData(option.type, currentFilters);

                if (!reportData || reportData.products.length === 0) {
                    alert('No hay datos para generar el informe con los filtros seleccionados.');
                    return;
                }

                if (option.format === 'excel') {
                    generateExcelReport(reportData, option.type, currentFilters);
                } else if (option.format === 'pdf') {
                    generatePdfReport(reportData, option.type, currentFilters);
                }
            });
        }
    });
}

function generateExcelReport(reportData, reportType, filters) {
    const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
    const wb = XLSX.utils.book_new();
    const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
    const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // --- Crear Hoja de Resumen ---
    const summaryData = [
        [reportTitle],
        [],
        ['Filtros Aplicados'],
        ['Fecha Inicio:', filters.start_date || 'N/A'],
        ['Fecha Fin:', filters.end_date || 'N/A'],
        [],
        ['Resumen General'],
        ['Total de Pedidos (líneas de producto):', totalPedidos],
        ['Total de Productos (unidades físicas):', totalProductos],
        [],
        ['Resumen de Novedades'],
        ...Object.entries(noveltyCounts).map(([key, value]) => [key, value])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // --- Crear Hoja de Datos ---
    const tableHeader = ['Item', 'Orden de Traslado', 'SKU', 'Descripción', 'Novedad', 'Cant. Documento', 'Cant. Física', 'Diferencia', 'Observaciones'];
    const tableBody = products.map((p, index) => ({
        Item: index + 1,
        'Orden de Traslado': p.orden_traslado,
        SKU: p.sku,
        Descripción: p.nombre_articulo,
        Novedad: p.novedad,
        'Cant. Documento': p.cantidad_documento,
        'Cant. Física': p.cantidad_fisica,
        Diferencia: (p.cantidad_fisica || 0) - (p.cantidad_documento || 0),
        Observaciones: p.observaciones
    }));

    const wsData = XLSX.utils.json_to_sheet(tableBody, { header: tableHeader });
    XLSX.utils.book_append_sheet(wb, wsData, 'Detalle de Productos');

    XLSX.writeFile(wb, fileName);
}

function generatePdfReport(reportData, reportType, filters) {
    const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
    const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const today = new Date().toLocaleDateString('es-ES');

    // Título
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha de Generación: ${today}`, 14, 28);

    // Resumen y Filtros
    doc.setFontSize(12);
    doc.text('Resumen y Filtros Aplicados', 14, 40);
    doc.autoTable({
        startY: 42,
        head: [['Concepto', 'Valor']],
        body: [
            ['Fecha Inicio Filtro', filters.start_date || 'N/A'],
            ['Fecha Fin Filtro', filters.end_date || 'N/A'],
            ['Total de Pedidos (líneas)', totalPedidos],
            ['Total de Productos (unidades)', totalProductos],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
    });

    let finalY = doc.lastAutoTable.finalY || 80;

    // Tabla de Productos
    doc.setFontSize(12);
    doc.text('Detalle de Productos', 14, finalY + 10);
    const tableHeader = ['#', 'Orden T.', 'SKU', 'Descripción', 'Novedad', 'Cant. Doc', 'Cant. Fís', 'Dif.'];
    const tableBody = products.map((p, index) => [
        index + 1,
        p.orden_traslado,
        p.sku,
        p.nombre_articulo,
        p.novedad,
        p.cantidad_documento,
        p.cantidad_fisica,
        (p.cantidad_fisica || 0) - (p.cantidad_documento || 0)
    ]);

    doc.autoTable({
        startY: finalY + 12,
        head: [tableHeader],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
        didParseCell: function (data) {
            if (data.column.dataKey === 3 && data.cell.section === 'body') { // Columna 'Descripción'
                data.cell.text = data.cell.text[0].substring(0, 25) + (data.cell.text[0].length > 25 ? '...' : '');
            }
        }
    });
    finalY = doc.lastAutoTable.finalY;

    // Gráfico de Novedades (movido después de la tabla)
    const noveltyChartCanvas = state.chartInstances.noveltiesChart?.canvas;
    if (noveltyChartCanvas && Object.keys(noveltyCounts).length > 0) {
        finalY += 10;
        doc.setFontSize(12);
        doc.text('Gráfico de Novedades', 14, finalY);
        const chartImage = noveltyChartCanvas.toDataURL('image/png', 1.0);
        doc.addImage(chartImage, 'PNG', 14, finalY + 2, 90, 60);
        finalY += 70; // Incrementar espacio para el gráfico
    }

    // Conclusiones
    doc.setFontSize(12);
    doc.text('Conclusiones', 14, finalY);
    let conclusionText = `El informe de tipo '${reportType}' generó un total de ${totalPedidos} líneas de producto. `;
    if(Object.keys(noveltyCounts).length > 0) {
        const mainNovelty = Object.entries(noveltyCounts).sort((a, b) => b[1] - a[1])[0];
        conclusionText += `Se encontraron ${Object.keys(noveltyCounts).length} tipos de novedades, siendo la más común '${mainNovelty[0]}' con ${mainNovelty[1]} ocurrencias.`;
    } else {
        conclusionText += 'No se encontraron novedades significativas en los productos analizados.';
    }
    const splitText = doc.splitTextToSize(conclusionText, 180);
    doc.text(splitText, 14, finalY + 5);

    doc.save(fileName);
}
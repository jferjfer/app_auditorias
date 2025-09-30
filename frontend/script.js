document.addEventListener('DOMContentLoaded', function() {
    // --- Variables Globales y de Entorno ---
    const DEPLOYMENT_URL = 'https://app-auditorias.onrender.com';
    const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_URL = IS_LOCAL ? 'http://127.0.0.1:8000' : DEPLOYMENT_URL;

    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    const authForm = document.getElementById('auth-form');
    const roleMap = {
        analista: 'analyst-dashboard',
        auditor: 'auditor-dashboard',
        administrador: 'admin-dashboard'
    };

    let websocket = null;
    let currentAudit = null;
    let lastFocusedQuantityInput = null; // Para el flujo de escaneo rápido
    let lastScannedSku = null;
    let chartInstances = {};
    let html5QrCode = null;
    let editingUserId = null; // For admin edit user functionality

    // --- Lógica de Inicialización ---
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.classList.add('d-none');
                document.getElementById('app-container').classList.remove('d-none');
                initApp();
            }, { once: true });
        }, 1000); // Reduced splash screen time
    } else {
        initApp();
    }

    function initApp() {
        initTheme();
        checkAuth();
        setupGlobalListeners();
    }

    // --- Lógica de Tema ---
    function initTheme() {
        const savedTheme = localStorage.getItem('selected_theme') || 'dark-default';
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('theme-menu')?.addEventListener('click', (e) => {
            if (e.target.matches('[data-theme]')) {
                document.body.setAttribute('data-theme', e.target.getAttribute('data-theme'));
                localStorage.setItem('selected_theme', e.target.getAttribute('data-theme'));
            }
        });
    }

    // --- Helpers de Sesión ---
    const getToken = () => localStorage.getItem('access_token');
    function clearSession() {
        localStorage.clear();
        if (websocket) websocket.close();
        window.location.reload();
    }

    // --- Lógica de Navegación y UI ---
    function showDashboard(dashboardId) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('d-none');
        });
        const activeDashboard = document.getElementById(dashboardId);
        if (activeDashboard) {
            activeDashboard.classList.remove('d-none');
        }
    }

    // --- Lógica de Autenticación y Carga de Datos ---
    async function checkAuth() {
        const token = getToken();
        if (!token) {
            authModal.show();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const user = await response.json();
                setupUserSession(user, token);
            } else {
                clearSession();
            }
        } catch (error) {
            console.error('Error en checkAuth:', error);
            clearSession();
        }
    }

    function setupUserSession(user, token) {
        localStorage.setItem('user_role', user.rol);
        localStorage.setItem('user_name', user.nombre);
        localStorage.setItem('user_id', user.id);

        const dashboardId = roleMap[user.rol];
        showDashboard(dashboardId);
        const titleElement = document.getElementById(`${user.rol}-title`);
        if (titleElement) titleElement.textContent = `Bienvenido, ${user.nombre}`;

        loadDashboardData(user.rol, token);
        initGeneralWebSocket();
    }

    async function loadDashboardData(role, token, filters = {}) {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        try {
            if (role === 'analista') {
                const params = new URLSearchParams(filters);
                const queryString = params.toString();
                const [auditsRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/api/audits/?${queryString}`, { headers }),
                    fetch(`${API_URL}/api/users/`, { headers })
                ]);
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    renderAuditsTable(audits, '#analyst-audits-table-body');
                    renderComplianceChart(audits);
                    renderNoveltiesChart(audits);
                }
                if (usersRes.ok) {
                    const users = await usersRes.json();
                    populateAuditorFilter(users);
                }
            } else if (role === 'auditor') {
                const auditorId = localStorage.getItem('user_id');
                const auditsRes = await fetch(`${API_URL}/api/audits/auditor/${auditorId}`, { headers });
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    window._auditorAuditsList = audits;
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    setupAuditorDashboard(audits);
                }
            } else if (role === 'administrador') {
                const today = new Date().toISOString().split('T')[0];
                filters.date = today;
                const params = new URLSearchParams(filters);
                const queryString = params.toString();

                const [auditsRes, usersRes] = await Promise.all([fetch(`${API_URL}/api/audits/?${queryString}`, { headers }), fetch(`${API_URL}/api/users/`, { headers })]);
                if (auditsRes.ok) renderSimpleAdminAuditsTable(await auditsRes.json(), '#admin-audits-table-body');
                if (usersRes.ok) renderUsersTable(await usersRes.json(), '#admin-users-table-body');
            }
        } catch (error) {
            console.error(`Error al cargar datos para ${role}:`, error);
        }
    }

    // --- Lógica de Renderizado de Tablas y Gráficos ---
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
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center">No hay auditorías para el día de hoy.</td></tr>`;
            return;
        }
        tableBody.innerHTML = audits.map(audit => {
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? Math.round(audit.porcentaje_cumplimiento) : 0;
            return `<tr data-audit-id="${audit.id}">
                <td>${audit.ubicacion_destino}</td>
                <td>${audit.auditor?.nombre ?? 'N/A'}</td>
                <td>
                    <div class="progress" style="height: 20px; background-color: #343a40;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: ${cumplimiento}%;" aria-valuenow="${cumplimiento}">${cumplimiento}%</div>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    function renderAuditorAuditsTable(audits, tableSelector, mostrarFinalizadas = false) {
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

    function renderProductsTable(products) {
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

    function renderUsersTable(users, tableSelector) {
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
        const ctx = document.getElementById('complianceChart')?.getContext('2d');
        if (!ctx) return;

        if (chartInstances.complianceChart) {
            chartInstances.complianceChart.destroy();
        }

        const labels = audits.map(a => `Audit #${a.id}`);
        const data = audits.map(a => a.porcentaje_cumplimiento || 0);

        chartInstances.complianceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '% Cumplimiento',
                    data: data,
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
        });
    }

    async function renderNoveltiesChart(audits) {
        const ctx = document.getElementById('noveltiesChart')?.getContext('2d');
        if (!ctx) return;

        if (chartInstances.noveltiesChart) {
            chartInstances.noveltiesChart.destroy();
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

        chartInstances.noveltiesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Faltante', 'Sobrante', 'Avería'],
                datasets: [{
                    label: 'Novedades',
                    data: [noveltyData.faltante, noveltyData.sobrante, noveltyData.averia],
                    backgroundColor: ['#ffc107', '#fd7e14', '#dc3545'],
                }]
            }
        });
    }

    // --- Lógica del Dashboard del Auditor ---
    function setupAuditorDashboard(audits) {
        const btnShow = document.getElementById('show-finished-audits-btn');
        const btnHide = document.getElementById('hide-finished-audits-btn');
        if (btnShow) {
            btnShow.addEventListener('click', () => {
                renderAuditorAuditsTable(window._auditorAuditsList, '#auditor-audits-table-body', true)
                btnShow.classList.add('d-none');
                btnHide.classList.remove('d-none');
            });
        }
        if (btnHide) {
            btnHide.addEventListener('click', () => {
                renderAuditorAuditsTable(window._auditorAuditsList, '#auditor-audits-table-body', false)
                btnHide.classList.add('d-none');
                btnShow.classList.remove('d-none');
            });
        }
        renderAuditorAuditsTable(audits, '#auditor-audits-table-body', false);

        const uploadForm = document.getElementById('uploadForm');
        const fileInput = document.getElementById('audit-file-input');
        if (uploadForm && !uploadForm.dataset.listenerAdded) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = uploadForm.querySelector('button[type="submit"]');
                if (!fileInput.files || fileInput.files.length === 0) return alert("Selecciona al menos un archivo.");
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo...';
                const formData = new FormData();
                for (const file of fileInput.files) formData.append('files', file);
                try {
                    const token = getToken();
                    const response = await fetch(`${API_URL}/api/audits/upload-multiple-files`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                    if (response.ok) {
                        const result = await response.json();
                        alert(`✅ Auditoría creada con éxito! ID: ${result.audit_id}`);
                        loadDashboardData('auditor', token);
                    } else {
                        alert(`❌ Error: ${(await response.json()).detail}`);
                    }
                } catch (error) {
                    alert("❌ Error de conexión.");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
                }
            });
            uploadForm.dataset.listenerAdded = 'true';
        }
    }

    async function iniciarAuditoria(auditId) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/audits/${auditId}/iniciar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                loadDashboardData('auditor', token);
            } else {
                alert(`Error al iniciar auditoría: ${(await response.json()).detail}`);
            }
        } catch (error) {
            alert("Error de red al iniciar auditoría.");
        }
    }

    async function verAuditoria(auditId) {
        const token = getToken();
        if (!token) return alert("No autenticado.");
        try {
            const response = await fetch(`${API_URL}/api/audits/${auditId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                currentAudit = await response.json();
                renderProductsTable(currentAudit.productos);
                initWebSocket(auditId);

                if (currentAudit.estado === 'finalizada') {
                    // Modo solo lectura para auditorías finalizadas
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
                    // Modo editable para auditorías activas
                    ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => {
                        const btn = document.getElementById(id);
                        if (btn) btn.classList.remove('d-none');
                    });
                    const scanInput = document.getElementById('scan-input');
                    if(scanInput) scanInput.disabled = false;
                    const cameraBtn = document.getElementById('start-camera-scan-btn');
                    if(cameraBtn) cameraBtn.disabled = false;
                    
                    setupScanInput();
                    setupAutoSaveOnEnter();
                    document.getElementById('scan-input')?.focus();
                }

                updateCompliancePercentage(auditId);

            } else {
                alert(`Error: ${(await response.json()).detail}`);
            }
        } catch (error) {
            alert("Error de red.");
        }
    }

    // --- Lógica de Escaneo Rápido y Voz ---
    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }

    function setupScanInput() {
        const scanInput = document.getElementById('scan-input');
        if (!scanInput) return;

        const newScanInput = scanInput.cloneNode(true);
        scanInput.parentNode.replaceChild(newScanInput, scanInput);

        newScanInput.addEventListener('keydown', async (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();

            const scannedSku = newScanInput.value.trim();
            newScanInput.value = ''; // Clear input immediately

            // Tarea 2: Logica de doble escaneo
            if (scannedSku && scannedSku === lastScannedSku) {
                const row = document.querySelector(`#auditor-products-table-body tr[data-sku="${scannedSku}"]`);
                if (row) {
                    const docQuantity = parseInt(row.querySelector('.doc-quantity').textContent, 10) || 0;
                    const physicalCountInput = row.querySelector('.physical-count');
                    physicalCountInput.value = docQuantity;

                    const productId = row.getAttribute('data-product-id');
                    if (productId && currentAudit) {
                        const updateData = {
                            cantidad_fisica: docQuantity,
                            novedad: 'sin_novedad',
                            observaciones: row.querySelector('.observations-area').value || ''
                        };
                        const saved = await saveProduct(productId, currentAudit.id, updateData);
                        if (saved) {
                            physicalCountInput.classList.add('saved-success');
                            setTimeout(() => physicalCountInput.classList.remove('saved-success'), 1000);
                            await updateCompliancePercentage(currentAudit.id);
                            newScanInput.focus();
                        } else {
                            physicalCountInput.classList.add('saved-error');
                            speak("Error al guardar");
                        }
                    }
                }
                lastScannedSku = null; // Reset for next scan
                lastFocusedQuantityInput = null;
                return;
            }

            // Preserve auto-save from original logic (Case 2)
            if (lastFocusedQuantityInput && lastFocusedQuantityInput.value.trim() === '') {
                const prevRow = lastFocusedQuantityInput.closest('tr');
                const productId = prevRow.getAttribute('data-product-id');

                if (productId && currentAudit) {
                    const docQuantity = parseInt(prevRow.querySelector('.doc-quantity').textContent, 10) || 0;
                    lastFocusedQuantityInput.value = docQuantity;

                    const updateData = {
                        cantidad_fisica: docQuantity,
                        novedad: 'sin_novedad',
                        observaciones: ''
                    };
                    const saved = await saveProduct(productId, currentAudit.id, updateData);
                    if (saved) {
                        lastFocusedQuantityInput.classList.add('saved-success');
                        setTimeout(() => lastFocusedQuantityInput.classList.remove('saved-success'), 1000);
                        await updateCompliancePercentage(currentAudit.id);
                    } else {
                        lastFocusedQuantityInput.classList.add('saved-error');
                        speak("Error al guardar el producto anterior");
                        // Do not proceed if saving previous failed
                        lastScannedSku = null;
                        return;
                    }
                }
            }

            // Normal scan logic (Case 3 from original)
            if (!scannedSku) {
                lastFocusedQuantityInput = null;
                lastScannedSku = null;
                return;
            }

            const skuCell = document.querySelector(`#auditor-products-table-body td[data-sku="${scannedSku}"]`);
            if (skuCell) {
                const targetRow = skuCell.closest('tr');
                const physicalCountInput = targetRow.querySelector('.physical-count');
                const docQuantity = targetRow.querySelector('.doc-quantity').textContent.trim();

                speak(`Cantidad esperada: ${docQuantity}`);

                physicalCountInput.focus();
                physicalCountInput.select();

                lastFocusedQuantityInput = physicalCountInput;
                lastScannedSku = scannedSku; // Set for next scan
            } else {
                speak("SKU no encontrado");
                lastFocusedQuantityInput = null;
                lastScannedSku = null;
            }
        });
    }

    function setupAutoSaveOnEnter() {
        const productsTableBody = document.getElementById('auditor-products-table-body');
        const newTableBody = productsTableBody.cloneNode(true);
        productsTableBody.parentNode.replaceChild(newTableBody, productsTableBody);

        newTableBody.addEventListener('keydown', async (e) => {
            if (e.target.classList.contains('physical-count') && e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                const row = input.closest('tr');
                const productId = row.getAttribute('data-product-id');
                if (!productId || !currentAudit) return;

                input.disabled = true;
                const updateData = {
                    cantidad_fisica: parseInt(input.value) || 0,
                    novedad: row.querySelector('.novelty-select')?.value || 'sin_novedad',
                    observaciones: row.querySelector('.observations-area')?.value || ''
                };
                const result = await saveProduct(productId, currentAudit.id, updateData);
                input.disabled = false;

                if (result) {
                    input.classList.add('saved-success');
                    setTimeout(() => input.classList.remove('saved-success'), 1000);
                    lastFocusedQuantityInput = null;
                    await updateCompliancePercentage(currentAudit.id);
                    document.getElementById('scan-input')?.focus();
                } else {
                    alert("Error al guardar.");
                    input.focus();
                }
            }
        });
    }

    async function saveProduct(productId, auditId, updateData) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/audits/${auditId}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error('Error de red al guardar producto:', error);
            return null;
        }
    }

    async function updateCompliancePercentage(auditId) {
        const complianceDiv = document.getElementById('compliance-percentage');
        if (!complianceDiv) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/audits/${auditId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const auditData = await response.json();
                const percentage = auditData.porcentaje_cumplimiento ?? 0;
                complianceDiv.textContent = `${percentage}%`;
                complianceDiv.style.background = `conic-gradient(#00c6ff ${percentage}%, transparent ${percentage}%)`;
            }
        } catch (error) {
            console.error('Error al actualizar porcentaje:', error);
        }
    }

    // --- WebSockets ---
    function initWebSocket(auditId) {
        const token = getToken();
        if (!token) return;
        const wsUrl = API_URL.replace(/^http/, 'ws');
        websocket = new WebSocket(`${wsUrl}/api/ws/${auditId}?token=${token}`);
        websocket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            // Example: Update a product row in real-time
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
    }

    function initGeneralWebSocket() {
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

    // --- Listeners Globales ---
    function setupGlobalListeners() {
        // Sidebar toggle for mobile
        const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
                document.body.classList.toggle('sidebar-active');
            });
        }

        // Auth form
        authForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('correo_electronico').value;
            const password = document.getElementById('contrasena').value;
            const action = event.submitter.id;

            let url, body, headers = { 'Content-Type': 'application/json' };

            if (action === 'login-btn') {
                url = `${API_URL}/api/auth/login`;
                body = new URLSearchParams({ username: email, password });
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                url = `${API_URL}/api/auth/register`;
                body = JSON.stringify({ nombre: document.getElementById('nombre').value, correo: email, contrasena: password, rol: document.getElementById('rol').value });
            }

            try {
                const response = await fetch(url, { method: 'POST', headers, body });
                const result = await response.json();
                if (response.ok) {
                    if (result.access_token && result.user) {
                        localStorage.setItem('access_token', result.access_token);
                        authModal.hide();
                        setupUserSession(result.user, result.access_token);
                    } else if (result.access_token) { // Fallback for register
                        localStorage.setItem('access_token', result.access_token);
                        authModal.hide();
                        checkAuth();
                    }
                } else {
                    alert(`Error: ${result.detail}`);
                }
            } catch (error) {
                console.error('Error de conexión en Auth:', error);
                alert('Error de conexión.');
            }
        });

        // Logout
        document.querySelector('[data-target="logout"]').addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
        });

        // Sidebar navigation
        document.querySelector('.sidebar').addEventListener('click', (e) => {
            const link = e.target.closest('.dashboard-link');
            if (link) {
                e.preventDefault();
                const targetDashboard = link.getAttribute('data-target');
                showDashboard(targetDashboard);
            }
        });

        // Analyst: Filter form
        document.querySelector('#analyst-dashboard form').addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                status: document.getElementById('filterStatus').value,
                auditor_id: document.getElementById('filterAuditor').value,
                date: document.getElementById('filterDate').value
            };
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'Todos'));
            loadDashboardData('analista', getToken(), cleanFilters);
        });

        // Delegated listeners for dynamic content
        document.body.addEventListener('click', async function (e) {
            const iniciarBtn = e.target.closest('.iniciar-auditoria-btn');
            if (iniciarBtn) {
                iniciarAuditoria(iniciarBtn.getAttribute('data-audit-id'));
                return;
            }

            const verBtn = e.target.closest('.ver-auditoria-btn');
            if (verBtn) {
                verAuditoria(verBtn.getAttribute('data-audit-id'));
                return;
            }

            const viewAuditBtn = e.target.closest('.view-audit-btn');
            if (viewAuditBtn) {
                verAuditoria(viewAuditBtn.getAttribute('data-audit-id'));
                return;
            }

            const editUserBtn = e.target.closest('.edit-user-btn');
            if (editUserBtn) {
                editingUserId = editUserBtn.getAttribute('data-user-id');
                const response = await fetch(`${API_URL}/api/users/${editingUserId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
                if (response.ok) {
                    const user = await response.json();
                    document.getElementById('new-user-name').value = user.nombre;
                    document.getElementById('new-user-email').value = user.correo;
                    document.getElementById('new-user-role').value = user.rol;
                    document.getElementById('new-user-password').value = ''; // Clear password
                    document.getElementById('addUserModalLabel').textContent = 'Editar Usuario';
                    document.getElementById('confirm-add-user').textContent = 'Actualizar Usuario';
                    addUserModal.show();
                }
                return;
            }

            const deleteUserBtn = e.target.closest('.delete-user-btn');
            if (deleteUserBtn) {
                const userId = deleteUserBtn.getAttribute('data-user-id');
                if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${userId}?`)) {
                    const response = await fetch(`${API_URL}/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    if (response.ok) {
                        alert('Usuario eliminado.');
                        loadDashboardData('administrador', getToken());
                    } else {
                        alert(`Error al eliminar usuario: ${(await response.json()).detail}`);
                    }
                }
                return;
            }
        });

        // Analyst: Download Report
        document.getElementById('download-report-btn')?.addEventListener('click', async () => {
            const params = new URLSearchParams({
                status: document.getElementById('filterStatus').value,
                auditor_id: document.getElementById('filterAuditor').value,
                date: document.getElementById('filterDate').value
            });
            const cleanParams = new URLSearchParams(Object.fromEntries(Object.entries(Object.fromEntries(params)).filter(([_, v]) => v != null && v !== '' && v !== 'Todos')));

            try {
                const response = await fetch(`${API_URL}/api/audits/report?${cleanParams.toString()}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'reporte_auditorias.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    alert(`Error al descargar el informe: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red al descargar el informe.');
            }
        });

        // Admin: Add/Edit User Modal
        document.getElementById('confirm-add-user')?.addEventListener('click', async () => {
            const name = document.getElementById('new-user-name').value;
            const email = document.getElementById('new-user-email').value;
            const password = document.getElementById('new-user-password').value;
            const role = document.getElementById('new-user-role').value;
            if (!name || !email || !role) return alert('Por favor, completa nombre, correo y rol.');

            const url = editingUserId ? `${API_URL}/api/users/${editingUserId}` : `${API_URL}/api/users/`;
            const method = editingUserId ? 'PUT' : 'POST';
            const body = {
                nombre: name,
                correo: email,
                rol: role
            };
            if (password) body.contrasena = password; // Only include password if changed

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify(body)
                });
                if (response.ok) {
                    alert(editingUserId ? 'Usuario actualizado.' : 'Usuario creado.');
                    addUserModal.hide();
                    loadDashboardData('administrador', getToken());
                } else {
                    alert(`Error: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red.');
            }
        });

        // Reset modal on close
        document.getElementById('addUserModal').addEventListener('hidden.bs.modal', function () {
            editingUserId = null;
            document.getElementById('addUserModalLabel').textContent = 'Agregar Nuevo Usuario';
            document.getElementById('confirm-add-user').textContent = 'Agregar Usuario';
            document.getElementById('add-user-form').reset();
        });

        // Auditor: Finish Audit
        document.getElementById('finish-audit-btn')?.addEventListener('click', async () => {
            if (!currentAudit || !confirm('¿Estás seguro de que quieres finalizar esta auditoría?')) return;
            try {
                const response = await fetch(`${API_URL}/api/audits/${currentAudit.id}/finish`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (response.ok) {
                    alert('Auditoría finalizada con éxito.');
                    loadDashboardData('auditor', getToken());
                } else {
                    alert(`Error: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red al finalizar la auditoría.');
            }
        });

        // Auditor: Collaborative Audit
        document.getElementById('collaborative-audit-btn')?.addEventListener('click', async () => {
            const panel = document.getElementById('collaborative-panel');
            if (!panel || !currentAudit) return;

            panel.classList.toggle('d-none');
            if (panel.classList.contains('d-none')) return;

            try {
                const response = await fetch(`${API_URL}/api/users/`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
                if (response.ok) {
                    const users = await response.json();
                    const auditorSelect = document.getElementById('collaborative-auditors-select');
                    auditorSelect.innerHTML = '';
                    users.filter(u => u.rol === 'auditor' && u.id !== currentAudit.auditor_id).forEach(user => {
                        const option = new Option(user.nombre, user.id);
                        auditorSelect.add(option);
                    });
                } else {
                    alert('Error al cargar la lista de auditores.');
                }
            } catch (error) {
                alert('Error de red al cargar auditores.');
            }
        });

        document.getElementById('cancel-collaborative-audit')?.addEventListener('click', () => {
            document.getElementById('collaborative-panel').classList.add('d-none');
        });

        document.getElementById('collaborative-audit-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentAudit) return;

            const selectedIds = Array.from(document.getElementById('collaborative-auditors-select').selectedOptions).map(opt => opt.value);
            if (selectedIds.length === 0) return alert('Selecciona al menos un colaborador.');

            try {
                const response = await fetch(`${API_URL}/api/audits/${currentAudit.id}/collaborators`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ collaborator_ids: selectedIds })
                });
                if (response.ok) {
                    alert('Colaboradores añadidos con éxito.');
                    document.getElementById('collaborative-panel').classList.add('d-none');
                } else {
                    alert(`Error al añadir colaboradores: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red al añadir colaboradores.');
            }
        });

        // Auditor: Camera Scan
        document.getElementById('start-camera-scan-btn')?.addEventListener('click', () => {
            const scannerContainer = document.getElementById('scanner-container');
            scannerContainer.classList.remove('d-none');
            html5QrCode = new Html5Qrcode("reader");
            html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    document.getElementById('scan-input').value = decodedText;
                    if (html5QrCode) html5QrCode.stop();
                    scannerContainer.classList.add('d-none');
                    // Simulate Enter key press
                    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
                    document.getElementById('scan-input').dispatchEvent(enterEvent);
                },
                (errorMessage) => {
                    // console.log("QR Code no match: ", errorMessage);
                }
            ).catch(err => {
                alert("Error al iniciar la cámara. Asegúrate de dar permisos.");
                console.error(err);
            });
        });

        document.getElementById('close-scanner-btn')?.addEventListener('click', () => {
            if (html5QrCode) {
                try { html5QrCode.stop(); } catch (e) { console.error(e); }
            }
            document.getElementById('scanner-container').classList.add('d-none');
        });
    }
});
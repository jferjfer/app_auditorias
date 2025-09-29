document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica para la Pantalla de Carga (Splash Screen) ---
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');
    const splashVideo = document.getElementById('splash-video');

    const showApp = () => {
        if (splashScreen.style.opacity === '0') return;
        splashScreen.style.opacity = '0';
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.classList.add('d-none');
            appContainer.classList.remove('d-none');
            initTheme();
            checkAuth();
        }, { once: true });
    };

    if (splashScreen && appContainer && splashVideo) {
        splashVideo.play().catch(error => {
            console.error("El video no pudo reproducirse automáticamente:", error);
            showApp();
        });
        setTimeout(showApp, 8000);
    } else {
        initTheme();
        checkAuth();
    }

    // --- Lógica para Sidebar Responsivo ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-active');
        });
    }

    if (mainContent) {
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-active');
            }
        });
    }
    
    // --- Configuración de Entorno ---
    const DEPLOYMENT_URL = 'https://app-auditorias.onrender.com'; 
    const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_URL = IS_LOCAL ? 'http://127.0.0.1:8000' : DEPLOYMENT_URL;
    const authForm = document.getElementById('auth-form');
    const authModalEl = document.getElementById('authModal');
    const authModal = new bootstrap.Modal(authModalEl);
    let websocket = null;
    let html5QrCode = null;
    
    const roleMap = {
        analista: 'analyst-dashboard',
        auditor: 'auditor-dashboard',
        administrador: 'admin-dashboard'
    };
    
    let complianceChartInstance = null;
    let noveltiesChartInstance = null;
    let currentAudit = null;

    // --- Lógica de Temas ---
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('selected_theme', theme);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('selected_theme') || 'dark-default';
        applyTheme(savedTheme);
        document.getElementById('theme-menu')?.addEventListener('click', function(e) {
            if (e.target.matches('[data-theme]')) {
                applyTheme(e.target.getAttribute('data-theme'));
            }
        });
    }

    // --- Helpers de sesión ---
    const setToken = (t) => localStorage.setItem('access_token', t);
    const getToken = () => localStorage.getItem('access_token');
    const clearSession = () => {
        localStorage.clear();
        if (websocket) websocket.close();
        window.location.reload();
    };

    // --- WebSockets ---
    function initWebSocket(auditId) {
        if (websocket) websocket.close();
        const userId = localStorage.getItem('user_id');
        const token = getToken();
        if (!token) return;
        const wsProtocol = IS_LOCAL ? 'ws' : 'wss';
        const wsHost = IS_LOCAL ? '127.0.0.1:8000' : new URL(API_URL).host;
        const wsUrl = `${wsProtocol}://${wsHost}/ws/${auditId}/${userId}?token=${token}`;
        websocket = new WebSocket(wsUrl);
        websocket.onmessage = (event) => updateProductRow(JSON.parse(event.data));
    }

    function initGeneralWebSocket() {
        if (websocket) websocket.close();
        const userId = localStorage.getItem('user_id');
        const token = getToken();
        if (!token) return;
        const wsProtocol = IS_LOCAL ? 'ws' : 'wss';
        const wsHost = IS_LOCAL ? '127.0.0.1:8000' : new URL(API_URL).host;
        const wsUrl = `${wsProtocol}://${wsHost}/ws/${userId}?token=${token}`;
        websocket = new WebSocket(wsUrl);

        websocket.onmessage = function(event) {
            const role = localStorage.getItem('user_role');
            if (role === 'administrador') {
                loadDashboardData('administrador', getToken());
            } else if (role === 'analista') {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'new_audit') addOrUpdateAuditRow(message.data, true);
                    else if (message.type === 'audit_updated') addOrUpdateAuditRow(message.data, false);
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e, "Original data:", event.data);
                }
            }
        };
    }

    function addOrUpdateAuditRow(audit, prepend = false) {
        const createRowHtml = (audit) => {
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            const productosCount = audit.productos_count ?? (Array.isArray(audit.productos) ? audit.productos.length : '--');
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
            let estadoTexto, estadoColor;
            switch(audit.estado) {
                case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#ffc107'; break;
                case 'en_progreso': estadoTexto = 'En Progreso'; estadoColor = '#0dcaf0'; break;
                case 'finalizada': estadoTexto = 'Finalizada'; estadoColor = '#198754'; break;
                default: estadoTexto = audit.estado; estadoColor = '#6c757d';
            }
            return `<td>${audit.id}</td><td>${audit.ubicacion_destino}</td><td>${audit.auditor?.nombre}</td><td>${fecha}</td><td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td><td>${productosCount}</td><td>${cumplimiento}</td><td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>`;
        };
        const tableBody = document.querySelector('#analyst-audits-table-body');
        if (!tableBody) return;
        let existingRow = tableBody.querySelector(`tr[data-audit-id='${audit.id}']`);
        if (existingRow) {
            existingRow.innerHTML = createRowHtml(audit);
        } else if (prepend) {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-audit-id', audit.id);
            newRow.innerHTML = createRowHtml(audit);
            tableBody.prepend(newRow);
        }
    }

    function updateProductRow(product) {
        const row = document.querySelector(`tr[data-product-id='${product.id}']`);
        if (row) {
            const physicalCountInput = row.querySelector('.physical-count');
            if (physicalCountInput && physicalCountInput.value != (product.cantidad_fisica || '')) {
                physicalCountInput.value = product.cantidad_fisica || '';
            }
        }
    }

    // --- UI & Dashboards ---
    function updateTitleWithUser(name, role) {
        const el = document.getElementById(`${role}-title`);
        if (el) el.textContent = `${name}`;
    }

    function hideAllDashboards() {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('d-none'));
    }

    function showDashboard(dashboardId) {
        hideAllDashboards();
        const dashboard = document.getElementById(dashboardId);
        if (dashboard) {
            dashboard.classList.remove('d-none');
            if (dashboardId === 'auditor-dashboard') {
                setTimeout(() => setupAuditorDashboard(window._auditorAuditsList || []), 100);
            }
        }
    }

    // --- Auth & Data Loading ---
    async function checkAuth() {
        const token = getToken();
        if (!token) {
            authModal.show();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('user_role', user.rol);
                localStorage.setItem('user_name', user.nombre);
                localStorage.setItem('user_id', user.id);
                const dashboardId = roleMap[user.rol];
                showDashboard(dashboardId);
                updateTitleWithUser(user.nombre, user.rol);
                loadDashboardData(user.rol, token);
                if (user.rol === 'analista' || user.rol === 'administrador') {
                    initGeneralWebSocket();
                }
            } else {
                clearSession();
            }
        } catch (error) {
            clearSession();
        }
    }

    async function loadDashboardData(role, token) {
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            if (role === 'analista') {
                const [auditsRes, usersRes] = await Promise.all([ fetch(`${API_URL}/audits/`, { headers }), fetch(`${API_URL}/users/`, { headers }) ]);
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    renderAuditsTable(audits, '#analyst-audits-table-body');
                    renderComplianceChart(audits);
                    renderNoveltiesChart(audits);
                }
                if (usersRes.ok) {
                    populateAuditorFilter(await usersRes.json());
                }
            } else if (role === 'auditor') {
                const auditorId = localStorage.getItem('user_id');
                const auditsRes = await fetch(`${API_URL}/audits/auditor/${auditorId}`, { headers });
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    window._auditorAuditsList = audits;
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    setTimeout(() => setupAuditorDashboard(audits), 200);
                }
            } else if (role === 'administrador') {
                const [auditsRes, usersRes] = await Promise.all([ fetch(`${API_URL}/audits/`, { headers }), fetch(`${API_URL}/users/`, { headers }) ]);
                if (auditsRes.ok) renderAdminAuditsTable(await auditsRes.json(), '#admin-audits-table-body');
                if (usersRes.ok) renderUsersTable(await usersRes.json(), '#admin-users-table-body');
            }
        } catch (error) {
            console.error(`Error loading ${role} dashboard data:`, error);
        }
    }

    // --- Rendering ---
    function renderAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        audits.forEach(audit => {
            const row = document.createElement('tr');
            row.setAttribute('data-audit-id', audit.id);
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            const productosCount = audit.productos_count ?? (Array.isArray(audit.productos) ? audit.productos.length : '--');
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
            let estadoTexto, estadoColor;
            switch(audit.estado) {
                case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#ffc107'; break;
                case 'en_progreso': estadoTexto = 'En Progreso'; estadoColor = '#0dcaf0'; break;
                case 'finalizada': estadoTexto = 'Finalizada'; estadoColor = '#198754'; break;
                default: estadoTexto = audit.estado; estadoColor = '#6c757d';
            }
            row.innerHTML = `<td>${audit.id}</td><td>${audit.ubicacion_destino}</td><td>${audit.auditor?.nombre}</td><td>${fecha}</td><td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td><td>${productosCount}</td><td>${cumplimiento}</td><td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>`;
            tableBody.appendChild(row);
        });
    }

    function renderAdminAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        audits.forEach(audit => {
            const row = document.createElement('tr');
            row.setAttribute('data-audit-id', audit.id);
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            const productosCount = audit.productos_count ?? (Array.isArray(audit.productos) ? audit.productos.length : '--');
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? audit.porcentaje_cumplimiento : 0;
            let estadoTexto, estadoColor;
            switch(audit.estado) {
                case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#ffc107'; break;
                case 'en_progreso': estadoTexto = 'En Progreso'; estadoColor = '#0dcaf0'; break;
                case 'finalizada': estadoTexto = 'Finalizada'; estadoColor = '#198754'; break;
                default: estadoTexto = audit.estado; estadoColor = '#6c757d';
            }
            row.innerHTML = `<td>${audit.id}</td><td>${audit.ubicacion_destino}</td><td>${audit.auditor?.nombre}</td><td>${fecha}</td><td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td><td>${productosCount}</td><td><div class="progress" style="height: 20px; background-color: #343a40;"><div class="progress-bar bg-info" role="progressbar" style="width: ${cumplimiento}%;" aria-valuenow="${cumplimiento}" aria-valuemin="0" aria-valuemax="100">${cumplimiento}%</div></div></td><td>N/A</td>`;
            tableBody.appendChild(row);
        });
    }

    function renderAuditorAuditsTable(audits, tableSelector, mostrarFinalizadas = null) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        let filtradas = audits;
        if (mostrarFinalizadas === false) filtradas = audits.filter(a => a.estado !== 'finalizada');
        else if (mostrarFinalizadas === true) filtradas = audits.filter(a => a.estado === 'finalizada');
        if (!filtradas || filtradas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No tienes auditorías para mostrar</td></tr>';
            return;
        }
        tableBody.innerHTML = '';
        filtradas.forEach(audit => {
            const row = document.createElement('tr');
            row.setAttribute('data-audit-id', audit.id);
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            let claseEstado = '', textoEstado = '';
            switch(audit.estado) {
                case 'pendiente': claseEstado = 'estado-pendiente'; textoEstado = 'Pendiente'; break;
                case 'en_progreso': claseEstado = 'estado-progreso'; textoEstado = 'En Progreso'; break;
                case 'finalizada': claseEstado = 'estado-completada'; textoEstado = 'Finalizada'; break;
                default: claseEstado = 'bg-secondary'; textoEstado = audit.estado;
            }
            row.innerHTML = `<td>${audit.id}</td><td>${audit.ubicacion_destino}</td><td>${fecha}</td><td><span class="badge ${claseEstado}">${textoEstado}</span></td><td>${audit.estado === 'pendiente' ? `<button class="btn btn-sm btn-primary iniciar-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-play-fill"></i> Iniciar</button>` : `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`}</td>`;
            tableBody.appendChild(row);
        });
        tableBody.querySelectorAll('.iniciar-auditoria-btn').forEach(btn => btn.addEventListener('click', (e) => iniciarAuditoria(e.currentTarget.getAttribute('data-audit-id'))));
        tableBody.querySelectorAll('.ver-auditoria-btn').forEach(btn => btn.addEventListener('click', (e) => verAuditoria(e.currentTarget.getAttribute('data-audit-id'))));
    }

    function renderUsersTable(users, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const roleColors = { auditor: '#00c6ff', analista: '#28a745', administrador: '#ff0077' };
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);
            const rolColor = roleColors[user.rol] || '#6c757d';
            row.innerHTML = `<td>${user.nombre}</td><td>${user.correo}</td><td><span class="badge rounded-pill" style="background-color: ${rolColor};">${user.rol}</span></td><td><button class="btn btn-sm btn-info text-white"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button></td>`;
            tableBody.appendChild(row);
        });
    }

    function renderProductsTable(products) {
        const tableBody = document.getElementById('auditor-products-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay productos en esta auditoría.</td></tr>';
            return;
        }
        products.forEach(product => {
            const row = document.createElement('tr');
            row.setAttribute('data-product-id', product.id || product.product_id);
            row.innerHTML = `<td data-sku="${product.sku}">${product.sku}</td><td><strong>${product.orden_traslado_original || 'SIN_OT'}</strong></td><td>${product.nombre_articulo ?? '--'}</td><td>${product.cantidad_documento ?? '--'}</td><td><input type="number" class="form-control form-control-sm physical-count" value="${product.cantidad_fisica || ''}"></td><td><select class="form-select form-select-sm novelty-select"><option value="sin_novedad" ${product.novedad === 'sin_novedad' ? 'selected' : ''}>Sin Novedad</option><option value="faltante" ${product.novedad === 'faltante' ? 'selected' : ''}>Faltante</option><option value="sobrante" ${product.novedad === 'sobrante' ? 'selected' : ''}>Sobrante</option><option value="averia" ${product.novedad === 'averia' ? 'selected' : ''}>Avería</option></select></td><td><textarea class="form-control form-control-sm observations-area">${product.observaciones || ''}</textarea></td><td><button class="btn btn-sm btn-success save-product-btn"><i class="bi bi-save"></i></button></td>`;
            tableBody.appendChild(row);
        });
    }

    function populateAuditorFilter(users) {
        const filterAuditor = document.getElementById('filterAuditor');
        if (!filterAuditor) return;
        filterAuditor.innerHTML = '<option value="Todos" selected>Todos</option>';
        users.filter(u => u.rol === 'auditor').forEach(auditor => {
            const option = document.createElement('option');
            option.value = auditor.id;
            option.textContent = auditor.nombre;
            filterAuditor.appendChild(option);
        });
    }

    function setupAuditorDashboard(audits) {
        const btnShow = document.getElementById('show-finished-audits-btn');
        const btnHide = document.getElementById('hide-finished-audits-btn');
        if (btnShow && !btnShow.dataset.listenerAdded) {
            btnShow.addEventListener('click', () => renderAuditorAuditsTable(audits, '#auditor-audits-table-body', true));
            btnShow.dataset.listenerAdded = '1';
        }
        if (btnHide && !btnHide.dataset.listenerAdded) {
            btnHide.addEventListener('click', () => renderAuditorAuditsTable(audits, '#auditor-audits-table-body', false));
            btnHide.dataset.listenerAdded = '1';
        }
        renderAuditorAuditsTable(audits, '#auditor-audits-table-body', false);

        const uploadForm = document.getElementById('uploadForm');
        const fileInput = document.getElementById('audit-file-input');
        if (uploadForm && !uploadForm.dataset.listenerAdded) {
            uploadForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const submitBtn = uploadForm.querySelector('button[type="submit"]');
                if (!fileInput.files || fileInput.files.length === 0) return alert("Por favor, selecciona al menos un archivo Excel para subir.");
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo...';
                const formData = new FormData();
                for (const file of fileInput.files) formData.append('files', file);
                try {
                    const token = getToken();
                    const response = await fetch(`${API_URL}/audits/upload-multiple-files`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                    if (response.ok) {
                        const result = await response.json();
                        alert(`✅ ¡Auditoría creada con éxito!\nID: ${result.audit_id}`);
                        fileInput.value = '';
                        document.getElementById('selected-files').innerHTML = '';
                        loadDashboardData('auditor', token);
                    } else {
                        alert("❌ Error al procesar los archivos: " + (await response.json()).detail);
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

    async function saveProduct(productId, auditId, updateData) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}/products/${productId}`, {
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

    function setupAutoSaveOnEnter() {
        const productsTableBody = document.getElementById('auditor-products-table-body');
        if (!productsTableBody) return;
        productsTableBody.addEventListener('keydown', async function(e) {
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
                    document.getElementById('scan-input')?.focus();
                } else {
                    alert("Error al guardar el producto.");
                    input.focus();
                }
            }
        });
    }

    // --- Charts ---
    function renderComplianceChart(audits) {
        if (complianceChartInstance) complianceChartInstance.destroy();
        const ctx = document.getElementById('complianceChart')?.getContext('2d');
        if (!ctx) return;
    }

    function renderNoveltiesChart(audits) {
        if (noveltiesChartInstance) noveltiesChartInstance.destroy();
        const ctx = document.getElementById('noveltiesChart')?.getContext('2d');
        if (!ctx) return;
    }

    // --- Event Listeners & Global Functions ---
    async function iniciarAuditoria(auditId) {
        if (!confirm("¿Estás seguro de que quieres iniciar esta auditoría?")) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}/iniciar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                alert("Auditoría iniciada con éxito.");
                loadDashboardData('auditor', token);
            } else {
                alert("Error al iniciar auditoría: " + (await response.json()).detail);
            }
        } catch (error) {
            alert("Error de red al iniciar la auditoría.");
        }
    }

    async function verAuditoria(auditId) {
        const token = getToken();
        if (!token) return alert("No autenticado.");
        try {
            const response = await fetch(`${API_URL}/audits/${auditId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                currentAudit = await response.json();
                renderProductsTable(currentAudit.productos);
                initWebSocket(auditId);
                document.getElementById('save-all-btn').classList.remove('d-none');
                document.getElementById('finish-audit-btn').classList.remove('d-none');
                document.getElementById('collaborative-audit-btn').classList.remove('d-none');
                setupAutoSaveOnEnter(); // <-- Llamada a la nueva función
                document.getElementById('scan-input')?.focus();
            } else {
                alert('Error al cargar productos: ' + (await response.json()).detail);
            }
        } catch (error) {
            alert('Error de red al cargar productos.');
        }
    }

    authForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('correo_electronico').value;
        const password = document.getElementById('contrasena').value;
        const action = event.submitter.id;
        let url, body, headers = { 'Content-Type': 'application/json' };
        if (action === 'login-btn') {
            url = `${API_URL}/auth/login`;
            body = new URLSearchParams({ username: email, password });
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            url = `${API_URL}/auth/register`;
            const name = document.getElementById('nombre').value;
            const role = document.getElementById('rol').value;
            body = JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role });
        }
        try {
            const response = await fetch(url, { method: 'POST', headers, body });
            const result = await response.json();
            if (response.ok) {
                if (result.access_token) setToken(result.access_token);
                authModal.hide();
                checkAuth();
            } else {
                alert('Error: ' + result.detail);
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    });

    document.querySelector('[data-target="logout"]').addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
    });

    document.getElementById('download-report-btn')?.addEventListener('click', function() {
        const params = new URLSearchParams();
        const status = document.getElementById('filterStatus').value;
        const auditorId = document.getElementById('filterAuditor').value;
        const date = document.getElementById('filterDate').value;
        if (status && status !== 'Todos') params.append('status', status);
        if (auditorId && auditorId !== 'Todos') params.append('auditor_id', auditorId);
        if (date) params.append('date', date);
        window.location.href = `${API_URL}/audits/report?${params.toString()}`;
    });

    document.getElementById('confirm-add-user')?.addEventListener('click', async () => {
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const password = document.getElementById('new-user-password').value;
        const role = document.getElementById('new-user-role').value;
        if (!name || !email || !password || !role) return alert('Por favor, completa todos los campos.');
        try {
            const response = await fetch(`${API_URL}/users/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role }) });
            if (response.ok) {
                alert('Usuario creado exitosamente.');
                bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                loadDashboardData('administrador', getToken());
            } else {
                alert('Error al crear usuario: ' + (await response.json()).detail);
            }
        } catch (error) {
            alert('Error de red al crear usuario.');
        }
    });
});

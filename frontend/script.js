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

    // --- Lógica de Temas ---
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('selected_theme', theme);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('selected_theme') || 'dark-default';
        applyTheme(savedTheme);
        const themeMenu = document.getElementById('theme-menu');
        if (themeMenu) {
            themeMenu.addEventListener('click', function(e) {
                if (e.target.matches('[data-theme]')) {
                    applyTheme(e.target.getAttribute('data-theme'));
                }
            });
        }
    }

    let currentAudit = null;

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
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_audit') {
                    addOrUpdateAuditRow(message.data, true); // Prepend
                } else if (message.type === 'audit_updated') {
                    addOrUpdateAuditRow(message.data, false); // Update
                }
            } catch (e) {
                console.error("Error parsing WebSocket message:", e, "Original data:", event.data);
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

            return `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${audit.auditor?.nombre ?? 'N/A'}</td>
                <td>${fecha}</td>
                <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td>
                <td>${productosCount}</td>
                <td>${cumplimiento}</td>
                <td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>
            `;
        };

        ['#analyst-audits-table-body', '#admin-audits-table-body'].forEach(selector => {
            const tableBody = document.querySelector(selector);
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
        });

        // Refresh auditor's specific view if they are the current user
        if (localStorage.getItem('user_role') === 'auditor') {
            loadDashboardData('auditor', getToken());
        }
    }

    function updateProductRow(product) {
        const row = document.querySelector(`tr[data-product-id='${product.id}']`);
        if (row) {
            const physicalCountInput = row.querySelector('.physical-count');
            if (physicalCountInput && physicalCountInput.value != (product.cantidad_fisica || '')) {
                physicalCountInput.value = product.cantidad_fisica || '';
            }
            // ... more updates if needed
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
                const [auditsRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/audits/`, { headers }),
                    fetch(`${API_URL}/users/`, { headers })
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
                const auditsRes = await fetch(`${API_URL}/audits/auditor/${auditorId}`, { headers });
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    window._auditorAuditsList = audits;
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    setTimeout(() => setupAuditorDashboard(audits), 200);
                }
            } else if (role === 'administrador') {
                const [auditsRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/audits/`, { headers }),
                    fetch(`${API_URL}/users/`, { headers })
                ]);
                if (auditsRes.ok) renderAuditsTable(await auditsRes.json(), '#admin-audits-table-body');
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
            row.setAttribute('data-audit-id', audit.id); // Important for real-time updates
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

            row.innerHTML = `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${audit.auditor?.nombre ?? 'N/A'}</td>
                <td>${fecha}</td>
                <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto}</span></td>
                <td>${productosCount}</td>
                <td>${cumplimiento}</td>
                <td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderAuditorAuditsTable(audits, tableSelector, mostrarFinalizadas = null) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        let filtradas = audits;
        if (mostrarFinalizadas === false) filtradas = audits.filter(a => a.estado !== 'finalizada');
        else if (mostrarFinalizadas === true) filtradas = audits.filter(a => a.estado === 'finalizada');
        
        tableBody.innerHTML = filtradas.length === 0 ? '<tr><td colspan="5" class="text-center">No hay auditorías para mostrar</td></tr>' : '';
        
        filtradas.forEach(audit => {
            const row = document.createElement('tr');
            row.setAttribute('data-audit-id', audit.id);
            // ... (render logic for auditor-specific table)
            tableBody.appendChild(row);
        });
    }

    function renderUsersTable(users, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);
            // ... (render logic for user table)
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

    // --- Charts ---
    function renderComplianceChart(audits) {
        if (complianceChartInstance) complianceChartInstance.destroy();
        const ctx = document.getElementById('complianceChart')?.getContext('2d');
        if (!ctx) return;
        // ... (chart rendering logic)
    }

    function renderNoveltiesChart(audits) {
        if (noveltiesChartInstance) noveltiesChartInstance.destroy();
        const ctx = document.getElementById('noveltiesChart')?.getContext('2d');
        if (!ctx) return;
        // ... (chart rendering logic)
    }

    // --- Event Listeners ---
    authForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('correo_electronico').value;
        const password = document.getElementById('contrasena').value;
        const action = event.submitter.id;
        let url, body;

        if (action === 'login-btn') {
            url = `${API_URL}/auth/login`;
            const formBody = new URLSearchParams({ username: email, password });
            body = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formBody };
        } else {
            url = `${API_URL}/auth/register`;
            const name = document.getElementById('nombre').value;
            const role = document.getElementById('rol').value;
            body = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role }) };
        }

        try {
            const response = await fetch(url, body);
            const result = await response.json();
            if (response.ok) {
                if (result.access_token) {
                    setToken(result.access_token);
                }
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

    const downloadReportBtn = document.getElementById('download-report-btn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', function() {
            const status = document.getElementById('filterStatus').value;
            const auditorId = document.getElementById('filterAuditor').value;
            const date = document.getElementById('filterDate').value;
            const params = new URLSearchParams();
            if (status && status !== 'Todos') params.append('status', status);
            if (auditorId && auditorId !== 'Todos') params.append('auditor_id', auditorId);
            if (date) params.append('date', date);
            window.location.href = `${API_URL}/audits/report?${params.toString()}`;
        });
    }

    const confirmAddUserBtn = document.getElementById('confirm-add-user');
    if (confirmAddUserBtn) {
        confirmAddUserBtn.addEventListener('click', async () => {
            const name = document.getElementById('new-user-name').value;
            const email = document.getElementById('new-user-email').value;
            const password = document.getElementById('new-user-password').value;
            const role = document.getElementById('new-user-role').value;
            if (!name || !email || !password || !role) {
                alert('Por favor, completa todos los campos.');
                return;
            }
            try {
                const response = await fetch(`${API_URL}/users/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role })
                });
                if (response.ok) {
                    alert('Usuario creado exitosamente.');
                    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                    loadDashboardData('administrador', getToken());
                } else {
                    const error = await response.json();
                    alert('Error al crear usuario: ' + error.detail);
                }
            } catch (error) {
                alert('Error de red al crear usuario.');
            }
        });
    }
    
    function setupAuditorDashboard(audits) {
        // Placeholder for complex auditor-specific setup logic
    }
});

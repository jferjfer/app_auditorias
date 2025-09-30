
document.addEventListener('DOMContentLoaded', function() {
    // --- Variables Globales y de Entorno ---
    const DEPLOYMENT_URL = 'https://app-auditorias.onrender.com'; 
    const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_URL = IS_LOCAL ? 'http://127.0.0.1:8000' : DEPLOYMENT_URL;
    
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const authForm = document.getElementById('auth-form');
    const roleMap = {
        analista: 'analyst-dashboard',
        auditor: 'auditor-dashboard',
        administrador: 'admin-dashboard'
    };

    let websocket = null;
    let currentAudit = null;
    let lastFocusedQuantityInput = null; // Para el flujo de escaneo rápido
    let chartInstances = {};

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
        }, 8000);
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

    // --- Lógica de Autenticación y Carga de Datos ---
    async function checkAuth() {
        const token = getToken();
        console.log('checkAuth - Token presente:', !!token);
        if (!token) {
            console.log('checkAuth - No hay token, mostrando modal');
            authModal.show();
            return;
        }
        try {
            console.log('checkAuth - Enviando request a /users/me/');
            const response = await fetch(`${API_URL}/users/me/`, { headers: { 'Authorization': `Bearer ${token}` } });
            console.log('checkAuth - Response status:', response.status);
            if (response.ok) {
                const user = await response.json();
                console.log('checkAuth - Usuario obtenido:', user);
                console.log('checkAuth - Mostrando dashboard para rol:', user.rol);
                localStorage.setItem('user_role', user.rol);
                localStorage.setItem('user_name', user.nombre);
                localStorage.setItem('user_id', user.id);

                const dashboardId = roleMap[user.rol];
                showDashboard(dashboardId);
                document.getElementById(`${user.rol}-title`).textContent = user.nombre;

                loadDashboardData(user.rol, token);

                if (user.rol === 'analista' || user.rol === 'administrador') {
                    initGeneralWebSocket();
                }
                setupUserSession(user, token);
            } else {
                console.log('checkAuth - Response no ok, text:', await response.text());
                clearSession();
            }
        } catch (error) {
            console.log('checkAuth - Error:', error);
            console.log('checkAuth - Error message:', error.message);
            alert('Error en checkAuth: ' + error.message);
            clearSession();
        }
    }

    function setupUserSession(user, token) {
        // Guardar datos del usuario en localStorage
        localStorage.setItem('user_role', user.rol);
        localStorage.setItem('user_name', user.nombre);
        localStorage.setItem('user_id', user.id);

        // Configurar la UI
        const dashboardId = roleMap[user.rol];
        showDashboard(dashboardId);
        const titleElement = document.getElementById(`${user.rol}-title`);
        if (titleElement) titleElement.textContent = user.nombre;

        // Cargar datos y conectar websockets
        loadDashboardData(user.rol, token);
        if (user.rol === 'analista' || user.rol === 'administrador') initGeneralWebSocket();
    }

    async function loadDashboardData(role, token) {
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            if (role === 'analista') {
                const [auditsRes, usersRes] = await Promise.all([fetch(`${API_URL}/audits/`, { headers }), fetch(`${API_URL}/users/`, { headers })]);
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    renderAuditsTable(audits, '#analyst-audits-table-body');
                    renderComplianceChart(audits);
                    renderNoveltiesChart(audits);
                }
                if (usersRes.ok) populateAuditorFilter(await usersRes.json());
            } else if (role === 'auditor') {
                const auditorId = localStorage.getItem('user_id');
                const auditsRes = await fetch(`${API_URL}/audits/auditor/${auditorId}`, { headers });
                if (auditsRes.ok) {
                    const audits = await auditsRes.json();
                    window._auditorAuditsList = audits;
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    setupAuditorDashboard(audits);
                }
            } else if (role === 'administrador') {
                const [auditsRes, usersRes] = await Promise.all([fetch(`${API_URL}/audits/`, { headers }), fetch(`${API_URL}/users/`, { headers })]);
                if (auditsRes.ok) renderAdminAuditsTable(await auditsRes.json(), '#admin-audits-table-body');
                if (usersRes.ok) renderUsersTable(await usersRes.json(), '#admin-users-table-body');
            }
        } catch (error) {
            console.error(`Error al cargar datos para ${role}:`, error);
        }
    }

    // --- Lógica de Renderizado de Tablas ---
    function renderAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = audits.map(audit => {
            const fecha = new Date(audit.creada_en).toLocaleDateString();
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
            let estadoTexto, estadoColor;
            switch(audit.estado) {
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
                <td>${audit.productos_count ?? audit.productos.length}</td>
                <td>${cumplimiento}</td>
                <td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>
            </tr>`;
        }).join('');
    }

    function renderAdminAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = audits.map(audit => {
            const fecha = new Date(audit.creada_en).toLocaleDateString();
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? audit.porcentaje_cumplimiento : 0;
            let estadoTexto, estadoColor;
            switch(audit.estado) {
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
                <td>${audit.productos_count ?? audit.productos.length}</td>
                <td><div class="progress" style="height: 20px; background-color: #343a40;"><div class="progress-bar bg-info" role="progressbar" style="width: ${cumplimiento}%;" aria-valuenow="${cumplimiento}">${cumplimiento}%</div></div></td>
                <td>N/A</td>
            </tr>`;
        }).join('');
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
        tableBody.innerHTML = filtradas.map(audit => {
            const fecha = new Date(audit.creada_en).toLocaleDateString();
            let claseEstado = '', textoEstado = '';
            switch(audit.estado) {
                case 'pendiente': claseEstado = 'estado-pendiente'; textoEstado = 'Pendiente'; break;
                case 'en_progreso': claseEstado = 'estado-progreso'; textoEstado = 'En Progreso'; break;
                case 'finalizada': claseEstado = 'estado-completada'; textoEstado = 'Finalizada'; break;
                default: claseEstado = 'bg-secondary'; textoEstado = audit.estado;
            }
            return `<tr data-audit-id="${audit.id}">
                <td>${audit.id}</td>
                <td>${audit.ubicacion_destino}</td>
                <td>${fecha}</td>
                <td><span class="badge ${claseEstado}">${textoEstado}</span></td>
                <td>${audit.estado === 'pendiente' ? `<button class="btn btn-sm btn-primary iniciar-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-play-fill"></i> Iniciar</button>` : `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</button>`}</td>
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
            <tr data-product-id="${product.id || product.product_id}">
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
                <td><button class="btn btn-sm btn-info text-white"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button></td>
            </tr>`;
        }).join('');
    }

    // --- Lógica del Dashboard del Auditor ---
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
                    const response = await fetch(`${API_URL}/audits/upload-multiple-files`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
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
        if (!confirm("¿Iniciar esta auditoría?")) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}/iniciar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                alert("Auditoría iniciada.");
                loadDashboardData('auditor', token);
            } else {
                alert(`Error: ${(await response.json()).detail}`);
            }
        } catch (error) {
            alert("Error de red.");
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
                ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => document.getElementById(id).classList.remove('d-none'));
                
                setupScanInput();
                setupAutoSaveOnEnter();
                updateCompliancePercentage(auditId);

                document.getElementById('scan-input')?.focus();
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
            newScanInput.value = '';
            if (!scannedSku) return;

            if (lastFocusedQuantityInput && lastFocusedQuantityInput.value.trim() === '') {
                const prevRow = lastFocusedQuantityInput.closest('tr');
                const docQuantityCell = prevRow.querySelector('.doc-quantity');
                const docQuantity = parseInt(docQuantityCell.textContent) || 0;
                lastFocusedQuantityInput.value = docQuantity;
                const productId = prevRow.getAttribute('data-product-id');
                const updateData = { cantidad_fisica: docQuantity, novedad: 'sin_novedad', observaciones: '' };
                const saved = await saveProduct(productId, currentAudit.id, updateData);
                if(saved) {
                    lastFocusedQuantityInput.classList.add('saved-success');
                    setTimeout(() => lastFocusedQuantityInput.classList.remove('saved-success'), 1000);
                    await updateCompliancePercentage(currentAudit.id);
                }
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
            } else {
                speak("SKU no encontrado");
                lastFocusedQuantityInput = null;
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
    
    async function updateCompliancePercentage(auditId) {
        const complianceDiv = document.getElementById('compliance-percentage');
        if (!complianceDiv) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}`, { headers: { 'Authorization': `Bearer ${token}` } });
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

    // --- Listeners Globales ---
    function setupGlobalListeners() {
        authForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('correo_electronico').value;
            const password = document.getElementById('contrasena').value;
            const action = event.submitter.id;
            console.log('authForm submit - action:', action, 'email:', email);
            let url, body, headers = { 'Content-Type': 'application/json' };
            if (action === 'login-btn') {
                url = `${API_URL}/auth/login`;
                body = new URLSearchParams({ username: email, password });
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                url = `${API_URL}/auth/register`;
                body = JSON.stringify({ nombre: document.getElementById('nombre').value, correo: email, contrasena: password, rol: document.getElementById('rol').value });
            }
            try {
                console.log('authForm - Enviando request a:', url);
                const response = await fetch(url, { method: 'POST', headers, body });
                console.log('authForm - Response status:', response.status);
                const result = await response.json();
                console.log('authForm - Result:', result);
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
                    console.log('authForm - Error:', result.detail);
                    alert(`Error: ${result.detail}`);
                }
            } catch (error) {
                console.error('authForm - Error de conexión:', error);
                alert('Error de conexión.');
            }
        });

        document.querySelector('[data-target="logout"]').addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
        });

        document.getElementById('download-report-btn')?.addEventListener('click', () => {
            const params = new URLSearchParams({
                status: document.getElementById('filterStatus').value,
                auditor_id: document.getElementById('filterAuditor').value,
                date: document.getElementById('filterDate').value
            });
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
                    alert(`Error: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red.');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://127.0.0.1:8000';
    const authForm = document.getElementById('auth-form');
    const authModalEl = document.getElementById('authModal');
    const authModal = new bootstrap.Modal(authModalEl);
    
    const roleMap = {
        analista: 'analyst-dashboard',
        auditor: 'auditor-dashboard',
        administrador: 'admin-dashboard'
    };
    
    // Gráficos
    let complianceChartInstance = null;
    let noveltiesChartInstance = null;


    // Estado de la auditoría actual para el auditor
    let currentAudit = null;

    // --- Helpers de sesión ---
    const setToken = (t) => localStorage.setItem('access_token', t);
    const getToken = () => localStorage.getItem('access_token');
    const clearSession = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        window.location.reload();
    };

    // --- UI: Títulos y secciones ---
    function updateTitleWithUser(name, role) {
        if (!name) return;
        const elId = `${role}-title`;
        const el = document.getElementById(elId);
        if (el) el.textContent = `${name}`;
    }

    function hideAllDashboards() {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('d-none');
        });
    }

    function showDashboard(dashboardId) {
        hideAllDashboards();
        const dashboard = document.getElementById(dashboardId);
        if (dashboard) {
            dashboard.classList.remove('d-none');
        }
    }

    // --- Funcionalidad Principal ---
    async function checkAuth() {
        const token = getToken();
        if (!token) {
            authModal.show();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/users/me/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('user_role', user.rol);
                localStorage.setItem('user_name', user.nombre);
                showDashboard(roleMap[user.rol]);
                updateTitleWithUser(user.nombre, user.rol);
                loadDashboardData(user.rol, token);
            } else {
                clearSession();
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            clearSession();
        }
    }

    async function loadDashboardData(role, token) {
        if (role === 'analista') {
            try {
                const auditsResponse = await fetch(`${API_URL}/audits/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (auditsResponse.ok) {
                    const audits = await auditsResponse.json();
                    renderAuditsTable(audits, '#analyst-audits-table-body');
                    renderComplianceChart(audits);
                    renderNoveltiesChart(audits);
                } else {
                    console.error('No se pudieron cargar las auditorías del analista.');
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard del analista:', error);
            }
        } else if (role === 'auditor') {
            try {
                const auditsResponse = await fetch(`${API_URL}/audits/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (auditsResponse.ok) {
                    const audits = await auditsResponse.json();
                    const userAudits = audits.filter(a => a.auditor_nombre === localStorage.getItem('user_name') || a.auditor_id === localStorage.getItem('user_id'));
                    renderAuditorAuditsTable(userAudits, '#auditor-audits-table-body');
                } else {
                    console.error('No se pudieron cargar las auditorías del auditor.');
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard del auditor:', error);
            }
        } else if (role === 'administrador') {
            try {
                const [auditsResponse, usersResponse] = await Promise.all([
                    fetch(`${API_URL}/audits/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/users/`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (auditsResponse.ok) {
                    const audits = await auditsResponse.json();
                    renderAuditsTable(audits, '#admin-audits-table-body');
                } else {
                    console.error('No se pudieron cargar las auditorías del administrador.');
                }

                if (usersResponse.ok) {
                    const users = await usersResponse.json();
                    renderUsersTable(users, '#admin-users-table-body');
                } else {
                    console.error('No se pudieron cargar los usuarios del administrador.');
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard del administrador:', error);
            }
        }
    }

    function renderAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        audits.forEach(audit => {
            const row = document.createElement('tr');
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            const productosCount = Array.isArray(audit.productos) ? audit.productos.length : (audit.productos_count ?? '--');
            const cumplimiento = audit.porcentaje_cumplimiento !== null ? `${audit.porcentaje_cumplimiento}%` : '--';
            const estadoColor = audit.estado === 'Finalizada' ? '#28a745' : '#ffc107';

            row.innerHTML = `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${audit.auditor_nombre ?? audit.auditor_id ?? '--'}</td>
                <td>${fecha}</td>
                <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${audit.estado ?? '--'}</span></td>
                <td>${productosCount}</td>
                <td>${cumplimiento}</td>
                <td><a href="#" class="btn btn-sm btn-outline-info view-audit-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver</a></td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderAuditorAuditsTable(audits, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        audits.forEach(audit => {
            const row = document.createElement('tr');
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            const estadoColor = audit.estado === 'Finalizada' ? '#28a745' : '#ffc107';

            row.innerHTML = `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${fecha}</td>
                <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${audit.estado ?? '--'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info view-products-btn" data-audit-id="${audit.id}"><i class="bi bi-eye"></i> Ver Productos</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderUsersTable(users, tableSelector) {
        const tableBody = document.querySelector(tableSelector);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const roleColors = {
            auditor: '#00c6ff',
            analista: '#28a745',
            administrador: '#ff0077'
        };
        users.forEach(user => {
            const row = document.createElement('tr');
            const rolColor = roleColors[user.rol] || '#6c757d';
            row.innerHTML = `
                <td>${user.nombre}</td>
                <td>${user.correo}</td>
                <td><span class="badge rounded-pill" style="background-color: ${rolColor};">${user.rol}</span></td>
                <td>
                    <button class="btn btn-sm btn-info text-white"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // --- Lógica para Gráficos del Analista ---
    function renderComplianceChart(audits) {
        if (complianceChartInstance) complianceChartInstance.destroy();
        const ctx = document.getElementById('complianceChart').getContext('2d');
        const completedAudits = audits.filter(a => a.estado === 'Finalizada' && a.porcentaje_cumplimiento !== null);
        const labels = completedAudits.map(a => `Auditoría ${a.id}`);
        const data = completedAudits.map(a => a.porcentaje_cumplimiento);
        
        complianceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '% de Cumplimiento',
                    data: data,
                    backgroundColor: 'rgba(0, 198, 255, 0.6)',
                    borderColor: 'rgba(0, 198, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }

    function renderNoveltiesChart(audits) {
        if (noveltiesChartInstance) noveltiesChartInstance.destroy();
        const ctx = document.getElementById('noveltiesChart').getContext('2d');
        const noveltiesCount = {
            'Sin Novedad': 0,
            'Faltante': 0,
            'Sobrante': 0,
            'Avería': 0
        };
        audits.forEach(audit => {
            if (audit.productos && Array.isArray(audit.productos)) {
                audit.productos.forEach(p => {
                    const novelty = p.novedad || 'Sin Novedad';
                    if (noveltiesCount.hasOwnProperty(novelty)) {
                        noveltiesCount[novelty]++;
                    }
                });
            }
        });

        noveltiesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(noveltiesCount),
                datasets: [{
                    label: 'Novedades',
                    data: Object.values(noveltiesCount),
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.6)', // Sin Novedad
                        'rgba(220, 53, 69, 0.6)', // Faltante
                        'rgba(255, 193, 7, 0.6)', // Sobrante
                        'rgba(108, 117, 125, 0.6)' // Avería
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
    
    // --- Lógica para el modal de autenticación ---
    authForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('correo_electronico').value;
    const password = document.getElementById('contrasena').value;
    const formAction = event.submitter.id;

    try {
        let response;
        if (formAction === 'login-btn') {
            const formBody = new URLSearchParams();
            formBody.append('username', email); // FastAPI espera 'username'
            formBody.append('password', password);
            
            response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody
            });
        } else if (formAction === 'register-btn') {
            const name = document.getElementById('nombre').value;
            const role = document.getElementById('rol').value;
            response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role })
            });
        } else {
            return;
        }

        if (response.ok) {
            const result = await response.json();
            
            if (result.access_token && result.user) {
                // Almacenar el token y los datos del usuario
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('user_role', result.user.rol);
                localStorage.setItem('user_name', result.user.nombre);
            }
            
            authModal.hide();
            // Llama a la función para verificar el estado de autenticación y cargar el dashboard
            checkAuth();
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con la API.');
    }
});
          

    // --- Lógica para cerrar sesión y navegación del sidebar ---
    document.querySelector('[data-target="logout"]').addEventListener('click', function (e) {
        e.preventDefault();
        clearSession();
    });

    document.querySelectorAll('.dashboard-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            showDashboard(targetId);
            const role = localStorage.getItem('user_role');
            if (role) {
                loadDashboardData(role, getToken());
            }
        });
    });

    // --- Lógica para el Dashboard del Auditor ---
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        // Listener para el formulario de carga de archivos
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Obtener el input de archivo.
            const fileInput = document.getElementById('audit-file-input');
            
            // ✅ VERIFICACIÓN CLAVE: Asegurarse de que el elemento existe y que el usuario seleccionó un archivo
            if (!fileInput || fileInput.files.length === 0) {
                alert("Por favor, selecciona un archivo para subir.");
                console.error("Error: Elemento con id 'audit-file-input' es null o no tiene archivos seleccionados.");
                return;
            }
            
            const file = fileInput.files[0];

            try {
                const token = getToken();
                const formData = new FormData();
                formData.append('file', file);
            
                const response = await fetch(`${API_URL}/audits/upload-file`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
            
                if (response.ok) {
                    const audit = await response.json();
                    alert(`Auditoría creada con éxito. ID: ${audit.id}`);
                    loadDashboardData(localStorage.getItem('user_role'), token);
                } else {
                    const error = await response.json();
                    alert("Error al procesar el archivo: " + error.detail);
                }
            } catch (error) {
                console.error('Error al subir el archivo:', error);
                alert("Error de red o del servidor al intentar subir el archivo.");
            }
        });
    }
    }

    const auditorProductsTableBody = document.getElementById('auditor-products-table-body');

    async function fetchProductsByAuditId(auditId) {
        const token = getToken();
        if (!token) {
            alert("No autenticado. Por favor, inicia sesión.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/audits/${auditId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentAudit = await response.json();
                renderProductsTable(currentAudit.productos);
                updateAuditorCompliance(currentAudit.porcentaje_cumplimiento);
            } else {
                const error = await response.json();
                alert('Error al cargar productos: ' + error.detail);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al cargar productos.');
        }
    }

    function renderProductsTable(products) {
        auditorProductsTableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-sku="${product.sku}">${product.sku}</td>
                <td>${product.orden_traslado_original ?? '--'}</td>
                <td>${product.nombre_articulo ?? '--'}</td>
                <td>${product.cantidad_documento ?? '--'}</td>
                <td><input type="number" class="form-control form-control-sm physical-count" data-product-id="${product.id}" value="${product.cantidad_fisica || ''}"></td>
                <td><select class="form-select form-select-sm novelty-select" data-product-id="${product.id}">
                    <option value="sin_novedad" ${product.novedad === 'sin_novedad' ? 'selected' : ''}>Sin Novedad</option>
                    <option value="faltante" ${product.novedad === 'faltante' ? 'selected' : ''}>Faltante</option>
                    <option value="sobrante" ${product.novedad === 'sobrante' ? 'selected' : ''}>Sobrante</option>
                    <option value="averia" ${product.novedad === 'averia' ? 'selected' : ''}>Avería</option>
                </select></td>
                <td><textarea class="form-control form-control-sm observations-area" data-product-id="${product.id}">${product.observaciones || ''}</textarea></td>
                <td>
                    <button class="btn btn-sm btn-success save-product-btn" data-product-id="${product.id}"><i class="bi bi-save"></i></button>
                </td>
            `;
            auditorProductsTableBody.appendChild(row);
        });
    }

    function updateAuditorCompliance(percentage) {
        const complianceDiv = document.getElementById('compliance-percentage');
        if (complianceDiv) {
            complianceDiv.textContent = percentage !== null ? `${percentage}%` : 'N/A';
            const gradient = percentage !== null ? `conic-gradient(#00c6ff ${percentage}%, transparent ${percentage}%)` : `conic-gradient(#6c757d 100%, transparent 100%)`;
            complianceDiv.style.background = gradient;
        }
    }

    // Listener para los botones "Ver Productos" del dashboard del auditor
    document.addEventListener('click', (e) => {
        if (e.target.closest('.view-products-btn')) {
            e.preventDefault();
            const auditId = e.target.closest('.view-products-btn').getAttribute('data-audit-id');
            fetchProductsByAuditId(auditId);
        }
    });

    // Listener para el input de escaneo
    const scanInput = document.getElementById('scan-input');
    if (scanInput) {
        scanInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const scannedSku = scanInput.value.trim();
                if (scannedSku) {
                    const row = document.querySelector(`#auditor-products-table-body td[data-sku="${scannedSku}"]`);
                    if (row) {
                        const targetRow = row.closest('tr');
                        const physicalCountInput = targetRow.querySelector('.physical-count');
                        if (physicalCountInput) {
                            physicalCountInput.focus();
                            physicalCountInput.select();
                        }
                    } else {
                        alert(`SKU ${scannedSku} no encontrado en la auditoría.`);
                    }
                }
                scanInput.value = '';
            }
        });
    }

    // Listener para los botones "Guardar" de cada producto
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.save-product-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.save-product-btn');
            const productId = btn.getAttribute('data-product-id');
            const row = btn.closest('tr');

            const physicalCount = row.querySelector('.physical-count').value;
            const novelty = row.querySelector('.novelty-select').value;
            const observations = row.querySelector('.observations-area').value;

            const updateData = {
                cantidad_fisica: physicalCount,
                novedad: novelty,
                observaciones: observations
            };
            
            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/audits/${currentAudit.id}/products/${productId}`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    alert("Producto actualizado exitosamente.");
                    fetchProductsByAuditId(currentAudit.id);
                } else {
                    const error = await response.json();
                    alert("Error al actualizar producto: " + error.detail);
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert("Error de red al actualizar el producto.");
            }
        }
    });

    // Listener para el botón "Finalizar Auditoría"
    const finishAuditBtn = document.getElementById('finish-audit-btn');
    if (finishAuditBtn) {
        finishAuditBtn.addEventListener('click', async () => {
            if (!currentAudit) {
                alert("Por favor, selecciona una auditoría primero.");
                return;
            }

            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/audits/${currentAudit.id}/finish`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    alert("Auditoría finalizada con éxito.");
                    auditorProductsTableBody.innerHTML = '';
                    currentAudit = null;
                    updateAuditorCompliance(null);
                    loadDashboardData(localStorage.getItem('user_role'), token);
                } else {
                    const error = await response.json();
                    alert("Error al finalizar la auditoría: " + error.detail);
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert("Error de red al finalizar la auditoría.");
            }
        });
    }
    
    // Iniciar la verificación de autenticación
    checkAuth();
});
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
        localStorage.removeItem('user_id');
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
            
            // Configurar event listeners específicos del dashboard
            if (dashboardId === 'auditor-dashboard') {
                setTimeout(setupAuditorDashboard, 100);
            }
        }
    }

    // --- Mostrar archivos seleccionados ---
    function updateSelectedFilesDisplay() {
        const fileInput = document.getElementById('audit-file-input');
        const selectedFilesDiv = document.getElementById('selected-files');
        
        if (!fileInput || !selectedFilesDiv) return;
        
        selectedFilesDiv.innerHTML = '';
        
        if (fileInput.files.length > 0) {
            const fileList = document.createElement('div');
            fileList.className = 'selected-files-list';
            fileList.innerHTML = '<h6>Archivos seleccionados:</h6>';
            
            const fileListUl = document.createElement('ul');
            fileListUl.className = 'list-group list-group-flush';
            
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item bg-dark text-white';
                listItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span>${file.name}</span>
                        <small class="text-muted">${(file.size / 1024).toFixed(2)} KB</small>
                    </div>
                `;
                fileListUl.appendChild(listItem);
            }
            
            fileList.appendChild(fileListUl);
            selectedFilesDiv.appendChild(fileList);
        }
    }

    // --- Configurar el input de escaneo ---
    function setupScanInput() {
        const scanInput = document.getElementById('scan-input');
        if (!scanInput) {
            console.error("No se encontró el input de escaneo");
            return;
        }
        
        console.log("Configurando input de escaneo...");
        
        scanInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const scannedSku = scanInput.value.trim();
                
                if (scannedSku) {
                    // Buscar el producto en la tabla por el atributo data-sku
                    const skuCell = document.querySelector(`#auditor-products-table-body td[data-sku="${scannedSku}"]`);
                    
                    if (skuCell) {
                        const targetRow = skuCell.closest('tr');
                        const physicalCountInput = targetRow.querySelector('.physical-count');
                        
                        if (physicalCountInput) {
                            // Poner focus en cantidad física
                            physicalCountInput.focus();
                            physicalCountInput.select();
                            
                            // Limpiar el campo de escaneo
                            scanInput.value = '';
                        }
                    } else {
                        alert(`SKU ${scannedSku} no encontrado en la auditoría.`);
                        scanInput.value = '';
                        scanInput.focus();
                    }
                }
            }
        });
    }

    // --- Configurar botones del auditor ---
    function setupAuditorButtons() {
        const saveAllBtn = document.getElementById('save-all-btn');
        const finishAuditBtn = document.getElementById('finish-audit-btn');
        
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', async () => {
                if (!currentAudit) {
                    alert("Por favor, selecciona una auditoría primero.");
                    return;
                }
                
                const saved = await saveAllProducts(currentAudit.id);
                if (saved) {
                    alert("Todos los productos han sido guardados exitosamente.");
                } else {
                    alert("Hubo errores al guardar algunos productos. Por favor, revísalos manualmente.");
                }
            });
        }
        
        if (finishAuditBtn) {
            finishAuditBtn.addEventListener('click', async () => {
                if (!currentAudit) {
                    alert("Por favor, selecciona una auditoría primero.");
                    return;
                }

                try {
                    const token = getToken();
                    
                    // Primero guardar todos los cambios
                    const saved = await saveAllProducts(currentAudit.id);
                    if (!saved) {
                        alert("Hubo errores al guardar algunos productos. Revise los datos.");
                        return;
                    }
                    
                    // Luego finalizar la auditoría
                    const response = await fetch(`${API_URL}/audits/${currentAudit.id}/finish`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        alert("Auditoría finalizada con éxito.");
                        
                        // Limpiar la interfaz
                        const auditorProductsTableBody = document.getElementById('auditor-products-table-body');
                        if (auditorProductsTableBody) {
                            auditorProductsTableBody.innerHTML = '';
                        }
                        currentAudit = null;
                        updateAuditorCompliance(null);
                        
                        // Ocultar botones de guardar y finalizar
                        document.getElementById('save-all-btn').classList.add('d-none');
                        document.getElementById('finish-audit-btn').classList.add('d-none');
                        
                        // Recargar la lista de auditorías
                        loadDashboardData('auditor', token);
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
    }

    // --- Lógica para el Dashboard del Auditor ---
    function setupAuditorDashboard() {
        console.log("Configurando dashboard del auditor...");
        
        const uploadForm = document.getElementById('uploadForm');
        const fileInput = document.getElementById('audit-file-input');
        const selectedFilesDiv = document.getElementById('selected-files');
        
        console.log("Elementos encontrados - Formulario:", !!uploadForm, "Input:", !!fileInput);
        
        // Configurar display de archivos seleccionados
        if (fileInput) {
            fileInput.addEventListener('change', updateSelectedFilesDisplay);
        }
        
        if (uploadForm && fileInput) {
            // Remover event listeners anteriores para evitar duplicados
            uploadForm.replaceWith(uploadForm.cloneNode(true));
            fileInput.replaceWith(fileInput.cloneNode(true));
            
            // Volver a obtener los elementos después del reemplazo
            const refreshedUploadForm = document.getElementById('uploadForm');
            const refreshedFileInput = document.getElementById('audit-file-input');
            
            // Re-configurar el event listener para el cambio de archivos
            refreshedFileInput.addEventListener('change', updateSelectedFilesDisplay);
            
            refreshedUploadForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                // Verificación robusta
                if (!refreshedFileInput || !refreshedFileInput.files || refreshedFileInput.files.length === 0) {
                    alert("Por favor, selecciona al menos un archivo Excel para subir.");
                    return;
                }
                
                const files = Array.from(refreshedFileInput.files);
                console.log("Archivos seleccionados para upload:", files.map(f => f.name));

                try {
                    const token = getToken();
                    if (!token) {
                        alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
                        return;
                    }

                    
                    const formData = new FormData();

// Agregar todos los archivos al FormData - ✅ CORRECTO
files.forEach((file) => {
    formData.append('files', file); // 'files' en plural
});

const response = await fetch(`${API_URL}/audits/upload-multiple-files`, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`
        // NO incluir 'Content-Type' - FormData lo establece automáticamente
    },
    body: formData,
});
                    // Mostrar indicador de carga
                    const submitBtn = refreshedUploadForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...';
                    submitBtn.disabled = true;
                    
                    // Restaurar botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    if (response.ok) {
                        const result = await response.json();
                        alert(`✅ Auditoría creada con éxito!\nID: ${result.audit_id}\nÓrdenes de traslado procesadas: ${result.ordenes_procesadas}\nProductos procesados: ${result.productos_procesados}`);
                        
                        // Limpiar el input de archivo y el display
                        refreshedFileInput.value = '';
                        if (selectedFilesDiv) {
                            selectedFilesDiv.innerHTML = '';
                        }
                        
                        // Recargar las auditorías
                        loadDashboardData('auditor', token);
                    } else {
                        const error = await response.json();
                        console.error("Error del servidor:", error);
                        alert("❌ Error al procesar los archivos: " + (error.detail || "Error desconocido del servidor"));
                    }
                } catch (error) {
                    console.error('Error de red:', error);
                    
                    // Restaurar botón en caso de error
                    const submitBtn = refreshedUploadForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
                        submitBtn.disabled = false;
                    }
                    
                    alert("❌ Error de conexión. Verifica tu internet e intenta nuevamente.");
                }
            });
        } else {
            console.error("No se encontraron los elementos del formulario de upload");
        }
        
        // Configurar el input de escaneo
        setupScanInput();
        
        // Configurar botones de guardar y finalizar
        setupAuditorButtons();
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
                localStorage.setItem('user_id', user.id);
                
                // MOSTRAR EL DASHBOARD CORRESPONDIENTE AL ROL
                const dashboardId = roleMap[user.rol];
                showDashboard(dashboardId);
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
                // Obtener el ID del auditor actual
                const auditorId = localStorage.getItem('user_id');
                
                // Cargar auditorías del auditor actual
                const auditsResponse = await fetch(`${API_URL}/audits/auditor/${auditorId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (auditsResponse.ok) {
                    const audits = await auditsResponse.json();
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    
                    // CONFIGURAR EL DASHBOARD DEL AUDITOR DESPUÉS DE CARGAR LOS DATOS
                    setTimeout(setupAuditorDashboard, 200);
                } else {
                    console.error('No se pudieron cargar las auditorías del auditor.');
                    // Mostrar mensaje de error en la tabla
                    const tableBody = document.querySelector('#auditor-audits-table-body');
                    if (tableBody) {
                        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar las auditorías</td></tr>';
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard del auditor:', error);
                const tableBody = document.querySelector('#auditor-audits-table-body');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error de conexión</td></tr>';
                }
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
        
        if (audits.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No tienes auditorías asignadas</td></tr>';
            return;
        }
        
        audits.forEach(audit => {
            const row = document.createElement('tr');
            const fecha = new Date(audit.creada_en).toLocaleDateString() || '--';
            
            // Determinar clase según estado
            let claseEstado = '';
            let textoEstado = '';
            switch(audit.estado) {
                case 'pendiente':
                    claseEstado = 'estado-pendiente';
                    textoEstado = 'Pendiente';
                    break;
                case 'en_progreso':
                    claseEstado = 'estado-progreso';
                    textoEstado = 'En Progreso';
                    break;
                case 'finalizada':
                    claseEstado = 'estado-completada';
                    textoEstado = 'Completada';
                    break;
                default:
                    claseEstado = 'bg-secondary';
                    textoEstado = audit.estado;
            }

            row.innerHTML = `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${fecha}</td>
                <td><span class="badge ${claseEstado}">${textoEstado}</span></td>
                <td>
                    ${audit.estado === 'pendiente' ? 
                        `<button class="btn btn-sm btn-primary" onclick="iniciarAuditoria(${audit.id})">
                            <i class="bi bi-play-fill"></i> Iniciar
                        </button>` : 
                        `<button class="btn btn-sm btn-info" onclick="verAuditoria(${audit.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>`
                    }
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

    // Función para guardar un producto individualmente
    async function saveProduct(productId, auditId, updateData) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}/products/${productId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                return true;
            } else {
                const error = await response.json();
                console.error("Error al actualizar producto:", error.detail);
                return false;
            }
        } catch (error) {
            console.error('Error de red:', error);
            return false;
        }
    }

    // Función para iniciar una auditoría
    window.iniciarAuditoria = async function(auditId) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/audits/${auditId}/iniciar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                alert("Auditoría iniciada con éxito.");
                loadDashboardData('auditor', token);
            } else {
                const error = await response.json();
                alert("Error al iniciar auditoría: " + error.detail);
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Error de red al iniciar la auditoría.");
        }
    };

    // Función para ver una auditoría
    window.verAuditoria = function(auditId) {
        fetchProductsByAuditId(auditId);
    };

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
            
            // ✅ ACTUALIZAR CUMPLIMIENTO AL CARGAR LA AUDITORÍA
            await updateCompliancePercentage(auditId);
            
            // Configurar el auto-guardado al presionar Enter
            setupAutoSaveOnEnter();
            
            // Configurar el escaneo de SKUs
            setupScanInput();
            
            // Mostrar botones de guardar y finalizar
            document.getElementById('save-all-btn').classList.remove('d-none');
            document.getElementById('finish-audit-btn').classList.remove('d-none');
            
            // Poner focus en el campo de escaneo
            const scanInput = document.getElementById('scan-input');
            if (scanInput) {
                scanInput.focus();
            }
        } else {
            const error = await response.json();
            alert('Error al cargar productos: ' + error.detail);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de red al cargar productos.');
    }
}

    // Configurar el evento de Enter para guardar automáticamente
    function setupAutoSaveOnEnter() {
    // Usar event delegation en la tabla de productos
    const productsTable = document.getElementById('auditor-products-table-body');
    if (!productsTable) return;
    
    productsTable.addEventListener('keydown', async function(e) {
        // Verificar si el objetivo es un input de cantidad física y si se presionó Enter
        if (e.target.classList.contains('physical-count') && e.key === 'Enter') {
            e.preventDefault();
            
            const input = e.target;
            const productId = input.getAttribute('data-product-id');
            
            console.log("Product ID:", productId);
            
            if (!productId || productId === 'undefined') {
                alert("Error: No se pudo identificar el producto. Recarga la página.");
                return;
            }
            
            // Verificar que tenemos una auditoría actual
            if (!currentAudit || !currentAudit.id) {
                alert("No hay una auditoría activa. Por favor, selecciona una auditoría primero.");
                return;
            }
            
            const row = input.closest('tr');
            const noveltySelect = row.querySelector('.novelty-select');
            const observationsArea = row.querySelector('.observations-area');
            
            const physicalCount = parseInt(input.value) || 0;
            const novelty = noveltySelect ? noveltySelect.value : 'sin_novedad';
            const observations = observationsArea ? observationsArea.value : '';
            
            const updateData = {
                cantidad_fisica: physicalCount,
                novedad: novelty,
                observaciones: observations
            };
            
            console.log("Guardando producto:", productId, updateData);
            
            // Mostrar indicador de carga
            const originalValue = input.value;
            input.disabled = true;
            input.value = 'Guardando...';
            
            // Guardar el producto
            const success = await saveProduct(productId, currentAudit.id, updateData);
            
            // Restaurar el input
            input.disabled = false;
            input.value = originalValue;
            
            if (success) {
                console.log("Producto guardado exitosamente");
                // Mostrar feedback visual de guardado exitoso
                input.classList.add('saved-success');
                setTimeout(() => {
                    input.classList.remove('saved-success');
                }, 1000);
                
                // ✅ LLAMAR A LA NUEVA FUNCIÓN PARA ACTUALIZAR PORCENTAJE
                await updateCompliancePercentage(currentAudit.id);
                
                // VOLVER AL CAMPO DE ESCANEO DE SKU
                const scanInput = document.getElementById('scan-input');
                if (scanInput) {
                    scanInput.focus();
                    scanInput.select();
                }
            } else {
                console.error("Error al guardar producto");
                alert("Error al guardar el producto. Por favor, intente nuevamente.");
                input.focus();
                input.select();
            }
        }
    });
}

    function renderProductsTable(products) {
        const auditorProductsTableBody = document.getElementById('auditor-products-table-body');
        if (!auditorProductsTableBody) return;
        
        auditorProductsTableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            
            // Color diferente según la orden de traslado para fácil identificación
            const ordenTraslado = product.orden_traslado_original || 'SIN_OT';
            const rowClass = `ot-${ordenTraslado.replace(/[^a-zA-Z0-9]/g, '-')}`;
            
            row.innerHTML = `
                <td data-sku="${product.sku}" class="${rowClass}">${product.sku}</td>
                <td class="${rowClass}"><strong>${ordenTraslado}</strong></td>
                <td class="${rowClass}">${product.nombre_articulo ?? '--'}</td>
                <td class="${rowClass}">${product.cantidad_documento ?? '--'}</td>
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
        
        // Aplicar estilos CSS para diferenciar las órdenes de traslado
        applyOrderStyles(products);
    }

    function applyOrderStyles(products) {
        // Obtener órdenes de traslado únicas
        const uniqueOrders = [...new Set(products.map(p => p.orden_traslado_original))];
        
        // Generar estilos CSS dinámicamente
        const style = document.createElement('style');
        uniqueOrders.forEach((order, index) => {
            if (order) {
                const className = `ot-${order.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const hue = (index * 137.5) % 360; // Distribución uniforme en el círculo cromático
                style.textContent += `
                    .${className} {
                        background-color: hsla(${hue}, 70%, 20%, 0.3) !important;
                        border-left: 3px solid hsl(${hue}, 70%, 50%) !important;
                    }
                    .${className}:hover {
                        background-color: hsla(${hue}, 70%, 25%, 0.4) !important;
                    }
                `;
            }
        });
        
        document.head.appendChild(style);
    }

    function updateAuditorCompliance(percentage) {
        const complianceDiv = document.getElementById('compliance-percentage');
        if (complianceDiv) {
            complianceDiv.textContent = percentage !== null ? `${percentage}%` : 'N/A';
            const gradient = percentage !== null ? `conic-gradient(#00c6ff ${percentage}%, transparent ${percentage}%)` : `conic-gradient(#6c757d 100%, transparent 100%)`;
            complianceDiv.style.background = gradient;
        }
    }

    // Listener para los botones "Guardar" de cada producto
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.save-product-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.save-product-btn');
            const productId = btn.getAttribute('data-product-id');
            
            console.log("Product ID desde botón:", productId); // Para debugging
            
            if (!productId || productId === 'undefined') {
                alert("Error: No se pudo identificar el producto.");
                return;
            }
            
            const row = btn.closest('tr');
            const physicalCountInput = row.querySelector('.physical-count');
            const noveltySelect = row.querySelector('.novelty-select');
            const observationsArea = row.querySelector('.observations-area');

            const physicalCount = physicalCountInput ? parseInt(physicalCountInput.value) || 0 : 0;
            const novelty = noveltySelect ? noveltySelect.value : 'sin_novedad';
            const observations = observationsArea ? observationsArea.value : '';

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

    // Función para guardar todos los productos de la auditoría
    async function saveAllProducts(auditId) {
        if (!currentAudit || !currentAudit.productos) {
            alert("No hay productos para guardar.");
            return false;
        }

        const token = getToken();
        let allSaved = true;
        const savePromises = [];

        // Recorrer todos los productos y guardar los cambios
        currentAudit.productos.forEach(product => {
            const row = document.querySelector(`tr:has(td[data-sku="${product.sku}"])`);
            if (row) {
                const physicalCountInput = row.querySelector('.physical-count');
                const noveltySelect = row.querySelector('.novelty-select');
                const observationsArea = row.querySelector('.observations-area');
                
                const physicalCount = physicalCountInput ? parseInt(physicalCountInput.value) || 0 : 0;
                const novelty = noveltySelect ? noveltySelect.value : 'sin_novedad';
                const observations = observationsArea ? observationsArea.value : '';
                
                const updateData = {
                    cantidad_fisica: physicalCount,
                    novedad: novelty,
                    observaciones: observations
                };
                
                // Agregar la promesa de guardado
                savePromises.push(
                    saveProduct(product.id, auditId, updateData)
                        .then(success => {
                            if (!success) allSaved = false;
                        })
                );
            }
        });

        // Esperar a que todas las promesas se completen
        await Promise.all(savePromises);
        
        return allSaved;
    }


// --- Función para calcular y actualizar el porcentaje de cumplimiento ---
async function updateCompliancePercentage(auditId) {
    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/audits/${auditId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const auditData = await response.json();
            
            if (auditData.productos && Array.isArray(auditData.productos)) {
                // Calcular cumplimiento en tiempo real
                const totalProductos = auditData.productos.length;
                let correctos = 0;
                
                auditData.productos.forEach(producto => {
                    if (producto.cantidad_fisica !== null && 
                        producto.cantidad_fisica === producto.cantidad_enviada && 
                        producto.novedad === 'sin_novedad') {
                        correctos++;
                    }
                });
                
                const cumplimiento = totalProductos > 0 ? 
                    Math.round((correctos / totalProductos) * 100) : 0;
                
                // Actualizar la interfaz
                updateAuditorCompliance(cumplimiento);
                
                console.log(`✅ Cumplimiento actualizado: ${cumplimiento}% (${correctos}/${totalProductos})`);
            }
        }
    } catch (error) {
        console.error('Error al actualizar porcentaje de cumplimiento:', error);
    }
}

// --- Lógica para el modal de autenticación ---
authForm.addEventListener('submit', async function (event) {
    // ... [tu código existente] ...
});

// --- Lógica para cerrar sesión y navegación del sidebar ---
document.querySelector('[data-target="logout"]').addEventListener('click', function (e) {
    // ... [tu código existente] ...
});

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
                formBody.append('username', email);
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
                
                if (result.access_token) {
                    // Almacenar el token y los datos del usuario
                    localStorage.setItem('access_token', result.access_token);
                    localStorage.setItem('user_role', result.user_role || result.user?.rol);
                    localStorage.setItem('user_name', result.user_name || result.user?.nombre);
                    localStorage.setItem('user_id', result.user_id || result.user?.id);
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

    // Configurar dashboard del auditor si ya está visible al cargar la página
    setTimeout(function() {
        const userRole = localStorage.getItem('user_role');
        if (userRole === 'auditor') {
            const auditorDashboard = document.getElementById('auditor-dashboard');
            if (auditorDashboard && !auditorDashboard.classList.contains('d-none')) {
                console.log("Dashboard del auditor visible al cargar, configurando...");
                setupAuditorDashboard();
            }
        }
    }, 1000);


    
    // Iniciar la verificación de autenticación
    checkAuth();
});
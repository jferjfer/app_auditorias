document.addEventListener('DOMContentLoaded', function() {
    // --- Configuración de Entorno ---
    // Cambia la URL de DEPLOYMENT_URL por la URL pública de tu backend en Render
    const DEPLOYMENT_URL = 'https://tu-backend.onrender.com'; 
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
    
    // Gráficos
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
        if (websocket) {
            websocket.close();
        }
        window.location.reload();
    };

    // --- WebSockets ---
    function initWebSocket(auditId) {
        if (websocket) {
            websocket.close();
        }
        const userId = localStorage.getItem('user_id');
        const token = getToken();
        if (!token) {
            console.error("No se encontró token de autenticación para la conexión WebSocket.");
            return;
        }
        const wsProtocol = IS_LOCAL ? 'ws' : 'wss';
        const wsHost = IS_LOCAL ? '127.0.0.1:8000' : new URL(API_URL).host;
        const wsUrl = `${wsProtocol}://${wsHost}/ws/${auditId}/${userId}?token=${token}`;
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
            console.log(`WebSocket connection established for audit ${auditId}`);
        };

        websocket.onmessage = function(event) {
            const productData = JSON.parse(event.data);
            console.log('WebSocket message received:', productData);
            updateProductRow(productData);
        };

        websocket.onclose = function() {
            console.log('WebSocket connection closed.');
        };

        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }

    function updateProductRow(product) {
        const row = document.querySelector(`tr[data-product-id='${product.id}']`);
        if (row) {
            const physicalCountInput = row.querySelector('.physical-count');
            const noveltySelect = row.querySelector('.novelty-select');
            const observationsArea = row.querySelector('.observations-area');

            // Solo actualizar si el valor es diferente para no interrumpir al usuario
            if (physicalCountInput && physicalCountInput.value != (product.cantidad_fisica || '')) {
                physicalCountInput.value = product.cantidad_fisica || '';
            }
            if (noveltySelect && noveltySelect.value !== (product.novedad || 'sin_novedad')) {
                noveltySelect.value = product.novedad || 'sin_novedad';
            }
            if (observationsArea && observationsArea.value !== (product.observaciones || '')) {
                observationsArea.value = product.observaciones || '';
            }

            // Lógica para bloquear la fila
            if (product.novedad === 'sin_novedad' && (product.cantidad_fisica !== null && product.cantidad_fisica !== '')) {
                row.classList.add('row-locked');
                if (physicalCountInput) physicalCountInput.disabled = true;
                if (noveltySelect) noveltySelect.disabled = true;
                if (observationsArea) observationsArea.disabled = true;
            } else {
                row.classList.remove('row-locked');
                if (physicalCountInput) physicalCountInput.disabled = false;
                if (noveltySelect) noveltySelect.disabled = false;
                if (observationsArea) observationsArea.disabled = false;
            }
        }
    }


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
                setTimeout(function() {
                    if (window._auditorAuditsList) {
                        setupAuditorDashboard(window._auditorAuditsList);
                    } else {
                        setupAuditorDashboard();
                    }
                }, 100);
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
            // Eliminar listeners previos usando clonación
            const newSaveBtn = saveAllBtn.cloneNode(true);
            saveAllBtn.parentNode.replaceChild(newSaveBtn, saveAllBtn);
            newSaveBtn.addEventListener('click', async () => {
                if (!currentAudit || !currentAudit.id) {
                    alert("Por favor, selecciona una auditoría válida antes de guardar. Si el problema persiste, recarga la página.");
                    return;
                }
                newSaveBtn.disabled = true;
                try {
                    const saved = await saveAllProducts(currentAudit.id);
                    if (saved) {
                        alert("Todos los productos han sido guardados exitosamente.");
                    } else {
                        alert("Hubo errores al guardar algunos productos. Por favor, revísalos manualmente.");
                    }
                } finally {
                    newSaveBtn.disabled = false;
                }
            });
        }

        if (finishAuditBtn) {
            // Eliminar listeners previos usando clonación
            const newFinishBtn = finishAuditBtn.cloneNode(true);
            finishAuditBtn.parentNode.replaceChild(newFinishBtn, finishAuditBtn);
            newFinishBtn.addEventListener('click', async () => {
                if (!currentAudit || !currentAudit.id) {
                    alert("Por favor, selecciona una auditoría válida antes de finalizar. Si el problema persiste, recarga la página.");
                    return;
                }
                newFinishBtn.disabled = true;
                try {
                    // Confirmar antes de finalizar
                    if (!confirm("¿Estás seguro de que quieres finalizar esta auditoría? Esta acción no se puede deshacer.")) {
                        return;
                    }
                    const token = getToken();
                    // Validar de nuevo antes de guardar
                    if (!currentAudit || !currentAudit.id) {
                        alert("No hay una auditoría activa para finalizar. Recarga la página.");
                        return;
                    }
                    // Primero guardar todos los cambios
                    const saved = await saveAllProducts(currentAudit.id);
                    if (!saved) {
                        alert("Hubo errores al guardar algunos productos. Revise los datos.");
                        return;
                    }
                    // Validar de nuevo antes de finalizar
                    if (!currentAudit || !currentAudit.id) {
                        alert("No hay una auditoría activa para finalizar. Recarga la página.");
                        return;
                    }
                    // Luego finalizar la auditoría
                    const response = await fetch(`${API_URL}/audits/${currentAudit.id}/finish`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        alert(`Auditoría finalizada con éxito.\nPorcentaje de cumplimiento: ${result.porcentaje_cumplimiento}%`);
                        // Limpiar la interfaz
                        const auditorProductsTableBody = document.getElementById('auditor-products-table-body');
                        if (auditorProductsTableBody) {
                            auditorProductsTableBody.innerHTML = '';
                        }
                        // Limpiar currentAudit y actualizar cumplimiento solo si corresponde
                        currentAudit = null;
                        if (typeof updateAuditorCompliance === 'function') {
                            updateAuditorCompliance(null);
                        }
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
                } finally {
                    newFinishBtn.disabled = false;
                }
            });
        }
    }

    // --- Lógica para el Dashboard del Auditor ---
    function setupAuditorDashboard() {
        console.log("Configurando dashboard del auditor...");
        // --- Lógica de filtrado de auditorías finalizadas ---
        function setupFinalizadasDashboard(audits) {
            // Inicializar variable de control global
            window._mostrarFinalizadas = false;
            const btnShow = document.getElementById('show-finished-audits-btn');
            const btnHide = document.getElementById('hide-finished-audits-btn');
            // Función para renderizar según filtro
            function renderAudits(filtrarFinalizadas = false) {
                window._mostrarFinalizadas = filtrarFinalizadas;
                // Mostrar/ocultar botones: el de ver finalizadas siempre visible, el de volver solo si está en finalizadas
                if (btnShow) btnShow.classList.toggle('d-none', filtrarFinalizadas);
                if (btnHide) btnHide.classList.toggle('d-none', !filtrarFinalizadas);
                renderAuditorAuditsTable(audits, '#auditor-audits-table-body', filtrarFinalizadas);
            }
            // Listeners (solo una vez)
            if (btnShow && !btnShow.dataset.listenerAdded) {
                btnShow.addEventListener('click', function() { renderAudits(true); });
                btnShow.dataset.listenerAdded = '1';
            }
            if (btnHide && !btnHide.dataset.listenerAdded) {
                btnHide.addEventListener('click', function() { renderAudits(false); });
                btnHide.dataset.listenerAdded = '1';
            }
            // Inicial: mostrar solo activas (no finalizadas)
            renderAudits(false);
        }
        // --- Fin lógica de auditorías finalizadas ---

        // Si no recibe auditorías, intenta usar la variable global
        let auditorias = arguments[0];
        if (!auditorias && window._auditorAuditsList) {
            auditorias = window._auditorAuditsList;
        }
        if (auditorias) {
            setupFinalizadasDashboard(auditorias);
        }

        // El resto de la lógica del dashboard
        const uploadForm = document.getElementById('uploadForm');
        const fileInput = document.getElementById('audit-file-input');
        const selectedFilesDiv = document.getElementById('selected-files');

        // Configurar display de archivos seleccionados
        if (fileInput) {
            fileInput.addEventListener('change', updateSelectedFilesDisplay);
        }

        if (uploadForm && fileInput) {
            // Evitar múltiples listeners
            if (!uploadForm.dataset.listenerAdded) {
                fileInput.addEventListener('change', updateSelectedFilesDisplay);
                uploadForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    // Deshabilitar el botón inmediatamente para evitar doble submit
                    const submitBtn = uploadForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                    }
                    // Verificación robusta
                    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                        alert("Por favor, selecciona al menos un archivo Excel para subir.");
                        if (submitBtn) submitBtn.disabled = false;
                        return;
                    }
                    const files = Array.from(fileInput.files);
                    console.log("Archivos seleccionados para upload:", files.map(f => f.name));
                    try {
                        const token = getToken();
                        if (!token) {
                            alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
                            if (submitBtn) submitBtn.disabled = false;
                            return;
                        }
                        // Mostrar indicador de carga
        // Si se pasa la lista de auditorías, activar la lógica de finalizadas
        if (arguments.length > 0 && Array.isArray(arguments[0])) {
            setupFinalizadasDashboard(arguments[0]);
        }
                        const originalText = submitBtn ? submitBtn.innerHTML : '';
                        if (submitBtn) {
                            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...';
                        }
                        const formData = new FormData();
                        // Agregar todos los archivos al FormData
                        files.forEach((file) => {
                            formData.append('files', file);
                        });
                        // Validar token antes de enviar
                        if (!token || typeof token !== 'string' || token.length < 10) {
                            alert("Token de autenticación inválido. Por favor, inicia sesión nuevamente.");
                            clearSession();
                            if (submitBtn) submitBtn.disabled = false;
                            return;
                        }
                        // Enviar token solo si existe
                        const headers = {};
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        const response = await fetch(`${API_URL}/audits/upload-multiple-files`, {
                            method: 'POST',
                            headers,
                            body: formData,
                        });
                        if (response.ok) {
                            const result = await response.json();
                            
                            const ordenesLabel = result.numero_ordenes === 1 ? "Orden de traslado procesada:" : "Órdenes de traslado procesadas:";
                            const ordenesList = Array.isArray(result.ordenes_procesadas) ? result.ordenes_procesadas.join('\n- ') : "N/A";
                            
                            alert(`✅ ¡Auditoría creada con éxito!\n\nID de Auditoría: ${result.audit_id}\n${ordenesLabel}\n- ${ordenesList}\n\nTotal de productos procesados: ${result.productos_procesados}`);
                            
                            // Limpiar el input de archivo y el display
                            fileInput.value = '';
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
                        alert("❌ Error de conexión. Verifica tu internet e intenta nuevamente.");
                    } finally {
                        // Restaurar botón
                        if (submitBtn) {
                            submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
                            submitBtn.disabled = false;
                        }
                    }
                });
                uploadForm.dataset.listenerAdded = 'true';
            }
        } else {
            console.error("No se encontraron los elementos del formulario de upload");
        }
        
        // Configurar el input de escaneo
        setupScanInput();
        
        // Configurar el escáner de cámara
        setupCameraScanner();

        // Configurar botones de guardar y finalizar
        setupAuditorButtons();
    }

    // --- Lógica para el Escáner de Cámara ---
    async function setupCameraScanner() {
        const startCameraBtn = document.getElementById('start-camera-scan-btn');
        const scannerContainer = document.getElementById('scanner-container');
        const closeScannerBtn = document.getElementById('close-scanner-btn');

        if (!startCameraBtn || !scannerContainer || !closeScannerBtn) {
            // Los elementos no existen en este dashboard, no es un error.
            return;
        }

        // Comprobar si hay cámaras disponibles antes de mostrar el botón
        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length) {
                // Si hay al menos una cámara, muestra el botón
                startCameraBtn.classList.remove('d-none');
            } else {
                // Si no hay cámaras, el botón permanece oculto (d-none)
                return; 
            }
        } catch (err) {
            // Error al obtener cámaras (el usuario puede haber denegado el permiso, o no es compatible)
            console.warn("No se pudo acceder a las cámaras. El botón de escaneo permanecerá oculto.", err);
            return;
        }

        // Función para manejar un escaneo exitoso
        function onScanSuccess(decodedText, decodedResult) {
            console.log(`Código escaneado = ${decodedText}`, decodedResult);
            
            // Detener el escaneo
            html5QrCode.stop().then((ignore) => {
                scannerContainer.classList.add('d-none');
                
                // Poner el valor en el input de escaneo
                const scanInput = document.getElementById('scan-input');
                scanInput.value = decodedText;
                
                // Simular la pulsación de 'Enter' para procesar el SKU
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true
                });
                scanInput.dispatchEvent(enterEvent);

            }).catch((err) => {
                console.error("Fallo al detener el escáner de QR.", err);
            });
        }

        // Función para manejar fallos (opcional, útil para depurar)
        function onScanFailure(error) {
            // No hacer nada en caso de fallo para no molestar al usuario
        }

        // Listener para el botón de la cámara
        startCameraBtn.addEventListener('click', () => {
            scannerContainer.classList.remove('d-none');
            
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("reader");
            }

            html5QrCode.start(
                { facingMode: "environment" }, // Usar la cámara trasera
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onScanFailure
            ).catch((err) => {
                alert("No se pudo iniciar la cámara. Asegúrate de dar permisos y que no esté en uso por otra app.");
                scannerContainer.classList.add('d-none');
            });
        });

        // Listener para el botón de cerrar
        closeScannerBtn.addEventListener('click', () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Error al detener el escáner:", err));
            }
            scannerContainer.classList.add('d-none');
        });
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
                    window._auditorAuditsList = audits;
                    renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
                    // CONFIGURAR EL DASHBOARD DEL AUDITOR DESPUÉS DE CARGAR LOS DATOS, pasando la lista
                    setTimeout(() => setupAuditorDashboard(audits), 200);
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
            const estadoColor = audit.estado === 'finalizada' ? '#28a745' : '#ffc107';

            // Mostrar el estado como 'Finalizada' si corresponde
            let estadoTexto = audit.estado;
            if (audit.estado === 'finalizada') {
                estadoTexto = 'Finalizada';
            }
            row.innerHTML = `
                <td>${audit.id ?? '--'}</td>
                <td>${audit.ubicacion_destino ?? '--'}</td>
                <td>${audit.auditor_nombre ?? audit.auditor_id ?? '--'}</td>
                <td>${fecha}</td>
                <td><span class="badge rounded-pill" style="background-color: ${estadoColor};">${estadoTexto ?? '--'}</span></td>
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
        tableBody.innerHTML = '';
        let filtradas = audits;
        if (mostrarFinalizadas === false) {
            filtradas = audits.filter(a => a.estado !== 'finalizada');
        } else if (mostrarFinalizadas === true) {
            filtradas = audits.filter(a => a.estado === 'finalizada');
        }
        if (filtradas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No tienes auditorías para mostrar</td></tr>';
            return;
        }
        filtradas.forEach(audit => {
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
                    textoEstado = 'Finalizada';
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
                        `<button class="btn btn-sm btn-primary iniciar-auditoria-btn" data-audit-id="${audit.id}">
                            <i class="bi bi-play-fill"></i> Iniciar
                        </button>` : 
                        `<button class="btn btn-sm btn-info ver-auditoria-btn" data-audit-id="${audit.id}">
                            <i class="bi bi-eye"></i> Ver
                        </button>`
                    }
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Event listener para los botones de la tabla de auditorías del auditor
        tableBody.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const auditId = target.getAttribute('data-audit-id');
            if (target.classList.contains('iniciar-auditoria-btn')) {
                iniciarAuditoria(auditId);
            }
            if (target.classList.contains('ver-auditoria-btn')) {
                verAuditoria(auditId);
            }
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
                const result = await response.json();
                return result.product; // Devolver el producto actualizado
            } else {
                const error = await response.json();
                console.error("Error al actualizar producto:", error.detail);
                return null;
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
                // Iniciar WebSocket
                initWebSocket(auditId);
                // Actualizar cumplimiento
                await updateCompliancePercentage(auditId);
                setupAutoSaveOnEnter();
                setupScanInput();
                // Mostrar botones de guardar, finalizar y colaborativa
                document.getElementById('save-all-btn').classList.remove('d-none');
                document.getElementById('finish-audit-btn').classList.remove('d-none');
                document.getElementById('collaborative-audit-btn').classList.remove('d-none');
                // Focus en escaneo
                const scanInput = document.getElementById('scan-input');
                if (scanInput) scanInput.focus();
            } else {
                const error = await response.json();
                alert('Error al cargar productos: ' + error.detail);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de red al cargar productos.');
        }
    }

// --- Lógica para Panel de Auditoría Colaborativa ---
const collaborativeAuditBtn = document.getElementById('collaborative-audit-btn');
const collaborativePanel = document.getElementById('collaborative-panel');
const confirmCollaborativeBtn = document.getElementById('confirm-collaborative-audit');
const cancelCollaborativeBtn = document.getElementById('cancel-collaborative-audit');
const auditorsSelect = document.getElementById('collaborative-auditors-select');

if (collaborativeAuditBtn) {
    collaborativeAuditBtn.addEventListener('click', async () => {
        // Si el panel ya está visible, lo ocultamos
        if (!collaborativePanel.classList.contains('d-none')) {
            collaborativePanel.classList.add('d-none');
            return;
        }

        // Si está oculto, lo mostramos y cargamos los auditores
        collaborativePanel.classList.remove('d-none');
        auditorsSelect.innerHTML = '<option disabled>Cargando auditores...</option>';

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/auditors/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const auditors = await response.json();
                const currentUserId = parseInt(localStorage.getItem('user_id'));
                const filteredAuditors = auditors.filter(auditor => auditor.id !== currentUserId);

                if (filteredAuditors.length === 0) {
                    auditorsSelect.innerHTML = '<option disabled>No hay otros auditores disponibles</option>';
                } else {
                    auditorsSelect.innerHTML = '';
                    filteredAuditors.forEach(auditor => {
                        const opt = document.createElement('option');
                        opt.value = auditor.id;
                        opt.textContent = `${auditor.nombre} (${auditor.correo})`;
                        auditorsSelect.appendChild(opt);
                    });
                }
            } else {
                auditorsSelect.innerHTML = '<option disabled>Error al cargar auditores</option>';
            }
        } catch (e) {
            auditorsSelect.innerHTML = '<option disabled>Error de red</option>';
        }
    });
}

// Botón de Cancelar en el panel
if (cancelCollaborativeBtn) {
    cancelCollaborativeBtn.addEventListener('click', () => {
        collaborativePanel.classList.add('d-none');
    });
}

// Botón de Confirmar/Asignar en el panel
if (confirmCollaborativeBtn) {
    confirmCollaborativeBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!currentAudit || !currentAudit.id) {
            alert('Error: No se ha seleccionado una auditoría. Recarga la página.');
            return;
        }

        const selectedOptions = Array.from(auditorsSelect.selectedOptions);
        if (selectedOptions.length === 0) {
            alert('Selecciona al menos un auditor para colaborar.');
            return;
        }

        const collaborator_ids = selectedOptions.map(opt => parseInt(opt.value));
        const token = getToken();

        if (!token) {
            alert('Error de autenticación. Por favor, inicia sesión de nuevo.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/audits/${currentAudit.id}/collaborators`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ collaborator_ids: collaborator_ids })
            });

            if (response.ok) {
                alert('¡Colaboradores añadidos con éxito a la auditoría!');
                collaborativePanel.classList.add('d-none'); // Ocultar panel al éxito
            } else {
                const error = await response.json();
                alert('Error al añadir colaboradores: ' + (error.detail || 'Error desconocido.'));
            }
        } catch (error) {
            console.error('Error de red al asignar auditoría colaborativa:', error);
            alert('Error de red. No se pudo conectar con el servidor.');
        }
    });
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
            const row = input.closest('tr');
            const productId = row.getAttribute('data-product-id');
            
            if (!productId || productId === 'undefined') {
                alert("Error: No se pudo identificar el producto. Recarga la página.");
                return;
            }
            
            if (!currentAudit || !currentAudit.id) {
                alert("No hay una auditoría activa. Por favor, selecciona una auditoría primero.");
                return;
            }
            
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
            
            input.disabled = true;
            const updatedProduct = await saveProduct(productId, currentAudit.id, updateData);
            input.disabled = false;
            
            if (updatedProduct) {
                input.classList.add('saved-success');
                setTimeout(() => input.classList.remove('saved-success'), 1000);
                
                await updateCompliancePercentage(currentAudit.id);

                if (novelty === 'sin_novedad') {
                    row.classList.add('row-locked');
                    input.disabled = true;
                    if (noveltySelect) noveltySelect.disabled = true;
                    if (observationsArea) observationsArea.disabled = true;
                }

                const scanInput = document.getElementById('scan-input');
                if (scanInput) {
                    scanInput.focus();
                    scanInput.select();
                }
            } else {
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
            const productId = product.id || product.product_id;
            row.setAttribute('data-product-id', productId);
            
            const ordenTraslado = product.orden_traslado_original || 'SIN_OT';
            const rowClass = `ot-${ordenTraslado.replace(/[^a-zA-Z0-9]/g, '-')}`;
            
            row.innerHTML = `
                <td data-sku="${product.sku}" class="${rowClass}">${product.sku}</td>
                <td class="${rowClass}"><strong>${ordenTraslado}</strong></td>
                <td class="${rowClass}">${product.nombre_articulo ?? '--'}</td>
                <td class="${rowClass}">${product.cantidad_documento ?? '--'}</td>
                <td><input type="number" class="form-control form-control-sm physical-count" value="${product.cantidad_fisica || ''}"></td>
                <td><select class="form-select form-select-sm novelty-select">
                    <option value="sin_novedad" ${product.novedad === 'sin_novedad' ? 'selected' : ''}>Sin Novedad</option>
                    <option value="faltante" ${product.novedad === 'faltante' ? 'selected' : ''}>Faltante</option>
                    <option value="sobrante" ${product.novedad === 'sobrante' ? 'selected' : ''}>Sobrante</option>
                    <option value="averia" ${product.novedad === 'averia' ? 'selected' : ''}>Avería</option>
                </select></td>
                <td><textarea class="form-control form-control-sm observations-area">${product.observaciones || ''}</textarea></td>
                <td>
                    <button class="btn btn-sm btn-success save-product-btn"><i class="bi bi-save"></i></button>
                </td>
            `;
            auditorProductsTableBody.appendChild(row)

            // After adding row to DOM, check if it should be locked
            updateProductRow(product);
        });
        
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
            const row = btn.closest('tr');
            const productId = row.getAttribute('data-product-id');
            
            if (!productId || productId === 'undefined') {
                alert("Error: No se pudo identificar el producto.");
                return;
            }
            
            if (!currentAudit || !currentAudit.id) {
                alert("No hay una auditoría activa. Por favor, selecciona una auditoría primero.");
                return;
            }
            
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
            
            const updatedProduct = await saveProduct(productId, currentAudit.id, updateData);

            if (updatedProduct) {
                alert("Producto actualizado exitosamente.");
                await updateCompliancePercentage(currentAudit.id);
            } else {
                alert("Error al actualizar producto.");
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
            const row = document.querySelector(`tr[data-product-id="${product.id}"]`);
            if (row && !row.classList.contains('row-locked')) {
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
                
                savePromises.push(
                    saveProduct(product.id, auditId, updateData)
                        .then(success => {
                            if (!success) allSaved = false;
                        })
                );
            }
        });

        await Promise.all(savePromises);
        
        if (allSaved) {
            await updateCompliancePercentage(auditId);
        }
        
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


    
    // Iniciar la lógica de temas
    initTheme();

    // Iniciar la verificación de autenticación
    checkAuth();
});
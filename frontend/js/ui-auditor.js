import * as api from './api.js';
import { showToast, renderAuditorAuditsTable, renderProductsTable, speak, updateCompliancePercentage, playBeep } from './ui-helpers.js';
import { state, setAuditorAuditsList, setCurrentAudit, setLastScanned, setHtml5QrCode } from './state.js';
import { initWebSocket } from './websockets.js';
import { ensureModal } from './ui-modals.js';

const auditorListHTML = `
<div id="auditor-dashboard" class="dashboard-section">
    <h1 class="h2">Dashboard del Auditor</h1>
    
    <div class="card mb-4">
        <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-upload"></i> Cargar Nuevas Órdenes de Traslado</h5>
        </div>
        <div class="card-body">
            <form id="uploadForm">
                <div class="input-group">
                    <input type="file" class="form-control" id="audit-file-input" multiple accept=".xlsx, .xls">
                    <button class="btn btn-primary" type="submit">Subir Archivos</button>
                </div>
                <div class="form-text">Selecciona uno o más archivos de Excel para crear las auditorías.</div>
            </form>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-list-check"></i> Mis Auditorías</h5>
            <div class="btn-group mt-2">
                <button id="show-finished-audits-btn" class="btn btn-sm btn-outline-secondary">Ver Finalizadas</button>
                <button id="hide-finished-audits-btn" class="btn btn-sm btn-secondary d-none">Ocultar Finalizadas</button>
            </div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover table-dark">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ubicación</th>
                            <th>Fecha Creación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="auditor-audits-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`;

const auditorDetailHTML = `
<div id="auditor-detail-view" class="dashboard-section">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
        <button id="back-to-audits-list" class="btn btn-secondary"><i class="bi bi-arrow-left"></i> Volver a la lista</button>
        <div id="compliance-percentage-container" class="d-flex align-items-center">
            <span class="me-2">Cumplimiento:</span>
            <div id="compliance-percentage" class="compliance-circle">--%</div>
        </div>
    </div>

    <div class="card mb-4">
        <div class="card-body">
            <div class="row g-3 align-items-center">
                <div class="col">
                    <input type="text" id="scan-input" class="form-control form-control-lg" placeholder="Escanear SKU o buscar producto...">
                </div>
                <div class="col-auto">
                    <button id="start-camera-scan-btn" class="btn btn-lg btn-outline-primary"><i class="bi bi-camera"></i></button>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Productos de la Auditoría</h5>
            <div id="toggle-correct-products-container" class="form-check form-switch d-none">
                <input class="form-check-input" type="checkbox" id="toggle-correct-products-checkbox">
                <label class="form-check-label" for="toggle-correct-products-checkbox">Ocultar correctos</label>
            </div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>OT</th>
                            <th>Nombre</th>
                            <th>Cant. Doc.</th>
                            <th>Cant. Física</th>
                            <th>Novedad</th>
                            <th>Observaciones</th>
                            <th>Guardar</th>
                        </tr>
                    </thead>
                    <tbody id="auditor-products-table-body">
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card-footer text-end">
            <button id="collaborative-audit-btn" class="btn btn-outline-info me-2"><i class="bi bi-people"></i> Colaborar</button>
            <button id="save-all-btn" class="btn btn-primary me-2"><i class="bi bi-save-all"></i> Guardar Todo</button>
            <button id="finish-audit-btn" class="btn btn-success"><i class="bi bi-check-circle"></i> Finalizar Auditoría</button>
        </div>
    </div>
</div>
`;

export async function loadAuditorDashboard(token) {
    document.querySelector('.main-content').innerHTML = auditorListHTML;
    try {
        const audits = await api.fetchAudits();
        setAuditorAuditsList(audits);
        renderAuditorAuditsTable(audits, '#auditor-audits-table-body');
        setupAuditorDashboardListeners();
    } catch (error) {
        console.error('Error loading auditor dashboard:', error);
        showToast(`Error al cargar datos de auditor: ${error.message}`, 'error');
    }
}

export async function verAuditoria(auditId) {
    document.querySelector('.main-content').innerHTML = auditorDetailHTML;
    document.getElementById('back-to-audits-list')?.addEventListener('click', () => {
        loadAuditorDashboard();
    });
    try {
        const audit = await api.fetchAuditDetails(auditId);
        setCurrentAudit(audit);
        renderProductsTable(audit.productos);
        initWebSocket(auditId);
        setupAuditViewListeners();

        const toggleContainer = document.getElementById('toggle-correct-products-container');
        if (toggleContainer) {
            if (audit.colaboradores && audit.colaboradores.length > 0) {
                toggleContainer.classList.remove('d-none');
            } else {
                toggleContainer.classList.add('d-none');
            }
        }

        if (audit.estado === 'finalizada') {
            document.querySelectorAll('#auditor-products-table-body input, #auditor-products-table-body select, #auditor-products-table-body textarea, #auditor-products-table-body button').forEach(el => {
                el.disabled = true;
            });
            ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
            document.getElementById('scan-input')?.setAttribute('disabled', 'true');
            document.getElementById('start-camera-scan-btn')?.setAttribute('disabled', 'true');
        } else {
            document.querySelectorAll('#auditor-products-table-body input, #auditor-products-table-body select, #auditor-products-table-body textarea, #auditor-products-table-body button').forEach(el => {
                el.disabled = false;
            });
            ['save-all-btn', 'finish-audit-btn', 'collaborative-audit-btn'].forEach(id => document.getElementById(id)?.classList.remove('d-none'));
            document.getElementById('scan-input')?.removeAttribute('disabled');
            document.getElementById('start-camera-scan-btn')?.removeAttribute('disabled');
            document.getElementById('scan-input')?.focus();
        }
        updateCompliancePercentage(auditId);
    } catch (error) {
        showToast(`Error al ver la auditoría: ${error.message}`, 'error');
    }
}

function filterProducts(searchText) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;

    const lowerSearchText = searchText.trim().toLowerCase();
    const searchWords = lowerSearchText.split(' ').filter(w => w);
    const rows = tableBody.querySelectorAll('tr');

    if (!lowerSearchText) {
        rows.forEach(row => {
            if (row.style.display === 'none') {
                 row.style.display = '';
            }
        });
        return;
    }

    rows.forEach(row => {
        const sku = row.dataset.sku?.toLowerCase() || '';
        const description = row.cells[2]?.textContent.toLowerCase() || '';

        let isMatch = false;

        // 1. Exact SKU match
        if (sku === lowerSearchText) {
            isMatch = true;
        }

        // 2. Last 4 digits of SKU match
        if (!isMatch && /^\d{4}$/.test(lowerSearchText) && sku.endsWith(lowerSearchText)) {
            isMatch = true;
        }

        // 3. All search words in description
        if (!isMatch && searchWords.length > 0) {
            const allWordsMatch = searchWords.every(word => description.includes(word));
            if (allWordsMatch) {
                isMatch = true;
            }
        }
        
        row.style.display = isMatch ? '' : 'none';
    });
}

async function handleSkuScan(searchText) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;

    const visibleRows = Array.from(tableBody.querySelectorAll('tr')).filter(row => row.style.display !== 'none' && !row.querySelector('td[colspan="8"]'));
    const scanInput = document.getElementById('scan-input');

    if (scanInput) scanInput.value = '';
    filterProducts(''); // Reset filter regardless of outcome

    // Case 1: Exactly one product matches the filter
    if (visibleRows.length === 1) {
        await processFoundProduct(visibleRows[0]);

    // Case 2: Multiple products match -> Show selection modal
    } else if (visibleRows.length > 1) {
        ensureModal('product-selection-modal');
        const modalEl = document.getElementById('product-selection-modal');
        const selectionModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        const listContainer = document.getElementById('product-selection-list');
        listContainer.innerHTML = ''; // Clear previous items

        visibleRows.forEach(row => {
            const sku = row.dataset.sku;
            const name = row.cells[2].textContent;
            
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'list-group-item list-group-item-action';
            button.innerHTML = `<strong>${sku}</strong> - ${name}`;
            
            button.addEventListener('click', async () => {
                await processFoundProduct(row);
                selectionModal.hide();
            });
            
            listContainer.appendChild(button);
        });

        selectionModal.show();

    // Case 3: No products match -> Handle as potential surplus
    } else if (visibleRows.length === 0 && searchText.trim() !== '') {
        const isCollaborative = state.currentAudit && state.currentAudit.colaboradores && state.currentAudit.colaboradores.length > 0;
        if (isCollaborative) {
            speak("Producto no encontrado en la lista.");
            handleCollaborativeScanNotFound(searchText);
        } else {
            speak("Producto no encontrado.");
            // Maybe open a simplified surplus modal for single-user audits too?
            // For now, just a voice message as per original logic.
        }
    }
}

async function processFoundProduct(productRow) {
    const productId = parseInt(productRow.getAttribute('data-product-id'), 10);
    const productInState = state.currentAudit.productos.find(p => p.id === productId);
    const isCollaborative = state.currentAudit && state.currentAudit.colaboradores && state.currentAudit.colaboradores.length > 0;

    // For non-collaborative audits, if the product is scanned again, just focus the input.
    // This preserves the simple, fast workflow for single users unless a conflict arises.
    const lastScanned = state.lastScanned;
    if (!isCollaborative && lastScanned && lastScanned.sku === productInState.sku) {
        const physicalCountInput = productRow.querySelector('.physical-count');
        productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productRow.classList.add('highlight-manual');
        physicalCountInput.focus();
        physicalCountInput.select();
        setLastScanned(null); // Reset for next scan
        return;
    }

    // --- Smart Modal Logic (applies to ALL audits) ---
    if (productInState) {
        // SCENARIO A: Product already marked as CORRECT
        if (productInState.novedad === 'sin_novedad') {
            speak("Este producto ya fue verificado. Indica si encontraste un sobrante o una avería.");
            showDynamicDiscrepancyModal(productRow, productInState, 'conflict');
            return;
        }
        // SCENARIO B: Product already marked as MISSING
        if (productInState.novedad === 'faltante') {
            speak("Este producto tiene un faltante. Por favor, introduce la cantidad que encontraste.");
            showDynamicDiscrepancyModal(productRow, productInState, 'complete_missing');
            return;
        }
    }

    // --- Default Behavior ---
    // For collaborative audits, always show the generic discrepancy modal first.
    if (isCollaborative) {
        speak("Se encontró una discrepancia. Por favor, resuelve.");
        showDynamicDiscrepancyModal(productRow, productInState, 'generic');
    // For single-user audits, do the quick-scan workflow.
    } else {
        if (lastScanned && lastScanned.sku !== productInState.sku) {
            // Auto-save the previously scanned item as correct if user moved to a new one
            const lastProductRow = document.querySelector(`tr[data-sku="${lastScanned.sku}"]`);
            if (lastProductRow) {
                const lastProductId = lastProductRow.getAttribute('data-product-id');
                const docQuantity = parseInt(lastProductRow.querySelector('.doc-quantity').textContent, 10) || 0;
                try {
                    await api.updateProduct(state.currentAudit.id, lastProductId, { cantidad_fisica: docQuantity, novedad: 'sin_novedad', observaciones: '' });
                    lastProductRow.classList.add('is-saved');
                    lastProductRow.querySelector('.physical-count').value = docQuantity;
                    lastProductRow.querySelector('.novelty-select').value = 'sin_novedad';
                    setTimeout(() => lastProductRow.classList.remove('is-saved'), 1200);
                    updateCompliancePercentage(state.currentAudit.id);
                } catch (error) {
                    console.error(`Error al autoguardar producto ${lastScanned.sku}: ${error.message}`);
                }
            }
        }
        const currentDocQuantity = productRow.querySelector('.doc-quantity').textContent;
        speak(`Cantidad: ${currentDocQuantity}`);
        setLastScanned({ sku: productInState.sku, productId: productInState.id });
        document.getElementById('scan-input')?.focus();
    }
}


function showDynamicDiscrepancyModal(productRow, productState, mode) {
    ensureModal('discrepancy-modal');
    const modalEl = document.getElementById('discrepancy-modal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    const titleEl = document.getElementById('discrepancyModalLabel');
    const messageEl = document.getElementById('discrepancy-modal-message');
    const actionsContainer = document.getElementById('discrepancy-actions-container');
    const manualInputContainer = document.getElementById('discrepancy-manual-input-container');
    const quantityInput = document.getElementById('discrepancy-quantity');
    const quantityLabel = document.querySelector('label[for="discrepancy-quantity"]');
    const observationsInput = document.getElementById('discrepancy-observations');
    const confirmBtn = document.getElementById('confirm-discrepancy-btn');

    // Reset modal to a clean state
    actionsContainer.innerHTML = '';
    manualInputContainer.classList.add('d-none');
    confirmBtn.classList.add('d-none');
    confirmBtn.onclick = null; // Remove previous event listeners

    const docQuantity = parseInt(productRow.querySelector('.doc-quantity').textContent, 10);
    const physicalCount = parseInt(productState.cantidad_fisica, 10) || 0;
    const productName = productRow.cells[2].textContent;

    switch (mode) {
        case 'conflict':
            titleEl.textContent = 'Acción Adicional para Producto Verificado';
            messageEl.textContent = `El producto "${productName}" ya fue contado como correcto con ${physicalCount} unidades. ¿Qué acción deseas realizar?`;
            actionsContainer.innerHTML = `
                <button class="btn btn-lg btn-primary" id="modal-add-surplus-btn">Registrar Sobrante</button>
                <button class="btn btn-lg btn-secondary" id="modal-report-damage-btn">Reportar Avería</button>
            `;

            document.getElementById('modal-add-surplus-btn').onclick = () => {
                messageEl.textContent = 'Introduce la cantidad ADICIONAL encontrada.';
                actionsContainer.innerHTML = '';
                manualInputContainer.classList.remove('d-none');
                quantityLabel.textContent = 'Cantidad Sobrante';
                quantityInput.value = '1';
                observationsInput.value = 'Sobrante registrado tras verificación.';
                confirmBtn.classList.remove('d-none');
                confirmBtn.onclick = async () => {
                    const surplusQuantity = parseInt(quantityInput.value, 10);
                    if (!surplusQuantity || surplusQuantity <= 0) {
                        showToast('La cantidad sobrante debe ser mayor a cero.', 'error');
                        return;
                    }
                    const newTotal = physicalCount + surplusQuantity;
                    await updateProductAndClose(productRow, newTotal, 'sobrante', observationsInput.value);
                    modal.hide();
                };
            };

            document.getElementById('modal-report-damage-btn').onclick = () => {
                messageEl.textContent = 'Introduce la cantidad de unidades dañadas.';
                actionsContainer.innerHTML = '';
                manualInputContainer.classList.remove('d-none');
                quantityLabel.textContent = 'Cantidad Averiada';
                quantityInput.value = '1';
                observationsInput.value = 'Producto dañado.';
                confirmBtn.classList.remove('d-none');
                confirmBtn.onclick = async () => {
                    const damagedQuantity = parseInt(quantityInput.value, 10);
                    if (!damagedQuantity || damagedQuantity <= 0) {
                        showToast('La cantidad averiada debe ser mayor a cero.', 'error');
                        return;
                    }
                    const obs = `Avería: ${damagedQuantity}. ${observationsInput.value}`;
                    await updateProductAndClose(productRow, physicalCount, 'averia', obs);
                    modal.hide();
                };
            };
            break;

        case 'complete_missing':
            titleEl.textContent = 'Completar Faltante';
            messageEl.textContent = `Se reportó un faltante para "${productName}" (encontradas ${physicalCount} de ${docQuantity}). Introduce la cantidad que encontraste TÚ.`;
            manualInputContainer.classList.remove('d-none');
            quantityLabel.textContent = 'Cantidad Encontrada Ahora';
            quantityInput.value = '1';
            observationsInput.value = 'Completando faltante.';
            confirmBtn.classList.remove('d-none');
            confirmBtn.onclick = async () => {
                const foundQuantity = parseInt(quantityInput.value, 10);
                if (!foundQuantity || foundQuantity < 0) {
                    showToast('La cantidad debe ser cero o más.', 'error');
                    return;
                }
                const newTotal = physicalCount + foundQuantity;
                const newNovelty = newTotal > docQuantity ? 'sobrante' : (newTotal < docQuantity ? 'faltante' : 'sin_novedad');
                await updateProductAndClose(productRow, newTotal, newNovelty, observationsInput.value);
                modal.hide();
            };
            break;

        case 'generic':
        default:
            titleEl.textContent = 'Resolver Discrepancia';
            messageEl.textContent = `Discrepancia en ${productName} (SKU: ${productState.sku}). Documento: ${docQuantity}, Físico: ${physicalCount}.`;
            actionsContainer.innerHTML = `
                <button class="btn btn-lg btn-success" id="modal-confirm-match-btn">Confirmar ${docQuantity} Unidades</button>
                <button class="btn btn-lg btn-warning" id="modal-add-one-btn">Añadir 1 Unidad</button>
                <button class="btn btn-lg btn-info" id="modal-manual-entry-btn">Ingreso Manual</button>
            `;

            document.getElementById('modal-confirm-match-btn').onclick = async () => {
                await updateProductAndClose(productRow, docQuantity, 'sin_novedad', 'Confirmado por colaborador.');
                modal.hide();
            };
            document.getElementById('modal-add-one-btn').onclick = async () => {
                const newQuantity = physicalCount + 1;
                const novelty = newQuantity > docQuantity ? 'sobrante' : (newQuantity < docQuantity ? 'faltante' : 'sin_novedad');
                await updateProductAndClose(productRow, newQuantity, novelty, `Ajuste de +1 por colaborador. Total: ${newQuantity}`);
                modal.hide();
            };
            document.getElementById('modal-manual-entry-btn').onclick = () => {
                actionsContainer.innerHTML = '';
                manualInputContainer.classList.remove('d-none');
                quantityLabel.textContent = 'Cantidad Encontrada';
                confirmBtn.classList.remove('d-none');
                confirmBtn.onclick = async () => {
                    const newQuantity = parseInt(quantityInput.value, 10);
                    const novelty = newQuantity > docQuantity ? 'sobrante' : (newQuantity < docQuantity ? 'faltante' : 'sin_novedad');
                    await updateProductAndClose(productRow, newQuantity, novelty, observationsInput.value || 'Ajuste manual por colaborador.');
                    modal.hide();
                };
            };
            break;
    }
    modal.show();
}


function handleCollaborativeScanNotFound(scannedSku) {
    ensureModal('surplus-modal');
    const surplusModalEl = document.getElementById('surplus-modal');
    const surplusModal = bootstrap.Modal.getInstance(surplusModalEl) || new bootstrap.Modal(surplusModalEl);
    
    document.getElementById('surplus-modal-message').textContent = `El producto con SKU ${scannedSku} no se encontró. Registra el sobrante.`;
    const quantityInput = document.getElementById('surplus-quantity');
    const observationsInput = document.getElementById('surplus-observations');
    quantityInput.value = 1;
    observationsInput.value = 'Sobrante registrado por colaborador.';

    const confirmBtn = document.getElementById('confirm-surplus-btn');
    
    const handleConfirm = async () => {
        const productData = {
            sku: scannedSku,
            cantidad_fisica: parseInt(quantityInput.value, 10),
            observaciones: observationsInput.value
        };

        if (!productData.cantidad_fisica || productData.cantidad_fisica <= 0) {
            showToast('La cantidad debe ser un número mayor a cero.', 'error');
            return;
        }

        try {
            await api.addSurplusProduct(state.currentAudit.id, productData);
            showToast(`Sobrante para SKU ${scannedSku} registrado con éxito.`, 'success');
            surplusModal.hide();
        } catch (error) {
            showToast(`Error al registrar sobrante: ${error.message}`, 'error');
            console.error('Error adding surplus product:', error);
        }
    };
    
    // Replace the event listener to avoid duplicates
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('confirm-surplus-btn').addEventListener('click', handleConfirm);

    surplusModal.show();
}

async function updateProductAndClose(row, quantity, novelty, observation) {
    const productId = row.getAttribute('data-product-id');
    if (!productId) return;

    const updateData = {
        cantidad_fisica: quantity,
        novedad: novelty,
        observaciones: observation
    };

    try {
        await api.updateProduct(state.currentAudit.id, productId, updateData);
        row.querySelector('.physical-count').value = quantity;
        row.querySelector('.novelty-select').value = novelty;
        row.querySelector('.observations-area').value = observation;
        showToast(`Producto ${row.dataset.sku} actualizado.`, 'success');
        updateCompliancePercentage(state.currentAudit.id);
    } catch (error) {
        showToast(`Error al actualizar producto: ${error.message}`, 'error');
    }
}


async function saveProductData(row) {
    const productId = row.getAttribute('data-product-id');
    if (!productId) return true;

    const updateData = {
        cantidad_fisica: row.querySelector('.physical-count').value,
        novedad: row.querySelector('.novelty-select').value,
        observaciones: row.querySelector('.observations-area').value
    };

    try {
        await api.updateProduct(state.currentAudit.id, productId, updateData);
        row.classList.add('is-saved');
        setTimeout(() => row.classList.remove('is-saved'), 1200);
        updateCompliancePercentage(state.currentAudit.id);
        return true;
    } catch (error) {
        showToast(`Error al guardar producto ${productId}: ${error.message}`, 'error');
        console.error(`Failed to save product ${productId}:`, error);
        return false;
    }
}

function updateNoveltyAndObservation(row) {
    const physicalCountInput = row.querySelector('.physical-count');
    const physicalCount = parseInt(physicalCountInput.value, 10);
    const docQuantity = parseInt(row.querySelector('.doc-quantity').textContent, 10);
    const noveltySelect = row.querySelector('.novelty-select');
    const observationsArea = row.querySelector('.observations-area');

    if (isNaN(physicalCount) || isNaN(docQuantity)) return;

    const diff = physicalCount - docQuantity;

    if (diff === 0) {
        noveltySelect.value = 'sin_novedad';
        observationsArea.value = '';
    } else if (diff < 0) {
        noveltySelect.value = 'faltante';
        observationsArea.value = `Faltante: ${Math.abs(diff)}`;
    } else { // diff > 0
        noveltySelect.value = 'sobrante';
        observationsArea.value = `Sobrante: ${diff}`;
    }
}

function toggleCorrectProducts(hide) {
    const tableBody = document.getElementById('auditor-products-table-body');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const docQuantityEl = row.querySelector('.doc-quantity');
        const physicalCountInput = row.querySelector('.physical-count');

        if (docQuantityEl && physicalCountInput && physicalCountInput.value) {
            const docQuantity = parseInt(docQuantityEl.textContent, 10);
            const physicalCount = parseInt(physicalCountInput.value, 10);

            if (docQuantity === physicalCount) {
                row.style.display = hide ? 'none' : '';
            }
        }
    });
}

function setupAuditViewListeners() {
    const productsTable = document.getElementById('auditor-products-table-body');
    if (!productsTable) return;

    productsTable.addEventListener('click', async (e) => {
        if (e.target.closest('.save-product-btn')) {
            const row = e.target.closest('tr');
            await saveProductData(row);
            speak('Guardado');
        }
    });

    productsTable.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && e.target.matches('.physical-count')) {
            e.preventDefault();
            const row = e.target.closest('tr');
            
            updateNoveltyAndObservation(row);
            
            await saveProductData(row);
            speak('Guardado');

            document.getElementById('scan-input')?.focus();
        }
    });

    productsTable.addEventListener('change', (e) => {
        if (e.target.matches('.physical-count')) {
            const row = e.target.closest('tr');
            updateNoveltyAndObservation(row);
        }
    });

    document.getElementById('toggle-correct-products-checkbox')?.addEventListener('change', (e) => {
        toggleCorrectProducts(e.target.checked);
    });

    document.getElementById('save-all-btn')?.addEventListener('click', async () => {
        const rows = productsTable.querySelectorAll('tr');
        speak('Guardando todos los cambios.');
        const savePromises = Array.from(rows).map(row => saveProductData(row));
        
        try {
            await Promise.all(savePromises);
            showToast('Todos los cambios han sido guardados.', 'success');
        } catch (error) {
            showToast('Ocurrió un error al guardar todo. Revisa la consola.', 'error');
            console.error("Error during save all:", error);
        }
    });

    document.getElementById('finish-audit-btn')?.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que quieres finalizar esta auditoría? No podrás hacer más cambios.')) {
            return;
        }
        try {
            await api.finishAudit(state.currentAudit.id);
            showToast('Auditoría finalizada con éxito.', 'success');
            speak('Auditoría finalizada');
            await verAuditoria(state.currentAudit.id);
        } catch (error) {
            showToast(`Error al finalizar la auditoría: ${error.message}`, 'error');
        }
    });

    document.getElementById('collaborative-audit-btn')?.addEventListener('click', async () => {
        ensureModal('collaborativeAuditModal');
        const modalEl = document.getElementById('collaborativeAuditModal');
        if (!modalEl || !state.currentAudit) return;

        const modal = new bootstrap.Modal(modalEl);

        try {
            const allAuditors = await api.fetchAuditors();
            if (!Array.isArray(allAuditors)) {
                console.error('Se esperaba un array de auditores, pero se recibió:', allAuditors);
                throw new Error('La respuesta de la API de auditores no es válida.');
            }

            const currentUserId = parseInt(localStorage.getItem('user_id'), 10);
            const currentCollaboratorIds = (state.currentAudit.collaborators || []).map(c => c.id);
            const listContainer = document.getElementById('collaborative-auditors-list');
            listContainer.innerHTML = '';

            allAuditors.forEach(auditor => {
                if (auditor.id === currentUserId) return;
                const isChecked = currentCollaboratorIds.includes(auditor.id);
                const item = document.createElement('label');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    ${auditor.nombre}
                    <input class="form-check-input" type="checkbox" value="${auditor.id}" ${isChecked ? 'checked' : ''}>
                `;
                listContainer.appendChild(item);
            });

            modal.show();
        } catch (error) {
            showToast(`Error al cargar auditores: ${error.message}`, 'error');
        }
    });

    document.getElementById('confirm-collaborative-audit')?.addEventListener('click', async () => {
        const selectedCheckboxes = document.querySelectorAll('#collaborative-auditors-list .form-check-input:checked');
        const collaboratorIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value, 10));
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('collaborativeAuditModal'));

        try {
            await api.addCollaborators(state.currentAudit.id, collaboratorIds);
            showToast('Colaboradores actualizados con éxito.', 'success');
            modalInstance?.hide();
            await verAuditoria(state.currentAudit.id);
        } catch (error) {
            showToast(`Error al asignar colaboradores: ${error.message}`, 'error');
        }
    });
}

function setupAuditorDashboardListeners() {
    const uploadForm = document.getElementById('uploadForm');
    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('audit-file-input');
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (!fileInput.files || fileInput.files.length === 0) return showToast("Selecciona al menos un archivo.", 'info');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo...';
        try {
            const result = await api.uploadAuditFiles(fileInput.files);
            showToast(`✅ Auditoría creada con éxito! ID: ${result.audit_id}`, 'success');
            loadAuditorDashboard(); // Recarga el dashboard del auditor
        } catch (error) {
            showToast(`❌ Error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivos';
        }
    });

    const btnShow = document.getElementById('show-finished-audits-btn');
    const btnHide = document.getElementById('hide-finished-audits-btn');
    
    btnShow?.addEventListener('click', () => {
        renderAuditorAuditsTable(state.auditorAuditsList, '#auditor-audits-table-body', true);
        btnShow.classList.add('d-none');
        btnHide.classList.remove('d-none');
    });

    btnHide?.addEventListener('click', () => {
        renderAuditorAuditsTable(state.auditorAuditsList, '#auditor-audits-table-body', false);
        btnHide.classList.add('d-none');
        btnShow.classList.remove('d-none');
    });

    const scanInput = document.getElementById('scan-input');
    scanInput?.addEventListener('input', (e) => filterProducts(e.target.value));

    scanInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita cualquier comportamiento por defecto del Enter
            handleSkuScan(e.target.value);
        }
    });

    const startCameraScanBtn = document.getElementById('start-camera-scan-btn');
    startCameraScanBtn?.addEventListener('click', () => {
        const scannerContainer = document.getElementById('scanner-container');
        scannerContainer?.classList.remove('d-none');
        const html5QrCode = new Html5Qrcode("reader");
        setHtml5QrCode(html5QrCode);

        const qrCodeSuccessCallback = (decodedText) => {
            playBeep();
            handleSkuScan(decodedText);
            html5QrCode.stop().then(() => {
                scannerContainer.classList.add('d-none');
                setHtml5QrCode(null);
            });
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
            .catch(err => showToast("No se pudo iniciar el escáner.", 'error'));
    });

    const closeScannerBtn = document.getElementById('close-scanner-btn');
    closeScannerBtn?.addEventListener('click', () => {
        if (state.html5QrCode) {
            state.html5QrCode.stop().then(() => {
                document.getElementById('scanner-container').classList.add('d-none');
                setHtml5QrCode(null);
            });
        }
    });
}
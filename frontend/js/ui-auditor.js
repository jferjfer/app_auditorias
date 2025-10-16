import * as api from './api.js';
import { showToast, renderAuditorAuditsTable, renderProductsTable, speak, updateCompliancePercentage, playBeep } from './ui-helpers.js';
import { state, setAuditorAuditsList, setCurrentAudit, setLastScanned, setHtml5QrCode } from './state.js';
import { initWebSocket } from './websockets.js';

export async function loadAuditorDashboard(token) {
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

async function handleSkuScan(scannedSku) {
    const scanInput = document.getElementById('scan-input');
    if (!scannedSku) return;

    scannedSku = scannedSku.trim().toUpperCase().replace(/^0+/, '');
    if (scanInput) scanInput.value = '';

    const isCollaborative = state.currentAudit && state.currentAudit.colaboradores && state.currentAudit.colaboradores.length > 0;

    if (isCollaborative) {
        speak("Procesando SKU");
        const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);

        if (!productRow) {
            speak("Producto no encontrado en la lista.");
            handleCollaborativeScanNotFound(scannedSku);
        } else {
            if (productRow.style.display === 'none') {
                productRow.style.display = '';
                speak('Producto re-escaneado, registrando novedad.');
            } else {
                const novelty = productRow.querySelector('.novelty-select').value;
                const docQuantity = parseInt(productRow.querySelector('.doc-quantity').textContent, 10);
                const physicalCount = parseInt(productRow.querySelector('.physical-count').value, 10) || 0;

                switch (novelty) {
                    case 'faltante':
                        speak(`Faltaban ${docQuantity - physicalCount}`);
                        break;
                    case 'sobrante':
                        speak(`Sobraban ${physicalCount - docQuantity}`);
                        break;
                    case 'averia':
                        speak(`Producto registrado con avería`);
                        break;
                    default:
                        speak("");
                        break;
                }
            }
            handleCollaborativeScanFound(productRow);
        }
    } else {
        const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);
        if (!productRow) {
            speak(`Producto no encontrado.`);
            setLastScanned(null);
            return;
        }

        const lastScanned = state.lastScanned;
        const productId = productRow.getAttribute('data-product-id');

        if (lastScanned && lastScanned.sku === scannedSku) {
            const physicalCountInput = productRow.querySelector('.physical-count');
            productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productRow.classList.add('highlight-manual');
            physicalCountInput.focus();
            physicalCountInput.select();
            setLastScanned(null);
            return;
        }

        if (lastScanned && lastScanned.sku !== scannedSku) {
            const lastProductRow = document.querySelector(`tr[data-sku="${lastScanned.sku}"]`);
            if (lastProductRow) {
                const lastProductId = lastProductRow.getAttribute('data-product-id');
                const docQuantity = parseInt(lastProductRow.querySelector('.doc-quantity').textContent, 10) || 0;
                try {
                    await api.updateProduct(state.currentAudit.id, lastProductId, {
                        cantidad_fisica: docQuantity,
                        novedad: 'sin_novedad',
                        observaciones: ''
                    });
                    lastProductRow.classList.add('is-saved');
                    lastProductRow.querySelector('.physical-count').value = docQuantity;
                    lastProductRow.querySelector('.novelty-select').value = 'sin_novedad';
                    setTimeout(() => lastProductRow.classList.remove('is-saved'), 1200);
                    updateCompliancePercentage(state.currentAudit.id);
                } catch (error) {
                    console.error(`Error al autoguardar producto ${lastScanned.sku}: ${error.message}`);
                    speak(`Error al guardar ${lastScanned.sku}`);
                }
            }
        }

        const currentDocQuantity = productRow.querySelector('.doc-quantity').textContent;
        speak(`Cantidad: ${currentDocQuantity}`);
        setLastScanned({ sku: scannedSku, productId: productId });
        if (scanInput) scanInput.focus();
    }
}

function handleCollaborativeScanNotFound(scannedSku) {
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

function handleCollaborativeScanFound(productRow) {
    const discrepancyModalEl = document.getElementById('discrepancy-modal');
    const discrepancyModal = bootstrap.Modal.getInstance(discrepancyModalEl) || new bootstrap.Modal(discrepancyModalEl);

    const docQuantity = parseInt(productRow.querySelector('.doc-quantity').textContent, 10);
    const physicalCount = parseInt(productRow.querySelector('.physical-count').value, 10) || 0;
    const productName = productRow.cells[2].textContent;
    const sku = productRow.dataset.sku;

    document.getElementById('discrepancy-modal-message').textContent = `Discrepancia en ${productName} (SKU: ${sku}). Documento: ${docQuantity}, Físico: ${physicalCount}.`;

    const actionsContainer = document.getElementById('discrepancy-actions-container');
    actionsContainer.innerHTML = `
        <button class="btn btn-lg btn-success" id="confirm-match-btn">Confirmar ${docQuantity} Unidades</button>
        <button class="btn btn-lg btn-warning" id="add-one-btn">Añadir 1 Unidad</button>
        <button class="btn btn-lg btn-info" id="manual-entry-btn">Ingreso Manual</button>
    `;

    const manualInputContainer = document.getElementById('discrepancy-manual-input-container');
    const confirmDiscrepancyBtn = document.getElementById('confirm-discrepancy-btn');
    const discrepancyQuantityInput = document.getElementById('discrepancy-quantity');
    const discrepancyObservationsInput = document.getElementById('discrepancy-observations');

    const hideManualInput = () => {
        manualInputContainer.classList.add('d-none');
        confirmDiscrepancyBtn.classList.add('d-none');
        discrepancyQuantityInput.value = '';
        discrepancyObservationsInput.value = '';
    };

    hideManualInput();

    const updateAndClose = async (quantity, novelty, obs) => {
        await updateProductAndClose(productRow, quantity, novelty, obs);
        discrepancyModal.hide();
    };

    document.getElementById('confirm-match-btn').addEventListener('click', () => {
        updateAndClose(docQuantity, 'sin_novedad', 'Confirmado por colaborador.');
    });

    document.getElementById('add-one-btn').addEventListener('click', () => {
        const newQuantity = physicalCount + 1;
        const novelty = newQuantity > docQuantity ? 'sobrante' : (newQuantity < docQuantity ? 'faltante' : 'sin_novedad');
        updateAndClose(newQuantity, novelty, `Ajuste de +1 por colaborador. Total: ${newQuantity}`);
    });

    document.getElementById('manual-entry-btn').addEventListener('click', () => {
        manualInputContainer.classList.remove('d-none');
        confirmDiscrepancyBtn.classList.remove('d-none');
        discrepancyQuantityInput.focus();
    });

    confirmDiscrepancyBtn.addEventListener('click', () => {
        const newQuantity = parseInt(discrepancyQuantityInput.value, 10);
        const novelty = newQuantity > docQuantity ? 'sobrante' : (newQuantity < docQuantity ? 'faltante' : 'sin_novedad');
        updateAndClose(newQuantity, novelty, discrepancyObservationsInput.value || 'Ajuste manual por colaborador.');
    });

    discrepancyModal.show();
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
    scanInput?.addEventListener('change', (e) => handleSkuScan(e.target.value));

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
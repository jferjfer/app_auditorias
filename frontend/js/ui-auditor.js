import * as api from './api.js';
import { showToast, renderAuditorAuditsTable, renderProductsTable, speak, updateCompliancePercentage, playBeep } from './ui-helpers.js';

export async function loadAuditorDashboard(token) {
    try {
        const auditorId = localStorage.getItem('user_id');
        const audits = await api.fetchAuditsByAuditor(auditorId);
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

    const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);
    if (!productRow) {
        speak(`Producto ${scannedSku} no encontrado.`);
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

function setupAuditViewListeners() {
    const productsTable = document.getElementById('auditor-products-table-body');
    if (!productsTable) return;

    productsTable.addEventListener('click', async (e) => {
        if (e.target.closest('.save-product-btn')) {
            const row = e.target.closest('tr');
            const productId = row.getAttribute('data-product-id');
            const updateData = {
                cantidad_fisica: row.querySelector('.physical-count').value,
                novedad: row.querySelector('.novelty-select').value,
                observaciones: row.querySelector('.observations-area').value
            };
            try {
                await api.updateProduct(state.currentAudit.id, productId, updateData);
                speak('Guardado');
                row.classList.add('is-saved');
                setTimeout(() => row.classList.remove('is-saved'), 1200);
                updateCompliancePercentage(state.currentAudit.id);
            } catch (error) {
                showToast(`Error al guardar: ${error.message}`, 'error');
            }
        }
    });
    
    // Other listeners like keydown for Enter, etc. can be added here
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
    
    // Listeners for save all, finish, collaborative audit buttons
    // These can be moved from ui.js or main.js
}

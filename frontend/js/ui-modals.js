export const collaborativeAuditModalHTML = `
<!-- Modal para Auditoría Colaborativa -->
<div class="modal fade" id="collaborativeAuditModal" tabindex="-1" aria-labelledby="collaborativeAuditModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 350px;">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="collaborativeAuditModalLabel">Asignar Colaboradores</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="collaborative-audit-form">
                    <div class="mb-3">
                        <p class="form-label">Selecciona uno o más auditores:</p>
                        <div id="collaborative-auditors-list" class="list-group" style="max-height: 200px; overflow-y: auto;">
                            <!-- Los auditores se renderizarán aquí dinámicamente -->
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="confirm-collaborative-audit">Asignar</button>
            </div>
        </div>
    </div>
</div>
`;

export const surplusModalHTML = `
<!-- Modal para Registrar Sobrante -->
<div class="modal fade" id="surplus-modal" tabindex="-1" aria-labelledby="surplusModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="surplusModalLabel">Registrar Sobrante</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p id="surplus-modal-message"></p>
                <div class="mb-3">
                    <label for="surplus-quantity" class="form-label">Cantidad Sobrante</label>
                    <input type="number" class="form-control" id="surplus-quantity" min="1">
                </div>
                <div class="mb-3">
                    <label for="surplus-observations" class="form-label">Observaciones</label>
                    <textarea class="form-control" id="surplus-observations"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="confirm-surplus-btn">Registrar Sobrante</button>
            </div>
        </div>
    </div>
</div>
`;

export const discrepancyModalHTML = `
<!-- Modal para Resolver Discrepancia -->
<div class="modal fade" id="discrepancy-modal" tabindex="-1" aria-labelledby="discrepancyModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="discrepancyModalLabel">Resolver Discrepancia</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p id="discrepancy-modal-message"></p>
                <div id="discrepancy-actions-container" class="d-grid gap-2">
                    <!-- Botones se insertan aquí dinámicamente -->
                </div>
                <div id="discrepancy-manual-input-container" class="d-none mt-3">
                    <div class="mb-3">
                        <label for="discrepancy-quantity" class="form-label">Cantidad Encontrada</label>
                        <input type="number" class="form-control" id="discrepancy-quantity" min="0">
                    </div>
                     <div class="mb-3">
                        <label for="discrepancy-observations" class="form-label">Observaciones</label>
                        <textarea class="form-control" id="discrepancy-observations"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary d-none" id="confirm-discrepancy-btn">Guardar</button>
            </div>
        </div>
    </div>
</div>
`;

export const productSelectionModalHTML = `
<!-- Modal para Selección de Producto Múltiple -->
<div class="modal fade" id="product-selection-modal" tabindex="-1" aria-labelledby="productSelectionModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="productSelectionModalLabel">Múltiples Coincidencias</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Se encontraron varios productos. Por favor, selecciona el correcto:</p>
                <div id="product-selection-list" class="list-group">
                    <!-- Los productos coincidentes se insertarán aquí -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
        </div>
    </div>
</div>
`;

const modalMap = {
    'collaborativeAuditModal': collaborativeAuditModalHTML,
    'surplus-modal': surplusModalHTML,
    'discrepancy-modal': discrepancyModalHTML,
    'product-selection-modal': productSelectionModalHTML
};

/**
 * Injects a modal's HTML into the DOM if it doesn't already exist.
 * @param {string} modalId The ID of the modal element to ensure exists.
 */
export function ensureModal(modalId) {
    if (!document.getElementById(modalId)) {
        const modalHTML = modalMap[modalId];
        if (modalHTML) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }
}

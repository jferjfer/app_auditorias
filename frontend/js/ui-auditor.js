import * as api from './api.js';
import { showToast, renderAuditorAuditsTable, renderProductsTable, speak, updateCompliancePercentage, playBeep } from './ui-helpers.js';
import { state, setAuditorAuditsList, setCurrentAudit, setLastScanned, setHtml5QrCode } from './state.js';
import { initWebSocket } from './websockets.js';
import { ensureModal } from './ui-modals.js';

const auditorDashboardHTML = `
        <div id="auditor-dashboard" class="dashboard-section">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4">
                <h1 id="auditor-title" class="h2 fw-bold">Dashboard del Auditor</h1>
            </div>
            
            <!-- Panel Superior -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Porcentaje de Auditoría</h5>
                            <div id="compliance-percentage" class="progress-circle mx-auto">N/A</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Cargar Archivos de Auditoría</h5>
                            <form id="uploadForm" class="mb-3">
                                <div class="input-group">
                                    <input type="file" class="form-control" id="audit-file-input" accept=".xlsx,.xls" multiple>
                                    <button class="btn btn-primary" type="submit">
                                        <i class="bi bi-upload"></i> Subir Archivos
                                    </button>
                                </div>
                                <small class="form-text text-muted">
                                    <b>Selecciona tus archivos</b> Cada archivo debe ser una orden de traslado.
                                </small>
                                <div id="selected-files" class="mt-2"></div>
                            </form>
                            <hr class="border-secondary">
                            <h5 class="card-title">Escaneo de Productos</h5>
                            <div class="input-group">
                                <span class="input-group-text" id="scan-icon"><i class="bi bi-qr-code-scan"></i></span>
                                <input type="text" class="form-control" placeholder="Escanea el SKU del producto..." id="scan-input">
                                <button class="btn btn-outline-secondary" type="button" id="start-camera-scan-btn" title="Escanear con cámara">
                                    <i class="bi bi-camera-video"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tabla de Auditorías -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title">Mis Auditorías</h5>
                                <div class="btn-group" role="group">
                                    <button id="show-finished-audits-btn" class="btn btn-outline-secondary" type="button">
                                        <i class="bi bi-archive"></i> Ver auditorías finalizadas
                                    </button>
                                    <button id="hide-finished-audits-btn" class="btn btn-outline-secondary d-none" type="button">
                                        <i class="bi bi-arrow-left"></i> Volver a auditorías activas
                                    </button>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover table-dark">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Orden de traslado</th>
                                            <th>Fecha</th>
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
            </div>
            
            <!-- Tabla de Productos -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Productos de la Auditoría</h5>
                            <div class="table-responsive">
                                <table class="table table-hover table-dark">
                                    <thead>
                                        <tr>
                                            <th>SKU</th>
                                            <th>Orden de Traslado</th>
                                            <th>Nombre</th>
                                            <th>Cantidad Documento</th>
                                            <th>Cantidad Física</th>
                                            <th>Novedad</th>
                                            <th>Observaciones</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="auditor-products-table-body">
                                    </tbody>
                                </table>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                                <button class="btn btn-success d-none" id="save-all-btn">
                                    <i class="bi bi-save"></i> Guardar Auditoría
                                </button>
                                <button class="btn btn-info text-white d-none" id="finish-audit-btn">
                                    <i class="bi bi-check-circle"></i> Finalizar Auditoría
                                </button>
                                <button id="collaborative-audit-btn" class="btn btn-outline-primary d-none" type="button">
                                    <i class="bi bi-people"></i> Auditoría Colaborativa
                                </button>
                            </div>
                            <!-- Panel de Auditoría Colaborativa (reemplaza el modal) -->
                            <div id="collaborative-panel" class="d-none mt-4" tabindex="-1">
                                <h5 class="text-white">Asignar Colaboradores</h5>
                                <form id="collaborative-audit-form">
                                    <div class="mb-3">
                                        <label for="collaborative-auditors-select" class="form-label">Selecciona uno o más auditores:</label>
                                        <select id="collaborative-auditors-select" class="form-select" multiple required>
                                            <!-- Opciones generadas dinámicamente -->
                                        </select>
                                        <div class="form-text">Puedes seleccionar varios auditores manteniendo presionada la tecla Ctrl (o Cmd en Mac).</div>
                                    </div>
                                    <div class="d-flex justify-content-end">
                                        <button type="button" class="btn btn-secondary me-2" id="cancel-collaborative-audit">Cancelar</button>
                                        <button type="submit" class="btn btn-primary" id="confirm-collaborative-audit">Asignar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
`;
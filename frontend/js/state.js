
export const state = {
    websocket: null,
    currentAudit: null,
    lastFocusedQuantityInput: null,
    chartInstances: {},
    html5QrCode: null,
    editingUserId: null,
    auditorAuditsList: [],
    analystAudits: [], // Para almacenar las auditorías del dashboard de analista
};

export function setWebSocket(ws) {
    state.websocket = ws;
}

export function setCurrentAudit(audit) {
    state.currentAudit = audit;
}

export function setLastFocusedQuantityInput(input) {
    state.lastFocusedQuantityInput = input;
}

export function setChartInstance(name, instance) {
    if (state.chartInstances[name]) {
        state.chartInstances[name].destroy();
    }
    state.chartInstances[name] = instance;
}

export function setHtml5QrCode(instance) {
    state.html5QrCode = instance;
}

export function setEditingUserId(id) {
    state.editingUserId = id;
}

export function setAuditorAuditsList(audits) {
    state.auditorAuditsList = audits;
}

export function setAnalystAudits(audits) {
    state.analystAudits = audits;
}

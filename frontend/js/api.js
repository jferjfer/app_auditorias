const DEPLOYMENT_URL = 'https://app-auditorias.onrender.com';
const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
export const API_URL = IS_LOCAL ? 'http://127.0.0.1:8000' : DEPLOYMENT_URL;

const getToken = () => localStorage.getItem('access_token');

async function fetchApi(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        let errorDetail = 'API request failed';
        try {
            const error = await response.json();
            errorDetail = error.detail || JSON.stringify(error);
        } catch (e) {
            // Not a JSON response
            errorDetail = response.statusText;
        }
        throw new Error(errorDetail);
    }
    // Handle responses with no content
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export async function loginUser(email, password) {
    const url = `${API_URL}/api/auth/login`;
    const body = new URLSearchParams({ username: email, password });
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }
    return response.json();
}



export async function fetchCurrentUser() {
    return fetchApi(`${API_URL}/api/users/me/`);
}

export async function fetchAudits(filters = {}) {
    const params = new URLSearchParams(filters);
    return fetchApi(`${API_URL}/api/audits/?${params.toString()}`);
}

export async function fetchAuditors() {
    return fetchApi(`${API_URL}/api/users/auditors/`);
}

export async function fetchAuditsByAuditor(auditorId) {
    return fetchApi(`${API_URL}/api/audits/auditor/${auditorId}`);
}

export async function fetchAllUsers() {
    return fetchApi(`${API_URL}/api/users/`);
}

export async function iniciarAuditoria(auditId) {
    return fetchApi(`${API_URL}/api/audits/${auditId}/iniciar`, { method: 'PUT' });
}

export async function fetchAuditDetails(auditId) {
    return fetchApi(`${API_URL}/api/audits/${auditId}`);
}

export async function updateProduct(auditId, productId, updateData) {
    const body = JSON.stringify(updateData);
    return fetchApi(`${API_URL}/api/audits/${auditId}/products/${productId}`, { method: 'PUT', body });
}

export async function bulkUpdateProducts(auditId, products) {
    const body = JSON.stringify({ products });
    return fetchApi(`${API_URL}/api/audits/${auditId}/products/bulk-update`, { method: 'POST', body });
}

export async function finishAudit(auditId) {
    return fetchApi(`${API_URL}/api/audits/${auditId}/finish`, { method: 'PUT' });
}

export async function addCollaborators(auditId, collaborator_ids) {
    const body = JSON.stringify({ collaborator_ids });
    return fetchApi(`${API_URL}/api/audits/${auditId}/collaborators`, { method: 'POST', body });
}

export async function downloadReport(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/api/audits/report?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to download report');
    }
    return response.blob();
}

export async function fetchUser(userId) {
    return fetchApi(`${API_URL}/api/users/${userId}`);
}

export async function deleteUser(userId) {
    return fetchApi(`${API_URL}/api/users/${userId}`, { method: 'DELETE' });
}

export async function updateUser(userId, userData) {
    const body = JSON.stringify(userData);
    return fetchApi(`${API_URL}/api/users/${userId}`, { method: 'PUT', body });
}

export async function createUser(userData) {
    const body = JSON.stringify(userData);
    return fetchApi(`${API_URL}/api/users/`, { method: 'POST', body });
}

export async function fetchReportData(filters = {}) {
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'Todos')
    );
    const params = new URLSearchParams(cleanFilters);
    return fetchApi(`${API_URL}/api/audits/report/details?${params.toString()}`);
}

export async function uploadAuditFiles(files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    const response = await fetch(`${API_URL}/api/audits/upload-multiple-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'File upload failed');
    }
    return response.json();
}

// --- Statistics API Calls ---

// helper to build query strings from filter objects
function buildQueryString(filters = {}) {
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== 'Todos')
    );
    const params = new URLSearchParams(cleanFilters);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

export async function getAuditStatusStatistics(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/status${queryString}`);
}

export async function getAverageComplianceStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/average-compliance${queryString}`);
}

export async function getNoveltyDistributionStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/novelty-distribution${queryString}`);
}

export async function getComplianceByAuditorStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/compliance-by-auditor${queryString}`);
}

export async function getAuditsByPeriodStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/audits-by-period${queryString}`);
}

export async function getTopNoveltySkusStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/top-novelty-skus${queryString}`);
}

export async function getAverageAuditDurationStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/statistics/average-audit-duration${queryString}`);
}

export async function getAuditsWithFilters(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`${API_URL}/api/audits/report/details${queryString}`);
}
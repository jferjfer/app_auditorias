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
        // Si el token ha expirado o no es válido, el servidor devolverá un 401.
        // En ese caso, limpiamos el estado de la sesión y recargamos la página
        // para forzar al usuario a iniciar sesión de nuevo.
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_id');
            window.location.reload();
            // Arrojamos un error para detener la ejecución del script actual
            throw new Error('Sesión expirada. Por favor, inicie sesión de nuevo.');
        }

        let errorDetail = 'API request failed';
        try {
            const error = await response.json();
            if (typeof error.detail === 'string') {
                errorDetail = error.detail;
            } else if (error.detail && typeof error.detail.msg === 'string') {
                errorDetail = error.detail.msg;
            } else {
                errorDetail = JSON.stringify(error);
            }
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
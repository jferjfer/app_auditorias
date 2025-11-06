// Lee la URL base de la API desde las variables de entorno de Vite (VITE_API_BASE) o usa el mismo origen por defecto.
const API_BASE = import.meta.env.VITE_API_BASE || '';
export const API_BASE_URL = API_BASE;

// Helper para obtener el token de autenticación
const getToken = () => localStorage.getItem('access_token');

// Helper para construir las opciones de fetch, incluyendo autenticación.
function buildOptions(method = 'GET', body) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) {
    // Si el body es FormData, no establecemos Content-Type para que el navegador lo haga automáticamente.
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }
  return options;
}

// Helper para construir query strings a partir de un objeto de parámetros.
function buildQueryString(params) {
  if (!params) return '';
  const esc = encodeURIComponent;
  const query = Object.keys(params)
    .filter(k => {
      const val = params[k];
      // Filtrar valores vacíos, null, undefined, 'Todos', y strings vacíos después de trim
      return val !== undefined && 
             val !== null && 
             val !== '' && 
             val !== 'Todos' && 
             (typeof val !== 'string' || val.trim() !== '');
    })
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query ? `?${query}` : '';
}

// Helper genérico para realizar las peticiones a la API.
async function fetchApi(endpoint, options) {
    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
        let errorDetail = 'La petición a la API falló';
        try {
            const error = await response.json();
            errorDetail = error.detail || JSON.stringify(error);
        } catch (e) {
            errorDetail = response.statusText;
        }
        throw new Error(errorDetail);
    }

    if (response.status === 204) {
        return null; // No content
    }
    // Para descargas de archivos
    if (options && options.headers && options.headers['Accept'] === 'application/octet-stream') {
        return response.blob();
    }

    return response.json();
}


// --- Autenticación y Usuarios ---

export async function loginUser(email, password) {
    const url = `${API_BASE}/api/auth/login`;
    const body = new URLSearchParams({ username: email, password });
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login fallido');
    }
    return response.json();
}

export async function fetchCurrentUser() {
    return fetchApi('/api/users/me/', buildOptions('GET'));
}

export async function fetchAllUsers() {
    return fetchApi('/api/users/', buildOptions('GET'));
}

export async function fetchUser(userId) {
    return fetchApi(`/api/users/${userId}`, buildOptions('GET'));
}

export async function createUser(userData) {
    return fetchApi('/api/users/', buildOptions('POST', userData));
}

export async function updateUser(userId, userData) {
    return fetchApi(`/api/users/${userId}`, buildOptions('PUT', userData));
}

export async function deleteUser(userId) {
    return fetchApi(`/api/users/${userId}`, buildOptions('DELETE'));
}

export async function fetchAuditors() {
    return fetchApi('/api/users/auditors/', buildOptions('GET'));
}


// --- Auditorías ---

export async function fetchAudits(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/${queryString}`, buildOptions('GET'));
}

export async function fetchAuditDetails(auditId) {
    return fetchApi(`/api/audits/${auditId}`, buildOptions('GET'));
}

export async function fetchAuditsByAuditor(auditorId) {
    return fetchApi(`/api/audits/auditor/${auditorId}`, buildOptions('GET'));
}

export async function uploadAuditFiles(files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    return fetchApi('/api/audits/upload-multiple-files', buildOptions('POST', formData));
}

export async function iniciarAuditoria(auditId) {
    return fetchApi(`/api/audits/${auditId}/iniciar`, buildOptions('PUT'));
}

export async function finishAudit(auditId) {
    return fetchApi(`/api/audits/${auditId}/finish`, buildOptions('PUT'));
}

export async function updateProduct(auditId, productId, updateData) {
    return fetchApi(`/api/audits/${auditId}/products/${productId}`, buildOptions('PUT', updateData));
}

export async function bulkUpdateProducts(auditId, products) {
    return fetchApi(`/api/audits/${auditId}/products/bulk-update`, buildOptions('POST', { products }));
}

export async function addCollaborators(auditId, collaborator_ids) {
    return fetchApi(`/api/audits/${auditId}/collaborators`, buildOptions('POST', { collaborator_ids }));
}


// --- Reportes y Estadísticas ---

export async function fetchStats(filters = {}) {
    const queryString = buildQueryString(filters);
    const statsPromises = [
        getAuditStatusStatistics(filters),
        getAverageComplianceStatistic(filters),
        getNoveltyDistributionStatistic(filters),
        getComplianceByAuditorStatistic(filters),
        getAuditsByPeriodStatistic(filters),
        getTopNoveltySkusStatistic(filters),
        getAverageAuditDurationStatistic(filters)
    ];

    const [
        status,
        averageCompliance,
        noveltyDistribution,
        complianceByAuditor,
        auditsByPeriod,
        topNoveltySkus,
        averageAuditDuration
    ] = await Promise.all(statsPromises);

    return {
        status,
        averageCompliance,
        noveltyDistribution,
        complianceByAuditor,
        auditsByPeriod,
        topNoveltySkus,
        averageAuditDuration
    };
}

export async function fetchReportData(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/report/details${queryString}`, buildOptions('GET'));
}

export async function downloadReport(filters = {}) {
    const queryString = buildQueryString(filters);
    const token = getToken();
    const response = await fetch(`${API_BASE}/api/audits/report${queryString}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        let errorDetail = 'Fallo al descargar el reporte';
        try {
            const error = await response.json();
            errorDetail = error.detail || JSON.stringify(error);
        } catch (e) {
            errorDetail = response.statusText;
        }
        throw new Error(errorDetail);
    }
    return response.blob();
}

export async function getAuditStatusStatistics(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/status${queryString}`, buildOptions('GET'));
}

export async function getAverageComplianceStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/average-compliance${queryString}`, buildOptions('GET'));
}

export async function getNoveltyDistributionStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/novelty-distribution${queryString}`, buildOptions('GET'));
}

export async function getComplianceByAuditorStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/compliance-by-auditor${queryString}`, buildOptions('GET'));
}

export async function getAuditsByPeriodStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/audits-by-period${queryString}`, buildOptions('GET'));
}

export async function getTopNoveltySkusStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/top-novelty-skus${queryString}`, buildOptions('GET'));
}

export async function getAverageAuditDurationStatistic(filters = {}) {
    const queryString = buildQueryString(filters);
    return fetchApi(`/api/audits/statistics/average-audit-duration${queryString}`, buildOptions('GET'));
}

// Exportar todo como un objeto default para compatibilidad
const api = {
    loginUser,
    fetchCurrentUser,
    fetchAllUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    fetchAuditors,
    fetchAudits,
    fetchAuditDetails,
    fetchAuditsByAuditor,
    uploadAuditFiles,
    iniciarAuditoria,
    finishAudit,
    updateProduct,
    bulkUpdateProducts,
    addCollaborators,
    fetchStats,
    fetchReportData,
    downloadReport,
    getAuditStatusStatistics,
    getAverageComplianceStatistic,
    getNoveltyDistributionStatistic,
    getComplianceByAuditorStatistic,
    getAuditsByPeriodStatistic,
    getTopNoveltySkusStatistic,
    getAverageAuditDurationStatistic,
};

export default api;
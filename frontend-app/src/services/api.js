// Lee la URL base de la API desde las variables de entorno de Vite (VITE_API_BASE) o usa el mismo origen por defecto.
const API_BASE = import.meta.env.VITE_API_BASE || '';
export const API_BASE_URL = API_BASE;

// Función auxiliar para obtener el token de autenticación
const getToken = () => localStorage.getItem('access_token');

// Función auxiliar para construir las opciones de fetch, incluyendo autenticación.
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

// Función auxiliar para construir query strings a partir de un objeto de parámetros.
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

// Función para renovar token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (!response.ok) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Sesión expirada');
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
}

// Función auxiliar genérica para realizar las peticiones a la API.
async function fetchApi(endpoint, options, auditContext = null) {
    let response = await fetch(`${API_BASE}${endpoint}`, options);

    // Si es 401, intentar renovar token
    if (response.status === 401) {
        try {
            const newToken = await refreshAccessToken();
            if (options.headers) {
                options.headers['Authorization'] = `Bearer ${newToken}`;
            }
            response = await fetch(`${API_BASE}${endpoint}`, options);
        } catch (refreshError) {
            if (auditContext) {
                try {
                    const { offlineDB } = await import('../utils/offlineDB');
                    await offlineDB.init();
                    await offlineDB.savePendingChange(
                        auditContext.auditId,
                        auditContext.productId,
                        auditContext.changes
                    );
                    window.dispatchEvent(new Event('pendingChangesUpdated'));
                    throw new Error('⚠️ Sesión expirada. Cambios guardados localmente.');
                } catch (offlineError) {
                    console.error('Error guardando offline:', offlineError);
                }
            }
            throw refreshError;
        }
    }

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

    if (response.status === 204) return null;
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

export async function uploadAuditFiles(files, ubicacionOrigenId, ubicacionDestinoId) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    
    let url = '/api/audits/upload-multiple-files';
    const params = [];
    if (ubicacionOrigenId) params.push(`ubicacion_origen_id=${ubicacionOrigenId}`);
    if (ubicacionDestinoId) params.push(`ubicacion_destino_id=${ubicacionDestinoId}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    return fetchApi(url, buildOptions('POST', formData));
}

export async function iniciarAuditoria(auditId, modo = 'normal') {
    return fetchApi(`/api/audits/${auditId}/iniciar?modo=${modo}`, buildOptions('PUT'));
}

export async function finishAudit(auditId) {
    return fetchApi(`/api/audits/${auditId}/finish`, buildOptions('PUT'));
}

export async function updateProduct(auditId, productId, updateData) {
    const auditContext = { auditId, productId, changes: updateData };
    return fetchApi(`/api/audits/${auditId}/products/${productId}`, buildOptions('PUT', updateData), auditContext);
}

export async function bulkUpdateProducts(auditId, products) {
    return fetchApi(`/api/audits/${auditId}/products/bulk-update`, buildOptions('POST', { products }));
}

export async function addCollaborators(auditId, collaborator_ids) {
    return fetchApi(`/api/audits/${auditId}/collaborators`, buildOptions('POST', { collaborator_ids }));
}

export async function fetchNoveltiesBySku(auditId) {
    return fetchApi(`/api/audits/${auditId}/novelties-by-sku`, buildOptions('GET'));
}

export async function fetchProductNovelties(auditId, productId) {
    return fetchApi(`/api/audits/${auditId}/products/${productId}/novelties`, buildOptions('GET'));
}


// --- Reportes y Estadísticas ---

export async function fetchStats(filters = {}) {
    const queryString = buildQueryString(filters);
    
    try {
        const statsPromises = [
            getAuditStatusStatistics(filters).catch(e => { console.error('Error status:', e); return { total: 0, pendientes: 0, en_progreso: 0, finalizadas: 0 }; }),
            getAverageComplianceStatistic(filters).catch(e => { console.error('Error compliance:', e); return { average_compliance: 0 }; }),
            getNoveltyDistributionStatistic(filters).catch(e => { console.error('Error novelty:', e); return []; }),
            getComplianceByAuditorStatistic(filters).catch(e => { console.error('Error by auditor:', e); return []; }),
            getAuditsByPeriodStatistic(filters).catch(e => { console.error('Error by period:', e); return []; }),
            getTopNoveltySkusStatistic(filters).catch(e => { console.error('Error top skus:', e); return []; }),
            getAverageAuditDurationStatistic(filters).catch(e => { console.error('Error duration:', e); return { average_duration_hours: 0 }; })
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
            status: status || { total: 0, pendientes: 0, en_progreso: 0, finalizadas: 0 },
            averageCompliance: averageCompliance || { average_compliance: 0 },
            noveltyDistribution: noveltyDistribution || [],
            complianceByAuditor: complianceByAuditor || [],
            auditsByPeriod: auditsByPeriod || [],
            topNoveltySkus: topNoveltySkus || [],
            averageAuditDuration: averageAuditDuration || { average_duration_hours: 0 }
        };
    } catch (error) {
        console.error('Error crítico en fetchStats:', error);
        // Retornar estructura vacía pero válida en caso de error total
        return {
            status: { total: 0, pendientes: 0, en_progreso: 0, finalizadas: 0 },
            averageCompliance: { average_compliance: 0 },
            noveltyDistribution: [],
            complianceByAuditor: [],
            auditsByPeriod: [],
            topNoveltySkus: [],
            averageAuditDuration: { average_duration_hours: 0 }
        };
    }
}

export async function fetchReportData(filters = {}) {
    const queryString = buildQueryString(filters);
    const response = await fetch(`${API_BASE}/api/audits/report/details${queryString}`, buildOptions('GET'));
    const text = await response.text();
    console.log('📦 Tamaño de respuesta:', text.length, 'caracteres');
    const data = JSON.parse(text);
    console.log('📊 Auditorías parseadas:', data.length);
    if (data.length > 0) {
        console.log('🔍 Primera auditoría productos:', data[0].productos?.length || 0);
    }
    return data;
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

// --- Ubicaciones ---
export async function fetchUbicaciones(tipo = null) {
    const queryString = tipo ? `?tipo=${tipo}` : '';
    return fetchApi(`/api/ubicaciones/${queryString}`, buildOptions('GET'));
}

export async function createUbicacion(ubicacionData) {
    return fetchApi('/api/ubicaciones/', buildOptions('POST', ubicacionData));
}

export async function deleteUbicacion(ubicacionId) {
    return fetchApi(`/api/ubicaciones/${ubicacionId}`, buildOptions('DELETE'));
}

export async function createUbicacionesBulk(nombres) {
    return fetchApi('/api/ubicaciones/bulk', buildOptions('POST', nombres));
}

export async function addOtToAudit(auditId, files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    return fetchApi(`/api/audits/${auditId}/add-ot`, buildOptions('POST', formData));
}

export async function addSurplusProduct(auditId, productData) {
    return fetchApi(`/api/audits/${auditId}/products`, buildOptions('POST', productData));
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
    fetchNoveltiesBySku,
    fetchProductNovelties,
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
    fetchUbicaciones,
    createUbicacion,
    deleteUbicacion,
    createUbicacionesBulk,
    addOtToAudit,
    addSurplusProduct
};

export default api;
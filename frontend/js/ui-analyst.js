import {
    getAuditStatusStatistics,
    getAverageComplianceStatistic,
    getNoveltyDistributionStatistic,
    getComplianceByAuditorStatistic,
    getAuditsByPeriodStatistic,
    getTopNoveltySkusStatistic,
    getAverageAuditDurationStatistic,
    getAuditsWithFilters
} from './api.js';
import { showToast } from './ui-helpers.js';

let auditStatusChart, complianceByAuditorChart, auditsByPeriodChart, noveltyDistributionChart;
    let isLoadingAnalystDashboard = false; // evita recargas concurrentes

    const chartColors = {
        primary: 'rgba(54, 162, 235, 0.6)',
        secondary: 'rgba(255, 99, 132, 0.6)',
        success: 'rgba(75, 192, 192, 0.6)',
        warning: 'rgba(255, 206, 86, 0.6)',
        info: 'rgba(153, 102, 255, 0.6)',
        danger: 'rgba(255, 159, 64, 0.6)'
    };

    const CHART_DEFAULTS = {
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                y: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    };

    function createChart(ctx, type, data, options = {}) {
        const config = { type, data, options: { ...CHART_DEFAULTS.options, ...options } };
        return new Chart(ctx, config);
    }

    async function loadDashboardData(startDate, endDate) {
        if (isLoadingAnalystDashboard) {
            console.debug('Analyst dashboard load already in progress — skipping duplicate call.');
            return;
        }
        isLoadingAnalystDashboard = true;

        const token = localStorage.getItem('access_token');
        if (!token) {
            console.warn('No auth token found, skipping analyst dashboard data load.');
            isLoadingAnalystDashboard = false;
            return;
        }

        const startedAt = Date.now();
        console.debug(`Analyst dashboard load START at ${new Date(startedAt).toISOString()} startDate=${startDate} endDate=${endDate}`);

        try {
            const [
                statusData,
                avgComplianceData,
                noveltyDistData,
                complianceByAuditorData,
                auditsByPeriodData,
                topSkusData,
                avgDurationData,
                recentAudits
            ] = await Promise.all([
                getAuditStatusStatistics(),
                getAverageComplianceStatistic(),
                getNoveltyDistributionStatistic(),
                getComplianceByAuditorStatistic(),
                getAuditsByPeriodStatistic(startDate, endDate),
                getTopNoveltySkusStatistic(10),
                getAverageAuditDurationStatistic(),
                getAuditsWithFilters({ start_date: startDate, end_date: endDate, limit: 10 })
            ]);

            // Basic shape validation
            if (!Array.isArray(statusData) || !Array.isArray(noveltyDistData) || !Array.isArray(complianceByAuditorData)) {
                console.warn('Analyst dashboard received unexpected data shapes', { statusData, noveltyDistData, complianceByAuditorData });
                showToast('Datos del dashboard incompletos o inconsistentes.', 'warning');
                return;
            }

            updateKPIs(statusData, avgComplianceData, avgDurationData, noveltyDistData);
            updateAuditStatusChart(statusData);
            updateComplianceByAuditorChart(complianceByAuditorData);
            updateAuditsByPeriodChart(auditsByPeriodData);
            updateNoveltyDistributionChart(noveltyDistData);
            updateTopNoveltySkusTable(topSkusData);
            updateRecentAuditsTable(recentAudits);

        } catch (error) {
            console.error('Error loading analyst dashboard data:', error);
            showToast('Error al cargar los datos del dashboard.', 'error');
        } finally {
            const finishedAt = Date.now();
            console.debug(`Analyst dashboard load END at ${new Date(finishedAt).toISOString()} duration_ms=${finishedAt - startedAt}`);
            isLoadingAnalystDashboard = false;
        }
    }

    function updateKPIs(statusData, avgComplianceData, avgDurationData, noveltyDistData) {
        const totalAudits = statusData.reduce((sum, s) => sum + (s.count || 0), 0);
        const avgCompliance = avgComplianceData && typeof avgComplianceData.average_compliance !== 'undefined'
            ? avgComplianceData.average_compliance
            : 0;
        const avgDuration = avgDurationData && typeof avgDurationData.average_duration_hours !== 'undefined'
            ? avgDurationData.average_duration_hours
            : 0;
        const totalNovelties = Array.isArray(noveltyDistData) ? noveltyDistData.reduce((s, n) => s + (n.count || 0), 0) : 0;

        const elTotal = document.getElementById('stats-total-audits');
        const elAvgComp = document.getElementById('stats-avg-compliance');
        const elAvgDur = document.getElementById('stats-avg-duration');
        const elTotalNov = document.getElementById('stats-total-novelties');

        if (elTotal) elTotal.textContent = totalAudits;
        if (elAvgComp) elAvgComp.textContent = `${Math.round(avgCompliance)}%`;
        if (elAvgDur) elAvgDur.textContent = Number(avgDuration).toFixed(1);
        if (elTotalNov) elTotalNov.textContent = totalNovelties;
    }

    function updateAuditStatusChart(data) {
        const ctxEl = document.getElementById('chart-audit-status');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        const labels = data.map(d => d.estado);
        const counts = data.map(d => d.count);

        if (auditStatusChart) auditStatusChart.destroy();
        auditStatusChart = createChart(ctx, 'doughnut', {
            labels,
            datasets: [{ data: counts, backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.warning, chartColors.success] }]
        }, { plugins: { legend: { display: true, position: 'bottom', labels: { color: '#ccc' } } } });
    }

    function updateComplianceByAuditorChart(data) {
        const ctxEl = document.getElementById('chart-compliance-by-auditor');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        const labels = data.map(d => d.auditor_nombre);
        const compliance = data.map(d => d.average_compliance);

        if (complianceByAuditorChart) complianceByAuditorChart.destroy();
        complianceByAuditorChart = createChart(ctx, 'bar', {
            labels,
            datasets: [{
                label: 'Cumplimiento Promedio',
                data: compliance,
                backgroundColor: chartColors.primary
            }]
        });
    }

    function updateAuditsByPeriodChart(data) {
        const ctxEl = document.getElementById('chart-audits-by-period');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        const labels = data.map(d => new Date(d.fecha).toLocaleDateString());
        const counts = data.map(d => d.total_auditorias);

        if (auditsByPeriodChart) auditsByPeriodChart.destroy();
        auditsByPeriodChart = createChart(ctx, 'line', {
            labels,
            datasets: [{
                label: 'Total Auditorías',
                data: counts,
                borderColor: chartColors.success,
                tension: 0.1,
                fill: false
            }]
        });
    }

    function updateNoveltyDistributionChart(data) {
        const ctxEl = document.getElementById('chart-novelty-distribution');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        const filteredData = data.filter(d => d.novedad !== 'sin_novedad');
        const labels = filteredData.map(d => d.novedad);
        const counts = filteredData.map(d => d.count);

        if (noveltyDistributionChart) noveltyDistributionChart.destroy();
        noveltyDistributionChart = createChart(ctx, 'pie', {
            labels,
            datasets: [{ data: counts, backgroundColor: Object.values(chartColors) }]
        }, { plugins: { legend: { display: true, position: 'bottom', labels: { color: '#ccc' } } } });
    }

    function updateTopNoveltySkusTable(data) {
        const tableBody = document.getElementById('table-top-novelty-skus');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.sku}</td>
                    <td>${item.nombre_articulo}</td>
                    <td class="text-end">${item.total_novedades}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    function updateRecentAuditsTable(audits) {
        const tableBody = document.getElementById('analyst-audits-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        audits.forEach(audit => {
            const row = `
                <tr>
                    <td>${audit.id}</td>
                    <td>${audit.ubicacion_destino}</td>
                    <td>${audit.auditor?.nombre || 'N/A'}</td>
                    <td>${new Date(audit.creada_en).toLocaleDateString()}</td>
                    <td><span class="badge bg-primary">${audit.estado}</span></td>
                    <td class="text-end">${audit.porcentaje_cumplimiento || 0}%</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-info" data-audit-id="${audit.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }


    export function initAnalystDashboard() {
        const filtersForm = document.getElementById('analyst-filters-form');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');

        // Evitar añadir múltiples listeners si ya fue inicializado anteriormente
        if (!filtersForm) return;
        if (filtersForm.dataset.initialized === 'true') return;

        filtersForm.dataset.initialized = 'true';

        filtersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const startDate = document.getElementById('filter-start-date')?.value;
            const endDate = document.getElementById('filter-end-date')?.value;
            loadDashboardData(startDate, endDate);
        });

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                const s = document.getElementById('filter-start-date');
                const e = document.getElementById('filter-end-date');
                if (s) s.value = '';
                if (e) e.value = '';
                loadDashboardData();
            });
        }

        loadDashboardData();
    }

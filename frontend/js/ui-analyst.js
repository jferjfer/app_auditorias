
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

const chartColors = {
    primary: 'rgba(54, 162, 235, 0.6)',
    secondary: 'rgba(255, 99, 132, 0.6)',
    success: 'rgba(75, 192, 192, 0.6)',
    warning: 'rgba(255, 206, 86, 0.6)',
    info: 'rgba(153, 102, 255, 0.6)',
    danger: 'rgba(255, 159, 64, 0.6)'
};

const CHART_DEFAULTS = {
    type: 'bar',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                ticks: { color: '#ccc' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#ccc' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    }
};

function createChart(ctx, type, data, options = {}) {
    const config = { ...CHART_DEFAULTS, type, data, options: { ...CHART_DEFAULTS.options, ...options } };
    return new Chart(ctx, config);
}

async function loadDashboardData(startDate, endDate) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn("No auth token found, skipping analyst dashboard data load.");
        return;
    }

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
    }
}

function updateKPIs(statusData, avgCompliance, avgDuration, noveltyData) {
    const finishedAudits = statusData.find(s => s.estado === 'finalizada')?.count || 0;
    document.getElementById('stats-total-audits').textContent = finishedAudits;
    document.getElementById('stats-avg-compliance').textContent = `${avgCompliance.average_compliance.toFixed(1)}%`;
    document.getElementById('stats-avg-duration').textContent = avgDuration.average_duration_hours.toFixed(2);
    const totalNovelties = noveltyData.filter(n => n.novedad !== 'sin_novedad').reduce((sum, item) => sum + item.count, 0);
    document.getElementById('stats-total-novelties').textContent = totalNovelties;
}

function updateAuditStatusChart(data) {
    const ctx = document.getElementById('chart-audit-status').getContext('2d');
    const labels = data.map(d => d.estado);
    const counts = data.map(d => d.count);

    if (auditStatusChart) auditStatusChart.destroy();
    auditStatusChart = createChart(ctx, 'doughnut', {
        labels,
        datasets: [{
            data: counts,
            backgroundColor: [chartColors.success, chartColors.warning, chartColors.primary, chartColors.danger]
        }]
    }, { plugins: { legend: { display: true, position: 'bottom', labels: { color: '#ccc' } } } });
}

function updateComplianceByAuditorChart(data) {
    const ctx = document.getElementById('chart-compliance-by-auditor').getContext('2d');
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
    const ctx = document.getElementById('chart-audits-by-period').getContext('2d');
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
    const ctx = document.getElementById('chart-novelty-distribution').getContext('2d');
    const filteredData = data.filter(d => d.novedad !== 'sin_novedad');
    const labels = filteredData.map(d => d.novedad);
    const counts = filteredData.map(d => d.count);

    if (noveltyDistributionChart) noveltyDistributionChart.destroy();
    noveltyDistributionChart = createChart(ctx, 'pie', {
        labels,
        datasets: [{
            data: counts,
            backgroundColor: Object.values(chartColors)
        }]
    }, { plugins: { legend: { display: true, position: 'bottom', labels: { color: '#ccc' } } } });
}

function updateTopNoveltySkusTable(data) {
    const tableBody = document.getElementById('table-top-novelty-skus');
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
    tableBody.innerHTML = '';
    audits.forEach(audit => {
        const row = `
            <tr>
                <td>${audit.id}</td>
                <td>${audit.ubicacion_destino}</td>
                <td>${audit.auditor.nombre}</td>
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

    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        loadDashboardData(startDate, endDate);
    });

    clearFiltersBtn.addEventListener('click', () => {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        loadDashboardData();
    });

    loadDashboardData();
}

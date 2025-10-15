import { fetchAudits, fetchAuditors, fetchReportData } from './api.js';
import { renderAuditsTable, renderComplianceChart, renderNoveltiesChart, populateAuditorFilter } from './ui-helpers.js';
import { showToast } from './ui-helpers.js';

export async function loadAnalystDashboard(token, filters = {}) {
    try {
        const [audits, users] = await Promise.all([
            fetchAudits(filters),
            fetchAuditors()
        ]);
        renderAuditsTable(audits, '#analyst-audits-table-body');
        renderComplianceChart(audits);
        renderNoveltiesChart(audits);
        populateAuditorFilter(users);
        // Listeners are initialized once, maybe in main.js, but for now, let's keep it here.
        initAnalystEventListeners(); 
    } catch (error) {
        console.error('Error loading analyst dashboard:', error);
        showToast(`Error al cargar dashboard: ${error.message}`, 'error');
    }
}


// --- Funciones para Generación de Informes (Analista) ---

async function prepareReportData(reportType, filters) {
    const detailedAudits = await fetchReportData(filters);

    if (!detailedAudits || detailedAudits.length === 0) {
        return { products: [], totalPedidos: 0, totalProductos: 0, noveltyCounts: {} };
    }

    let allProducts = [];
    detailedAudits.forEach(audit => {
        if (audit.productos && audit.productos.length > 0) {
            const productsWithContext = audit.productos.map(p => ({
                ...p,
                orden_traslado: audit.ubicacion_destino,
                audit_id: audit.id,
                auditor_nombre: audit.auditor?.nombre ?? 'N/A',
                audit_fecha: new Date(audit.creada_en).toLocaleDateString()
            }));
            allProducts.push(...productsWithContext);
        }
    });

    if (reportType === 'novedades') {
        allProducts = allProducts.filter(p => p.novedad && p.novedad !== 'sin_novedad');
    }

    const totalPedidos = allProducts.length;
    const totalProductos = allProducts.reduce((sum, p) => sum + (p.cantidad_fisica || 0), 0);
    
    const noveltyCounts = allProducts.reduce((acc, p) => {
        if (p.novedad && p.novedad !== 'sin_novedad') {
            acc[p.novedad] = (acc[p.novedad] || 0) + 1;
        }
        return acc;
    }, {});

    return { products: allProducts, totalPedidos, totalProductos, noveltyCounts };
}

export function initAnalystEventListeners() {
    const downloadContainer = document.querySelector('#analyst-dashboard .btn-group.w-100');
    if (!downloadContainer) return;

    // Event delegation for download buttons
    downloadContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('.dropdown-item');
        if (!target || target.classList.contains('disabled')) return;

        e.preventDefault();

        const reportMap = {
            'download-general-excel': { type: 'general', format: 'excel' },
            'download-general-pdf': { type: 'general', format: 'pdf' },
            'download-novelties-excel': { type: 'novedades', format: 'excel' },
            'download-novelties-pdf': { type: 'novedades', format: 'pdf' },
        };

        const reportConfig = reportMap[target.id];
        if (!reportConfig) return;

        const currentFilters = {
            status: document.getElementById('filterStatus').value,
            auditor_id: document.getElementById('filterAuditor').value,
            start_date: document.getElementById('filterStartDate').value,
            end_date: document.getElementById('filterEndDate').value,
        };

        const originalText = target.innerHTML;
        try {
            target.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generando...';
            target.classList.add('disabled');

            const reportData = await prepareReportData(reportConfig.type, currentFilters);

            if (!reportData || reportData.products.length === 0) {
                showToast('No hay datos para generar el informe con los filtros seleccionados.', 'info');
                return;
            }

            if (reportConfig.format === 'excel') {
                generateExcelReport(reportData, reportConfig.type, currentFilters);
            } else if (reportConfig.format === 'pdf') {
                await generatePdfReport(reportData, reportConfig.type, currentFilters);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showToast(`Error al generar el informe: ${error.message}`, 'error');
        } finally {
            target.innerHTML = originalText;
            target.classList.remove('disabled');
        }
    });
}

function generateExcelReport(reportData, reportType, filters) {
    const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
    const wb = XLSX.utils.book_new();
    const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
    const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    const summaryData = [
        [reportTitle],
        [],
        ['Filtros Aplicados'],
        ['Fecha Inicio:', filters.start_date || 'N/A'],
        ['Fecha Fin:', filters.end_date || 'N/A'],
        [],
        ['Resumen General'],
        ['Total de Pedidos (líneas de producto):', totalPedidos],
        ['Total de Productos (unidades físicas):', totalProductos],
        [],
        ['Resumen de Novedades'],
        ...Object.entries(noveltyCounts).map(([key, value]) => [key, value])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    const tableHeader = ['Item', 'Orden de Traslado', 'SKU', 'Descripción', 'Novedad', 'Cant. Documento', 'Cant. Física', 'Diferencia', 'Observaciones'];
    const tableBody = products.map((p, index) => ({
        Item: index + 1,
        'Orden de Traslado': p.orden_traslado,
        SKU: p.sku,
        Descripción: p.nombre_articulo,
        Novedad: p.novedad,
        'Cant. Documento': p.cantidad_documento,
        'Cant. Física': p.cantidad_fisica,
        Diferencia: (p.cantidad_fisica || 0) - (p.cantidad_documento || 0),
        Observaciones: p.observaciones
    }));

    const wsData = XLSX.utils.json_to_sheet(tableBody, { header: tableHeader });
    XLSX.utils.book_append_sheet(wb, wsData, 'Detalle de Productos');

    XLSX.writeFile(wb, fileName);
}

async function generatePdfReport(reportData, reportType, filters) {
    const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
    const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const today = new Date().toLocaleDateString('es-ES');

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha de Generación: ${today}`, 14, 28);

    doc.setFontSize(12);
    doc.text('Resumen y Filtros Aplicados', 14, 40);
    doc.autoTable({
        startY: 42,
        head: [['Concepto', 'Valor']],
        body: [
            ['Fecha Inicio Filtro', filters.start_date || 'N/A'],
            ['Fecha Fin Filtro', filters.end_date || 'N/A'],
            ['Total de Pedidos (líneas)', totalPedidos],
            ['Total de Productos (unidades)', totalProductos],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
    });

    let finalY = doc.lastAutoTable.finalY || 80;

    if (Object.keys(noveltyCounts).length > 0) {
        finalY += 10;
        doc.setFontSize(12);
        doc.text('Gráfico de Novedades', 14, finalY);
        
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 400;
        offscreenCanvas.height = 250;

        const chartImage = await new Promise((resolve) => {
            new Chart(offscreenCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(noveltyCounts),
                    datasets: [{
                        data: Object.values(noveltyCounts),
                        backgroundColor: ['#ffc107', '#fd7e14', '#dc3545', '#6f42c1', '#20c997', '#0dcaf0'],
                    }]
                },
                options: {
                    responsive: false,
                    animation: {
                        onComplete: function() {
                            resolve(this.toBase64Image());
                        }
                    },
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        });

        doc.addImage(chartImage, 'PNG', 14, finalY + 2, 90, 60);
        finalY += 70;
    }

    doc.setFontSize(12);
    doc.text('Detalle de Productos', 14, finalY + 10);
    const tableHeader = ['#', 'Orden T.', 'SKU', 'Descripción', 'Novedad', 'Cant. Doc', 'Cant. Fís', 'Dif.'];
    const tableBody = products.map((p, index) => [
        index + 1,
        p.orden_traslado,
        p.sku,
        p.nombre_articulo,
        p.novedad,
        p.cantidad_documento,
        p.cantidad_fisica,
        (p.cantidad_fisica || 0) - (p.cantidad_documento || 0)
    ]);

    doc.autoTable({
        startY: finalY + 12,
        head: [tableHeader],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
        didParseCell: function (data) {
            if (data.column.dataKey === 3 && data.cell.section === 'body') {
                data.cell.text = data.cell.text[0].substring(0, 25) + (data.cell.text[0].length > 25 ? '...' : '');
            }
        }
    });
    finalY = doc.lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.text('Conclusiones', 14, finalY + 5);
    let conclusionText = `El informe de tipo '${reportType}' generó un total de ${totalPedidos} líneas de producto. `;
    if(Object.keys(noveltyCounts).length > 0) {
        const mainNovelty = Object.entries(noveltyCounts).sort((a, b) => b[1] - a[1])[0];
        conclusionText += `Se encontraron ${Object.keys(noveltyCounts).length} tipos de novedades, siendo la más común '${mainNovelty[0]}' con ${mainNovelty[1]} ocurrencias.`;
    } else {
        conclusionText += 'No se encontraron novedades significativas en los productos analizados.';
    }
    const splitText = doc.splitTextToSize(conclusionText, 180);
    doc.text(splitText, 14, finalY + 10);

    doc.save(fileName);
}

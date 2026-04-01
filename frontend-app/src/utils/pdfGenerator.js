import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Chart } from 'chart.js';

async function getImageBase64(imagePath) {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) {
      console.warn('Imagen no encontrada:', imagePath);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error leyendo imagen'));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error cargando imagen:', err);
    return null;
  }
}

export async function generatePdfReport(reportData, reportType, filters, userName = 'Usuario') {
  const { products, totalPedidos, totalUnidadesOts, totalAuditados, noveltyCounts } = reportData;
  const doc = new jsPDF();

  const logoBase64 = await getImageBase64('/images/marca_deagua.png');

  const primaryColor = '#6a11cb';
  const textColor = '#333333';
  const headerTextColor = '#ffffff';
  const tableHeaderColor = '#6a11cb';

  const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
  const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  const today = new Date().toLocaleDateString('es-ES');

  const addWatermark = () => {
    if (logoBase64) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const logoWidth = 150;
      const logoHeight = 150;
      const x = (pageWidth - logoWidth) / 2;
      const y = (pageHeight - logoHeight) / 2;

      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.addImage(logoBase64, 'PNG', x, y, logoWidth, logoHeight);
      doc.restoreGraphicsState();
    }
  };

  const addHeader = () => {
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
    
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 5, 3, 14, 14);
    }

    doc.setFontSize(16);
    doc.setTextColor(headerTextColor);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 25, 13);
  };

  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addWatermark();
      
      doc.setFontSize(8);
      doc.setTextColor('#888888');
      const pageText = `Página ${i} de ${pageCount} | Generado el ${today}`;
      doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };

  addHeader();

  doc.setFontSize(12);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen y Filtros Aplicados', 14, 30);
  doc.autoTable({
    startY: 33,
    head: [['Concepto', 'Valor']],
    body: [
      ['Analista de seguridad', userName],
      ['Fecha Inicio Filtro', filters.start_date || 'N/A'],
      ['Fecha Fin Filtro', filters.end_date || 'N/A'],
      ['Ubicación Origen', filters.ubicacion_origen_nombre || 'Todas'],
      ['Total de Pedidos (líneas)', totalPedidos],
      ['Total de Productos (unidades de las OTs)', totalUnidadesOts],
      ['Total de Productos (auditados sobre el total de las OTs)', totalAuditados],
    ],
    theme: 'grid',
    styles: { fontSize: 9, textColor: textColor },
    headStyles: { fillColor: tableHeaderColor, textColor: headerTextColor },
    margin: { top: 25 },
  });

  let finalY = doc.lastAutoTable.finalY || 80;

  if (Object.keys(noveltyCounts).length > 0) {
    finalY += 10;
    doc.setFontSize(12);
    doc.text('Gráfico de Novedades', 14, finalY);
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 400;
    offscreenCanvas.height = 250;

    const total = Object.values(noveltyCounts).reduce((a, b) => a + b, 0);
    const chartImage = await new Promise((resolve) => {
      new Chart(offscreenCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(noveltyCounts),
          datasets: [{
            data: Object.values(noveltyCounts),
            backgroundColor: [
              '#FF6384', // Rosa vibrante
              '#36A2EB', // Azul cielo
              '#FFCE56', // Amarillo dorado
              '#4BC0C0', // Turquesa
              '#9966FF', // Púrpura
              '#FF9F40', // Naranja
              '#FF6384', // Rosa (repetir si hay más)
              '#C9CBCF'  // Gris
            ],
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
        },
        plugins: [{
          id: 'percentageLabels',
          afterDatasetsDraw: function(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              meta.data.forEach((element, index) => {
                const data = dataset.data[index];
                const percentage = ((data / total) * 100).toFixed(0);
                const position = element.tooltipPosition();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 3;
                ctx.fillText(`${percentage}%`, position.x, position.y);
                ctx.shadowBlur = 0;
              });
            });
          }
        }]
      });
    });

    doc.addImage(chartImage, 'PNG', 14, finalY + 2, 90, 60);
    finalY += 70;
  }

  doc.setFontSize(12);
  doc.text('Detalle de Productos', 14, finalY + 10);
  const tableHeader = ['#', 'Orden T.', 'SKU', 'Descripción', 'Novedad', 'Cant. Novedad', 'Cant. Doc', 'Cant. Fís', 'Dif.'];
  const tableBody = products.map((p, index) => {
    let novedadesTexto = '';
    let cantidadNovedadTexto = '';
    const novedadesArray = [];
    const cantidadesArray = [];
    
    if (p.novelties && p.novelties.length > 0) {
      p.novelties.forEach(nov => {
        const tipo = nov.novedad_tipo || nov.tipo;
        if (tipo && tipo !== 'sin_novedad') {
          novedadesArray.push(tipo);
          cantidadesArray.push(nov.cantidad || 0);
        }
      });
      
      // Verificar si novedad tiene algo que no esté en novelties
      if (p.novedad && p.novedad !== 'sin_novedad' && !novedadesArray.includes(p.novedad)) {
        novedadesArray.push(p.novedad);
        const diff = Math.abs((p.cantidad_fisica || 0) - (p.cantidad_documento || 0));
        cantidadesArray.push(diff);
      }
    } else if (p.novedad && p.novedad !== 'sin_novedad') {
      novedadesArray.push(p.novedad);
      const diff = Math.abs((p.cantidad_fisica || 0) - (p.cantidad_documento || 0));
      cantidadesArray.push(diff);
    }
    
    novedadesTexto = novedadesArray.length > 0 ? novedadesArray.join(', ') : 'sin_novedad';
    cantidadNovedadTexto = cantidadesArray.length > 0 ? cantidadesArray.join(', ') : '0';
    
    return [
      index + 1,
      p.orden_traslado_original || 'N/A',
      p.sku,
      p.nombre_articulo,
      novedadesTexto,
      cantidadNovedadTexto,
      p.cantidad_documento,
      p.cantidad_fisica || 0,
      (p.cantidad_fisica || 0) - (p.cantidad_documento || 0)
    ];
  });

  doc.autoTable({
    startY: finalY + 12,
    head: [tableHeader],
    body: tableBody,
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.5, textColor: textColor },
    headStyles: { fillColor: tableHeaderColor, textColor: headerTextColor, fontSize: 7 },
    margin: { top: 25, bottom: 25 },
  });

  addFooter();
  doc.save(fileName);
}

export function prepareReportData(audits) {
  const products = [];
  const noveltyCounts = {};
  let totalUnidadesOts = 0;
  let totalAuditados = 0;

  audits.forEach(audit => {
    if (audit.productos) {
      audit.productos.forEach(product => {
        products.push({
          ...product,
          orden_traslado: audit.ubicacion_destino
        });
        
        totalUnidadesOts += product.cantidad_documento || 0;
        totalAuditados += product.cantidad_fisica || 0;
        
        if (product.novelties && product.novelties.length > 0) {
          product.novelties.forEach(nov => {
            const tipo = nov.novedad_tipo || nov.tipo;
            const cantidad = nov.cantidad || 0;
            if (tipo !== 'sin_novedad') {
              noveltyCounts[tipo] = (noveltyCounts[tipo] || 0) + cantidad;
            }
          });
        } else if (product.novedad && product.novedad !== 'sin_novedad') {
          const cantidad = Math.abs((product.cantidad_fisica || 0) - (product.cantidad_documento || 0));
          noveltyCounts[product.novedad] = (noveltyCounts[product.novedad] || 0) + cantidad;
        }
      });
    }
  });

  return {
    products,
    totalPedidos: products.length,
    totalUnidadesOts,
    totalAuditados,
    noveltyCounts
  };
}

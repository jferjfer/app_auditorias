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

export async function generatePdfReport(reportData, reportType, filters) {
  const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
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
    doc.setFontSize(8);
    doc.setTextColor('#888888');
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addWatermark();
      const text = `Página ${i} de ${pageCount} | Generado el ${today}`;
      doc.text(text, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
  };

  addHeader();

  doc.setFontSize(12);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen y Filtros Aplicados', 14, 35);
  doc.autoTable({
    startY: 38,
    head: [['Concepto', 'Valor']],
    body: [
      ['Fecha Inicio Filtro', filters.start_date || 'N/A'],
      ['Fecha Fin Filtro', filters.end_date || 'N/A'],
      ['Total de Pedidos (líneas)', totalPedidos],
      ['Total de Productos (unidades)', totalProductos],
    ],
    theme: 'grid',
    styles: { fontSize: 9, textColor: textColor },
    headStyles: { fillColor: tableHeaderColor, textColor: headerTextColor },
    didDrawPage: addHeader,
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
            backgroundColor: ['#a855f7', '#d8b4fe', '#c084fc', '#9333ea', '#7e22ce', '#581c87'],
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
    p.orden_traslado_original || 'N/A',
    p.sku,
    p.nombre_articulo,
    p.novedad,
    p.cantidad_documento,
    p.cantidad_fisica || 0,
    (p.cantidad_fisica || 0) - (p.cantidad_documento || 0)
  ]);

  doc.autoTable({
    startY: finalY + 12,
    head: [tableHeader],
    body: tableBody,
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.5, textColor: textColor },
    headStyles: { fillColor: tableHeaderColor, textColor: headerTextColor, fontSize: 7 },
    didDrawPage: addHeader,
  });

  addFooter();
  doc.save(fileName);
}

export function prepareReportData(audits) {
  const products = [];
  const noveltyCounts = {};
  let totalProductos = 0;

  audits.forEach(audit => {
    if (audit.productos) {
      audit.productos.forEach(product => {
        products.push({
          ...product,
          orden_traslado: audit.ubicacion_destino
        });
        totalProductos += product.cantidad_fisica || 0;
        
        const novedad = product.novedad || 'sin_novedad';
        noveltyCounts[novedad] = (noveltyCounts[novedad] || 0) + 1;
      });
    }
  });

  return {
    products,
    totalPedidos: products.length,
    totalProductos,
    noveltyCounts
  };
}

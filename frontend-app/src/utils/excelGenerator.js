import * as XLSX from 'xlsx';

export function generateExcelReport(reportData, reportType, filters) {
  const { products, totalPedidos, totalProductos, noveltyCounts } = reportData;
  
  const reportTitle = reportType === 'general' ? 'Informe General de Auditoría' : 'Informe de Novedades';
  const fileName = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const today = new Date().toLocaleDateString('es-ES');

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const resumenData = [
    ['RESUMEN Y FILTROS APLICADOS'],
    [],
    ['Concepto', 'Valor'],
    ['Fecha Inicio Filtro', filters.start_date || 'N/A'],
    ['Fecha Fin Filtro', filters.end_date || 'N/A'],
    ['Total de Pedidos (líneas)', totalPedidos],
    ['Total de Productos (unidades)', totalProductos],
    [],
    ['DISTRIBUCIÓN DE NOVEDADES'],
    [],
    ['Novedad', 'Cantidad'],
    ...Object.entries(noveltyCounts).map(([novedad, count]) => [novedad, count])
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  
  // Aplicar estilos básicos (ancho de columnas)
  wsResumen['!cols'] = [
    { wch: 30 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

  // Hoja 2: Detalle de Productos
  const productsData = [
    ['DETALLE DE PRODUCTOS'],
    [],
    ['#', 'ID Auditoría', 'Fecha', 'Auditor Principal', 'Auditado Por', 'Orden T.', 'SKU', 'Descripción', 'Origen', 'Destino', 'Novedad', 'Cant. Doc', 'Cant. Fís', 'Diferencia', 'Observaciones'],
    ...products.map((p, index) => [
      index + 1,
      p.audit_id || 'N/A',
      p.fecha_auditoria || 'N/A',
      p.auditor_nombre || 'N/A',
      p.auditado_por || p.auditor_nombre || 'N/A',
      p.orden_traslado_original || 'N/A',
      p.sku,
      p.nombre_articulo,
      p.ubicacion_origen || 'N/A',
      p.ubicacion_destino || 'N/A',
      p.novedad,
      p.cantidad_documento,
      p.cantidad_fisica || 0,
      (p.cantidad_fisica || 0) - (p.cantidad_documento || 0),
      p.observaciones || ''
    ])
  ];

  const wsProductos = XLSX.utils.aoa_to_sheet(productsData);
  
  // Aplicar estilos básicos (ancho de columnas)
  wsProductos['!cols'] = [
    { wch: 5 },   // #
    { wch: 12 },  // ID Auditoría
    { wch: 18 },  // Fecha
    { wch: 20 },  // Auditor Principal
    { wch: 20 },  // Auditado Por
    { wch: 12 },  // Orden T.
    { wch: 15 },  // SKU
    { wch: 40 },  // Descripción
    { wch: 20 },  // Origen
    { wch: 20 },  // Destino
    { wch: 15 },  // Novedad
    { wch: 10 },  // Cant. Doc
    { wch: 10 },  // Cant. Fís
    { wch: 10 },  // Diferencia
    { wch: 30 }   // Observaciones
  ];

  XLSX.utils.book_append_sheet(workbook, wsProductos, 'Productos');

  // Generar y descargar archivo
  XLSX.writeFile(workbook, fileName);
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
          audit_id: audit.id,
          fecha_auditoria: audit.creada_en ? new Date(audit.creada_en).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A',
          auditor_nombre: audit.auditor?.nombre || 'N/A',
          ubicacion_origen: audit.ubicacion_origen?.nombre || 'N/A',
          ubicacion_destino: audit.ubicacion_destino?.nombre || 'N/A'
        });
        totalProductos += product.cantidad_fisica || 0;
        
        // Contar novedad del campo principal (faltante/sobrante)
        const novedad = product.novedad || 'sin_novedad';
        noveltyCounts[novedad] = (noveltyCounts[novedad] || 0) + 1;
        
        // Contar novedades de la tabla novelties (averías, vencidos, etc.)
        if (product.novelties && product.novelties.length > 0) {
          product.novelties.forEach(nov => {
            const tipo = nov.novedad_tipo || nov.tipo;
            noveltyCounts[tipo] = (noveltyCounts[tipo] || 0) + 1;
          });
        }
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

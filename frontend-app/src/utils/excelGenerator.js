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
    ['#', 'ID Auditoría', 'Fecha', 'Auditor Principal', 'Auditado Por', 'Orden T.', 'SKU', 'Descripción', 'Origen', 'Destino', 'Novedades', 'Cant. Novedad', 'Fecha/Hora Novedad', 'Cant. Doc', 'Cant. Fís', 'Diferencia', 'Observaciones'],
    ...products.map((p, index) => {
      // Combinar TODAS las novedades (campo novedad + novelties)
      let novedadesTexto = '';
      let cantidadNovedadTexto = '';
      let fechaNovedadTexto = 'N/A';
      const novedadesArray = [];
      const cantidadesArray = [];
      
      // Agregar novedad principal si existe y no es sin_novedad
      if (p.novedad && p.novedad !== 'sin_novedad') {
        novedadesArray.push(p.novedad);
        const diff = Math.abs((p.cantidad_fisica || 0) - (p.cantidad_documento || 0));
        cantidadesArray.push(diff);
      }
      
      // Agregar novedades de novelties con cantidades
      if (p.novelties && p.novelties.length > 0) {
        p.novelties.forEach(n => {
          const tipo = n.novedad_tipo || n.tipo || 'N/A';
          const cantidad = n.cantidad || 0;
          if (tipo !== 'sin_novedad') {
            novedadesArray.push(tipo);
            cantidadesArray.push(cantidad);
          }
        });
        
        // Obtener la fecha de la primera novedad (o la más reciente)
        const primeraFecha = p.novelties[0].created_at;
        if (primeraFecha) {
          fechaNovedadTexto = new Date(primeraFecha).toLocaleString('es-CO', { 
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
      
      novedadesTexto = novedadesArray.length > 0 ? novedadesArray.join(', ') : 'sin_novedad';
      cantidadNovedadTexto = cantidadesArray.length > 0 ? cantidadesArray.join(', ') : '0';
      
      return [
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
        novedadesTexto,
        cantidadNovedadTexto,
        fechaNovedadTexto,
        p.cantidad_documento,
        p.cantidad_fisica || 0,
        (p.cantidad_fisica || 0) - (p.cantidad_documento || 0),
        p.observaciones || ''
      ];
    })
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
    { wch: 25 },  // Novedades
    { wch: 15 },  // Cant. Novedad
    { wch: 20 },  // Fecha/Hora Novedad
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
    totalProductos,
    noveltyCounts
  };
}

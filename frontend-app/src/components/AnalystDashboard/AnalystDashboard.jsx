import React, { useState, useEffect } from 'react'
import Filters from './Filters'
import KPIs from './KPIs'
import Charts from './Charts'
import useStats from '../../hooks/useStats'
import { fetchReportData, downloadReport } from '../../services/api'
import ToastContainer, { toast } from '../Toast'

export default function AnalystDashboard(){
  const { data, loading, error, filters, setFilters, reload } = useStats()
  const [audits, setAudits] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)

  useEffect(() => {
    loadAudits()
  }, [filters])

  const loadAudits = async () => {
    setLoadingAudits(true)
    try {
      const data = await fetchReportData(filters)
      setAudits(data || [])
    } catch (err) {
      console.error('Error cargando auditorías:', err)
    } finally {
      setLoadingAudits(false)
    }
  }

  const handleDownloadExcel = async (type) => {
    try {
      if (!audits || audits.length === 0) {
        toast.warning('No hay auditorías para exportar con los filtros seleccionados')
        return
      }
      toast.info('Generando reporte...')
      const blob = await downloadReport(filters)
      if (!blob || blob.size === 0) {
        toast.error('El reporte está vacío')
        return
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Reporte descargado exitosamente')
    } catch (err) {
      const errorMsg = err.message.includes('inválida') ? err.message : 'Error descargando reporte: ' + err.message
      toast.error(errorMsg)
    }
  }

  const handleDownloadPDF = async (type) => {
    try {
      const { generatePdfReport, prepareReportData } = await import('../../utils/pdfGenerator')
      let reportData;
      
      if (type === 'novedades') {
        // Filtrar solo productos con novedades
        const auditsWithNovelties = audits.map(audit => ({
          ...audit,
          productos: audit.productos?.filter(p => p.novedad !== 'sin_novedad') || []
        })).filter(audit => audit.productos.length > 0);
        reportData = prepareReportData(auditsWithNovelties);
      } else {
        reportData = prepareReportData(audits);
      }
      
      await generatePdfReport(reportData, type === 'novedades' ? 'novedades' : 'general', filters)
    } catch (err) {
      toast.error('Error generando PDF: ' + err.message)
    }
  }

  return (
    <div className="container-fluid" style={{padding: '0', maxWidth: '100%'}}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Dashboard del Analista</h1>
      </div>

      <Filters onChange={setFilters} initial={filters} />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">Error cargando estadísticas: {String(error)}</div>
      ) : (
        <>
          <KPIs data={data} />
          <Charts data={data} />

          {/* Tabla de auditorías */}
          <div className="row g-3">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Auditorías Recientes</h5>
                    <div className="btn-group">
                      <button className="btn btn-danger btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i className="bi bi-file-pdf"></i> PDF
                      </button>
                      <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => handleDownloadPDF('general')}>Reporte General</button></li>
                        <li><button className="dropdown-item" onClick={() => handleDownloadPDF('novedades')}>Reporte de Novedades</button></li>
                      </ul>
                      
                      <button className="btn btn-success btn-sm dropdown-toggle ms-2" data-bs-toggle="dropdown">
                        <i className="bi bi-file-excel"></i> Excel
                      </button>
                      <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => handleDownloadExcel('general')}>Reporte General</button></li>
                        <li><button className="dropdown-item" onClick={() => handleDownloadExcel('novedades')}>Reporte de Novedades</button></li>
                      </ul>
                    </div>
                  </div>
                  {loadingAudits ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Ubicación</th>
                            <th>Auditor</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th className="text-end">Cumplimiento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audits.map(audit => (
                            <tr key={audit.id}>
                              <td>{audit.id}</td>
                              <td>{audit.ubicacion_destino}</td>
                              <td>{audit.auditor?.nombre || 'N/A'}</td>
                              <td>{new Date(audit.creada_en).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                              <td>
                                <span className={`badge bg-${audit.estado === 'finalizada' ? 'success' : audit.estado === 'en_progreso' ? 'warning' : 'secondary'}`}>
                                  {audit.estado}
                                </span>
                              </td>
                              <td className="text-end">
                                {audit.porcentaje_cumplimiento ? `${audit.porcentaje_cumplimiento}%` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      <ToastContainer />
    </div>
  )
}

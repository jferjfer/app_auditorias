import React, { useState, useEffect } from 'react'
import Filters from './Filters'
import KPIs from './KPIs'
import Charts from './Charts'
import useStats from '../../hooks/useStats'
import { fetchReportData, downloadReport } from '../../services/api'

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

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadReport(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_auditorias_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Error descargando reporte: ' + err.message)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const { generatePdfReport, prepareReportData } = await import('../utils/pdfGenerator')
      const reportData = prepareReportData(audits)
      await generatePdfReport(reportData, 'general', filters)
    } catch (err) {
      alert('Error generando PDF: ' + err.message)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Dashboard del Analista</h1>
        <div>
          <button className="btn btn-danger me-2" onClick={handleDownloadPDF}>
            <i className="bi bi-file-pdf"></i> Descargar PDF
          </button>
          <button className="btn btn-success" onClick={handleDownloadExcel}>
            <i className="bi bi-file-excel"></i> Descargar Excel
          </button>
        </div>
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
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Auditorías Recientes</h5>
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
                              <td>{new Date(audit.creada_en).toLocaleString()}</td>
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
    </div>
  )
}

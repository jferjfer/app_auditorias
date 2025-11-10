import React, { useState, useEffect } from 'react'
import Filters from './Filters'
import KPIs from './KPIs'
import Charts from './Charts'
import useStats from '../../hooks/useStats'
import { useSessionKeepAlive } from '../../hooks/useSessionKeepAlive'
import { fetchReportData } from '../../services/api'
import { API_BASE_URL } from '../../services/api'
import ToastContainer, { toast } from '../Toast'

export default function AnalystDashboard(){
  useSessionKeepAlive(30000); // Ping cada 30 segundos
  const { data, loading, error, filters, setFilters, reload } = useStats()
  const [audits, setAudits] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [otSearch, setOtSearch] = useState('')

  // Limpiar filtros al montar el componente
  useEffect(() => {
    setFilters({})
  }, [])

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

  const handleOtSearch = async (e) => {
    e.preventDefault()
    if (!otSearch.trim()) {
      toast.warning('Ingresa una OT para buscar')
      return
    }
    
    setLoadingAudits(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/api/audits/search-by-ot/${otSearch.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error(`No se encontró auditoría con OT ${otSearch}`)
        } else {
          throw new Error('Error en la búsqueda')
        }
        setLoadingAudits(false)
        return
      }
      
      const auditData = await response.json()
      
      // Mostrar la auditoría encontrada
      setAudits([auditData])
      toast.success(`Auditoría encontrada con ${auditData.productos.length} producto(s) de OT ${otSearch}`)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoadingAudits(false)
    }
  }

  const handleDownloadExcel = async (type) => {
    try {
      if (!audits || audits.length === 0) {
        toast.warning('No hay auditorías para exportar')
        return
      }
      toast.info('Generando reporte...')
      
      console.log('Filters before download:', filters)
      
      // Construir URL manualmente con solo filtros válidos
      const params = new URLSearchParams()
      if (filters.audit_status && filters.audit_status !== 'Todos' && filters.audit_status.trim()) {
        params.append('audit_status', filters.audit_status)
      }
      if (filters.auditor_id) {
        params.append('auditor_id', filters.auditor_id)
      }
      if (filters.start_date && typeof filters.start_date === 'string' && filters.start_date.trim()) {
        params.append('start_date', filters.start_date.trim())
      }
      if (filters.end_date && typeof filters.end_date === 'string' && filters.end_date.trim()) {
        params.append('end_date', filters.end_date.trim())
      }
      
      const queryString = params.toString()
      const url = `${API_BASE_URL}/api/audits/report${queryString ? '?' + queryString : ''}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(error.detail || 'Error al generar reporte')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      toast.success('Reporte descargado exitosamente')
    } catch (err) {
      toast.error(err.message || 'Error descargando reporte')
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
                    <div className="d-flex gap-2 align-items-center">
                      <form onSubmit={handleOtSearch} className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Buscar por OT (ej: VE23456)"
                          value={otSearch}
                          onChange={(e) => setOtSearch(e.target.value)}
                          style={{width: '200px'}}
                        />
                        <button type="submit" className="btn btn-sm btn-primary">
                          <i className="bi bi-search"></i>
                        </button>
                        {otSearch && (
                          <button 
                            type="button" 
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setOtSearch('')
                              loadAudits()
                            }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </form>
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

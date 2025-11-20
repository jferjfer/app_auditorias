import React, { useState, useEffect } from 'react'
import Filters from './Filters'
import KPIs from './KPIs'
import Charts from './Charts'
import AuditProductsModal from './AuditProductsModal'
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
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const ITEMS_PER_PAGE = 4

  // Limpiar filtros al montar el componente
  useEffect(() => {
    console.log('AnalystDashboard montado')
    setFilters({})
  }, [])
  
  // Debug: Log cuando cambian los datos
  useEffect(() => {
    console.log('Estado del dashboard:', { data, loading, error })
  }, [data, loading, error])

  useEffect(() => {
    loadAudits()
  }, [filters])

  const loadAudits = async () => {
    setLoadingAudits(true)
    try {
      console.log('Cargando auditorías con filtros:', filters)
      const data = await fetchReportData(filters)
      console.log('Auditorías cargadas:', data?.length || 0)
      setAudits(data || [])
      setCurrentPage(0) // Reset a primera página
    } catch (err) {
      console.error('Error cargando auditorías:', err)
      toast.error('Error cargando auditorías: ' + err.message)
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



  const handleDownloadPDF = async (type) => {
    try {
      const { generatePdfReport, prepareReportData } = await import('../../utils/pdfGenerator')
      const { getCurrentUser } = await import('../../services/auth')
      const user = getCurrentUser()
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
      
      await generatePdfReport(reportData, type === 'novedades' ? 'novedades' : 'general', filters, user?.nombre || 'Usuario')
      toast.success('Reporte PDF generado exitosamente')
    } catch (err) {
      toast.error('Error generando PDF: ' + err.message)
    }
  }

  const handleDownloadExcel = async (type) => {
    try {
      const { generateExcelReport, prepareReportData } = await import('../../utils/excelGenerator')
      let reportData;
      
      if (type === 'novedades') {
        const auditsWithNovelties = audits.map(audit => ({
          ...audit,
          productos: audit.productos?.filter(p => p.novedad !== 'sin_novedad') || []
        })).filter(audit => audit.productos.length > 0);
        reportData = prepareReportData(auditsWithNovelties);
      } else {
        reportData = prepareReportData(audits);
      }
      
      generateExcelReport(reportData, type === 'novedades' ? 'novedades' : 'general', filters)
      toast.success('Reporte Excel generado exitosamente')
    } catch (err) {
      toast.error('Error generando Excel: ' + err.message)
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
        <div className="alert alert-danger">
          <h5>Error cargando estadísticas</h5>
          <p>{String(error)}</p>
          <button className="btn btn-primary" onClick={reload}>Reintentar</button>
        </div>
      ) : !data ? (
        <div className="alert alert-warning">
          <h5>No hay datos disponibles</h5>
          <p>No se pudieron cargar las estadísticas. Intenta recargar la página.</p>
          <button className="btn btn-primary" onClick={reload}>Recargar</button>
        </div>
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
                    <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th style={{textAlign: 'center'}}>ID</th>
                            <th style={{textAlign: 'left'}}>Origen</th>
                            <th style={{textAlign: 'left'}}>Destino</th>
                            <th style={{textAlign: 'left'}}>Auditor</th>
                            <th style={{textAlign: 'center'}}>Fecha</th>
                            <th style={{textAlign: 'center'}}>Estado</th>
                            <th style={{textAlign: 'center'}}>Cumplimiento</th>
                            <th style={{textAlign: 'center'}}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audits.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map(audit => (
                            <tr key={audit.id}>
                              <td style={{textAlign: 'center'}}>{audit.id}</td>
                              <td style={{textAlign: 'left'}}>{audit.ubicacion_origen?.nombre || 'N/A'}</td>
                              <td style={{textAlign: 'left'}}>{audit.ubicacion_destino?.nombre || 'N/A'}</td>
                              <td style={{textAlign: 'left'}}>{audit.auditor?.nombre || 'N/A'}</td>
                              <td style={{textAlign: 'center'}}>{new Date(audit.creada_en).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                              <td style={{textAlign: 'center'}}>
                                <span className={`badge bg-${audit.estado === 'finalizada' ? 'success' : audit.estado === 'en_progreso' ? 'warning' : 'secondary'}`}>
                                  {audit.estado}
                                </span>
                              </td>
                              <td style={{textAlign: 'center'}}>
                                {audit.porcentaje_cumplimiento ? `${audit.porcentaje_cumplimiento}%` : 'N/A'}
                              </td>
                              <td style={{textAlign: 'center'}}>
                                <button 
                                  className="btn btn-sm btn-primary"
                                  onClick={() => setSelectedAudit(audit)}
                                >
                                  <i className="bi bi-eye"></i> Ver
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Paginación */}
                    {audits.length > ITEMS_PER_PAGE && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                        >
                          <i className="bi bi-chevron-left"></i> Anterior
                        </button>
                        <span className="text-muted">
                          Página {currentPage + 1} de {Math.ceil(audits.length / ITEMS_PER_PAGE)} ({audits.length} auditorías)
                        </span>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(audits.length / ITEMS_PER_PAGE) - 1, p + 1))}
                          disabled={currentPage >= Math.ceil(audits.length / ITEMS_PER_PAGE) - 1}
                        >
                          Siguiente <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {selectedAudit && (
        <AuditProductsModal 
          audit={selectedAudit} 
          onClose={() => setSelectedAudit(null)} 
        />
      )}
      
      <ToastContainer />
    </div>
  )
}

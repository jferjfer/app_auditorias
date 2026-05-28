import React, { useState, useEffect, useRef, Component } from 'react'
import { useNavigate } from 'react-router-dom'
import Filters from './Filters'
import KPIs from './KPIs'
import Charts from './Charts'
import AuditProductsModal from './AuditProductsModal'
import { useSessionKeepAlive } from '../../hooks/useSessionKeepAlive'
import { fetchDashboardData, fetchReportData } from '../../services/api'
import { API_BASE_URL } from '../../services/api'
import ToastContainer, { toast } from '../Toast'

// Error Boundary para evitar pantalla blanca
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-4">
          <h5>Ocurrió un error al renderizar el dashboard</h5>
          <p>{this.state.error?.message || 'Error desconocido'}</p>
          <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AnalystDashboardContent(){
  const navigate = useNavigate()
  useSessionKeepAlive(30000)

  const [filters, setFilters] = useState({})
  const [data, setData] = useState(null)
  const [audits, setAudits] = useState([])
  const [pagination, setPagination] = useState({ page: 0, total: 0, total_pages: 0, page_size: 10 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [otSearch, setOtSearch] = useState('')
  const [selectedAudit, setSelectedAudit] = useState(null)
  const debounceRef = useRef(null)

  const PAGE_SIZE = 10

  // Cargar datos cuando cambian filtros (con debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadDashboard(0)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters])

  const loadDashboard = async (page = 0) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboardData(filters, page, PAGE_SIZE)
      setData(result.stats)
      setAudits(result.audits || [])
      setPagination(result.pagination || { page: 0, total: 0, total_pages: 0, page_size: PAGE_SIZE })
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      if (err.message.includes('502')) {
        toast.error('El servidor está sobrecargado. Intenta con un rango de fechas más pequeño.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    loadDashboard(newPage)
  }

  const handleOtSearch = async (e) => {
    e.preventDefault()
    if (!otSearch.trim()) {
      toast.warning('Ingresa una OT para buscar')
      return
    }
    
    setLoading(true)
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
        setLoading(false)
        return
      }
      
      const auditData = await response.json()
      setAudits([auditData])
      setPagination({ page: 0, total: 1, total_pages: 1, page_size: PAGE_SIZE })
      toast.success(`Auditoría encontrada con ${auditData.productos?.length || 0} producto(s) de OT ${otSearch}`)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (type) => {
    try {
      toast.info('Cargando datos para el reporte...')
      const { generatePdfReport, prepareReportData } = await import('../../utils/pdfGenerator')
      const { getCurrentUser } = await import('../../services/auth')
      const user = getCurrentUser()
      
      // Cargar datos completos con productos solo para el reporte
      const fullData = await fetchReportData(filters)
      let reportData;
      
      if (type === 'novedades') {
        const auditsWithNovelties = fullData.map(audit => ({
          ...audit,
          productos: audit.productos?.filter(p => {
            if (p.novelties && p.novelties.length > 0) {
              return p.novelties.some(n => {
                const tipo = n.novedad_tipo || n.tipo;
                return tipo !== 'sin_novedad';
              });
            }
            return false;
          }) || []
        })).filter(audit => audit.productos.length > 0);
        reportData = prepareReportData(auditsWithNovelties);
      } else {
        reportData = prepareReportData(fullData);
      }
      
      const filtersWithNames = { ...filters }
      if (filters.ubicacion_origen_id && fullData.length > 0) {
        const ubicacion = fullData[0]?.ubicacion_origen?.nombre
        if (ubicacion) filtersWithNames.ubicacion_origen_nombre = ubicacion
      }
      
      await generatePdfReport(reportData, type === 'novedades' ? 'novedades' : 'general', filtersWithNames, user?.nombre || 'Usuario')
      toast.success('Reporte PDF generado exitosamente')
    } catch (err) {
      toast.error('Error generando PDF: ' + err.message)
    }
  }

  const handleDownloadExcel = async (type) => {
    try {
      toast.info('Cargando datos para el reporte...')
      const { generateExcelReport, prepareReportData } = await import('../../utils/excelGenerator')
      
      // Cargar datos completos con productos solo para el reporte
      const fullData = await fetchReportData(filters)
      let reportData;
      
      if (type === 'novedades') {
        const auditsWithNovelties = fullData.map(audit => ({
          ...audit,
          productos: audit.productos?.filter(p => {
            if (p.novelties && p.novelties.length > 0) {
              return p.novelties.some(n => {
                const tipo = n.novedad_tipo || n.tipo;
                return tipo !== 'sin_novedad';
              });
            }
            return false;
          }) || []
        })).filter(audit => audit.productos.length > 0);
        reportData = prepareReportData(auditsWithNovelties);
      } else {
        reportData = prepareReportData(fullData);
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
        <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/ultima-milla')}
          >
            <i className="bi bi-truck"></i> 📦 Gestionar Última Milla
          </button>
          {Object.keys(filters).length > 0 && (
            <span className="badge bg-info" style={{fontSize: '14px'}}>
              <i className="bi bi-funnel-fill"></i> {Object.keys(filters).length} filtro(s) activo(s)
            </span>
          )}
        </div>
      </div>

      <Filters onChange={setFilters} initial={filters} />

      {loading && !data ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <h5>Error cargando datos</h5>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => loadDashboard(0)}>Reintentar</button>
        </div>
      ) : !data ? (
        <div className="alert alert-warning">
          <h5>No hay datos disponibles</h5>
          <p>No se pudieron cargar las estadísticas. Intenta recargar la página.</p>
          <button className="btn btn-primary" onClick={() => loadDashboard(0)}>Recargar</button>
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
                    <h5 className="card-title mb-0">
                      Auditorías Recientes
                      {loading && <span className="spinner-border spinner-border-sm ms-2" role="status"></span>}
                    </h5>
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
                              loadDashboard(0)
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
                        {audits.map(audit => (
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
                              {audit.porcentaje_cumplimiento != null ? `${audit.porcentaje_cumplimiento}%` : 'N/A'}
                            </td>
                            <td style={{textAlign: 'center'}}>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('access_token')
                                    const response = await fetch(`${API_BASE_URL}/api/audits/${audit.id}`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    const fullAudit = await response.json()
                                    setSelectedAudit(fullAudit)
                                  } catch (err) {
                                    toast.error('Error cargando productos: ' + err.message)
                                  }
                                }}
                              >
                                <i className="bi bi-eye"></i> Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                        {audits.length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">
                              No se encontraron auditorías con los filtros aplicados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Paginación server-side */}
                  {pagination.total_pages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 0}
                      >
                        <i className="bi bi-chevron-left"></i> Anterior
                      </button>
                      <span className="text-muted">
                        Página {pagination.page + 1} de {pagination.total_pages} ({pagination.total} auditorías)
                      </span>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.total_pages - 1}
                      >
                        Siguiente <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
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

export default function AnalystDashboard() {
  return (
    <DashboardErrorBoundary>
      <AnalystDashboardContent />
    </DashboardErrorBoundary>
  )
}

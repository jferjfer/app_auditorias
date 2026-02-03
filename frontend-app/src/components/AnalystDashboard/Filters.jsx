import React, { useState, useEffect } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { fetchAuditors, fetchUbicaciones } from '../../services/api'

export default function Filters({ onChange, initial = {} }){
  const [start, setStart] = useState(initial.start_date || '')
  const [end, setEnd] = useState(initial.end_date || '')
  const [status, setStatus] = useState(initial.audit_status || '')
  const [auditor, setAuditor] = useState(initial.auditor_id || '')
  const [ubicacionOrigen, setUbicacionOrigen] = useState(initial.ubicacion_origen_id || '')
  const [auditors, setAuditors] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])

  useEffect(() => { 
    populateAuditors()
    populateUbicaciones()
  }, [])

  async function populateAuditors(){
    try{
      const data = await fetchAuditors();
      setAuditors(data || [])
    }catch(e){ console.error('Error cargando auditores:', e) }
  }

  async function populateUbicaciones(){
    try{
      const data = await fetchUbicaciones()
      setUbicaciones(Array.isArray(data) ? data : [])
    }catch(e){ 
      console.error('Error cargando ubicaciones:', e)
      setUbicaciones([])
    }
  }

  function submit(e){
    e && e.preventDefault()
    const filters = {}
    if(status) filters.audit_status = status
    if(auditor) filters.auditor_id = auditor
    if(ubicacionOrigen) filters.ubicacion_origen_id = ubicacionOrigen
    if(start) filters.start_date = formatYMD(start)
    if(end) filters.end_date = formatYMD(end)
    console.log('🔍 Aplicando filtros:', filters)
    onChange && onChange(filters)
  }

  function clear(){
    setStart('')
    setEnd('')
    setStatus('')
    setAuditor('')
    setUbicacionOrigen('')
    console.log('🧹 Limpiando filtros')
    onChange && onChange({})
  }

  function formatYMD(v){
    if(!v) return ''
    const d = v instanceof Date ? v : new Date(v)
    // Usar UTC para evitar problemas de timezone
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth()+1).padStart(2,'0')
    const dd = String(d.getUTCDate()).padStart(2,'0')
    const result = `${yyyy}-${mm}-${dd}`
    console.log('Formatting date:', v, 'Result:', result)
    return result
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Filtros</h5>
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Fecha Inicio</label>
            <Flatpickr 
              className="form-control"
              value={start} 
              onChange={d=>setStart(d[0]||'')} 
              options={{dateFormat:'Y-m-d', altInput:true, altFormat:'d/m/Y', maxDate: 'today'}} 
              placeholder="dd/mm/YYYY"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Fecha Fin</label>
            <Flatpickr 
              className="form-control"
              value={end} 
              onChange={d=>setEnd(d[0]||'')} 
              options={{dateFormat:'Y-m-d', altInput:true, altFormat:'d/m/Y', maxDate: 'today'}} 
              placeholder="dd/mm/YYYY"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Estado</label>
            <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Auditor</label>
            <select className="form-select" value={auditor} onChange={e=>setAuditor(e.target.value)}>
              <option value="">Todos</option>
              {auditors.map(a=> <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Ubicación Origen</label>
            <select className="form-select" value={ubicacionOrigen} onChange={e=>setUbicacionOrigen(e.target.value)}>
              <option value="">Todas</option>
              {ubicaciones.map(u=> <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <button className="btn btn-primary w-100" type="submit">
              <i className="bi bi-funnel"></i> Filtrar
            </button>
          </div>
          <div className="col-md-6">
            <button className="btn btn-secondary w-100" type="button" onClick={clear}>
              <i className="bi bi-arrow-clockwise"></i> Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

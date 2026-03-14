import React from 'react'

export default function KPIs({ data }){
  if (!data) return null;
  
  const totalStatus = data.status?.reduce((sum, s) => sum + s.count, 0) || 0;
  const finalizadas = data.status?.find(s => s.estado === 'finalizada')?.count || 0;
  const avgCompliance = data.averageCompliance?.average_compliance || 0;
  const avgDuration = data.averageAuditDuration?.average_duration_hours || 0;
  const totalNovelties = data.noveltyDistribution?.reduce((sum, n) => sum + n.count, 0) || 0;

  return (
    <div className="row mb-4">
      <div className="col-md-3">
        <div className="card text-center h-100">
          <div className="card-body">
            <h5 className="card-title">Total Auditorías</h5>
            <p className="display-4 fw-bold">{totalStatus}</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center h-100">
          <div className="card-body">
            <h5 className="card-title">Finalizadas</h5>
            <p className="display-4 fw-bold">{finalizadas}</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center h-100">
          <div className="card-body">
            <h5 className="card-title">Cumplimiento Promedio</h5>
            <p className="display-4 fw-bold">{Math.round(avgCompliance)}%</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center h-100">
          <div className="card-body">
            <h5 className="card-title">Duración Promedio</h5>
            <p className="display-4 fw-bold">{avgDuration.toFixed(1)}h</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

export default function Charts({ data }){
  if (!data) return null;

  // Gráfico de estado
  const statusLabels = data.status?.map(s => s.estado) || [];
  const statusValues = data.status?.map(s => s.count) || [];
  const statusData = {
    labels: statusLabels,
    datasets: [{
      label: 'Auditorías',
      data: statusValues,
      backgroundColor: ['#6c757d', '#ffc107', '#28a745']
    }]
  };

  // Gráfico de cumplimiento por auditor
  const auditorLabels = data.complianceByAuditor?.map(a => a.auditor_nombre) || [];
  const auditorValues = data.complianceByAuditor?.map(a => a.average_compliance) || [];
  const auditorData = {
    labels: auditorLabels,
    datasets: [{
      label: '% Cumplimiento',
      data: auditorValues,
      backgroundColor: 'rgba(54,162,235,0.6)',
      borderColor: 'rgba(54,162,235,1)',
      borderWidth: 1
    }]
  };

  // Gráfico de auditorías por período
  const periodLabels = data.auditsByPeriod?.map(p => p.fecha) || [];
  const periodValues = data.auditsByPeriod?.map(p => p.total_auditorias) || [];
  const periodData = {
    labels: periodLabels,
    datasets: [{
      label: 'Auditorías',
      data: periodValues,
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
      tension: 0.1
    }]
  };

  // Gráfico de distribución de novedades
  const noveltyLabels = data.noveltyDistribution?.map(n => n.novedad) || [];
  const noveltyValues = data.noveltyDistribution?.map(n => n.count) || [];
  const noveltyData = {
    labels: noveltyLabels,
    datasets: [{
      data: noveltyValues,
      backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8', '#e83e8c', '#fd7e14']
    }]
  };

  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } };

  return (
    <>
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Auditorías por Estado</h5>
              <div style={{height:250}}>
                <Pie data={statusData} options={opts} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Cumplimiento por Auditor</h5>
              <div style={{height:250}}>
                <Bar data={auditorData} options={opts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Auditorías por Período</h5>
              <div style={{height:250}}>
                <Line data={periodData} options={opts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Distribución de Novedades</h5>
              <div style={{height:250}}>
                <Pie data={noveltyData} options={opts} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Top 10 SKUs con Más Novedades</h5>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Artículo</th>
                      <th className="text-end">Novedades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topNoveltySkus?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.sku}</td>
                        <td>{item.nombre_articulo}</td>
                        <td className="text-end">{item.total_novedades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

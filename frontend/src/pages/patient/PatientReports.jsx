import { useMemo, useRef } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import VitalsLineChart from '../../components/charts/VitalsLineChart'
import { useVitals } from '../../hooks/useVitals'
import { Download } from 'lucide-react'
import Button from '../../components/common/Button'
import { getVitalScalar } from '../../utils/vitalValues'
import toast from 'react-hot-toast'

const getAverage = (values) => {
  const validValues = values.filter((value) => Number.isFinite(value))
  if (!validValues.length) return null
  const total = validValues.reduce((sum, value) => sum + value, 0)
  return total / validValues.length
}

export default function PatientReports() {
  const { vitals } = useVitals()
  const reportRef = useRef(null)

  const metrics = [
    { key: 'heartRate', label: 'Heart Rate' },
    { key: 'oxygenSaturation', label: 'SpO2' },
    { key: 'temperature', label: 'Temperature' },
  ]

  const stats = useMemo(() => {
    const heartRateValues = vitals.map((vital) => Number(getVitalScalar(vital.heartRate))).filter((value) => Number.isFinite(value))
    const oxygenValues = vitals.map((vital) => Number(getVitalScalar(vital.oxygenSaturation ?? vital.oxygenLevel))).filter((value) => Number.isFinite(value))

    const avgHeartRate = getAverage(heartRateValues)
    const avgSpo2 = getAverage(oxygenValues)

    return [
      { label: 'Total Readings', value: vitals.length, color: 'text-teal-400' },
      { label: 'Avg Heart Rate', value: avgHeartRate !== null ? `${Math.round(avgHeartRate)} bpm` : '-', color: 'text-red-400' },
      { label: 'Avg SpO2', value: avgSpo2 !== null ? `${avgSpo2.toFixed(1)}%` : '-', color: 'text-blue-400' },
    ]
  }, [vitals])

  const handleExportPdf = () => {
    const content = reportRef.current
    if (!content) {
      toast.error('Report is not ready to export')
      return
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900')
    if (!printWindow) {
      toast.error('Please allow pop-ups to export the report')
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CareMate Health Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #0f172a;
              background: #ffffff;
            }
            h1, h2, h3, p {
              margin: 0;
            }
            .report-shell {
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 16px;
            }
            .stat-card, .panel {
              border: 1px solid #dbe3f0;
              border-radius: 16px;
              padding: 20px;
              background: #ffffff;
            }
            .stat-value {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 6px;
            }
            .stat-label, .muted {
              color: #64748b;
              font-size: 14px;
            }
            .chart-wrapper svg {
              width: 100% !important;
              height: auto !important;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 400)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Health Reports</h1>
          <p className="text-slate-400 text-sm">Comprehensive view of your health data</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={handleExportPdf}>Export PDF</Button>
      </div>

      <div ref={reportRef} className="report-shell">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stats-grid">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center stat-card">
              <p className={`text-3xl font-display font-semibold ${stat.color} stat-value`}>{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1 stat-label">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Card className="panel">
          <h3 className="section-title mb-5">30-Day Overview</h3>
          <div className="chart-wrapper">
            <VitalsLineChart data={vitals.slice(-30)} metrics={metrics} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

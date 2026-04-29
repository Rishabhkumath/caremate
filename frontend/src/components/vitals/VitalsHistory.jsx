import { formatDateTime } from '../../utils/formatDate'
import { getVitalScalar, hasVitalScalar } from '../../utils/vitalValues'
import { Activity } from 'lucide-react'

export default function VitalsHistory({ vitals = [] }) {
  if (!vitals.length) return (
    <div className="text-center py-8">
      <Activity size={32} className="text-slate-600 mx-auto mb-2" />
      <p className="text-slate-500 text-sm">No vitals recorded yet</p>
    </div>
  )

  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{ border: '1px solid #e2e8f0', background: '#fcfdff', padding: '6px 14px' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {['Date/Time', 'BP', 'Heart Rate', 'SpO2', 'Temp'].map((heading) => (
              <th key={heading} className="px-2 py-3 text-left text-xs font-medium" style={{ color: '#64748b' }}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vitals.map((vital, index) => {
            const systolic = vital.bloodPressure?.systolic ?? vital.bp?.systolic ?? null
            const diastolic = vital.bloodPressure?.diastolic ?? vital.bp?.diastolic ?? null
            const heartRate = getVitalScalar(vital.heartRate)
            const oxygenLevel = getVitalScalar(vital.oxygenSaturation ?? vital.oxygenLevel)
            const temperature = getVitalScalar(vital.temperature)

            return (
              <tr
                key={vital._id || index}
                className="transition-colors"
                style={{ borderTop: '1px solid #f1f5f9' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <td className="px-2 py-3 text-xs" style={{ color: '#64748b' }}>{formatDateTime(vital.recordedAt || vital.timestamp)}</td>
                <td className="px-2 py-3 font-mono text-xs" style={{ color: '#0f172a' }}>
                  {hasVitalScalar(systolic) && hasVitalScalar(diastolic) ? `${systolic}/${diastolic}` : '-'}
                </td>
                <td className="px-2 py-3 font-mono text-xs" style={{ color: '#0f172a' }}>
                  {heartRate ?? '-'} <span style={{ color: '#64748b' }}>bpm</span>
                </td>
                <td className="px-2 py-3 font-mono text-xs" style={{ color: '#0f172a' }}>
                  {oxygenLevel ?? '-'}<span style={{ color: '#64748b' }}>%</span>
                </td>
                <td className="px-2 py-3 font-mono text-xs" style={{ color: '#0f172a' }}>
                  {temperature ?? '-'}<span style={{ color: '#64748b' }}>deg F</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

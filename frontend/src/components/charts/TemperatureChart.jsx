import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatShortDate } from '../../utils/formatDate'
import { getVitalScalar } from '../../utils/vitalValues'

export default function TemperatureChart({ data = [] }) {
  const formatted = data.map((item) => ({
    date: formatShortDate(item.recordedAt || item.timestamp),
    value: getVitalScalar(item.temperature),
  })).filter((item) => item.value !== null)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} padding={{ left: 8, right: 8 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={34} domain={[95, 103]} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#0f172a' }}
          formatter={(value) => [`${value} deg F`, 'Temperature']}
        />
        <ReferenceLine y={98.6} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Normal', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

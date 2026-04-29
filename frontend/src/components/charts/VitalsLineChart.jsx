import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatShortDate } from '../../utils/formatDate'

export default function VitalsLineChart({ data = [], metrics = [] }) {
  // Normalize each record — extract .value from nested objects
  const formatted = data.map(d => {
    const row = { date: formatShortDate(d.recordedAt || d.timestamp) }
    metrics.forEach(m => {
      const raw = d[m.key]
      // If it's a nested object like { value, unit }, extract .value
      row[m.key] = (raw !== null && typeof raw === 'object') ? (raw.value ?? null) : raw
    })
    return row
  })

  const colors = ['#2a7de1', '#ef4444', '#0d9488', '#f97316', '#818cf8']

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
               axisLine={{ stroke: '#e2e8f0' }} tickLine={false} padding={{ left: 8, right: 8 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
               axisLine={{ stroke: '#e2e8f0' }} tickLine={false} width={34} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0',
                          borderRadius: 10, fontSize: 12, color: '#0f172a' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
        {metrics.map((m, i) => (
          <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                stroke={colors[i % colors.length]} strokeWidth={2}
                dot={{ r: 3, fill: colors[i % colors.length], strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

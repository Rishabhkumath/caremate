import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatShortDate } from '../../utils/formatDate'

export default function BloodPressureChart({ data = [] }) {
  // Backend: bloodPressure is { systolic, diastolic, unit }
  const formatted = data.map(d => ({
    date:      formatShortDate(d.recordedAt || d.timestamp),
    systolic:  d.bloodPressure?.systolic  ?? null,
    diastolic: d.bloodPressure?.diastolic ?? null,
  })).filter(d => d.systolic !== null)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} padding={{ left: 8, right: 8 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={34} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0',
                          borderRadius: 10, fontSize: 12, color: '#0f172a' }}
          formatter={(v, name) => [`${v} mmHg`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        <Line type="monotone" dataKey="systolic"  name="Systolic"  stroke="#2a7de1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

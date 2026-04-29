import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AppointmentBarChart({ data = [] }) {
  const colors = { confirmed: '#14b8a6', pending: '#fbbf24', cancelled: '#f87171', completed: '#64748b' }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} padding={{ left: 8, right: 8 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
        <Tooltip contentStyle={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
        <Bar dataKey="count" name="Appointments" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => <Cell key={i} fill={colors[entry.status] || '#14b8a6'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

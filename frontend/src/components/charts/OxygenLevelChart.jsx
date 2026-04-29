import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatShortDate } from '../../utils/formatDate'
import { getVitalScalar } from '../../utils/vitalValues'

export default function OxygenLevelChart({ data = [] }) {
  const formatted = data.map((item) => ({
    date: formatShortDate(item.recordedAt || item.timestamp),
    value: getVitalScalar(item.oxygenSaturation ?? item.oxygenLevel),
  })).filter((item) => item.value !== null)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="oxyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} padding={{ left: 8, right: 8 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={34} domain={[90, 100]} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#0f172a' }}
          formatter={(value) => [`${value}%`, 'SpO2']}
        />
        <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} fill="url(#oxyGrad)" dot={false} activeDot={{ r: 4, fill: '#0d9488' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

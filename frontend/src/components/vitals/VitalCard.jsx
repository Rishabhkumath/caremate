import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getVitalStatus } from '../../utils/formatVitals'

export default function VitalCard({ type, label, value, unit, icon: Icon, color = 'teal', trend }) {
  const status = getVitalStatus(type, value)

  const colorMap = {
    teal: 'text-teal-600 bg-teal-50',
    red: 'text-red-500 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-500 bg-orange-50',
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          {Icon && <Icon size={18} />}
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend > 0
                ? 'text-red-400'
                : trend < 0
                  ? 'text-teal-500'
                  : 'text-slate-400'
            }`}
          >
            {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-xs mb-2" style={{ color: '#64748b' }}>{label}</p>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-display font-semibold" style={{ color: '#0f172a' }}>
          {value ?? '—'}
        </span>
        {unit && <span className="text-sm" style={{ color: '#64748b' }}>{unit}</span>}
      </div>

      {value !== null && value !== undefined && (
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
          {status.label || status.status}
        </span>
      )}
    </div>
  )
}

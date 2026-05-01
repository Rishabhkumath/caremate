import { Pill, Clock, Trash2, Edit } from 'lucide-react'
import Badge from '../common/Badge'

export default function MedicationCard({ medication, onEdit, onDelete }) {
  const { name, dosage, frequency, timing = [], status } = medication
  const active = status !== 'completed' && status !== 'discontinued'
  const times = timing.map((item) => item?.time).filter(Boolean)

  const freqLabels = {
    once: 'Once Daily',
    twice: 'Twice Daily',
    thrice: 'Three Times Daily',
    'four times': 'Four Times Daily',
    'every 4 hours': 'Every 4 Hours',
    'every 6 hours': 'Every 6 Hours',
    'every 8 hours': 'Every 8 Hours',
    'as needed': 'As Needed',
  }

  return (
    <div className="glass-card p-4 hover:border-teal-500/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-teal-400/10' : 'bg-slate-400/10'}`}>
            <Pill size={18} className={active ? 'text-teal-400' : 'text-slate-500'} />
          </div>
          <div>
            <h4 className="text-slate-900 font-medium text-sm">{name}</h4>
            <p className="text-slate-600 text-xs">{dosage}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={active ? 'success' : 'default'} dot>{active ? 'Active' : 'Inactive'}</Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock size={12} />
          <span>{freqLabels[frequency] || frequency}</span>
        </div>
        {times.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {times.map((time) => (
              <span key={time} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{time}</span>
            ))}
          </div>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button onClick={() => onEdit(medication)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Edit size={12} /> Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(medication._id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

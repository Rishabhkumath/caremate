import { Bell, CheckCircle } from 'lucide-react'
import { medicationApi } from '../../api/medicationApi'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function ReminderBadge({ reminder, onTaken }) {
  const [marking, setMarking] = useState(false)
  const taken = reminder.status === 'taken'
  const medicationName = reminder.medication?.name || reminder.medicationName || 'Medication'
  const dosage = reminder.dose || reminder.medication?.dosage || reminder.dosage || ''
  const time = reminder.scheduledTime
    ? new Date(reminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : reminder.time || '--:--'

  const handleTaken = async () => {
    setMarking(true)
    try {
      await medicationApi.markTaken(reminder._id)
      toast.success('Marked as taken')
      onTaken?.()
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className={`flex items-center justify-between rounded-xl border p-3 transition-all ${taken ? 'bg-teal-50 border-teal-200 opacity-70' : 'bg-white border-slate-200 hover:border-teal-200'}`}>
      <div className="flex items-center gap-3">
        <Bell size={15} className={taken ? 'text-teal-400' : 'text-yellow-400'} />
        <div>
          <p className="text-slate-900 text-sm font-medium">{medicationName}</p>
          <p className="text-slate-600 text-xs">{time} - {dosage}</p>
        </div>
      </div>
      {!taken && (
        <button onClick={handleTaken} disabled={marking} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs hover:bg-teal-500/20 transition-colors">
          <CheckCircle size={13} /> {marking ? '...' : 'Taken'}
        </button>
      )}
      {taken && <CheckCircle size={16} className="text-teal-400" />}
    </div>
  )
}

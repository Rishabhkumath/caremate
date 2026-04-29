import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAppointmentDateTime } from '../../utils/formatDate'

export default function AppointmentCalendar({ appointments = [], onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPadding = getDay(startOfMonth(currentMonth))

  const getApptForDay = (day) => appointments.filter(a => {
    const appointmentDate = getAppointmentDateTime(a)
    return appointmentDate ? isSameDay(appointmentDate, day) : false
  })

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs text-slate-600 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(startPadding).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const appts = getApptForDay(day)
          return (
            <button key={day.toString()} onClick={() => onDateClick?.(day, appts)}
              className={`relative p-2 rounded-lg text-xs transition-all hover:bg-white/10 flex flex-col items-center
                ${isToday(day) ? 'bg-teal-500/20 text-teal-400 font-bold' : 'text-slate-400'}
                ${appts.length ? 'ring-1 ring-teal-500/30' : ''}
              `}>
              {format(day, 'd')}
              {appts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-0.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

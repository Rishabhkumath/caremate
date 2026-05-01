import { Calendar, Clock, User, MapPin, X, Star } from 'lucide-react'
import Badge from '../common/Badge'
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from '../../utils/formatDate'

export default function AppointmentCard({ appointment, onCancel, onRate, showActions = true }) {
  const { doctorName, patientName, status, type, location, notes } = appointment
  const variantMap = { confirmed: 'success', pending: 'warning', cancelled: 'danger', completed: 'default' }
  const derivedDoctorName = appointment.doctor?.user?.name || appointment.doctor?.name || doctorName
  const derivedPatientName = appointment.patient?.user?.name || patientName
  const hasReview = !!appointment.doctorReview?.rating
  const consultationSummary = appointment.consultationSummary || {}
  const treatment = consultationSummary.treatment || appointment.treatmentSummary
  const suggestions = consultationSummary.suggestions || appointment.suggestionsSummary
  const followUpDate = consultationSummary.followUpDate

  return (
    <div className="glass-card p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-card">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={variantMap[status] || 'default'} dot>{status}</Badge>
        {showActions && status !== 'cancelled' && status !== 'completed' && (
          <button onClick={() => onCancel?.(appointment._id)} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar size={13} />
          <span>{formatAppointmentDate(appointment, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock size={13} />
          <span>{formatAppointmentTime(appointment)}</span>
        </div>
        {(derivedDoctorName || derivedPatientName) && (
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <User size={13} />
            <span>{derivedDoctorName || derivedPatientName}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin size={13} />
            <span>{location}</span>
          </div>
        )}
        {type && (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">{type}</span>
        )}
      </div>
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
        <div className="text-slate-600">
          <span className="text-slate-500">Visit:</span> {formatAppointmentDate(appointment)} at {formatAppointmentTime(appointment)}
        </div>
        {followUpDate && (
          <div className="text-slate-600">
            <span className="text-slate-500">Next visit:</span> {formatAppointmentDate({ date: followUpDate })}
          </div>
        )}
        {treatment && (
          <div className="text-slate-700">
            <span className="text-slate-500">Treatment:</span> {treatment}
          </div>
        )}
        {suggestions && (
          <div className="text-slate-700">
            <span className="text-slate-500">Doctor suggestion:</span> {suggestions}
          </div>
        )}
      </div>
      {notes && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 line-clamp-2">{notes}</p>}
      {showActions && status === 'completed' && onRate && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            onClick={() => onRate(appointment)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors text-yellow-500 hover:bg-yellow-500/10"
          >
            <Star size={13} />
            {hasReview ? `Update Rating (${appointment.doctorReview.rating}/5)` : 'Rate Doctor'}
          </button>
        </div>
      )}
    </div>
  )
}

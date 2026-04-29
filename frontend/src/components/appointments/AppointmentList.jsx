import AppointmentCard from './AppointmentCard'
import { Calendar } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

export default function AppointmentList({ appointments = [], loading, onCancel, onRate }) {
  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner /></div>
  if (!appointments.length) return (
    <div className="text-center py-10">
      <Calendar size={32} className="text-slate-600 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">No appointments found</p>
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {appointments.map(appt => (
        <AppointmentCard key={appt._id} appointment={appt} onCancel={onCancel} onRate={onRate} />
      ))}
    </div>
  )
}

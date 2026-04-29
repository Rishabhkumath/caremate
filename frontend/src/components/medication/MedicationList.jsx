import MedicationCard from './MedicationCard'
import { Pill } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

export default function MedicationList({ medications = [], loading, onEdit, onDelete }) {
  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner /></div>
  if (!medications.length) return (
    <div className="text-center py-10">
      <Pill size={32} className="text-slate-600 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">No medications added</p>
      <p className="text-slate-600 text-xs mt-1">Add your first medication to get started</p>
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {medications.map(med => (
        <MedicationCard key={med._id} medication={med} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

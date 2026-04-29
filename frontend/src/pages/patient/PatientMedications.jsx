import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import MedicationList from '../../components/medication/MedicationList'
import MedicationForm from '../../components/medication/MedicationForm'
import ReminderBadge from '../../components/medication/ReminderBadge'
import { useMedications } from '../../hooks/useMedications'
import { Plus, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message ||
  error?.response?.data?.message ||
  fallback

export default function PatientMedications() {
  const { medications, reminders, loading, addMedication, updateMedication, deleteMedication, fetchMedications } = useMedications()
  const [addModal, setAddModal] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAdd = async (data) => {
    setSaving(true)
    try { await addMedication(data); setAddModal(false); toast.success('Medication added') }
    catch (error) { toast.error(getErrorMessage(error, 'Failed to add medication')) }
    finally { setSaving(false) }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    try { await updateMedication(editMed._id, data); setEditMed(null); toast.success('Updated') }
    catch (error) { toast.error(getErrorMessage(error, 'Failed to update')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this medication?')) return
    try { await deleteMedication(id); toast.success('Removed') }
    catch (error) { toast.error(getErrorMessage(error, 'Failed to remove')) }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Medications</h1>
          <p className="text-slate-400 text-sm">{medications.filter(m => m.active).length} active medications</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon={Plus}>Add Medication</Button>
      </div>

      {/* Today's reminders */}
      {reminders.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-yellow-400" />
            <h3 className="section-title text-base">Today's Reminders</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reminders.map(r => <ReminderBadge key={r._id} reminder={r} onTaken={fetchMedications} />)}
          </div>
        </Card>
      )}

      <MedicationList medications={medications} loading={loading} onEdit={setEditMed} onDelete={handleDelete} />

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Medication">
        <MedicationForm onSubmit={handleAdd} onCancel={() => setAddModal(false)} loading={saving} />
      </Modal>
      <Modal isOpen={!!editMed} onClose={() => setEditMed(null)} title="Edit Medication">
        <MedicationForm initialData={editMed} onSubmit={handleEdit} onCancel={() => setEditMed(null)} loading={saving} />
      </Modal>
    </DashboardLayout>
  )
}

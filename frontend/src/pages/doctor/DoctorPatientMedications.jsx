import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import MedicationList from '../../components/medication/MedicationList'
import MedicationForm from '../../components/medication/MedicationForm'
import Modal from '../../components/common/Modal'
import { useMedications } from '../../hooks/useMedications'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorPatientMedications() {
  const { patientId } = useParams()
  const { medications, loading, updateMedication, deleteMedication } = useMedications(patientId)
  const [editMedication, setEditMedication] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleEdit = async (data) => {
    if (!editMedication?._id) return
    setSaving(true)
    try {
      await updateMedication(editMedication._id, data)
      toast.success('Medication updated')
      setEditMedication(null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update medication')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (medicationId) => {
    if (!confirm('Delete this medication?')) return
    try {
      await deleteMedication(medicationId)
      toast.success('Medication deleted')
      if (editMedication?._id === medicationId) setEditMedication(null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete medication')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title mb-1">Patient Medications</h1>
          <p className="text-slate-400 text-sm">Medication and prescription history for this patient</p>
        </div>
        <Link to="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#2a7de1' }}>
          <ArrowLeft size={16} />
          Back to Patients
        </Link>
      </div>

      <Card>
        <MedicationList
          medications={medications}
          loading={loading}
          onEdit={setEditMedication}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        isOpen={!!editMedication}
        onClose={() => setEditMedication(null)}
        title="Edit Medication"
      >
        <MedicationForm
          initialData={editMedication}
          onSubmit={handleEdit}
          onCancel={() => setEditMedication(null)}
          loading={saving}
          showStatus
        />
      </Modal>
    </DashboardLayout>
  )
}

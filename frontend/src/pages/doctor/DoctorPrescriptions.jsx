import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import { doctorApi } from '../../api/doctorApi'
import { ClipboardList, Plus, Pill } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const FREQUENCY_OPTIONS = [
  { value: 'once',       label: 'Once daily'       },
  { value: 'twice',      label: 'Twice daily'       },
  { value: 'thrice',     label: 'Three times daily' },
  { value: 'four times', label: 'Four times daily'  },
  { value: 'as needed',  label: 'As needed'         },
]

const INITIAL = { patientId: '', medicationName: '', dosage: '', frequency: 'once', duration: '', notes: '' }

const formatDuration = (duration) => {
  if (!duration) return ''
  if (typeof duration === 'string') return duration
  if (duration.endDate) return `Until ${new Date(duration.endDate).toLocaleDateString()}`
  if (duration.startDate) return `From ${new Date(duration.startDate).toLocaleDateString()}`
  return ''
}

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [patients,      setPatients]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [form,          setForm]          = useState(INITIAL)
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    Promise.all([
      doctorApi.getPrescriptions?.().catch(() => ({ data: [] })),
      doctorApi.getPatients().catch(() => ({ data: [] })),
    ]).then(([pRes, ptRes]) => {
      setPrescriptions(pRes.data?.data || pRes.data || [])
      setPatients(ptRes.data?.data    || ptRes.data    || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patientId)      return toast.error('Select a patient')
    if (!form.medicationName) return toast.error('Medication name is required')
    if (!form.dosage)         return toast.error('Dosage is required')
    setSaving(true)
    try {
      const response = await doctorApi.addPrescription(form)
      const newPrescription = response.data?.data || response.data
      setPrescriptions(current => newPrescription ? [newPrescription, ...current] : current)
      toast.success('Prescription added')
      setShowModal(false)
      setForm(INITIAL)
    } catch { toast.error('Failed to add prescription') }
    finally { setSaving(false) }
  }

  const patientOptions = patients.map(p => ({
    value: p._id,
    label: p.user?.name || p.name || 'Patient',
  }))

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Manage patient prescriptions
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          New Prescription
        </Button>
      </div>

      {loading ? (
        <Card padding="p-8">
          <p className="text-center text-sm" style={{ color: '#94a3b8' }}>Loading…</p>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card padding="p-12">
          <div className="text-center">
            <ClipboardList size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>No prescriptions yet</p>
            <button onClick={() => setShowModal(true)}
                    style={{ marginTop: 12, fontSize: 13, color: '#2a7de1',
                              background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + Add first prescription
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map(p => (
            <div key={p._id}
                 style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f1fd',
                               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={16} style={{ color: '#2a7de1' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, margin: 0 }}>
                    {p.name || p.medicationName || p.medication?.name || 'Medication'}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    {p.patient?.user?.name || 'Patient'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.dosage && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                  background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {p.dosage}
                  </span>
                )}
                {p.frequency && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                  background: '#ccfbf1', color: '#0d9488', border: '1px solid #99f6e4' }}>
                    {p.frequency}
                  </span>
                )}
                {formatDuration(p.duration) && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                  background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {formatDuration(p.duration)}
                  </span>
                )}
              </div>
              {(p.notes || p.instructions) && (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>{p.notes || p.instructions}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Prescription Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Prescription">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Patient" name="patientId" value={form.patientId}
                  onChange={handleChange} options={patientOptions}
                  placeholder="Select patient" required />
          <Input label="Medication Name" name="medicationName" value={form.medicationName}
                 onChange={handleChange} placeholder="e.g. Metformin 500mg" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Dosage" name="dosage" value={form.dosage}
                   onChange={handleChange} placeholder="e.g. 500mg" required />
            <Select label="Frequency" name="frequency" value={form.frequency}
                    onChange={handleChange} options={FREQUENCY_OPTIONS} />
          </div>
          <Input label="Duration" name="duration" value={form.duration}
                 onChange={handleChange} placeholder="e.g. 30 days" />
          <div>
            <label className="label-text">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
                      className="input-field resize-none" rows={2}
                      placeholder="Additional instructions…" />
          </div>
          <Button type="submit" fullWidth loading={saving}>Add Prescription</Button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

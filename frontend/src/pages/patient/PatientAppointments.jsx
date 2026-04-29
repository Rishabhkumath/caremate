import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import AppointmentList from '../../components/appointments/AppointmentList'
import AppointmentForm from '../../components/appointments/AppointmentForm'
import AppointmentCalendar from '../../components/appointments/AppointmentCalendar'
import { useAppointments } from '../../hooks/useAppointments'
import { consultationApi } from '../../api/consultationApi'
import { Plus, Star, FileText, Calendar, Clock } from 'lucide-react'
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatDate,
} from '../../utils/formatDate'
import toast from 'react-hot-toast'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message ||
  error?.response?.data?.message ||
  fallback

const getCarePairKey = (item) => {
  const patientId = item?.patient?._id || item?.patient
  const doctorId = item?.doctor?._id || item?.doctor
  if (!patientId || !doctorId) return null
  return `${patientId.toString()}::${doctorId.toString()}`
}

export default function PatientAppointments() {
  const { appointments, loading, createAppointment, cancelAppointment, rateAppointment } = useAppointments()
  const [consultations, setConsultations] = useState([])
  const [loadingConsultations, setLoadingConsultations] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [ratingModal, setRatingModal] = useState(null)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await createAppointment(data)
      setAddModal(false)
      toast.success('Appointment booked!')
    }
    catch (error) { toast.error(getErrorMessage(error, 'Failed to book appointment')) }
    finally { setSaving(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try { await cancelAppointment(id); toast.success('Appointment cancelled') }
    catch (error) { toast.error(getErrorMessage(error, 'Failed to cancel')) }
  }

  const openRatingModal = (appointment) => {
    setRatingModal(appointment)
    setRating(appointment.doctorReview?.rating || 5)
    setReviewComment(appointment.doctorReview?.comment || '')
  }

  const handleRateDoctor = async (e) => {
    e.preventDefault()
    if (!ratingModal?._id) return
    setSaving(true)
    try {
      await rateAppointment(ratingModal._id, { rating, comment: reviewComment.trim() })
      toast.success('Doctor rating saved')
      setRatingModal(null)
      setRating(5)
      setReviewComment('')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save rating'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  useEffect(() => {
    setLoadingConsultations(true)
    consultationApi.getAll()
      .then((response) => {
        const list = response.data?.data || response.data || []
        const next = Array.isArray(list) ? list : []
        const deduped = next.reduce((acc, consultation) => {
          const pairKey = getCarePairKey(consultation)
          if (pairKey && !acc.some((item) => getCarePairKey(item) === pairKey)) {
            acc.push(consultation)
          }
          return acc
        }, [])
        setConsultations(deduped)
      })
      .catch(() => {
        setConsultations([])
      })
      .finally(() => setLoadingConsultations(false))
  }, [appointments.length])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Appointments</h1>
          <p className="text-slate-400 text-sm">{appointments.filter(a => a.status === 'confirmed').length} upcoming confirmed</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon={Plus}>Book Appointment</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === s ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {s}
              </button>
            ))}
          </div>
          <AppointmentList appointments={filtered} loading={loading} onCancel={handleCancel} onRate={openRatingModal} />
        </div>
        <AppointmentCalendar appointments={appointments} />
      </div>

      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Consultation Summaries</h3>
            <p className="text-slate-400 text-sm mt-1">
              Completed doctor notes, treatment plans, and follow-up suggestions
            </p>
          </div>
          <FileText size={18} className="text-slate-400" />
        </div>

        {loadingConsultations ? (
          <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>Loading consultation summaries...</p>
        ) : consultations.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={34} className="mx-auto mb-3 text-slate-500" />
            <p className="text-sm" style={{ color: '#64748b' }}>No consultation summaries yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {consultations.map((consultation) => {
              const doctorName = consultation.doctor?.user?.name || consultation.doctor?.name || 'Doctor'
              const appointment = consultation.appointment
              const diagnosis = typeof consultation.diagnosis === 'string'
                ? consultation.diagnosis
                : [
                    consultation.diagnosis?.primary,
                    ...(consultation.diagnosis?.secondary || []),
                  ].filter(Boolean).join(', ')
              const treatment = [
                consultation.treatment?.plan,
                ...(consultation.treatment?.procedures || []),
              ].filter(Boolean).join('. ')

              return (
                <div
                  key={consultation._id}
                  className="rounded-xl p-4"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a', margin: 0 }}>Dr. {doctorName}</p>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                        Saved on {formatDate(consultation.updatedAt || consultation.createdAt)}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: '#e0f2fe', color: '#0369a1' }}
                    >
                      {consultation.status}
                    </span>
                  </div>

                  {appointment && (
                    <div className="flex flex-wrap gap-4 mb-3">
                      <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                        <Calendar size={12} /> {formatAppointmentDate(appointment)}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                        <Clock size={12} /> {formatAppointmentTime(appointment)}
                      </span>
                    </div>
                  )}

                  {diagnosis && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', margin: '0 0 4px' }}>Diagnosis</p>
                      <p className="text-sm" style={{ color: '#0f172a', margin: 0 }}>{diagnosis}</p>
                    </div>
                  )}

                  {treatment && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', margin: '0 0 4px' }}>Treatment</p>
                      <p className="text-sm" style={{ color: '#0f172a', margin: 0 }}>{treatment}</p>
                    </div>
                  )}

                  {consultation.notes && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', margin: '0 0 4px' }}>Doctor Suggestion</p>
                      <p className="text-sm" style={{ color: '#0f172a', margin: 0 }}>{consultation.notes}</p>
                    </div>
                  )}

                  {consultation.treatment?.followUp && (
                    <p className="text-xs" style={{ color: '#64748b', margin: 0 }}>
                      Follow-up: {formatDate(consultation.treatment.followUp)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Book Appointment" size="lg">
        <AppointmentForm onSubmit={handleCreate} onCancel={() => setAddModal(false)} loading={saving} />
      </Modal>

      <Modal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        title={`Rate Dr. ${ratingModal?.doctor?.user?.name || ratingModal?.doctor?.name || 'Doctor'}`}
      >
        <form onSubmit={handleRateDoctor} className="space-y-4">
          <div>
            <label className="label-text">Your Rating</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors"
                  style={{
                    background: value <= rating ? '#fef3c7' : '#f8fafc',
                    borderColor: value <= rating ? '#f59e0b' : '#e2e8f0',
                    color: value <= rating ? '#d97706' : '#94a3b8',
                  }}
                >
                  <Star size={16} fill={value <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">Review</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="Share your experience with this doctor"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={saving} fullWidth>Save Rating</Button>
            <Button type="button" variant="secondary" onClick={() => setRatingModal(null)} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

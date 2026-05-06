import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import VitalCard from '../../components/vitals/VitalCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import VitalsForm from '../../components/vitals/VitalsForm'
import ReminderBadge from '../../components/medication/ReminderBadge'
import HeartRateChart from '../../components/charts/HeartRateChart'
import BloodPressureChart from '../../components/charts/BloodPressureChart'
import { useAuth } from '../../hooks/useAuth'
import { useVitals } from '../../hooks/useVitals'
import { useMedications } from '../../hooks/useMedications'
import { useAppointments } from '../../hooks/useAppointments'
import { Heart, Droplet, Wind, Thermometer, Plus, Calendar, Pill, Star, ShieldCheck, Phone, Mail } from 'lucide-react'
import {
  formatAppointmentRelative,
  formatDate,
} from '../../utils/formatDate'
import { patientApi } from '../../api/patientApi'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { vitals, latest, logVital } = useVitals()
  const { reminders }      = useMedications()
  const { appointments, rateAppointment }   = useAppointments()
  const [logModal, setLogModal] = useState(false)
  const [profile, setProfile] = useState(null)
  const [ratingModal, setRatingModal] = useState(null)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingRating, setSavingRating] = useState(false)

  useEffect(() => {
    patientApi.getProfile()
      .then((response) => setProfile(response.data?.data || response.data || null))
      .catch(() => {})
  }, [])

  // Backend stores vitals as nested objects: { value, unit }
  // Extract the scalar values so VitalCard receives a number/string not an object
  const heartRate   = latest?.heartRate?.value       ?? null
  const systolic    = latest?.bloodPressure?.systolic ?? null
  const diastolic   = latest?.bloodPressure?.diastolic ?? null
  const oxygenLevel = latest?.oxygenSaturation?.value ?? null
  const temperature = latest?.temperature?.value      ?? null

  const bpDisplay = systolic && diastolic ? `${systolic}/${diastolic}` : null

  const upcoming       = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').slice(0, 3)
  const todayReminders = reminders.slice(0, 4)
  const completedAppointments = appointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.date || b.dateTime || 0) - new Date(a.date || a.dateTime || 0))

  const primaryDoctor = profile?.primaryDoctor || null
  const latestDoctorAppointment = completedAppointments[0] || appointments.find((a) => a.doctor)
  const displayedDoctor = primaryDoctor || latestDoctorAppointment?.doctor || null
  const reviewableAppointment = completedAppointments.find((appointment) => {
    const appointmentDoctorId = appointment.doctor?._id || appointment.doctor
    const displayedDoctorId = displayedDoctor?._id || displayedDoctor
    return appointmentDoctorId && displayedDoctorId && String(appointmentDoctorId) === String(displayedDoctorId)
  }) || completedAppointments[0] || null

  const doctorName = displayedDoctor?.user?.name || displayedDoctor?.name || latestDoctorAppointment?.doctor?.user?.name || 'Doctor'
  const doctorEmail = displayedDoctor?.user?.email || ''
  const doctorPhone = displayedDoctor?.user?.phoneNumber || ''

  const openRatingModal = () => {
    if (!reviewableAppointment) return
    setRatingModal(reviewableAppointment)
    setRating(reviewableAppointment.doctorReview?.rating || 5)
    setReviewComment(reviewableAppointment.doctorReview?.comment || '')
  }

  const handleRateDoctor = async (e) => {
    e.preventDefault()
    if (!ratingModal?._id) return
    setSavingRating(true)
    try {
      await rateAppointment(ratingModal._id, { rating, comment: reviewComment.trim() })
      toast.success('Doctor rating saved')
      setRatingModal(null)
      setRating(5)
      setReviewComment('')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save rating')
    } finally {
      setSavingRating(false)
    }
  }

  return (
    <DashboardLayout>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Here's your health overview for today
          </p>
        </div>
        <Button onClick={() => setLogModal(true)} icon={Plus}>Log Vitals</Button>
      </div>

      {/* ── Vital Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <VitalCard
          type="heartRate" label="Heart Rate"
          value={heartRate} unit="bpm"
          icon={Heart} color="red"
        />
        <VitalCard
          type="systolic" label="Blood Pressure"
          value={bpDisplay} unit="mmHg"
          icon={Droplet} color="blue"
        />
        <VitalCard
          type="oxygenLevel" label="Oxygen Level"
          value={oxygenLevel} unit="%"
          icon={Wind} color="teal"
        />
        <VitalCard
          type="temperature" label="Temperature"
          value={temperature} unit="°F"
          icon={Thermometer} color="orange"
        />
      </div>

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Heart Rate Trend</h3>
            <Badge variant="danger" dot>Live</Badge>
          </div>
          <HeartRateChart data={vitals.slice(-14)} />
        </Card>

        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Blood Pressure</h3>
            <Badge variant="info">7 days</Badge>
          </div>
          <BloodPressureChart data={vitals.slice(-14)} />
        </Card>
      </div>

      {/* ── Bottom row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Medication reminders */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill size={16} style={{ color: '#2a7de1' }} />
              <h3 className="section-title">Today's Medications</h3>
            </div>
            <Badge variant="warning">
              {todayReminders.filter(r => !r.taken).length} pending
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {todayReminders.length === 0
              ? <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No reminders for today</p>
              : todayReminders.map(r => <ReminderBadge key={r._id} reminder={r} />)
            }
          </div>
        </Card>

        {/* Upcoming appointments */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: '#2a7de1' }} />
              <h3 className="section-title">Upcoming Appointments</h3>
            </div>
            <Badge variant="info">{upcoming.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.length === 0
              ? <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No upcoming appointments</p>
              : upcoming.map(a => (
                <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl"
                     style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: '#e8f1fd' }}>
                    <Calendar size={15} style={{ color: '#2a7de1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>
                      Dr. {a.doctor?.user?.name || a.doctor?.name || a.doctorName || 'Doctor'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {formatAppointmentRelative(a)}
                    </p>
                  </div>
                  <Badge variant={a.status === 'confirmed' ? 'success' : 'warning'}>
                    {a.status}
                  </Badge>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="section-title">My Doctor</h3>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              Doctor details and review
            </p>
          </div>
          <Button
            onClick={openRatingModal}
            icon={Star}
            disabled={!reviewableAppointment}
          >
            {reviewableAppointment?.doctorReview?.rating ? 'Update Review' : 'Rate Doctor'}
          </Button>
        </div>

        {!displayedDoctor ? (
          <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>
            No doctor details available yet
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                     style={{ background: '#e8f1fd', color: '#2a7de1' }}>
                  {doctorName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold" style={{ color: '#0f172a', margin: 0 }}>
                      Dr. {doctorName}
                    </p>
                    <Badge variant={displayedDoctor.isVerified ? 'success' : 'warning'} dot>
                      {displayedDoctor.isVerified ? 'Verified' : 'Pending verification'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    {displayedDoctor.specialization || 'Specialization not added'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {displayedDoctor.department && <Badge variant="info">{displayedDoctor.department}</Badge>}
                    <Badge variant="purple">
                      {displayedDoctor.rating || 0} / 5 ({displayedDoctor.totalReviews || 0} reviews)
                    </Badge>
                    {displayedDoctor.consultationFee ? (
                      <Badge variant="default">Fee: Rs. {displayedDoctor.consultationFee}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={14} style={{ color: '#2a7de1' }} />
                    <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Email</span>
                  </div>
                  <p className="text-sm break-words" style={{ color: '#0f172a', margin: 0 }}>{doctorEmail || 'Not added'}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={14} style={{ color: '#2a7de1' }} />
                    <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Phone</span>
                  </div>
                  <p className="text-sm" style={{ color: '#0f172a', margin: 0 }}>{doctorPhone || 'Not added'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} style={{ color: '#2a7de1' }} />
                <p className="text-sm font-semibold" style={{ color: '#0f172a', margin: 0 }}>Your Review</p>
              </div>
              {reviewableAppointment?.doctorReview?.rating ? (
                <>
                  <p className="text-sm" style={{ color: '#64748b', margin: 0 }}>
                    Rating: <span style={{ color: '#0f172a', fontWeight: 600 }}>{reviewableAppointment.doctorReview.rating}/5</span>
                  </p>
                  <p className="text-sm mt-2" style={{ color: '#475569' }}>
                    {reviewableAppointment.doctorReview.comment || 'No written review added.'}
                  </p>
                  {reviewableAppointment.doctorReview.ratedAt && (
                    <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
                      Updated on {formatDate(reviewableAppointment.doctorReview.ratedAt)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {reviewableAppointment
                    ? 'You can rate and review your doctor after a completed appointment.'
                    : 'Complete at least one appointment to leave a rating and review.'}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={logModal} onClose={() => setLogModal(false)} title="Log Today's Vitals">
        <VitalsForm logVital={logVital} onSuccess={() => setLogModal(false)} />
      </Modal>

      <Modal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        title={`Rate Dr. ${ratingModal?.doctor?.user?.name || doctorName}`}
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
            <Button type="submit" loading={savingRating} fullWidth>Save Review</Button>
            <Button type="button" variant="secondary" onClick={() => setRatingModal(null)} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}

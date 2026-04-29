import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { caregiverApi } from '../../api/caregiverApi'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  HeartPulse,
  Mail,
  Phone,
  Pill,
  Search,
  Stethoscope,
  UserRound,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react'
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatDate,
  formatDateTime,
  formatRelative,
} from '../../utils/formatDate'

const getDiagnosisText = (consultation) => {
  if (!consultation?.diagnosis) return 'Not recorded'
  if (typeof consultation.diagnosis === 'string') return consultation.diagnosis

  return [
    consultation.diagnosis.primary,
    ...(consultation.diagnosis.secondary || []),
  ].filter(Boolean).join(', ') || 'Not recorded'
}

const getBloodPressureText = (vitals) => {
  const systolic = vitals?.bloodPressure?.systolic
  const diastolic = vitals?.bloodPressure?.diastolic
  if (systolic == null || diastolic == null) return 'Not recorded'
  return `${systolic}/${diastolic} mmHg`
}

const getHeartRateText = (vitals) => (
  vitals?.heartRate?.value != null ? `${vitals.heartRate.value} ${vitals.heartRate.unit || 'bpm'}` : 'Not recorded'
)

const getOxygenText = (vitals) => (
  vitals?.oxygenSaturation?.value != null ? `${vitals.oxygenSaturation.value}${vitals.oxygenSaturation.unit || '%'}` : 'Not recorded'
)

const getTemperatureText = (vitals) => (
  vitals?.temperature?.value != null
    ? `${vitals.temperature.value} ${vitals.temperature.unit === 'celsius' ? 'C' : 'F'}`
    : 'Not recorded'
)

const DetailSection = ({ icon: Icon, title, subtitle, children, count }) => (
  <div
    className="rounded-2xl p-4"
    style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
  >
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#f5f3ff', color: '#7c3aed' }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className="section-title" style={{ marginBottom: 4 }}>{title}</h3>
          {subtitle && <p className="text-xs" style={{ color: '#64748b' }}>{subtitle}</p>}
        </div>
      </div>
      {typeof count === 'number' && <Badge variant="purple">{count}</Badge>}
    </div>
    {children}
  </div>
)

export default function CaregiverPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openPatientIds, setOpenPatientIds] = useState({})
  const [patientDetails, setPatientDetails] = useState({})
  const [loadingDetails, setLoadingDetails] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    caregiverApi.getPatients()
      .then((res) => setPatients(res.data?.data || res.data || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return patients

    return patients.filter((patient) => {
      const name = patient.user?.name || patient.name || ''
      const email = patient.user?.email || ''
      const phone = patient.user?.phoneNumber || ''
      const doctorName = patient.primaryDoctor?.user?.name || patient.primaryDoctor?.name || ''
      const gender = patient.gender || ''
      const status = patient.status || ''

      return [
        name,
        email,
        phone,
        doctorName,
        gender,
        status,
      ].join(' ').toLowerCase().includes(query)
    })
  }, [patients, searchTerm])

  const togglePatient = async (patientId) => {
    const isOpen = !!openPatientIds[patientId]

    setOpenPatientIds((prev) => ({
      ...prev,
      [patientId]: !isOpen,
    }))

    if (isOpen || patientDetails[patientId] || loadingDetails[patientId]) return

    setLoadingDetails((prev) => ({ ...prev, [patientId]: true }))
    try {
      const res = await caregiverApi.getPatientDetails(patientId)
      setPatientDetails((prev) => ({
        ...prev,
        [patientId]: res.data?.data || res.data || null,
      }))
    } catch {
      setPatientDetails((prev) => ({ ...prev, [patientId]: null }))
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [patientId]: false }))
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title mb-1">Patients</h1>
        <p className="text-slate-400 text-sm">Assigned patients with doctor, medication, appointment, and care history details</p>
      </div>

      <Card>
        <div className="mb-5 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patients, doctor, email, phone, or status"
            className="input-field pl-10"
            style={{ paddingLeft: 42 }}
          />
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-12">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No patients are assigned to you yet.</p>
        ) : filteredPatients.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No patients match your search.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPatients.map((patient) => {
              const name = patient.user?.name || patient.name || 'Patient'
              const email = patient.user?.email || 'No email added'
              const phone = patient.user?.phoneNumber || 'No phone number'
              const hasAlert = patient.hasAlert || patient.status === 'critical'
              const doctorName = patient.primaryDoctor?.user?.name || patient.primaryDoctor?.name || 'Not assigned'
              const isOpen = !!openPatientIds[patient._id]
              const details = patientDetails[patient._id]
              const detailLoading = !!loadingDetails[patient._id]

              return (
                <div
                  key={patient._id}
                  className="rounded-2xl p-4 sm:p-5"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                        style={{ background: '#7c3aed' }}
                      >
                        {name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold truncate" style={{ color: '#0f172a', margin: 0 }}>{name}</p>
                          <Badge variant={hasAlert ? 'danger' : 'success'} dot>
                            {hasAlert ? 'Needs attention' : 'Stable'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                          <p className="text-xs flex items-center gap-2 min-w-0" style={{ color: '#64748b' }}>
                            <Mail size={13} /> <span className="truncate">{email}</span>
                          </p>
                          <p className="text-xs flex items-center gap-2" style={{ color: '#64748b' }}>
                            <Phone size={13} /> {phone}
                          </p>
                          <p className="text-xs flex items-center gap-2 min-w-0" style={{ color: '#64748b' }}>
                            <Stethoscope size={13} /> <span className="truncate">Primary doctor: {doctorName}</span>
                          </p>
                          <p className="text-xs flex items-center gap-2" style={{ color: '#64748b' }}>
                            <UserRound size={13} /> Gender: {patient.gender || 'Not added'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={isOpen ? ChevronUp : ChevronDown}
                      onClick={() => togglePatient(patient._id)}
                    >
                      {isOpen ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="mt-5">
                      {detailLoading ? (
                        <p className="text-sm text-center py-8" style={{ color: '#94a3b8' }}>Loading patient details...</p>
                      ) : !details ? (
                        <p className="text-sm text-center py-8" style={{ color: '#94a3b8' }}>Unable to load patient details right now.</p>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <DetailSection
                            icon={Stethoscope}
                            title="Doctor & Profile"
                            subtitle="Essential patient and doctor information"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Assigned doctor</p>
                                <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                  Dr. {details.patient?.primaryDoctor?.user?.name || 'Not assigned'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                  {details.patient?.primaryDoctor?.specialization || 'Specialization not added'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                  {details.patient?.primaryDoctor?.department || 'Department not added'}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Date of birth</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{details.patient?.dateOfBirth ? formatDate(details.patient.dateOfBirth) : 'Not added'}</p>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Patient status</p>
                                  <p className="text-sm capitalize" style={{ color: '#0f172a' }}>{details.patient?.status || 'Stable'}</p>
                                </div>
                              </div>
                            </div>
                          </DetailSection>

                          <DetailSection
                            icon={HeartPulse}
                            title="Latest Vitals"
                            subtitle={details.latestVitals?.recordedAt ? `Last recorded ${formatRelative(details.latestVitals.recordedAt)}` : 'Most recent health readings'}
                          >
                            {!details.latestVitals ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No vitals recorded yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Blood pressure</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{getBloodPressureText(details.latestVitals)}</p>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Heart rate</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{getHeartRateText(details.latestVitals)}</p>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Oxygen level</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{getOxygenText(details.latestVitals)}</p>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Temperature</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{getTemperatureText(details.latestVitals)}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <p className="text-xs font-semibold uppercase" style={{ color: '#64748b', marginBottom: 6 }}>Timestamp</p>
                                  <p className="text-sm" style={{ color: '#0f172a' }}>{formatDateTime(details.latestVitals.recordedAt || details.latestVitals.createdAt)}</p>
                                  {Array.isArray(details.latestVitals.alerts) && details.latestVitals.alerts.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {details.latestVitals.alerts.map((alert) => (
                                        <Badge key={alert} variant="danger">{alert}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </DetailSection>

                          <DetailSection
                            icon={Pill}
                            title="Medication Details"
                            subtitle="Active and recent medications with schedule"
                            count={details.recentMedications?.length || 0}
                          >
                            {!details.recentMedications?.length ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No medications found for this patient.</p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {details.recentMedications.map((medication) => (
                                  <div key={medication._id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{medication.name}</p>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                          {medication.dosage} • {medication.frequency} • {medication.status}
                                        </p>
                                      </div>
                                      <Badge variant={medication.status === 'active' ? 'success' : medication.status === 'completed' ? 'info' : 'warning'}>
                                        {medication.status}
                                      </Badge>
                                    </div>
                                    {medication.instructions && (
                                      <p className="text-xs mt-2" style={{ color: '#475569' }}>
                                        Instructions: {medication.instructions}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                      <p className="text-xs" style={{ color: '#64748b' }}>
                                        Prescribed: {formatDateTime(medication.prescribedDate || medication.createdAt)}
                                      </p>
                                      {medication.duration?.endDate && (
                                        <p className="text-xs" style={{ color: '#64748b' }}>
                                          Ends: {formatDate(medication.duration.endDate)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </DetailSection>

                          <DetailSection
                            icon={Calendar}
                            title="Appointment Details"
                            subtitle="Recent and upcoming appointments"
                            count={details.recentAppointments?.length || 0}
                          >
                            {!details.recentAppointments?.length ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No appointment history found.</p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {details.recentAppointments.map((appointment) => (
                                  <div key={appointment._id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                          Dr. {appointment.doctor?.user?.name || 'Doctor'}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                          {formatAppointmentDate(appointment)} • {formatAppointmentTime(appointment)}
                                        </p>
                                      </div>
                                      <Badge variant={
                                        appointment.status === 'completed' ? 'success'
                                          : appointment.status === 'cancelled' ? 'danger'
                                            : appointment.status === 'pending' ? 'warning'
                                              : 'info'
                                      }>
                                        {appointment.status}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                      <p className="text-xs capitalize" style={{ color: '#64748b' }}>Type: {appointment.type || 'consultation'}</p>
                                      <p className="text-xs" style={{ color: '#64748b' }}>
                                        Last updated: {formatDateTime(appointment.updatedAt || appointment.createdAt)}
                                      </p>
                                    </div>
                                    {appointment.reason && (
                                      <p className="text-xs mt-2" style={{ color: '#475569' }}>
                                        Reason: {appointment.reason}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </DetailSection>

                          <DetailSection
                            icon={ClipboardList}
                            title="Consultation Details"
                            subtitle="Diagnosis, treatment, and follow-up summary"
                            count={details.recentConsultations?.length || 0}
                          >
                            {!details.recentConsultations?.length ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No consultation summaries available.</p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {details.recentConsultations.map((consultation) => (
                                  <div key={consultation._id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                          Dr. {consultation.doctor?.user?.name || 'Doctor'}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                          {formatDateTime(consultation.updatedAt || consultation.date || consultation.createdAt)}
                                        </p>
                                      </div>
                                      <Badge variant={consultation.status === 'completed' ? 'success' : 'warning'}>
                                        {consultation.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs mt-2" style={{ color: '#64748b' }}>Diagnosis</p>
                                    <p className="text-sm" style={{ color: '#0f172a' }}>{getDiagnosisText(consultation)}</p>
                                    {(consultation.treatment?.plan || consultation.notes) && (
                                      <>
                                        <p className="text-xs mt-3" style={{ color: '#64748b' }}>Treatment / Notes</p>
                                        <p className="text-sm" style={{ color: '#475569' }}>
                                          {consultation.treatment?.plan || consultation.notes}
                                        </p>
                                      </>
                                    )}
                                    {consultation.treatment?.followUp && (
                                      <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                                        Follow-up: {formatDate(consultation.treatment.followUp)}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </DetailSection>

                          <DetailSection
                            icon={Clock}
                            title="Pending Reminders"
                            subtitle="Upcoming medication reminders"
                            count={details.pendingReminders?.length || 0}
                          >
                            {!details.pendingReminders?.length ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No pending reminders right now.</p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {details.pendingReminders.map((reminder) => (
                                  <div key={reminder._id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                          {reminder.medication?.name || 'Medication'}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                          Scheduled: {formatDateTime(reminder.scheduledTime)}
                                        </p>
                                      </div>
                                      <Badge variant="warning">{reminder.status}</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </DetailSection>

                          <DetailSection
                            icon={AlertTriangle}
                            title="Care Logs"
                            subtitle="Recent caregiver observations and completed care"
                            count={details.recentLogs?.length || 0}
                          >
                            {!details.recentLogs?.length ? (
                              <p className="text-sm" style={{ color: '#64748b' }}>No caregiver logs recorded yet.</p>
                            ) : (
                              <div className="flex flex-col gap-3">
                                {details.recentLogs.map((log) => (
                                  <div key={log._id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                          {log.caregiver?.user?.name || 'Caregiver log'}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                          {formatDateTime(log.date || log.createdAt)}
                                        </p>
                                      </div>
                                      {typeof log.totalHours === 'number' && (
                                        <Badge variant="info">{log.totalHours.toFixed(1)} hrs</Badge>
                                      )}
                                    </div>
                                    {log.observations && (
                                      <p className="text-xs mt-2" style={{ color: '#475569' }}>
                                        Observations: {log.observations}
                                      </p>
                                    )}
                                    {log.mood && (
                                      <p className="text-xs mt-2 capitalize" style={{ color: '#64748b' }}>
                                        Mood: {log.mood}
                                      </p>
                                    )}
                                    {(log.checkInTime || log.checkOutTime) && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                        {log.checkInTime && (
                                          <p className="text-xs" style={{ color: '#64748b' }}>
                                            Check-in: {formatDateTime(log.checkInTime)}
                                          </p>
                                        )}
                                        {log.checkOutTime && (
                                          <p className="text-xs" style={{ color: '#64748b' }}>
                                            Check-out: {formatDateTime(log.checkOutTime)}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </DetailSection>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppointments } from '../../hooks/useAppointments'
import { consultationApi } from '../../api/consultationApi'
import {
  Plus,
  Pill,
  Trash2,
  Stethoscope,
  FileText,
  ClipboardList,
  Calendar,
  Clock,
  Search,
} from 'lucide-react'
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatDateTime,
  getAppointmentDateTime,
} from '../../utils/formatDate'
import toast from 'react-hot-toast'

const INITIAL_FORM = {
  diagnosisPrimary: '',
  diagnosisSecondary: '',
  treatmentPlan: '',
  procedures: '',
  notes: '',
  followUpDate: '',
  prescriptions: [],
}

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once daily' },
  { value: 'twice', label: 'Twice daily' },
  { value: 'thrice', label: 'Three times daily' },
  { value: 'four times', label: 'Four times daily' },
  { value: 'every 4 hours', label: 'Every 4 hours' },
  { value: 'every 6 hours', label: 'Every 6 hours' },
  { value: 'every 8 hours', label: 'Every 8 hours' },
  { value: 'as needed', label: 'As needed' },
]

const toInputDate = (value) => {
  if (!value) return ''
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toISOString().slice(0, 10)
}

const toCommaList = (value) => (
  Array.isArray(value) ? value.filter(Boolean).join(', ') : ''
)

const getDiagnosisText = (consultation) => {
  if (!consultation?.diagnosis) return ''
  if (typeof consultation.diagnosis === 'string') return consultation.diagnosis

  return [
    consultation.diagnosis.primary,
    ...(consultation.diagnosis.secondary || []),
  ].filter(Boolean).join(', ')
}

const getTreatmentText = (consultation) => {
  if (!consultation?.treatment) return ''

  return [
    consultation.treatment.plan,
    ...(consultation.treatment.procedures || []),
  ].filter(Boolean).join('. ')
}

const consultationToPrescriptionForm = (prescription) => ({
  _id: prescription?._id,
  medicationName: prescription?.name || prescription?.medicationName || '',
  dosage: prescription?.dosage || '',
  frequency: prescription?.frequency || 'once',
  duration: prescription?.duration?.endDate
    ? toInputDate(prescription.duration.endDate)
    : '',
  notes: prescription?.instructions || prescription?.notes || '',
})

const consultationToForm = (consultation) => ({
  diagnosisPrimary: consultation?.diagnosis?.primary || (typeof consultation?.diagnosis === 'string' ? consultation.diagnosis : ''),
  diagnosisSecondary: toCommaList(consultation?.diagnosis?.secondary),
  treatmentPlan: consultation?.treatment?.plan || '',
  procedures: toCommaList(consultation?.treatment?.procedures),
  notes: consultation?.notes || '',
  followUpDate: toInputDate(consultation?.treatment?.followUp),
  prescriptions: Array.isArray(consultation?.prescriptions)
    ? consultation.prescriptions.map(consultationToPrescriptionForm)
    : [],
})

const buildConsultationPayload = (form) => ({
  diagnosis: {
    primary: form.diagnosisPrimary.trim(),
    secondary: form.diagnosisSecondary
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  },
  treatment: {
    plan: form.treatmentPlan.trim(),
    procedures: form.procedures
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    ...(form.followUpDate ? { followUp: form.followUpDate } : {}),
  },
  notes: form.notes.trim(),
  prescriptions: (form.prescriptions || [])
    .map((item) => ({
      ...(item._id ? { _id: item._id } : {}),
      medicationName: item.medicationName.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency,
      duration: item.duration.trim(),
      notes: item.notes.trim(),
    }))
    .filter((item) => item._id || (item.medicationName && item.dosage)),
})

const createEmptyPrescription = () => ({
  medicationName: '',
  dosage: '',
  frequency: 'once',
  duration: '',
  notes: '',
})

const getAppointmentPriority = ({ appointment, consultation }) => {
  const status = appointment?.status

  if (consultation && consultation.status !== 'completed') return 0
  if (status === 'confirmed') return 1
  if (status === 'scheduled') return 2
  if (status === 'in-progress') return 3
  if (status === 'completed' && consultation) return 4
  if (status === 'completed') return 5
  return 99
}

export default function DoctorConsultations() {
  const { appointments, loading: appointmentsLoading, fetchAppointments } = useAppointments()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeAppointment, setActiveAppointment] = useState(null)
  const [activeConsultation, setActiveConsultation] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [openPatientIds, setOpenPatientIds] = useState({})

  const fetchConsultations = async () => {
    const response = await consultationApi.getAll()
    const list = response.data?.data || response.data || []
    setConsultations(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    Promise.all([
      fetchConsultations().catch(() => {
        toast.error('Failed to load consultations')
      }),
      fetchAppointments().catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [fetchAppointments])

  const consultationByAppointmentId = useMemo(() => (
    consultations.reduce((acc, consultation) => {
      const appointmentId = consultation.appointment?._id || consultation.appointment
      if (appointmentId) acc[String(appointmentId)] = consultation
      return acc
    }, {})
  ), [consultations])

  const patientFiles = useMemo(() => {
    const files = {}

    appointments
      .filter((appointment) => (
        appointment.patient &&
        ['scheduled', 'confirmed', 'in-progress', 'completed'].includes(appointment.status)
      ))
      .forEach((appointment) => {
        const patientId = String(appointment.patient?._id || appointment.patient)
        const patientName = appointment.patient?.user?.name || 'Patient'

        if (!files[patientId]) {
          files[patientId] = {
            patientId,
            patientName,
            actionAppointment: null,
            actionConsultation: null,
            consultations: [],
          }
        }

        const consultation = consultationByAppointmentId[String(appointment._id)]
        const current = files[patientId].actionAppointment
          ? {
              appointment: files[patientId].actionAppointment,
              consultation: files[patientId].actionConsultation,
            }
          : null
        const candidate = { appointment, consultation }

        if (!current) {
          files[patientId].actionAppointment = appointment
          files[patientId].actionConsultation = consultation || null
          return
        }

        const currentPriority = getAppointmentPriority(current)
        const candidatePriority = getAppointmentPriority(candidate)
        const currentTime = getAppointmentDateTime(current.appointment)?.getTime() || 0
        const candidateTime = getAppointmentDateTime(candidate.appointment)?.getTime() || 0

        if (
          candidatePriority < currentPriority ||
          (candidatePriority === currentPriority && candidateTime > currentTime)
        ) {
          files[patientId].actionAppointment = appointment
          files[patientId].actionConsultation = consultation || null
        }
      })

    consultations.forEach((consultation) => {
      const patientId = String(consultation.patient?._id || consultation.patient || consultation._id)
      const patientName = consultation.patient?.user?.name || 'Patient'

      if (!files[patientId]) {
        files[patientId] = {
          patientId,
          patientName,
          actionAppointment: null,
          actionConsultation: null,
          consultations: [],
        }
      }

      files[patientId].consultations.push(consultation)
    })

    return Object.values(files)
      .map((file) => ({
        ...file,
        consultations: file.consultations
          .slice()
          .sort((a, b) => {
            const left = new Date(a.date || a.updatedAt || a.createdAt || 0).getTime()
            const right = new Date(b.date || b.updatedAt || b.createdAt || 0).getTime()
            return right - left
          }),
      }))
      .sort((a, b) => {
        const aActionTime = getAppointmentDateTime(a.actionAppointment)?.getTime() || 0
        const bActionTime = getAppointmentDateTime(b.actionAppointment)?.getTime() || 0
        const aConsultationTime = new Date(a.consultations[0]?.date || a.consultations[0]?.updatedAt || a.consultations[0]?.createdAt || 0).getTime()
        const bConsultationTime = new Date(b.consultations[0]?.date || b.consultations[0]?.updatedAt || b.consultations[0]?.createdAt || 0).getTime()
        return Math.max(bActionTime, bConsultationTime) - Math.max(aActionTime, aConsultationTime)
      })
  }, [appointments, consultations, consultationByAppointmentId])

  const filteredPatientFiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return patientFiles

    return patientFiles.filter((group) => {
      const searchableText = [
        group.patientName,
        group.actionAppointment?.reason,
        group.actionAppointment?.type,
        ...(group.consultations || []).flatMap((consultation) => [
          getDiagnosisText(consultation),
          getTreatmentText(consultation),
          consultation.notes,
          consultation.type,
          consultation.appointment?.reason,
          ...(consultation.prescriptions || []).flatMap((item) => [
            item?.name,
            item?.medicationName,
            item?.dosage,
          ]),
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [patientFiles, searchTerm])

  const closeModal = () => {
    setActiveAppointment(null)
    setActiveConsultation(null)
    setForm(INITIAL_FORM)
  }

  const togglePatientFile = (patientId) => {
    setOpenPatientIds((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }))
  }

  const openConsultationModal = async (appointment) => {
    const existingConsultation = consultationByAppointmentId[String(appointment._id)]

    if (existingConsultation) {
      setActiveAppointment(appointment?.patient ? appointment : existingConsultation.appointment || appointment)
      setActiveConsultation(existingConsultation)
      setForm(consultationToForm(existingConsultation))
      return
    }

    setSaving(true)
    try {
      const response = await consultationApi.start(appointment._id)
      const started = response.data?.data || response.data
      setConsultations((prev) => [started, ...prev.filter((item) => item._id !== started._id)])
      await fetchAppointments()
      setActiveAppointment(appointment)
      setActiveConsultation(started)
      setForm(consultationToForm(started))
      toast.success('Consultation started')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to start consultation')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConsultation = async (event) => {
    event.preventDefault()
    if (!activeConsultation?._id) return

    setSaving(true)
    try {
      const payload = buildConsultationPayload(form)
      const response = activeConsultation.status === 'completed'
        ? await consultationApi.update(activeConsultation._id, {
            ...payload,
            status: 'completed',
          })
        : await consultationApi.end(activeConsultation._id, payload)

      const saved = response.data?.data || response.data
      setConsultations((prev) => [saved, ...prev.filter((item) => item._id !== saved._id)])
      await fetchAppointments()
      toast.success(activeConsultation.status === 'completed' ? 'Consultation updated' : 'Consultation completed')
      closeModal()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save consultation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="page-title">Consultations</h1>
        <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
          Start, complete, and review patient consultation summaries
        </p>
      </div>

      <Card padding="p-4">
        <Input
          name="consultationSearch"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by patient, diagnosis, treatment, reason, or medication"
          icon={Search}
        />
      </Card>

      {loading || appointmentsLoading ? (
        <Card padding="p-8">
          <p className="text-center text-sm" style={{ color: '#94a3b8' }}>Loading patient files...</p>
        </Card>
      ) : patientFiles.length === 0 ? (
        <Card padding="p-12">
          <div className="text-center">
            <Stethoscope size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>No patient files yet</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Once a patient has a valid appointment or consultation, their file will appear here
            </p>
          </div>
        </Card>
      ) : filteredPatientFiles.length === 0 ? (
        <Card padding="p-12">
          <div className="text-center">
            <Search size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>No matching consultation files</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Try a patient name, diagnosis, treatment detail, appointment reason, or medication
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredPatientFiles.map((group) => (
            <div
              key={group.patientId}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}
            >
              <button
                type="button"
                onClick={() => togglePatientFile(group.patientId)}
                className="w-full"
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 15, margin: 0 }}>{group.patientName}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                        Click to {openPatientIds[group.patientId] ? 'hide' : 'view'} this patient file
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      minWidth: 40,
                      borderRadius: 12,
                      background: '#f8fafc',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {openPatientIds[group.patientId] ? 'Hide' : 'Open'}
                    </span>
                  </div>
                </div>
              </button>

              {openPatientIds[group.patientId] && group.actionAppointment ? (() => {
                const appointment = group.actionAppointment
                const consultation = group.actionConsultation
                const actionLabel = consultation
                  ? consultation.status === 'completed' ? 'Edit Summary' : 'Continue Consultation'
                  : appointment.status === 'completed' ? 'Add Summary' : 'Add Consultation'

                return (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: 16 }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: '#0f172a', margin: 0 }}>
                            Current Appointment
                          </p>
                          <Badge variant={appointment.status === 'completed' ? 'default' : 'success'}>
                            {appointment.status}
                          </Badge>
                          {consultation && (
                            <Badge variant={consultation.status === 'completed' ? 'info' : 'warning'}>
                              {consultation.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                            <Calendar size={12} /> {formatAppointmentDate(appointment)}
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                            <Clock size={12} /> {formatAppointmentTime(appointment)}
                          </span>
                          <span className="text-xs" style={{ color: '#64748b', textTransform: 'capitalize' }}>
                            {appointment.type || 'Consultation'}
                          </span>
                        </div>
                        {appointment.reason && (
                          <p className="text-xs mt-2" style={{ color: '#475569', marginBottom: 0 }}>
                            Reason: {appointment.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        icon={consultation ? FileText : Stethoscope}
                        loading={saving && activeAppointment?._id === appointment._id}
                        onClick={() => openConsultationModal(appointment)}
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  </div>
                )
              })() : null}

              {openPatientIds[group.patientId] && !group.actionAppointment ? (
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: 16 }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    No active appointment action right now. Consultation history is shown below.
                  </p>
                </div>
              ) : null}

              {openPatientIds[group.patientId] ? (
                <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
                  {group.consultations.length === 0 ? (
                    <div
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}
                    >
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        No consultation records saved yet for this patient.
                      </p>
                    </div>
                  ) : null}

                  {group.consultations.map((consultation) => {
                    const appointment = consultation.appointment
                    const diagnosisText = getDiagnosisText(consultation)
                    const treatmentText = getTreatmentText(consultation)
                    const visitLabel = appointment
                      ? `${formatAppointmentDate(appointment)} at ${formatAppointmentTime(appointment)}`
                      : formatDateTime(consultation.date || consultation.updatedAt || consultation.createdAt)

                    return (
                      <div
                        key={consultation._id}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, margin: 0 }}>
                              Consultation Date: {visitLabel}
                            </p>
                            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
                                {(consultation.type || appointment?.type || 'consultation').replace('-', ' ')}
                              </span>
                              {appointment?.reason && (
                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                  Reason: {appointment.reason}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge variant={consultation.status === 'completed' ? 'success' : 'warning'}>
                              {consultation.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={ClipboardList}
                              onClick={() => openConsultationModal(appointment || { _id: consultation.appointment?._id, patient: consultation.patient })}
                            >
                              {consultation.status === 'completed' ? 'Edit' : 'Continue'}
                            </Button>
                          </div>
                        </div>

                        {diagnosisText && (
                          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>Diagnosis</p>
                            <p style={{ fontSize: 13, color: '#0f172a', margin: 0 }}>{diagnosisText}</p>
                          </div>
                        )}

                        {treatmentText && (
                          <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>Treatment Plan</p>
                            <p style={{ fontSize: 13, color: '#0f172a', margin: 0 }}>{treatmentText}</p>
                          </div>
                        )}

                        {Array.isArray(consultation.prescriptions) && consultation.prescriptions.length > 0 && (
                          <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontWeight: 600 }}>Medications</p>
                            <div className="flex flex-col gap-2">
                              {consultation.prescriptions.map((item) => (
                                <div
                                  key={item._id || `${item.name}-${item.dosage}`}
                                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
                                >
                                  <span style={{ fontSize: 13, color: '#0f172a' }}>
                                    {(item.name || item.medicationName || 'Medication')} {item.dosage ? `- ${item.dosage}` : ''}
                                  </span>
                                  <span style={{ fontSize: 12, color: '#64748b' }}>
                                    {item.frequency || 'once'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {consultation.notes && (
                          <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>Doctor Notes</p>
                            <p style={{ fontSize: 13, color: '#0f172a', margin: 0 }}>{consultation.notes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!activeConsultation}
        onClose={closeModal}
        title={activeConsultation?.status === 'completed' ? 'Edit Consultation Summary' : 'Complete Consultation'}
        size="lg"
      >
        <form onSubmit={handleSaveConsultation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Patient"
              name="patientName"
              value={activeAppointment?.patient?.user?.name || activeConsultation?.patient?.user?.name || 'Patient'}
              disabled
            />
            <Input
              label="Appointment Time"
              name="appointmentTime"
              value={activeAppointment ? `${formatAppointmentDate(activeAppointment)} at ${formatAppointmentTime(activeAppointment)}` : ''}
              disabled
            />
          </div>

          <Input
            label="Primary Diagnosis"
            name="diagnosisPrimary"
            value={form.diagnosisPrimary}
            onChange={(event) => setForm((prev) => ({ ...prev, diagnosisPrimary: event.target.value }))}
            placeholder="Main diagnosis"
            required
          />

          <Input
            label="Secondary Diagnosis"
            name="diagnosisSecondary"
            value={form.diagnosisSecondary}
            onChange={(event) => setForm((prev) => ({ ...prev, diagnosisSecondary: event.target.value }))}
            placeholder="Comma separated, optional"
          />

          <div>
            <label className="label-text">Treatment Plan</label>
            <textarea
              value={form.treatmentPlan}
              onChange={(event) => setForm((prev) => ({ ...prev, treatmentPlan: event.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="Treatment plan, medications, and next steps"
              required
            />
          </div>

          <Input
            label="Procedures"
            name="procedures"
            value={form.procedures}
            onChange={(event) => setForm((prev) => ({ ...prev, procedures: event.target.value }))}
            placeholder="Comma separated procedures, optional"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Follow-up Date"
              name="followUpDate"
              type="date"
              value={form.followUpDate}
              onChange={(event) => setForm((prev) => ({ ...prev, followUpDate: event.target.value }))}
            />
          </div>

          <div>
            <label className="label-text">Doctor Notes / Suggestions</label>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="input-field resize-none"
              rows={4}
              placeholder="Advice, precautions, home care suggestions, or follow-up instructions"
            />
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Medications</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Add medicines directly while completing the consultation
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() => setForm((prev) => ({ ...prev, prescriptions: [...prev.prescriptions, createEmptyPrescription()] }))}
              >
                Add Medication
              </Button>
            </div>

            {form.prescriptions.length === 0 ? (
              <p style={{ margin: '12px 0 0', fontSize: 12, color: '#94a3b8' }}>No medications added for this consultation.</p>
            ) : (
              <div className="flex flex-col gap-3" style={{ marginTop: 12 }}>
                {form.prescriptions.map((item, index) => (
                  <div
                    key={item._id || `prescription-${index}`}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}
                  >
                    <div className="flex items-center justify-between gap-3" style={{ marginBottom: 12 }}>
                      <div className="flex items-center gap-2">
                        <Pill size={15} style={{ color: '#2563eb' }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          Medication {index + 1}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          prescriptions: prev.prescriptions.filter((_, prescriptionIndex) => prescriptionIndex !== index),
                        }))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Medication Name"
                        value={item.medicationName}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          prescriptions: prev.prescriptions.map((prescription, prescriptionIndex) => (
                            prescriptionIndex === index
                              ? { ...prescription, medicationName: event.target.value }
                              : prescription
                          )),
                        }))}
                        placeholder="e.g. Metformin 500mg"
                      />
                      <Input
                        label="Dosage"
                        value={item.dosage}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          prescriptions: prev.prescriptions.map((prescription, prescriptionIndex) => (
                            prescriptionIndex === index
                              ? { ...prescription, dosage: event.target.value }
                              : prescription
                          )),
                        }))}
                        placeholder="e.g. 1 tablet"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label-text">Frequency</label>
                        <select
                          className="input-field"
                          value={item.frequency}
                          onChange={(event) => setForm((prev) => ({
                            ...prev,
                            prescriptions: prev.prescriptions.map((prescription, prescriptionIndex) => (
                              prescriptionIndex === index
                                ? { ...prescription, frequency: event.target.value }
                                : prescription
                            )),
                          }))}
                        >
                          {FREQUENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Duration"
                        value={item.duration}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          prescriptions: prev.prescriptions.map((prescription, prescriptionIndex) => (
                            prescriptionIndex === index
                              ? { ...prescription, duration: event.target.value }
                              : prescription
                          )),
                        }))}
                        placeholder="e.g. 5 days"
                      />
                    </div>

                    <div>
                      <label className="label-text">Medication Notes</label>
                      <textarea
                        value={item.notes}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          prescriptions: prev.prescriptions.map((prescription, prescriptionIndex) => (
                            prescriptionIndex === index
                              ? { ...prescription, notes: event.target.value }
                              : prescription
                          )),
                        }))}
                        className="input-field resize-none"
                        rows={2}
                        placeholder="Instructions like after food, before sleep, or precautions"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={saving} fullWidth>
              {activeConsultation?.status === 'completed' ? 'Update Summary' : 'Complete Consultation'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

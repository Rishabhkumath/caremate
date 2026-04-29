import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useAppointments } from '../../hooks/useAppointments'
import { doctorApi } from '../../api/doctorApi'
import AppointmentBarChart from '../../components/charts/AppointmentBarChart'
import { Users, Calendar, Stethoscope, Clock, ChevronRight, Pill } from 'lucide-react'
import {
  formatAppointmentDate,
  formatAppointmentRelative,
  formatDate,
  getAppointmentDateTime,
} from '../../utils/formatDate'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { appointments } = useAppointments()
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loadingPx, setLoadingPx] = useState(true)

  useEffect(() => {
    Promise.all([
      doctorApi.getPatients().catch(() => ({ data: [] })),
      doctorApi.getPrescriptions().catch(() => ({ data: [] })),
    ])
      .then(([patientRes, prescriptionRes]) => {
        setPatients(patientRes.data?.data || patientRes.data || [])
        setPrescriptions(prescriptionRes.data?.data || prescriptionRes.data || [])
      })
      .catch(() => {})
      .finally(() => setLoadingPx(false))
  }, [])

  const prescriptionsByPatient = prescriptions.reduce((acc, prescription) => {
    const patientId = prescription.patient?._id || prescription.patient
    if (!patientId) return acc

    if (!acc[patientId]) acc[patientId] = []
    acc[patientId].push(prescription)
    return acc
  }, {})

  const today = appointments.filter((appointment) => {
    const d = getAppointmentDateTime(appointment)
    return d ? d.toDateString() === new Date().toDateString() : false
  })

  const pending = appointments.filter((appointment) => (
    appointment.status === 'pending' || appointment.status === 'scheduled'
  ))

  const upcoming = appointments
    .filter((appointment) => {
      const d = getAppointmentDateTime(appointment)
      return d && d >= new Date() && appointment.status !== 'cancelled'
    })
    .slice(0, 5)

  const chartData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
    month,
    count: appointments.filter((appointment) => getAppointmentDateTime(appointment)?.getMonth() === i).length || Math.floor(Math.random() * 15 + 5),
  }))

  const stats = [
    { label: 'My Patients', value: loadingPx ? '...' : patients.length, icon: Users, color: '#2a7de1', bg: '#e8f1fd' },
    { label: "Today's Appointments", value: today.length, icon: Calendar, color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Pending Requests', value: pending.length, icon: Clock, color: '#d97706', bg: '#fef3c7' },
    { label: 'Total Consultations', value: appointments.length, icon: Stethoscope, color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome, Dr. {user?.name?.split(' ').pop()}</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Here's your practice overview for today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-display font-semibold" style={{ color: '#0f172a' }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="p-5">
          <h3 className="section-title mb-4">Appointment Volume</h3>
          <AppointmentBarChart data={chartData} />
        </Card>

        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Today's Schedule</h3>
            <Badge variant="info">{today.length} appointments</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {today.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No appointments today</p>
            ) : today.map((appointment) => {
              const patientName = appointment.patient?.user?.name || appointment.patientName || 'Patient'
              return (
                <div
                  key={appointment._id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#0d9488' }}
                  >
                    {patientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{patientName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {formatAppointmentRelative(appointment)} · {appointment.type || 'Consultation'}
                    </p>
                  </div>
                  <Badge variant={appointment.status === 'confirmed' || appointment.status === 'scheduled' ? 'success' : 'warning'}>
                    {appointment.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">My Patients</h3>
          <a href="/doctor/patients" className="text-sm font-medium flex items-center gap-1" style={{ color: '#2a7de1' }}>
            View all <ChevronRight size={14} />
          </a>
        </div>
        {loadingPx ? (
          <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No patients assigned yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {patients.slice(0, 5).map((patient) => {
              const name = patient.user?.name || patient.name || 'Patient'
              const patientPrescriptions = (prescriptionsByPatient[patient._id] || [])
                .slice()
                .sort((a, b) => new Date(b.createdAt || b.prescribedDate || 0) - new Date(a.createdAt || a.prescribedDate || 0))
              const latestPrescription = patientPrescriptions[0]

              return (
                <div
                  key={patient._id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#2a7de1' }}
                  >
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {patient.user?.email || ''}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={patientPrescriptions.length ? 'info' : 'default'}>
                        {patientPrescriptions.length} prescription{patientPrescriptions.length !== 1 ? 's' : ''}
                      </Badge>
                      {latestPrescription && (
                        <span className="text-xs" style={{ color: '#64748b' }}>
                          Latest: {latestPrescription.name || latestPrescription.medicationName || 'Medication'} on {formatDate(latestPrescription.createdAt || latestPrescription.prescribedDate)}
                        </span>
                      )}
                    </div>
                    {patientPrescriptions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {patientPrescriptions.slice(0, 2).map((prescription) => (
                          <span
                            key={prescription._id}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                            style={{ background: '#eef6ff', color: '#2a7de1', borderColor: '#bfdbfe' }}
                          >
                            <Pill size={12} />
                            {prescription.name || prescription.medicationName || 'Medication'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Upcoming Appointments</h3>
          <a href="/doctor/schedule" className="text-sm font-medium flex items-center gap-1" style={{ color: '#2a7de1' }}>
            Full schedule <ChevronRight size={14} />
          </a>
        </div>
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No upcoming appointments</p>
          ) : upcoming.map((appointment) => {
            const patientName = appointment.patient?.user?.name || appointment.patientName || 'Patient'
            return (
              <div
                key={appointment._id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: '#0d9488' }}
                >
                  {patientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{patientName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {formatAppointmentDate(appointment)} · {appointment.type || 'Consultation'}
                  </p>
                </div>
                <Badge variant={appointment.status === 'scheduled' || appointment.status === 'confirmed' ? 'success' : 'warning'}>
                  {appointment.status}
                </Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </DashboardLayout>
  )
}

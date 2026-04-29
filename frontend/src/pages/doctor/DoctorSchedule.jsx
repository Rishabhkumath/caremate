import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { useAppointments } from '../../hooks/useAppointments'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import {
  formatAppointmentTime,
  getAppointmentDateTime,
} from '../../utils/formatDate'
import toast from 'react-hot-toast'

const STATUS_TABS = ['all', 'scheduled', 'confirmed', 'completed', 'cancelled']

export default function DoctorSchedule() {
  const { appointments, loading, updateAppointment } = useAppointments()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const handleConfirm = async (id) => {
    try {
      await updateAppointment(id, { status: 'confirmed' })
      toast.success('Appointment confirmed')
    } catch { toast.error('Failed to update') }
  }

  const handleComplete = async (id) => {
    try {
      await updateAppointment(id, { status: 'completed' })
      toast.success('Marked as completed')
    } catch { toast.error('Failed to update') }
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="page-title">My Schedule</h1>
        <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
          {appointments.length} total appointments
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', border: '1px solid',
                    background: filter === s ? '#2a7de1' : '#fff',
                    color:      filter === s ? '#fff'    : '#64748b',
                    borderColor: filter === s ? '#2a7de1' : '#e2e8f0',
                    textTransform: 'capitalize', transition: 'all 0.15s',
                  }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Card padding="p-8">
          <p className="text-center text-sm" style={{ color: '#94a3b8' }}>Loading schedule…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card padding="p-12">
          <div className="text-center">
            <Calendar size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b' }}>No appointments found</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(a => {
            const patientName = a.patient?.user?.name || a.patientName || 'Patient'
            const dt = getAppointmentDateTime(a) || new Date()
            return (
              <div key={a._id}
                   style={{ background: '#fff', border: '1px solid #e2e8f0',
                             borderRadius: 14, padding: '16px 20px',
                             display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                {/* Date block */}
                <div style={{ width: 52, height: 52, borderRadius: 12, background: '#e8f1fd',
                               display: 'flex', flexDirection: 'column',
                               alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#2a7de1',
                                  fontFamily: 'Fraunces,serif', lineHeight: 1 }}>
                    {dt.getDate()}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>
                    {dt.toLocaleString('default', { month: 'short' })}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', margin: 0 }}>
                      {patientName}
                    </p>
                    <Badge variant={
                      a.status === 'confirmed' ? 'success' :
                      a.status === 'completed' ? 'default' :
                      a.status === 'cancelled' ? 'danger'  : 'warning'
                    }>{a.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {formatAppointmentTime(a)}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
                      {a.type || 'Consultation'}
                    </span>
                    {a.reason && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>— {a.reason}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {(a.status === 'scheduled' || a.status === 'pending') && (
                    <button onClick={() => handleConfirm(a._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                     borderRadius: 8, background: '#e8f1fd', color: '#2a7de1',
                                     border: '1px solid rgba(42,125,225,0.2)',
                                     fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <CheckCircle size={13} /> Confirm
                    </button>
                  )}
                  {a.status === 'confirmed' && (
                    <button onClick={() => handleComplete(a._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                     borderRadius: 8, background: '#ccfbf1', color: '#0d9488',
                                     border: '1px solid rgba(13,148,136,0.2)',
                                     fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <CheckCircle size={13} /> Complete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}

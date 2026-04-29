import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../hooks/useAuth'
import { caregiverApi } from '../../api/caregiverApi'
import { Users, CheckSquare, AlertCircle, Heart, ChevronRight, Activity } from 'lucide-react'
import { formatRelative } from '../../utils/formatDate'

export default function CaregiverDashboard() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      caregiverApi.getPatients().catch(() => ({ data: [] })),
      caregiverApi.getTasks().catch(() => ({ data: [] })),
    ]).then(([pRes, tRes]) => {
      setPatients(pRes.data?.data || pRes.data || [])
      setTasks(tRes.data?.data    || tRes.data    || [])
    }).finally(() => setLoading(false))
  }, [])

  const alerts    = patients.filter(p => p.hasAlert || p.status === 'critical')
  const todayTasks = tasks.filter(t => !t.completed).slice(0, 5)

  const stats = [
    { label: 'Assigned Patients', value: loading ? '…' : patients.length, icon: Users,        color: '#2a7de1', bg: '#e8f1fd' },
    { label: 'Tasks Today',       value: loading ? '…' : todayTasks.length, icon: CheckSquare, color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Alerts',            value: loading ? '…' : alerts.length,    icon: AlertCircle, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Care Hours Today',  value: '4.5h',                            icon: Heart,       color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <DashboardLayout>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome, {user?.name} 🤝</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Caregiver dashboard — patient monitoring overview
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                 style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-display font-semibold" style={{ color: '#0f172a' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Patient Status */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Patient Status</h3>
            <a href="/caregiver/patients" className="text-sm font-medium flex items-center gap-1"
               style={{ color: '#7c3aed' }}>
              View all <ChevronRight size={14} />
            </a>
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>Loading patients…</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No patients assigned yet</p>
            ) : patients.slice(0, 5).map(p => {
                const name = p.user?.name || p.name || 'Patient'
                const hasAlert = p.hasAlert || p.status === 'critical'
                return (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                         style={{ background: '#7c3aed' }}>
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        {p.user?.email || ''}
                      </p>
                    </div>
                    <Badge variant={hasAlert ? 'danger' : 'success'} dot>
                      {hasAlert ? 'Alert' : 'Stable'}
                    </Badge>
                  </div>
                )
              })
            }
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Today's Tasks</h3>
            <a href="/caregiver/workboard" className="text-sm font-medium flex items-center gap-1"
               style={{ color: '#7c3aed' }}>
              Open workboard <ChevronRight size={14} />
            </a>
          </div>
          <div className="flex flex-col gap-2">
            {loading ? (
              <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>Loading tasks…</p>
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No pending tasks</p>
            ) : todayTasks.map((t, i) => (
                <div key={t._id || i} className="flex items-center gap-3 p-3 rounded-xl"
                     style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: '#ede9fe' }}>
                    <CheckSquare size={15} style={{ color: '#7c3aed' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>
                      {t.title || t.task || 'Task'}
                    </p>
                    {t.dueTime && (
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{t.dueTime}</p>
                    )}
                  </div>
                  <Badge variant={t.priority === 'high' ? 'danger' : 'warning'}>
                    {t.priority || 'Normal'}
                  </Badge>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <Card padding="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: '#dc2626' }} />
            <h3 className="section-title">Active Alerts</h3>
            <Badge variant="danger">{alerts.length}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {alerts.map(p => {
              const name = p.user?.name || p.name || 'Patient'
              return (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl"
                     style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Activity size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <p className="text-sm font-medium" style={{ color: '#0f172a' }}>
                    {name} requires attention
                  </p>
                  <a href="/caregiver/patients"
                     className="ml-auto text-xs font-semibold"
                     style={{ color: '#dc2626' }}>
                    View →
                  </a>
                </div>
              )
            })}
          </div>
        </Card>
      )}

    </DashboardLayout>
  )
}

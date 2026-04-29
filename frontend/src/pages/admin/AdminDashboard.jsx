import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { Users, UserCheck, HeartPulse, Calendar, ShieldAlert } from 'lucide-react'

const readData = (response) => response?.data?.data || response?.data || {}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    adminApi.getStats()
      .then((response) => {
        if (mounted) setStats(readData(response))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#2a7de1', bg: '#e8f1fd' },
    { label: 'Doctors', value: stats?.totalDoctors || 0, icon: UserCheck, color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Patients', value: stats?.totalPatients || 0, icon: HeartPulse, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Appointments Today', value: stats?.todayAppointments || 0, icon: Calendar, color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <DashboardLayout>
      <div>
        <h1 className="page-title mb-1">Admin Dashboard</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>Manage users, doctor verification, and platform access.</p>
      </div>

      {loading ? (
        <Card><LoadingSpinner /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-2xl font-display font-semibold" style={{ color: '#0f172a' }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert size={18} style={{ color: '#d97706' }} />
                <h3 className="section-title">Pending Verification</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="text-2xl font-semibold" style={{ color: '#0f172a' }}>{stats?.pendingVerifications?.doctors || 0}</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>Doctors</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="text-2xl font-semibold" style={{ color: '#0f172a' }}>{stats?.pendingVerifications?.caregivers || 0}</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>Caregivers</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="section-title mb-4">Recent Users</h3>
              <div className="space-y-3">
                {(stats?.recentUsers || []).map((item) => (
                  <div key={item._id} className="flex items-center gap-3 rounded-lg p-3" style={{ background: '#f8fafc' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#d97706' }}>
                      {item.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>{item.name}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>{item.email}</p>
                    </div>
                    <span className="text-xs capitalize px-2 py-1 rounded-lg" style={{ background: '#e8f1fd', color: '#1e63b8' }}>
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

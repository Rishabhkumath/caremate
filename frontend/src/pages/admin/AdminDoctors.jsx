import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'

const readData = (response) => response?.data?.data || response?.data || {}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const params = filter === 'all' ? { limit: 100 } : { verified: filter === 'verified', limit: 100 }
      const response = await adminApi.getDoctors(params)
      setDoctors(readData(response).doctors || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDoctors() }, [filter])

  const setVerified = async (doctor, verified) => {
    try {
      await adminApi.verifyDoctor(doctor._id, verified)
      toast.success(verified ? 'Doctor verified' : 'Doctor marked pending')
      loadDoctors()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update doctor')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title mb-1">Doctor Verification</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Approve doctors after checking their profile and license number.</p>
        </div>
        <select className="input-field sm:max-w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="all">All doctors</option>
        </select>
      </div>

      {loading ? (
        <Card><LoadingSpinner /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <Card key={doctor._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="section-title truncate">Dr. {doctor.user?.name || 'Unnamed Doctor'}</h3>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>{doctor.user?.email}</p>
                  <p className="text-sm mt-3" style={{ color: '#0f172a' }}>{doctor.specialization}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>License: {doctor.licenseNumber || 'Not provided'}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg shrink-0" style={{
                  background: doctor.isVerified ? '#dcfce7' : '#fffbeb',
                  color: doctor.isVerified ? '#166534' : '#92400e',
                }}>
                  {doctor.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="rounded-lg p-3" style={{ background: '#f8fafc' }}>
                  <p className="text-xs" style={{ color: '#64748b' }}>Fee</p>
                  <p style={{ color: '#0f172a' }}>{doctor.consultationFee || 0}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#f8fafc' }}>
                  <p className="text-xs" style={{ color: '#64748b' }}>Experience</p>
                  <p style={{ color: '#0f172a' }}>{doctor.experience || 0} years</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!doctor.isVerified ? (
                  <Button size="sm" onClick={() => setVerified(doctor, true)}>Approve Doctor</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setVerified(doctor, false)}>Mark Pending</Button>
                )}
              </div>
            </Card>
          ))}
          {doctors.length === 0 && (
            <Card className="lg:col-span-2">
              <p className="text-center py-8" style={{ color: '#64748b' }}>No doctors found.</p>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

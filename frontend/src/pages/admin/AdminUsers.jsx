import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'

const roles = ['patient', 'doctor', 'caregiver', 'admin']
const readData = (response) => response?.data?.data || response?.data || {}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getUsers(role ? { role, limit: 100 } : { limit: 100 })
      setUsers(readData(response).users || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [role])

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user._id, !user.isActive)
      toast.success('User status updated')
      loadUsers()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update user')
    }
  }

  const deleteUser = async (user) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(user._id)
      toast.success('User deleted')
      loadUsers()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title mb-1">Users</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>View, disable, or remove platform users.</p>
        </div>
        <select className="input-field sm:max-w-48" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {roles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <Card padding="p-0">
        {loading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc', color: '#64748b' }}>
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td className="p-4">
                      <p className="font-medium" style={{ color: '#0f172a' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{user.email}</p>
                    </td>
                    <td className="p-4 capitalize">{user.role}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg text-xs" style={{
                        background: user.isActive ? '#dcfce7' : '#fee2e2',
                        color: user.isActive ? '#166534' : '#991b1b',
                      }}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => toggleStatus(user)}>
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteUser(user)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}

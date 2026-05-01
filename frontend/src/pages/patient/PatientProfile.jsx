import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { BLOOD_TYPES } from '../../utils/constants'
import { caregiverApi } from '../../api/caregiverApi'
import { patientApi } from '../../api/patientApi'
import toast from 'react-hot-toast'

export default function PatientProfile() {
  const { user } = useAuth()
  const {
    soundProfile,
    ringDuration,
    soundOptions,
    durationOptions,
    setSoundProfile,
    setRingDuration,
    testReminderSound,
  } = useNotifications()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', bloodType: '', allergies: '', conditions: '' })
  const [saving, setSaving] = useState(false)
  const [caregivers, setCaregivers] = useState([])
  const [assignedCaregivers, setAssignedCaregivers] = useState([])
  const [selectedCaregiver, setSelectedCaregiver] = useState('')
  const [assigningCaregiver, setAssigningCaregiver] = useState(false)
  const [profileUser, setProfileUser] = useState(user)

  useEffect(() => {
    Promise.all([
      caregiverApi.getAll().catch(() => ({ data: [] })),
      patientApi.getProfile().catch(() => ({ data: null })),
    ]).then(([caregiverRes, profileRes]) => {
      setCaregivers(caregiverRes.data?.data || caregiverRes.data || [])
      const profile = profileRes.data?.data || profileRes.data
      if (profile?.user) {
        setProfileUser(profile.user)
      }
      if (profile) {
        setForm({
          name: profile.user?.name || user?.name || '',
          email: profile.user?.email || user?.email || '',
          phone: profile.user?.phoneNumber || user?.phoneNumber || user?.phone || '',
          bloodType: profile.bloodGroup || '',
          allergies: Array.isArray(profile.allergies) ? profile.allergies.join(', ') : '',
          conditions: Array.isArray(profile.chronicConditions) ? profile.chronicConditions.join(', ') : '',
        })
      }
      setAssignedCaregivers(profile?.assignedCaregivers || [])
    })
  }, [user])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await patientApi.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        bloodGroup: form.bloodType || null,
        allergies: form.allergies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        chronicConditions: form.conditions
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })

      const updatedProfile = response.data?.data || response.data
      if (updatedProfile?.user) {
        setProfileUser(updatedProfile.user)
      }
      setForm((prev) => ({
        ...prev,
        name: updatedProfile?.user?.name || prev.name,
        email: updatedProfile?.user?.email || prev.email,
        phone: updatedProfile?.user?.phoneNumber || prev.phone,
        bloodType: updatedProfile?.bloodGroup || '',
        allergies: Array.isArray(updatedProfile?.allergies) ? updatedProfile.allergies.join(', ') : prev.allergies,
        conditions: Array.isArray(updatedProfile?.chronicConditions) ? updatedProfile.chronicConditions.join(', ') : prev.conditions,
      }))
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSoundChange = (e) => {
    setSoundProfile(e.target.value)
    toast.success('Reminder sound updated')
  }

  const handleDurationChange = (e) => {
    setRingDuration(e.target.value)
    toast.success('Reminder duration updated')
  }

  const handleApproveCaregiver = async () => {
    if (!selectedCaregiver) return toast.error('Select a caregiver')
    setAssigningCaregiver(true)
    try {
      const res = await patientApi.approveCaregiver(selectedCaregiver)
      const updatedProfile = res.data?.data || res.data
      setAssignedCaregivers(updatedProfile?.assignedCaregivers || [])
      setSelectedCaregiver('')
      toast.success('Caregiver approved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve caregiver')
    } finally {
      setAssigningCaregiver(false)
    }
  }

  const assignedIds = new Set(assignedCaregivers.map(caregiver => String(caregiver._id)))
  const caregiverOptions = caregivers
    .filter(caregiver => !assignedIds.has(String(caregiver._id)))
    .map(caregiver => ({
      value: caregiver._id,
      label: `${caregiver.user?.name || 'Caregiver'}${caregiver.qualification ? ` - ${caregiver.qualification}` : ''}`,
    }))

  return (
    <DashboardLayout>
      <h1 className="page-title mb-6">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="text-center p-6 sm:p-8 flex flex-col items-center gap-4">
          <Avatar name={user?.name} role="patient" size="xl" />
          <div>
            <h3 className="text-slate-900 font-display text-xl font-semibold">{profileUser?.name || user?.name}</h3>
            <p className="text-slate-600 text-sm">{profileUser?.email || user?.email}</p>
            <p className="text-teal-700 text-xs mt-1 capitalize">{profileUser?.role || user?.role}</p>
          </div>
          <Button variant="secondary" size="sm">Change Photo</Button>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="section-title mb-5">Personal Information</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                <Select label="Blood Type" name="bloodType" value={form.bloodType} onChange={handleChange} options={BLOOD_TYPES.map((bloodType) => ({ value: bloodType, label: bloodType }))} />
                <Input label="Known Allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Penicillin, Peanuts..." className="md:col-span-2" />
                <Input label="Medical Conditions" name="conditions" value={form.conditions} onChange={handleChange} placeholder="Diabetes, Hypertension..." className="md:col-span-2" />
              </div>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </form>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="section-title">Reminder Sound</h3>
                <p className="text-slate-400 text-sm mt-1">Choose how medication reminders should ring on this device.</p>
              </div>
              <Button variant="outline" onClick={testReminderSound}>Test Sound</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Medication Reminder Tone"
                name="soundProfile"
                value={soundProfile}
                onChange={handleSoundChange}
                options={soundOptions}
              />
              <Select
                label="Ring Duration"
                name="ringDuration"
                value={ringDuration}
                onChange={handleDurationChange}
                options={durationOptions}
              />
            </div>
          </Card>

          <Card>
            <h3 className="section-title mb-2">Caregivers</h3>
            <p className="text-slate-400 text-sm mb-5">
              Approve a caregiver to let them monitor your care logs, reminders, and patient overview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <Select
                label="Available Caregivers"
                name="selectedCaregiver"
                value={selectedCaregiver}
                onChange={(e) => setSelectedCaregiver(e.target.value)}
                options={caregiverOptions}
                placeholder={caregiverOptions.length ? 'Select caregiver' : 'No caregivers available'}
              />
              <Button onClick={handleApproveCaregiver} loading={assigningCaregiver}>
                Approve Caregiver
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {assignedCaregivers.length === 0 ? (
                <p className="text-slate-400 text-sm">No caregivers approved yet.</p>
              ) : assignedCaregivers.map((caregiver) => (
                <div key={caregiver._id} className="rounded-xl p-4"
                     style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                    {caregiver.user?.name || 'Caregiver'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {caregiver.qualification || 'Care Assistant'} - {caregiver.availability || 'Availability not set'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

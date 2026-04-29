import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { caregiverApi } from '../../api/caregiverApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  Award,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'on-call', label: 'On-call' },
]

const SERVICE_OPTIONS = [
  'personal care',
  'medication assistance',
  'companionship',
  'meal preparation',
  'transportation',
  'housekeeping',
]

const INITIAL_FORM = {
  qualification: '',
  experience: '',
  availability: 'on-call',
  hourlyRate: '',
  bio: '',
  languages: '',
  servicesOffered: [],
}

export default function CaregiverProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    caregiverApi.getProfile()
      .then((res) => {
        const nextProfile = res.data?.data || res.data || null
        setProfile(nextProfile)
        if (nextProfile) {
          setForm({
            qualification: nextProfile.qualification || '',
            experience: nextProfile.experience ?? '',
            availability: nextProfile.availability || 'on-call',
            hourlyRate: nextProfile.hourlyRate ?? '',
            bio: nextProfile.bio || '',
            languages: Array.isArray(nextProfile.languages) ? nextProfile.languages.join(', ') : '',
            servicesOffered: Array.isArray(nextProfile.servicesOffered) ? nextProfile.servicesOffered : [],
          })
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const assignedPatients = useMemo(() => profile?.assignedPatients || [], [profile])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter((item) => item !== service)
        : [...prev.servicesOffered, service],
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        qualification: form.qualification.trim(),
        experience: form.experience === '' ? 0 : Number(form.experience),
        availability: form.availability,
        hourlyRate: form.hourlyRate === '' ? 0 : Number(form.hourlyRate),
        bio: form.bio.trim(),
        languages: form.languages
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        servicesOffered: form.servicesOffered,
      }

      const res = await caregiverApi.updateProfile(payload)
      const nextProfile = res.data?.data || res.data || null
      setProfile(nextProfile)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update caregiver profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title mb-1">Profile</h1>
        <p className="text-slate-400 text-sm">Manage your caregiver account, services, and availability</p>
      </div>

      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-12">Loading profile...</p>
        ) : !profile ? (
          <p className="text-slate-400 text-sm text-center py-12">Caregiver profile not found.</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: '#7c3aed' }}
                >
                  {(profile.user?.name || user?.name || 'C').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-semibold" style={{ color: '#0f172a' }}>
                      {profile.user?.name || user?.name || 'Caregiver'}
                    </h2>
                    <Badge variant={profile.isVerified ? 'success' : 'warning'} dot>
                      {profile.isVerified ? 'Verified' : 'Pending verification'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    {profile.qualification || 'Care Assistant'} • {profile.availability || 'on-call'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="purple">{assignedPatients.length} assigned patient{assignedPatients.length !== 1 ? 's' : ''}</Badge>
                    <Badge variant="info">Rating: {profile.rating || 0}/5</Badge>
                    <Badge variant="default">Reviews: {profile.totalReviews || 0}</Badge>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant={editing ? 'secondary' : 'primary'}
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={15} style={{ color: '#7c3aed' }} />
                      <p className="text-xs uppercase font-semibold" style={{ color: '#64748b' }}>Email</p>
                    </div>
                    <p className="text-sm font-medium break-words" style={{ color: '#0f172a' }}>{profile.user?.email || user?.email || 'Not available'}</p>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={15} style={{ color: '#7c3aed' }} />
                      <p className="text-xs uppercase font-semibold" style={{ color: '#64748b' }}>Phone</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{profile.user?.phoneNumber || 'Not available'}</p>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase size={15} style={{ color: '#7c3aed' }} />
                      <p className="text-xs uppercase font-semibold" style={{ color: '#64748b' }}>Experience</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{profile.experience ?? 0} years</p>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={15} style={{ color: '#7c3aed' }} />
                      <p className="text-xs uppercase font-semibold" style={{ color: '#64748b' }}>Background Check</p>
                    </div>
                    <p className="text-sm font-medium capitalize" style={{ color: '#0f172a' }}>
                      {profile.backgroundCheck?.status || 'pending'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} style={{ color: '#7c3aed' }} />
                    <h3 className="section-title">Professional Summary</h3>
                  </div>
                  <p className="text-sm" style={{ color: '#475569' }}>
                    {profile.bio || 'No bio added yet. Add a short introduction about your caregiving experience, strengths, and care style.'}
                  </p>
                </div>

                <div className="rounded-2xl p-5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} style={{ color: '#7c3aed' }} />
                    <h3 className="section-title">Assigned Patients</h3>
                  </div>
                  {assignedPatients.length === 0 ? (
                    <p className="text-sm" style={{ color: '#64748b' }}>No patients assigned yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {assignedPatients.slice(0, 6).map((patient) => (
                        <div key={patient._id} className="rounded-xl p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                            {patient.user?.name || 'Patient'}
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                            {patient.gender || 'Gender not added'}{patient.dateOfBirth ? ` • DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2 mb-4">
                  <UserRound size={16} style={{ color: '#7c3aed' }} />
                  <h3 className="section-title">{editing ? 'Edit Caregiver Profile' : 'Profile Details'}</h3>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <Input
                    label="Qualification"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    disabled={!editing}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Experience (years)"
                      name="experience"
                      type="number"
                      value={form.experience}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <Input
                      label="Hourly Rate"
                      name="hourlyRate"
                      type="number"
                      value={form.hourlyRate}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>

                  <Select
                    label="Availability"
                    name="availability"
                    value={form.availability}
                    onChange={handleChange}
                    options={AVAILABILITY_OPTIONS}
                    disabled={!editing}
                  />

                  <Input
                    label="Languages"
                    name="languages"
                    value={form.languages}
                    onChange={handleChange}
                    placeholder="e.g. English, Hindi, Bengali"
                    disabled={!editing}
                    icon={Globe}
                  />

                  <div>
                    <label className="label-text">Services Offered</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SERVICE_OPTIONS.map((service) => {
                        const selected = form.servicesOffered.includes(service)
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => editing && toggleService(service)}
                            disabled={!editing}
                            className="rounded-full border px-3 py-2 text-xs font-medium transition-colors"
                            style={{
                              background: selected ? '#ede9fe' : '#f8fafc',
                              color: selected ? '#6d28d9' : '#64748b',
                              borderColor: selected ? '#c4b5fd' : '#e2e8f0',
                              cursor: editing ? 'pointer' : 'default',
                              opacity: editing ? 1 : 0.85,
                            }}
                          >
                            {service}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="label-text">Bio</label>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      rows={5}
                      disabled={!editing}
                      className="input-field resize-none"
                      placeholder="Write a short summary about your caregiving background, strengths, and preferred care approach"
                    />
                  </div>

                  {editing && (
                    <Button type="submit" loading={saving} icon={Save}>
                      Save Profile
                    </Button>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}

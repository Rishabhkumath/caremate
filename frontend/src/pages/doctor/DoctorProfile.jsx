import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import { doctorApi } from '../../api/doctorApi'
import { useEffect, useState } from 'react'
import { Briefcase, Building2, CalendarDays, CreditCard, Mail, MapPin, Phone, ShieldCheck, Star, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const PROFILE_INITIAL = {
  name: '',
  email: '',
  phoneNumber: '',
  specialization: '',
  licenseNumber: '',
  experience: '',
  consultationFee: '',
  department: '',
  bio: '',
  availableDays: [],
  hospitalName: '',
  hospitalAddress: '',
  hospitalCity: '',
  hospitalState: '',
}

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(PROFILE_INITIAL)

  useEffect(() => {
    doctorApi.getMe()
      .then((response) => {
        const nextProfile = response.data?.data || response.data || null
        setProfile(nextProfile)
        if (nextProfile) {
          setForm({
            name: nextProfile.user?.name || '',
            email: nextProfile.user?.email || '',
            phoneNumber: nextProfile.user?.phoneNumber || '',
            specialization: nextProfile.specialization || '',
            licenseNumber: nextProfile.licenseNumber || '',
            experience: nextProfile.experience ?? '',
            consultationFee: nextProfile.consultationFee ?? '',
            department: nextProfile.department || '',
            bio: nextProfile.bio || '',
            availableDays: Array.isArray(nextProfile.availableDays) ? nextProfile.availableDays : [],
            hospitalName: nextProfile.hospital?.name || '',
            hospitalAddress: nextProfile.hospital?.address || '',
            hospitalCity: nextProfile.hospital?.city || '',
            hospitalState: nextProfile.hospital?.state || '',
          })
        }
      })
      .catch(() => toast.error('Failed to load doctor profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleAvailableDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((item) => item !== day)
        : [...prev.availableDays, day],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await doctorApi.updateMe({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        specialization: form.specialization.trim(),
        licenseNumber: form.licenseNumber.trim(),
        experience: form.experience === '' ? 0 : Number(form.experience),
        consultationFee: form.consultationFee === '' ? 0 : Number(form.consultationFee),
        department: form.department.trim(),
        bio: form.bio.trim(),
        availableDays: form.availableDays,
        hospital: {
          name: form.hospitalName.trim(),
          address: form.hospitalAddress.trim(),
          city: form.hospitalCity.trim(),
          state: form.hospitalState.trim(),
        },
      })
      const updated = response.data?.data || response.data
      setProfile(updated)
      setIsEditing(false)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const doctorName = profile?.user?.name || 'Doctor'
  const hospitalName = profile?.hospital?.name || profile?.department || 'Not added yet'
  const hospitalAddress = [
    profile?.hospital?.address,
    profile?.hospital?.city,
    profile?.hospital?.state,
  ].filter(Boolean).join(', ')

  return (
    <DashboardLayout>
      <div className="mb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title mb-1">Profile</h1>
            <p className="text-slate-400 text-sm">Doctor account and professional details</p>
          </div>
          {!loading && profile && (
            <Button icon={Pencil} onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="text-slate-400 text-sm text-center py-12">Loading profile...</p>
        </Card>
      ) : !profile ? (
        <Card>
          <p className="text-slate-400 text-sm text-center py-12">Doctor profile not found</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden mt-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div style={{ width: 72, height: 72, borderRadius: '20px', background: '#e8f1fd', color: '#2a7de1' }}
                     className="flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {doctorName.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-2xl font-semibold" style={{ color: '#0f172a' }}>{doctorName}</h2>
                    <Badge variant={profile.isVerified ? 'success' : 'warning'} dot>
                      {profile.isVerified ? 'Verified' : 'Pending verification'}
                    </Badge>
                  </div>
                  <p className="text-sm" style={{ color: '#475569' }}>
                    {profile.specialization || 'Specialization not added'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.department && <Badge variant="info">{profile.department}</Badge>}
                    {profile.experience !== undefined && <Badge variant="purple">{profile.experience} years experience</Badge>}
                    <Badge variant="default">License: {profile.licenseNumber || 'Not added'}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 lg:min-w-[320px]">
                {[
                  { icon: Mail, label: 'Email', value: profile.user?.email || 'Not added' },
                  { icon: Phone, label: 'Phone', value: profile.user?.phoneNumber || 'Not added' },
                  { icon: CreditCard, label: 'Consultation Fee', value: profile.consultationFee ? `Rs. ${profile.consultationFee}` : 'Not added' },
                  { icon: Star, label: 'Rating', value: `${profile.rating || 0} / 5 (${profile.totalReviews || 0} reviews)` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} style={{ color: '#2a7de1' }} />
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', margin: 0 }}>{label}</p>
                    </div>
                    <p className="text-sm font-medium break-words" style={{ color: '#0f172a', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} style={{ color: '#2a7de1' }} />
                <h3 className="section-title">Hospital</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p style={{ color: '#64748b', margin: 0 }}>Hospital / Department</p>
                  <p style={{ color: '#0f172a', margin: '4px 0 0', fontWeight: 600 }}>{hospitalName}</p>
                </div>
                <div>
                  <p style={{ color: '#64748b', margin: 0 }}>Address</p>
                  <p style={{ color: '#0f172a', margin: '4px 0 0' }}>{hospitalAddress || 'Not added yet'}</p>
                </div>
              </div>
            </Card>

            <Card className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} style={{ color: '#2a7de1' }} />
                <h3 className="section-title">Availability</h3>
              </div>
              {profile.availableDays?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.availableDays.map((day) => (
                    <Badge key={day} variant="info">{day}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#64748b' }}>No available days added yet</p>
              )}
            </Card>

            <Card className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} style={{ color: '#2a7de1' }} />
                <h3 className="section-title">Professional Summary</h3>
              </div>
              <p className="text-sm leading-6" style={{ color: '#475569' }}>
                {profile.bio || 'No bio added yet.'}
              </p>
            </Card>

            <Card className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} style={{ color: '#2a7de1' }} />
                <h3 className="section-title">Practice Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={14} style={{ color: '#2a7de1', marginTop: 2 }} />
                  <div>
                    <p style={{ color: '#64748b', margin: 0 }}>Department</p>
                    <p style={{ color: '#0f172a', margin: '4px 0 0', fontWeight: 600 }}>{profile.department || 'Not added'}</p>
                  </div>
                </div>
                <div>
                  <p style={{ color: '#64748b', margin: 0 }}>Consultation Slots</p>
                  <p style={{ color: '#0f172a', margin: '4px 0 0' }}>
                    {profile.availableTimeSlots?.length ? `${profile.availableTimeSlots.length} configured slot(s)` : 'No slots configured yet'}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#64748b', margin: 0 }}>Verification</p>
                  <p style={{ color: '#0f172a', margin: '4px 0 0' }}>
                    {profile.isVerified
                      ? 'Your doctor profile has been verified by the admin team.'
                      : 'Pending admin review. Verification is approved by an admin after checking your doctor details and license number.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Doctor Profile" size="xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Basic Details</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />
              <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Input label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
              <Input label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} required />
              <Input label="License Number" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required />
              <Input label="Experience (years)" name="experience" type="number" value={form.experience} onChange={handleChange} />
              <Input label="Consultation Fee" name="consultationFee" type="number" value={form.consultationFee} onChange={handleChange} />
              <Input label="Department" name="department" value={form.department} onChange={handleChange} />
              <div className="md:col-span-2">
                <label className="label-text mb-3 block">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = form.availableDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailableDay(day)}
                        className={[
                          'rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                        ].join(' ')}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Select one or more days from the valid weekly options.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Hospital Information</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Hospital Name" name="hospitalName" value={form.hospitalName} onChange={handleChange} />
              <Input label="Hospital Address" name="hospitalAddress" value={form.hospitalAddress} onChange={handleChange} />
              <Input label="Hospital City" name="hospitalCity" value={form.hospitalCity} onChange={handleChange} />
              <Input label="Hospital State" name="hospitalState" value={form.hospitalState} onChange={handleChange} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <label className="label-text mb-3 block">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="input-field resize-none"
              rows={4}
              placeholder="Write a short professional summary"
            />
          </div>

          <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 px-5 pt-4 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="sm:min-w-[140px]">
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="sm:min-w-[160px]">
                {saving ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

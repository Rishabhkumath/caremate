import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Phone, Stethoscope, BadgeCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'
import { getRoleDashboardPath } from '../../utils/roleHelpers'

const ROLES = [
  { value: 'patient',   label: 'Patient – I need health monitoring' },
  { value: 'doctor',    label: 'Doctor – I provide medical care'    },
  { value: 'caregiver', label: 'Caregiver – I assist patients'      },
  { value: 'admin',     label: 'Admin - I manage CareMate'          },
]

const GENDERS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
]

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'General Medicine', 'Geriatrics',
  'Hematology', 'Internal Medicine', 'Nephrology', 'Neurology',
  'Obstetrics & Gynecology', 'Oncology', 'Ophthalmology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology', 'Surgery', 'Urology',
].map(s => ({ value: s, label: s }))

const INITIAL = {
  name: '', email: '', password: '', confirmPassword: '',
  role: 'patient', phoneNumber: '', gender: '', dateOfBirth: '',
  // Doctor-only fields
  specialization: '', licenseNumber: '', consultationFee: '',
  adminSetupKey: '',
}

export default function Register() {
  const [form,         setForm]         = useState(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const { register } = useAuth()
  const navigate     = useNavigate()

  const isDoctor = form.role === 'doctor'
  const isAdmin = form.role === 'admin'

  const handleChange = (e) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const validate = () => {
    if (!form.name.trim())                      return 'Name is required'
    if (!form.email.includes('@'))              return 'Enter a valid email'
    if (form.password.length < 6)               return 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    if (!isAdmin && !form.gender)               return 'Gender is required'
    if (!isAdmin && !form.dateOfBirth)          return 'Date of birth is required'
    if (isDoctor && !form.specialization)       return 'Specialization is required for doctors'
    if (isDoctor && !form.licenseNumber.trim()) return 'License number is required for doctors'
    if (isAdmin && !form.adminSetupKey.trim())  return 'Admin setup key is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) return toast.error(err)

    setLoading(true)
    try {
      const payload = {
        name:        form.name,
        email:       form.email,
        password:    form.password,
        role:        form.role,
        gender:      form.gender,
        dateOfBirth: form.dateOfBirth,
        phoneNumber: form.phoneNumber || undefined,
        ...(isAdmin && { adminSetupKey: form.adminSetupKey.trim() }),
        // Doctor fields — only included if role is doctor
        ...(isDoctor && {
          specialization:  form.specialization,
          licenseNumber:   form.licenseNumber,
          consultationFee: form.consultationFee ? Number(form.consultationFee) : 0,
        }),
      }

      const user = await register(payload)
      toast.success('Account created successfully 🎉')
      navigate(getRoleDashboardPath(user.role))
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-5 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14 overflow-x-hidden"
         style={{ backgroundColor: '#f4f7fb' }}>
      <div className="w-full max-w-2xl min-w-0 animate-slide-up mx-auto">

        {/* Card */}
        <div className="rounded-2xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 overflow-hidden"
             style={{ background: '#ffffff', border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
          <div className="mx-auto flex w-full flex-col items-center justify-center py-3 sm:py-4">
            <div className="mb-10 w-full max-w-lg text-center">
              <Link to="/" className="inline-flex flex-col items-center justify-center gap-3 mb-5 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-glow"
                     style={{ background: '#2a7de1' }}>C</div>
                <span className="font-display font-semibold text-xl" style={{ color: '#0f172a' }}>CareMate</span>
              </Link>
              <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: '#0f172a' }}>
                Create your account
              </h2>
              <p className="text-sm leading-6" style={{ color: '#64748b' }}>
                Join CareMate and take control of your health
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-5 pb-2 sm:pb-3">

            {/* Basic fields */}
            <Input label="Full Name" name="name" value={form.name}
                   onChange={handleChange} placeholder="Your full name"
                   icon={User} required />

            <Input label="Email Address" name="email" type="email"
                   value={form.email} onChange={handleChange}
                   placeholder="your@email.com" icon={Mail} required />

            <Input label="Phone Number" name="phoneNumber" type="tel"
                   value={form.phoneNumber} onChange={handleChange}
                   placeholder="+91 9876543210" icon={Phone} />

            {!isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Gender" name="gender" value={form.gender}
                        onChange={handleChange} options={GENDERS} required />
                <Input label="Date of Birth" name="dateOfBirth" type="date"
                       value={form.dateOfBirth} onChange={handleChange} required />
              </div>
            )}

            <Select label="I am a…" name="role" value={form.role}
                    onChange={handleChange} options={ROLES} required />

            {/* ── Doctor-only fields (shown conditionally) ── */}
            {isDoctor && (
              <div className="flex flex-col gap-4 p-4 rounded-xl min-w-0"
                   style={{ background: '#eff6ff', border: '1px solid rgba(42,125,225,0.20)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope size={15} style={{ color: '#2a7de1' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2a7de1' }}>
                    Doctor Details
                  </span>
                </div>

                <Select label="Specialization" name="specialization"
                        value={form.specialization} onChange={handleChange}
                        options={SPECIALIZATIONS}
                        placeholder="Select your specialization" required />

                <Input label="Medical License Number" name="licenseNumber"
                       value={form.licenseNumber} onChange={handleChange}
                       placeholder="e.g. MCI-12345" icon={BadgeCheck} required />

                <Input label="Consultation Fee (₹)" name="consultationFee"
                       type="number" value={form.consultationFee}
                       onChange={handleChange} placeholder="500" hint="Optional" />
              </div>
            )}

            {isAdmin && (
              <div className="flex flex-col gap-4 p-4 rounded-xl min-w-0"
                   style={{ background: '#fffbeb', border: '1px solid rgba(217,119,6,0.25)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={15} style={{ color: '#d97706' }} />
                  <span className="text-sm font-semibold" style={{ color: '#92400e' }}>
                    Admin Setup
                  </span>
                </div>
                <Input label="Admin Setup Key" name="adminSetupKey" type="password"
                       value={form.adminSetupKey} onChange={handleChange}
                       placeholder="Enter the server setup key" icon={ShieldCheck} required />
                <p className="text-xs leading-5" style={{ color: '#92400e' }}>
                  Admin signup is protected. This key must match the `ADMIN_SETUP_KEY` value in `backend/.env`.
                </p>
              </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="reg-password" className="label-text">
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Lock size={15} style={{ color: '#94a3b8' }} />
                </span>
                <input id="reg-password" name="password"
                       type={showPassword ? 'text' : 'password'}
                       value={form.password} onChange={handleChange}
                       placeholder="Minimum 6 characters" required
                       className="input-field"
                       style={{ paddingLeft: '2.9rem', paddingRight: '2.9rem' }} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center transition-colors"
                        style={{ color: '#94a3b8' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Input label="Confirm Password" name="confirmPassword" type="password"
                   value={form.confirmPassword} onChange={handleChange}
                   placeholder="Repeat your password" required />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
              {loading ? 'Creating Account…' : 'Create Account'}
            </Button>

            </form>

            <div className="w-full max-w-lg pt-6 sm:pt-8">
              <p className="text-center text-sm" style={{ color: '#64748b' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold transition-colors"
                      style={{ color: '#2a7de1' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

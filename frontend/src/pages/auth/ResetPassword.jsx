import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { authApi } from '../../api/authApi'
import Button from '../../components/common/Button'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      setError('Reset link is missing or invalid.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, form.password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset link is invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 overflow-x-hidden" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="w-full max-w-md min-w-0 animate-slide-up">
        <div
          className="rounded-2xl p-6 sm:p-8 overflow-hidden"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}
        >
          <div className="text-center mb-7">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-glow" style={{ background: '#2a7de1' }}>C</div>
              <span className="font-display font-semibold text-xl" style={{ color: '#0f172a' }}>CareMate</span>
            </Link>
            <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: '#0f172a' }}>Set a new password</h2>
            <p className="text-sm leading-6" style={{ color: '#64748b' }}>
              Choose a new password for your account.
            </p>
          </div>

          {success ? (
            <div className="text-center py-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <CheckCircle2 size={30} style={{ color: '#16a34a' }} />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: '#0f172a' }}>Password updated</h3>
              <p className="text-sm leading-6" style={{ color: '#64748b' }}>
                Your password has been reset. Redirecting you to sign in.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <label htmlFor="reset-password" className="label-text">New Password</label>
                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                      <Lock size={15} style={{ color: '#94a3b8' }} />
                    </span>
                    <input
                      id="reset-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      required
                      className="input-field"
                      style={{ paddingLeft: '2.9rem', paddingRight: '2.9rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                      style={{ color: '#94a3b8' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-0">
                  <label htmlFor="reset-confirm-password" className="label-text">Confirm Password</label>
                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                      <Lock size={15} style={{ color: '#94a3b8' }} />
                    </span>
                    <input
                      id="reset-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your new password"
                      required
                      className="input-field"
                      style={{ paddingLeft: '2.9rem', paddingRight: '2.9rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                      style={{ color: '#94a3b8' }}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" fullWidth loading={loading} size="lg">
                  {loading ? 'Updating password...' : 'Update Password'}
                </Button>
              </form>

              <p className="text-center text-sm mt-5" style={{ color: '#64748b' }}>
                Remembered your password?{' '}
                <Link to="/login" className="font-semibold" style={{ color: '#2a7de1' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

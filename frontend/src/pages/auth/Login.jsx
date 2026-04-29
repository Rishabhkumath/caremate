import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'
import { getRoleDashboardPath } from '../../utils/roleHelpers'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(getRoleDashboardPath(user.role))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: '#f4f7fb' }}>
      <div
        className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #0d9488 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #fff 0%, transparent 50%)' }}
        />
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-display font-bold text-4xl leading-none">C</span>
          </div>
          <h1 className="font-display text-4xl font-semibold mb-2">CareMate</h1>
          <p className="text-blue-100 text-base">Your Virtual Nursing Assistant</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md min-w-0 animate-slide-up">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold"
              style={{ background: '#2a7de1' }}
            >
              C
            </div>
            <span className="font-display font-semibold text-lg" style={{ color: '#0f172a' }}>CareMate</span>
          </Link>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-semibold mb-1.5" style={{ color: '#0f172a' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>Sign in to your CareMate account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              icon={Mail}
              required
            />

            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="password" className="label-text">Password</label>
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Lock size={15} style={{ color: '#94a3b8' }} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  style={{ paddingLeft: '2.9rem', paddingRight: '2.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center transition-colors"
                  style={{ color: '#94a3b8' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: '#64748b' }}>
                <input type="checkbox" className="w-3.5 h-3.5 accent-blue-600" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium transition-colors" style={{ color: '#2a7de1' }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors" style={{ color: '#2a7de1' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

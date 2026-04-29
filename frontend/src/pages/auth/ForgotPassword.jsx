import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { authApi } from '../../api/authApi'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')
  const devResetPath = devResetUrl ? (() => {
    try {
      const parsed = new URL(devResetUrl)
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return devResetUrl
    }
  })() : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await authApi.forgotPassword(trimmed)
      setDevResetUrl(response?.data?.data?.resetUrl || '')
      setSent(true)
    } catch (err) {
      const status = err?.response?.status
      // 404 = email not found, 400 = bad input
      // For security, always show success so we don't reveal registered emails
      if (status === 404 || status === 400) {
        setSent(true)
      } else {
        setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 overflow-x-hidden"
         style={{ backgroundColor: '#f4f7fb' }}>
      <div className="w-full max-w-md min-w-0 animate-slide-up">

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => e.currentTarget.style.color = '#2a7de1'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="rounded-2xl p-6 sm:p-8 overflow-hidden"
             style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <CheckCircle size={32} style={{ color: '#16a34a' }} />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2" style={{ color: '#0f172a' }}>
                Check your inbox
              </h2>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>
                If an account exists for
              </p>
              <p className="text-sm font-semibold mb-4" style={{ color: '#0f172a' }}>{email}</p>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                you'll receive a reset link shortly. Check your spam folder too.
              </p>
              {devResetUrl && (
                <div className="rounded-xl px-4 py-3 text-left mb-6" style={{ background: '#eff6ff', border: '1px solid rgba(42,125,225,0.18)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2a7de1' }}>
                    Development Reset Link
                  </p>
                  <Link to={devResetPath} className="text-sm break-all font-medium" style={{ color: '#1e63b8' }}>
                    {devResetUrl}
                  </Link>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setSent(false); setError(''); setEmail(''); setDevResetUrl('') }}
                  className="btn-secondary w-full"
                >
                  Try a different email
                </button>
                <Link to="/login" className="btn-primary w-full text-center"
                      style={{ textDecoration: 'none' }}>
                  Back to Sign In
                </Link>
              </div>
            </div>

          ) : (
            <>
              <div className="text-center mb-7">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
                  <Mail size={22} style={{ color: '#2a7de1' }} />
                </div>
                <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: '#0f172a' }}>
                  Forgot your password?
                </h2>
                <p className="text-sm leading-6" style={{ color: '#64748b' }}>
                  Enter your registered email and we'll send you a secure reset link.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                     style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="your@email.com"
                  icon={Mail}
                  required
                />
                <Button type="submit" fullWidth loading={loading} size="lg">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="text-center text-sm mt-5" style={{ color: '#94a3b8' }}>
                Remembered it?{' '}
                <Link to="/login" className="font-semibold" style={{ color: '#2a7de1' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

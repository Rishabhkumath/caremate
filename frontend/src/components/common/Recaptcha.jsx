import { useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit'

const hasRecaptchaScript = (script) => {
  try {
    const url = new URL(script.src)
    return url.hostname === 'www.google.com' && url.pathname === '/recaptcha/api.js'
  } catch {
    return false
  }
}

export const getValidRecaptchaSiteKey = (siteKey) => {
  const normalizedSiteKey = (siteKey || '').trim()
  return normalizedSiteKey && !normalizedSiteKey.startsWith('your-recaptcha') ? normalizedSiteKey : ''
}

const loadRecaptchaScript = () => {
  const existingScript = Array.from(document.scripts).find(hasRecaptchaScript)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha?.render) return resolve()
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', reject, { once: true })
    document.head.appendChild(script)
  })
}

export default function Recaptcha({ siteKey, onChange, resetSignal = 0 }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const normalizedSiteKey = getValidRecaptchaSiteKey(siteKey)
  const isConfigured = Boolean(normalizedSiteKey)
  const [loading, setLoading] = useState(Boolean(isConfigured))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timeoutId

    if (!isConfigured || !containerRef.current) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError('')

    timeoutId = window.setTimeout(() => {
      if (!cancelled && widgetIdRef.current === null) {
        setError('reCAPTCHA is taking too long to load. Refresh the page and try again.')
        setLoading(false)
      }
    }, 10000)

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return

        window.grecaptcha.ready(() => {
          if (cancelled || !containerRef.current || widgetIdRef.current !== null) return

          try {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: normalizedSiteKey,
              callback: (token) => onChange(token),
              'expired-callback': () => onChange(''),
              'error-callback': () => {
                onChange('')
                setError('reCAPTCHA reported an error. Please try the challenge again.')
              },
            })
            setLoading(false)
          } catch (err) {
            setError(
              'Could not show reCAPTCHA. Use a reCAPTCHA v2 Checkbox site key and allow this domain in Google reCAPTCHA.'
            )
            setLoading(false)
          }
        })
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load reCAPTCHA. Check your internet connection and refresh the page.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isConfigured, normalizedSiteKey, onChange])

  useEffect(() => {
    if (widgetIdRef.current === null || !window.grecaptcha?.reset) return
    window.grecaptcha.reset(widgetIdRef.current)
    onChange('')
  }, [resetSignal, onChange])

  if (!isConfigured) {
    return (
      <div className="rounded-lg border px-3 py-2" style={{ borderColor: '#dbe4ef', backgroundColor: '#f8fafc' }}>
        <p className="text-xs leading-5" style={{ color: '#64748b' }}>
          reCAPTCHA is not configured. Add VITE_RECAPTCHA_SITE_KEY to frontend/.env and restart the frontend server.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border px-3 py-2" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
        <p className="text-xs leading-5" style={{ color: '#dc2626' }}>
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[78px] overflow-x-auto">
      {loading && (
        <p className="text-xs leading-5" style={{ color: '#64748b' }}>
          Loading reCAPTCHA...
        </p>
      )}
      <div ref={containerRef} />
    </div>
  )
}

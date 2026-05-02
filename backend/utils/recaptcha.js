const axios = require('axios')

const getRecaptchaSecret = () => {
  const secret = (process.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY || '').trim()
  return secret && !secret.startsWith('your-recaptcha') ? secret : ''
}

const verifyRecaptcha = async (token, remoteIp) => {
  const secret = getRecaptchaSecret()

  if (!secret) {
    return { success: true, skipped: true }
  }

  if (!token || typeof token !== 'string') {
    return { success: false, message: 'Please complete the reCAPTCHA challenge' }
  }

  try {
    const params = new URLSearchParams()
    params.append('secret', secret)
    params.append('response', token)
    if (remoteIp) params.append('remoteip', remoteIp)

    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )

    if (!data?.success) {
      return {
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        errors: data?.['error-codes'] || [],
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: 'Unable to verify reCAPTCHA right now. Please try again.',
    }
  }
}

module.exports = { verifyRecaptcha }

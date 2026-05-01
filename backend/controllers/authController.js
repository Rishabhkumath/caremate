const User      = require('../models/User')
const Patient   = require('../models/Patient')
const Doctor    = require('../models/Doctor')
const Caregiver = require('../models/Caregiver')
const { generateToken }    = require('../config/jwt')
const { validationResult } = require('express-validator')
const { successResponse, errorResponse } = require('../utils/apiResponse')
const crypto       = require('crypto')
const emailService = require('../services/emailService')
const axios        = require('axios')

const getAuthUserPayload = (user) => ({
  id:             user._id,
  _id:            user._id,
  name:           user.name,
  email:          user.email,
  role:           user.role,
  phoneNumber:    user.phoneNumber,
  profilePicture: user.profilePicture,
  authProvider:   user.authProvider,
  emailVerified:  user.emailVerified,
})

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  })
}

const getGoogleClientId = () => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim()
  return clientId && !clientId.startsWith('your-google-oauth-client-id') ? clientId : ''
}

// ── register ──────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return errorResponse(res, errors.array()[0].msg, 400)

    const { name, password, role, phoneNumber, adminSetupKey } = req.body
    const email = req.body.email.toLowerCase().trim()
    const requestedRole = role || 'patient'

    if (await User.findOne({ email }))
      return errorResponse(res, 'Email already registered', 400)

    if (requestedRole === 'admin') {
      if (!process.env.ADMIN_SETUP_KEY) {
        return errorResponse(res, 'Admin setup is not enabled on this server. Set ADMIN_SETUP_KEY in backend/.env and use that key during admin registration.', 403)
      }
      const submittedAdminSetupKey = String(adminSetupKey || '').trim()
      const expectedAdminSetupKey = String(process.env.ADMIN_SETUP_KEY || '').trim()

      if (submittedAdminSetupKey !== expectedAdminSetupKey) {
        return errorResponse(res, 'Invalid admin setup key', 403)
      }
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: requestedRole,
      phoneNumber: phoneNumber || undefined,
    })

    // Create role-specific profile
    if (requestedRole === 'patient') {
      await Patient.create({
        user:        user._id,
        dateOfBirth: req.body.dateOfBirth,
        gender:      req.body.gender,
      })
    } else if (requestedRole === 'doctor') {
      await Doctor.create({
        user:            user._id,
        specialization:  req.body.specialization  || 'General Medicine',
        licenseNumber:   req.body.licenseNumber   || 'PENDING',
        consultationFee: req.body.consultationFee || 0,
        department:      req.body.department,
      })
    } else if (requestedRole === 'caregiver') {
      await Caregiver.create({
        user:          user._id,
        qualification: req.body.qualification || 'Care Assistant',
        experience:    req.body.experience || 0,
        availability:  req.body.availability || 'on-call',
        hourlyRate:    req.body.hourlyRate || 0,
        servicesOffered: req.body.servicesOffered || ['personal care', 'medication assistance'],
      })
    }

    const token = generateToken(user._id)
    user.lastLogin = Date.now()
    await user.save()

    // Welcome email — fire and forget
    emailService.sendWelcomeEmail(user.email, user.name).catch(() => {})

    return successResponse(res, {
      token,
      user: getAuthUserPayload(user)
    }, 'Registration successful', 201)

  } catch (error) { next(error) }
}

// ── login ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return errorResponse(res, errors.array()[0].msg, 400)

    const email    = req.body.email.toLowerCase().trim()
    const { password } = req.body

    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user || !await user.matchPassword(password))
      return errorResponse(res, 'Invalid email or password', 401)

    if (!user.isActive)
      return errorResponse(res, 'Account deactivated. Contact support.', 401)

    user.lastLogin = Date.now()
    await user.save()

    const token = generateToken(user._id)

    setAuthCookie(res, token)

    return successResponse(res, {
      token,
      user: getAuthUserPayload(user)
    }, 'Login successful')

  } catch (error) { next(error) }
}

// Google OAuth login
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body
    const googleClientId = getGoogleClientId()

    if (!googleClientId) {
      return errorResponse(res, 'Google login is not configured on this server', 500)
    }

    if (!credential) {
      return errorResponse(res, 'Google credential is required', 400)
    }

    const { data: googleUser } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: credential },
      timeout: 5000,
    })

    const isVerifiedEmail = googleUser.email_verified === true || googleUser.email_verified === 'true'

    if (googleUser.aud !== googleClientId) {
      return errorResponse(res, 'Invalid Google credential audience', 401)
    }

    if (!googleUser.sub || !googleUser.email || !isVerifiedEmail) {
      return errorResponse(res, 'Google account email must be verified', 401)
    }

    const email = googleUser.email.toLowerCase().trim()
    let user = await User.findOne({
      $or: [{ googleId: googleUser.sub }, { email }],
    })

    if (user && !user.isActive) {
      return errorResponse(res, 'Account deactivated. Contact support.', 401)
    }

    if (!user) {
      user = await User.create({
        name: googleUser.name || email.split('@')[0],
        email,
        passwordHash: crypto.randomBytes(32).toString('hex'),
        role: 'patient',
        profilePicture: googleUser.picture || '',
        authProvider: 'google',
        googleId: googleUser.sub,
        emailVerified: true,
      })
    } else {
      user.googleId = user.googleId || googleUser.sub
      user.authProvider = user.authProvider === 'local' ? 'local' : 'google'
      user.emailVerified = true
      if (!user.profilePicture && googleUser.picture) user.profilePicture = googleUser.picture
      if (!user.name && googleUser.name) user.name = googleUser.name
    }

    user.lastLogin = Date.now()
    await user.save()

    const token = generateToken(user._id)
    setAuthCookie(res, token)

    return successResponse(res, {
      token,
      user: getAuthUserPayload(user)
    }, 'Google login successful')

  } catch (error) {
    if (error.response?.status) {
      return errorResponse(res, 'Invalid Google credential', 401)
    }
    next(error)
  }
}

const getGoogleConfig = (req, res) => {
  const clientId = getGoogleClientId()

  return successResponse(res, {
    enabled: Boolean(clientId),
    clientId,
  })
}

// ── getMe ─────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authenticated', 401)
    return successResponse(res, {
      ...getAuthUserPayload(req.user),
    })
  } catch (error) { next(error) }
}

// ── forgotPassword ────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return errorResponse(res, 'Email is required', 400)

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Always return success — never reveal whether email is registered (security)
    if (!user) {
      return successResponse(res, null, 'If that email is registered, a reset link has been sent')
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.passwordResetExpires = Date.now() + 3600000   // 1 hour
    await user.save()

    const result = await emailService.sendPasswordResetEmail(user.email, resetToken)
    if (result?.error) console.error('Password reset email failed:', result.error)

    if (process.env.NODE_ENV !== 'production' && (result?.skipped || result?.error)) {
      return successResponse(res, {
        resetUrl,
        delivery: result?.skipped ? 'disabled' : 'failed',
      }, 'Email delivery is unavailable in development. Use the reset link below.')
    }

    return successResponse(res, null, 'If that email is registered, a reset link has been sent')

  } catch (error) { next(error) }
}

// ── resetPassword ─────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token
    const { password } = req.body

    if (!token) return errorResponse(res, 'Reset token is required', 400)
    if (!password || password.length < 6)
      return errorResponse(res, 'Password must be at least 6 characters', 400)

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) return errorResponse(res, 'Invalid or expired reset link', 400)

    user.passwordHash         = password
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return successResponse(res, null, 'Password reset successful. Please log in.')

  } catch (error) { next(error) }
}

// ── logout ────────────────────────────────────────────────
const logout = (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires:  new Date(Date.now() + 10 * 1000),
  })
  return successResponse(res, null, 'Logged out successfully')
}

module.exports = { register, login, googleLogin, getGoogleConfig, getMe, forgotPassword, resetPassword, logout }

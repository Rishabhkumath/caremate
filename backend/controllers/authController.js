const User      = require('../models/User')
const Patient   = require('../models/Patient')
const Doctor    = require('../models/Doctor')
const Caregiver = require('../models/Caregiver')
const { generateToken }    = require('../config/jwt')
const { validationResult } = require('express-validator')
const { successResponse, errorResponse } = require('../utils/apiResponse')
const crypto       = require('crypto')
const emailService = require('../services/emailService')

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
      user: {
        id:    user._id,
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phoneNumber: user.phoneNumber,
      }
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

    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    })

    return successResponse(res, {
      token,
      user: {
        id:             user._id,
        _id:            user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        phoneNumber:    user.phoneNumber,
        profilePicture: user.profilePicture,
      }
    }, 'Login successful')

  } catch (error) { next(error) }
}

// ── getMe ─────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authenticated', 401)
    return successResponse(res, {
      id:             req.user._id,
      _id:            req.user._id,
      name:           req.user.name,
      email:          req.user.email,
      role:           req.user.role,
      phoneNumber:    req.user.phoneNumber,
      profilePicture: req.user.profilePicture,
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

module.exports = { register, login, getMe, forgotPassword, resetPassword, logout }

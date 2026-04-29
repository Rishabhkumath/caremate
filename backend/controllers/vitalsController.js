const Vitals  = require('../models/Vitals')
const Patient = require('../models/Patient')
const { successResponse, errorResponse } = require('../utils/apiResponse')
const notificationService = require('../services/notificationService')

// ── POST /api/v1/vitals ───────────────────────────────────
const createVitals = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
    if (!patient) {
      return errorResponse(
        res,
        'Patient profile not found. Please complete your registration profile first.',
        404
      )
    }

    const vitals = await Vitals.create({
      ...req.body,
      patient:    patient._id,
      recordedBy: req.user._id,
    })

    // Notify on abnormal readings — fire and forget, never crash request
    if (vitals.isAbnormal) {
      notificationService.sendVitalsAlert(patient, vitals).catch(e =>
        console.error('Vitals alert notification error:', e.message)
      )
    }

    return successResponse(res, vitals, 'Vitals recorded successfully', 201)
  } catch (error) { next(error) }
}

// ── GET /api/v1/vitals (patient's own) ───────────────────
const getVitals = async (req, res, next) => {
  try {
    let patientId

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id })
      if (!patient) return successResponse(res, [], 'No patient profile yet')
      patientId = patient._id
    } else {
      // Doctor / caregiver — patientId comes from URL param
      patientId = req.params.patientId
      if (!patientId) return errorResponse(res, 'Patient ID required', 400)
    }

    const days      = parseInt(req.query.days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const vitals = await Vitals
      .find({ patient: patientId, recordedAt: { $gte: startDate } })
      .sort('-recordedAt')
      .limit(100)

    return successResponse(res, vitals)
  } catch (error) { next(error) }
}

// ── GET /api/v1/vitals/stats ──────────────────────────────
const getVitalsStats = async (req, res, next) => {
  try {
    let patientId

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id })
      if (!patient) return successResponse(res, { average: null, alerts: [], total: 0 })
      patientId = patient._id
    } else {
      patientId = req.params.patientId
      if (!patientId) return errorResponse(res, 'Patient ID required', 400)
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const vitals = await Vitals
      .find({ patient: patientId, recordedAt: { $gte: since } })
      .sort('recordedAt')

    if (!vitals.length)
      return successResponse(res, { average: null, trends: {}, alerts: [], total: 0 })

    const avg = (arr, fn) =>
      arr.length ? arr.reduce((s, v) => s + fn(v), 0) / arr.length : null

    const bpList  = vitals.filter(v => v.bloodPressure?.systolic)
    const hrList  = vitals.filter(v => v.heartRate?.value)
    const tmpList = vitals.filter(v => v.temperature?.value)
    const o2List  = vitals.filter(v => v.oxygenSaturation?.value)

    const average = {
      bloodPressure: bpList.length ? {
        systolic:  avg(bpList, v => v.bloodPressure.systolic),
        diastolic: avg(bpList, v => v.bloodPressure.diastolic),
      } : null,
      heartRate:        avg(hrList,  v => v.heartRate.value),
      temperature:      avg(tmpList, v => v.temperature.value),
      oxygenSaturation: avg(o2List,  v => v.oxygenSaturation.value),
    }

    return successResponse(res, {
      average,
      trends: {
        bloodPressure: bpList.slice(-7),
        heartRate:     hrList.slice(-7),
        temperature:   tmpList.slice(-7),
        oxygenSaturation: o2List.slice(-7),
      },
      alerts: vitals.filter(v => v.isAbnormal).slice(-5),
      total:  vitals.length,
    })
  } catch (error) { next(error) }
}

// ── GET /api/v1/vitals/:id ────────────────────────────────
const getVitalsById = async (req, res, next) => {
  try {
    const vitals = await Vitals.findById(req.params.id)
      .populate('recordedBy', 'name')
    if (!vitals) return errorResponse(res, 'Vitals record not found', 404)
    return successResponse(res, vitals)
  } catch (error) { next(error) }
}

// ── PUT /api/v1/vitals/:id ────────────────────────────────
const updateVitals = async (req, res, next) => {
  try {
    const vitals = await Vitals.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
    if (!vitals) return errorResponse(res, 'Vitals record not found', 404)
    return successResponse(res, vitals, 'Vitals updated')
  } catch (error) { next(error) }
}

// ── DELETE /api/v1/vitals/:id ─────────────────────────────
const deleteVitals = async (req, res, next) => {
  try {
    const vitals = await Vitals.findByIdAndDelete(req.params.id)
    if (!vitals) return errorResponse(res, 'Vitals record not found', 404)
    return successResponse(res, null, 'Vitals deleted')
  } catch (error) { next(error) }
}

// ── POST /api/v1/vitals/:id/check-alert ──────────────────
const checkVitalsAlert = async (req, res, next) => {
  try {
    const vitals = await Vitals.findById(req.params.id)
    if (!vitals) return errorResponse(res, 'Vitals record not found', 404)
    // Trigger pre-save hook to re-evaluate alerts
    await vitals.save()
    return successResponse(res, { isAbnormal: vitals.isAbnormal, alerts: vitals.alerts })
  } catch (error) { next(error) }
}

module.exports = {
  createVitals, getVitals, getVitalsStats,
  getVitalsById, updateVitals, deleteVitals, checkVitalsAlert,
}
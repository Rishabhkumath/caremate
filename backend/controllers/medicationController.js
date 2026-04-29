const Medication = require('../models/Medication')
const MedicationReminder = require('../models/MedicationReminder')
const Patient = require('../models/Patient')
const Doctor  = require('../models/Doctor')
const { successResponse, errorResponse } = require('../utils/apiResponse')
const reminderScheduler = require('../services/reminderScheduler')

const buildTiming = (frequency, times = []) => {
  const cleanedTimes = Array.isArray(times)
    ? times.map((time) => String(time).trim()).filter(Boolean)
    : []

  if (cleanedTimes.length > 0) {
    return cleanedTimes.map((time) => ({ time, taken: false }))
  }

  return generateTimings(frequency)
}

// ── POST /api/v1/medications ──────────────────────────────
const createMedication = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
    if (!patient) return errorResponse(res, 'Patient profile not found', 404)

    const medication = await Medication.create({
      ...req.body,
      patient: patient._id
    })

    const timings = buildTiming(medication.frequency, req.body.times)
    medication.timing = timings
    await medication.save()

    reminderScheduler.scheduleMedicationReminders(medication)

    return successResponse(res, medication, 'Medication created successfully', 201)
  } catch (error) { next(error) }
}

// ── GET /api/v1/medications ───────────────────────────────
const getMedications = async (req, res, next) => {
  try {
    let query = {}

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id })
      if (!patient) return successResponse(res, [])
      query.patient = patient._id
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id })
      if (!doctor) return successResponse(res, [])
      query.doctor = doctor._id
    }

    const medications = await Medication.find(query)
      .populate('patient', 'user')
      .populate('doctor', 'name')

    return successResponse(res, medications)
  } catch (error) { next(error) }
}

// ── GET /api/v1/medications/patient/:patientId ────────────
// Used by doctors and caregivers to view a specific patient's medications
const getPatientMedications = async (req, res, next) => {
  try {
    const { patientId } = req.params

    const medications = await Medication.find({ patient: patientId })
      .populate('patient', 'user')
      .populate('doctor', 'name')

    return successResponse(res, medications)
  } catch (error) { next(error) }
}

// ── GET /api/v1/medications/:id ───────────────────────────
const getMedicationById = async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('patient', 'user')
      .populate('doctor', 'name')

    if (!medication) return errorResponse(res, 'Medication not found', 404)
    return successResponse(res, medication)
  } catch (error) { next(error) }
}

// ── PUT /api/v1/medications/:id ───────────────────────────
const updateMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
    if (!medication) return errorResponse(res, 'Medication not found', 404)

    if (req.body.frequency || req.body.times) {
      medication.timing = buildTiming(medication.frequency, req.body.times)
      await medication.save()
      reminderScheduler.rescheduleMedicationReminders(medication)
    }

    return successResponse(res, medication, 'Medication updated successfully')
  } catch (error) { next(error) }
}

// ── DELETE /api/v1/medications/:id ───────────────────────
const deleteMedication = async (req, res, next) => {
  try {
    await MedicationReminder.deleteMany({ medication: req.params.id })
    await Medication.findByIdAndDelete(req.params.id)
    return successResponse(res, null, 'Medication deleted successfully')
  } catch (error) { next(error) }
}

// ── GET /api/v1/medications/reminders/today ───────────────
const getTodayReminders = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
    if (!patient) return successResponse(res, [])

    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const reminders = await MedicationReminder.find({
      patient:       patient._id,
      scheduledTime: { $gte: today, $lt: tomorrow }
    }).populate('medication').sort('scheduledTime')

    return successResponse(res, reminders)
  } catch (error) { next(error) }
}

// ── PUT /api/v1/medications/reminders/:id/taken ───────────
const markReminderTaken = async (req, res, next) => {
  try {
    const reminder = await MedicationReminder.findById(req.params.id)
    if (!reminder) return errorResponse(res, 'Reminder not found', 404)

    reminder.status     = 'taken'
    reminder.actualTime = new Date()
    reminder.takenBy    = req.user._id
    await reminder.save()

    const medication = await Medication.findById(reminder.medication)
    if (medication) {
      const idx = medication.timing?.findIndex(
        t => t.time === reminder.scheduledTime.toTimeString().slice(0, 5)
      )
      if (idx !== -1) {
        medication.timing[idx].taken = true
        await medication.save()
      }
    }

    return successResponse(res, reminder, 'Medication marked as taken')
  } catch (error) { next(error) }
}

// ── GET /api/v1/medications/stats/adherence ───────────────
const getAdherenceStats = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
    if (!patient) return successResponse(res, { total: 0, taken: 0, missed: 0, adherenceRate: '0.0' })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const reminders = await MedicationReminder.find({
      patient:       patient._id,
      scheduledTime: { $gte: sevenDaysAgo }
    })

    const total  = reminders.length
    const taken  = reminders.filter(r => r.status === 'taken').length
    const missed = reminders.filter(r => r.status === 'missed').length
    const adherenceRate = total > 0 ? ((taken / total) * 100).toFixed(1) : '0.0'

    const dailyStats = {}
    reminders.forEach(r => {
      const day = r.scheduledTime.toISOString().split('T')[0]
      if (!dailyStats[day]) dailyStats[day] = { total: 0, taken: 0 }
      dailyStats[day].total++
      if (r.status === 'taken') dailyStats[day].taken++
    })

    return successResponse(res, { total, taken, missed, adherenceRate, dailyStats })
  } catch (error) { next(error) }
}

// ── Helper ────────────────────────────────────────────────
function generateTimings(frequency) {
  const map = {
    'once':          ['09:00'],
    'twice':         ['09:00', '21:00'],
    'thrice':        ['08:00', '14:00', '20:00'],
    'four times':    ['06:00', '12:00', '18:00', '00:00'],
    'every 4 hours': Array.from({ length: 6  }, (_, i) => `${String(i*4).padStart(2,'0')}:00`),
    'every 6 hours': Array.from({ length: 4  }, (_, i) => `${String(i*6).padStart(2,'0')}:00`),
    'every 8 hours': Array.from({ length: 3  }, (_, i) => `${String(i*8).padStart(2,'0')}:00`),
  }
  const times = map[frequency] || ['09:00']
  return times.map(time => ({ time, taken: false }))
}

module.exports = {
  createMedication,
  getMedications,
  getPatientMedications,   // ← new
  getMedicationById,
  updateMedication,
  deleteMedication,
  getTodayReminders,
  markReminderTaken,
  getAdherenceStats,
}

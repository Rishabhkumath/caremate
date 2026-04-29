const Appointment = require('../models/Appointment')
const Patient     = require('../models/Patient')
const Doctor      = require('../models/Doctor')
const Consultation = require('../models/Consultation')
const { successResponse, errorResponse } = require('../utils/apiResponse')
const emailService        = require('../services/emailService')
const notificationService = require('../services/notificationService')

const doctorPopulate = {
  path: 'doctor',
  select: 'specialization rating totalReviews isVerified',
  populate: { path: 'user', select: 'name email' },
}

const getCarePairKey = (item) => {
  const patientId = item?.patient?._id || item?.patient
  const doctorId = item?.doctor?._id || item?.doctor
  if (!patientId || !doctorId) return null
  return `${patientId.toString()}::${doctorId.toString()}`
}

const getConsultationSummary = (consultation) => {
  if (!consultation) return null

  const diagnosis = typeof consultation.diagnosis === 'string'
    ? consultation.diagnosis
    : [
        consultation.diagnosis?.primary,
        ...(consultation.diagnosis?.secondary || []),
      ].filter(Boolean).join(', ')

  const medications = (consultation.prescriptions || [])
    .map((medication) => medication?.name || medication?.medicationName)
    .filter(Boolean)

  const treatmentParts = [
    consultation.treatment?.plan,
    ...(consultation.treatment?.procedures || []),
    ...(medications.length ? [`Medications: ${medications.join(', ')}`] : []),
  ].filter(Boolean)

  const suggestions = [
    consultation.notes,
    consultation.diagnosis?.notes,
  ].filter(Boolean).join(' ')

  return {
    id: consultation._id,
    diagnosis: diagnosis || '',
    treatment: treatmentParts.join('. '),
    suggestions,
    followUpDate: consultation.treatment?.followUp || null,
    completedAt: consultation.updatedAt || consultation.createdAt || null,
  }
}

const attachConsultationSummaries = async (appointments) => {
  const plainAppointments = appointments.map((appointment) => (
    typeof appointment.toObject === 'function' ? appointment.toObject() : appointment
  ))

  if (plainAppointments.length === 0) return plainAppointments

  const appointmentIds = plainAppointments.map((appointment) => appointment._id)
  const patientIds = plainAppointments.map((appointment) => appointment.patient?._id || appointment.patient).filter(Boolean)
  const doctorIds = plainAppointments.map((appointment) => appointment.doctor?._id || appointment.doctor).filter(Boolean)

  const consultations = await Consultation.find({
    $or: [
      { appointment: { $in: appointmentIds } },
      {
        patient: { $in: patientIds },
        doctor: { $in: doctorIds },
      },
    ],
  })
    .populate('prescriptions', 'name medicationName')
    .sort('-updatedAt')
    .lean()

  const consultationByAppointmentId = consultations.reduce((acc, consultation) => {
    const appointmentId = consultation.appointment?.toString()
    if (appointmentId && !acc[appointmentId]) acc[appointmentId] = consultation
    return acc
  }, {})

  const consultationByPairKey = consultations.reduce((acc, consultation) => {
    const pairKey = getCarePairKey(consultation)
    if (pairKey && !acc[pairKey]) acc[pairKey] = consultation
    return acc
  }, {})

  return plainAppointments.map((appointment) => {
    const consultation = (
      consultationByAppointmentId[appointment._id.toString()] ||
      consultationByPairKey[getCarePairKey(appointment)]
    )
    const consultationSummary = getConsultationSummary(consultation)

    return {
      ...appointment,
      consultationSummary,
      treatmentSummary: consultationSummary?.treatment || '',
      suggestionsSummary: consultationSummary?.suggestions || '',
    }
  })
}

const recalculateDoctorRating = async (doctorId) => {
  const ratedAppointments = await Appointment.find({
    doctor: doctorId,
    'doctorReview.rating': { $exists: true, $ne: null },
  }).select('doctorReview.rating')

  const totalReviews = ratedAppointments.length
  const rating = totalReviews > 0
    ? ratedAppointments.reduce((sum, appointment) => sum + (appointment.doctorReview?.rating || 0), 0) / totalReviews
    : 0

  await Doctor.findByIdAndUpdate(doctorId, {
    rating: Number(rating.toFixed(1)),
    totalReviews,
  })
}

// ── POST /api/v1/appointments ─────────────────────────────
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, type, reason } = req.body

    const patient = await Patient.findOne({ user: req.user._id })
    if (!patient) return errorResponse(res, 'Patient profile not found', 404)

    const doctor = await Doctor.findById(doctorId)
    if (!doctor)  return errorResponse(res, 'Doctor not found', 404)
    if (!doctor.isVerified) return errorResponse(res, 'Doctor is pending admin verification', 400)

    // Check slot availability
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date:   new Date(date),
      'timeSlot.startTime': timeSlot?.startTime,
      status: { $nin: ['cancelled'] },
    })
    if (conflict) return errorResponse(res, 'That time slot is already booked', 400)

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor:  doctorId,
      date,
      timeSlot,
      type:    type    || 'consultation',
      reason:  reason  || '',
      status:  'pending',
    })

    // In-app notification
    notificationService.createNotification({
      recipient: req.user._id,
      type:      'appointment_reminder',
      title:     'Appointment Requested',
      message:   `Your appointment request with Dr. ${doctor.user?.name || doctor.name || 'your doctor'} has been sent for confirmation.`,
      priority:  'high',
    }).catch(() => {})

    // Email confirmation
    emailService.sendAppointmentConfirmation(
      req.user.email,
      appointment,
      doctor.user?.name || doctor.name || 'Doctor'
    ).catch(() => {})

    return successResponse(res, appointment, 'Appointment created successfully', 201)
  } catch (error) { next(error) }
}

// ── GET /api/v1/appointments ──────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query
    const query = {}

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id })
      if (!patient) return successResponse(res, [])
      query.patient = patient._id
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id })
      if (!doctor) return successResponse(res, [])
      query.doctor = doctor._id
    }

    if (status) query.status = status
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate)   query.date.$lte = new Date(endDate)
    }

    const appointments = await Appointment.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate(doctorPopulate)
      .sort('-date')

    return successResponse(res, await attachConsultationSummaries(appointments))
  } catch (error) { next(error) }
}

// ── GET /api/v1/appointments/:id ──────────────────────────
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate(doctorPopulate)
    if (!appointment) return errorResponse(res, 'Appointment not found', 404)
    const [enrichedAppointment] = await attachConsultationSummaries([appointment])
    return successResponse(res, enrichedAppointment)
  } catch (error) { next(error) }
}

// ── PUT /api/v1/appointments/:id ──────────────────────────
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return errorResponse(res, 'Appointment not found', 404)

    const { date, timeSlot, type, reason, status } = req.body

    const isStatusOnlyUpdate = status && !date && !timeSlot && !type && !reason

    if (status) {
      if (!['doctor', 'admin'].includes(req.user.role)) {
        return errorResponse(res, 'Only doctors or admins can update appointment status', 403)
      }
      appointment.status = status
    }

    if (!isStatusOnlyUpdate) {
      const apptDate  = new Date(appointment.date)
      const hoursLeft = (apptDate - new Date()) / (1000 * 60 * 60)
      if (hoursLeft < 24)
        return errorResponse(res, 'Appointments can only be rescheduled 24+ hours in advance', 400)

      if (date)     appointment.date     = date
      if (timeSlot) appointment.timeSlot = timeSlot
      if (type)     appointment.type     = type
      if (reason)   appointment.reason   = reason
    }

    await appointment.save()

    return successResponse(res, appointment, 'Appointment updated')
  } catch (error) { next(error) }
}

// ── DELETE /api/v1/appointments/:id ──────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: '_id name' } })
      .populate({ path: 'doctor',  populate: { path: 'user', select: '_id name' } })

    if (!appointment) return errorResponse(res, 'Appointment not found', 404)

    appointment.status              = 'cancelled'
    appointment.cancelledBy         = req.user._id
    appointment.cancellationReason  = req.body.reason || ''
    await appointment.save()

    // Notify both parties
    const patientUserId = appointment.patient?.user?._id
    const doctorUserId  = appointment.doctor?.user?._id

    if (patientUserId) {
      notificationService.createNotification({
        recipient: patientUserId,
        type:      'appointment_reminder',
        title:     'Appointment Cancelled',
        message:   `Your appointment with Dr. ${appointment.doctor?.name || 'your doctor'} has been cancelled.`,
        priority:  'medium',
      }).catch(() => {})
    }

    if (doctorUserId) {
      notificationService.createNotification({
        recipient: doctorUserId,
        type:      'appointment_reminder',
        title:     'Appointment Cancelled',
        message:   `An appointment has been cancelled.`,
        priority:  'low',
      }).catch(() => {})
    }

    return successResponse(res, null, 'Appointment cancelled')
  } catch (error) { next(error) }
}

// ── GET /api/v1/appointments/available-slots ─────────────
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date) return errorResponse(res, 'doctorId and date required', 400)

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) return errorResponse(res, 'Doctor not found', 404)

    const dayName  = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
    const daySlots = (doctor.availableTimeSlots || []).find(s => s.day === dayName)

    if (!daySlots) return successResponse(res, [], 'No slots available for this day')

    const booked = await Appointment.find({
      doctor: doctorId,
      date:   new Date(date),
      status: { $nin: ['cancelled'] },
    })
    const bookedTimes = booked.map(a => a.timeSlot?.startTime).filter(Boolean)

    const slots = []
    const start = new Date(`1970-01-01T${daySlots.startTime}`)
    const end   = new Date(`1970-01-01T${daySlots.endTime}`)

    for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 30)) {
      const str = t.toTimeString().slice(0, 5)
      if (!bookedTimes.includes(str)) slots.push(str)
    }

    return successResponse(res, slots)
  } catch (error) { next(error) }
}

// PUT /api/v1/appointments/:id/rate
const rateAppointment = async (req, res, next) => {
  try {
    const { rating, comment } = req.body
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', select: 'user' })

    if (!appointment) return errorResponse(res, 'Appointment not found', 404)
    if (req.user.role !== 'patient') return errorResponse(res, 'Only patients can rate doctors', 403)
    if (appointment.patient?.user?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to rate this appointment', 403)
    }
    if (appointment.status !== 'completed') {
      return errorResponse(res, 'Only completed appointments can be rated', 400)
    }

    const numericRating = Number(rating)
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400)
    }

    appointment.doctorReview = {
      rating: numericRating,
      comment: comment || '',
      ratedAt: new Date(),
    }
    await appointment.save()

    await recalculateDoctorRating(appointment.doctor)

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate(doctorPopulate)

    const [enrichedAppointment] = await attachConsultationSummaries([populatedAppointment])
    return successResponse(res, enrichedAppointment, 'Doctor rated successfully')
  } catch (error) { next(error) }
}

module.exports = {
  createAppointment, getAppointments, getAppointmentById,
  updateAppointment, cancelAppointment, getAvailableSlots, rateAppointment,
}

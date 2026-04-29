const Doctor       = require('../models/Doctor')
const Patient      = require('../models/Patient')
const Appointment  = require('../models/Appointment')
const Consultation = require('../models/Consultation')
const Medication   = require('../models/Medication')
const Caregiver    = require('../models/Caregiver')
const User         = require('../models/User')
const { successResponse, errorResponse } = require('../utils/apiResponse')

// GET /doctor/all — public, for appointment booking
const getAllDoctors = async (req, res, next) => {
  try {
    const query = { isAvailable: { $ne: false } }
    if (req.user?.role !== 'admin') query.isVerified = true

    const doctors = await Doctor.find(query)
      .populate('user', 'name email phoneNumber profilePicture')
      .select('specialization consultationFee department user rating totalReviews isVerified')
    return successResponse(res, doctors)
  } catch (error) { next(error) }
}

// GET /doctor/me
const getMyProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'name email phoneNumber profilePicture')

    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)
    return successResponse(res, doctor)
  } catch (error) { next(error) }
}

// PUT /doctor/me
const updateMyProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const {
      name,
      email,
      phoneNumber,
      specialization,
      licenseNumber,
      experience,
      consultationFee,
      department,
      bio,
      availableDays,
      hospital,
    } = req.body

    const userUpdates = {}
    if (name !== undefined) userUpdates.name = name
    if (email !== undefined) userUpdates.email = String(email).toLowerCase().trim()
    if (phoneNumber !== undefined) userUpdates.phoneNumber = phoneNumber

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates, { new: true, runValidators: true })
    }

    if (specialization !== undefined) doctor.specialization = specialization
    if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber
    if (experience !== undefined) doctor.experience = experience
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee
    if (department !== undefined) doctor.department = department
    if (bio !== undefined) doctor.bio = bio
    if (Array.isArray(availableDays)) doctor.availableDays = availableDays
    if (hospital && typeof hospital === 'object') {
      doctor.hospital = {
        ...doctor.hospital,
        ...hospital,
      }
    }

    await doctor.save()

    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'name email phoneNumber profilePicture')

    return successResponse(res, updatedDoctor, 'Profile updated successfully')
  } catch (error) { next(error) }
}

// GET /doctor/patients
const getPatients = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    // Get all patients who have appointments with this doctor
    const appointments = await Appointment.find({
      doctor: doctor._id,
      status: { $nin: ['cancelled', 'no-show'] },
    })
      .distinct('patient')

    const patients = await Patient.find({ _id: { $in: appointments } })
      .populate('user', 'name email phoneNumber')
      .populate({ path: 'assignedCaregivers', select: 'qualification user', populate: { path: 'user', select: 'name email phoneNumber' } })

    return successResponse(res, patients)
  } catch (error) { next(error) }
}

// GET /doctor/consultations
const getConsultations = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const consultations = await Consultation.find({ doctor: doctor._id })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort('-createdAt')
      .limit(50)

    return successResponse(res, consultations)
  } catch (error) { next(error) }
}

// GET /doctor/schedule
const getSchedule = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort('-date')

    return successResponse(res, appointments)
  } catch (error) { next(error) }
}

// GET /doctor/prescriptions
const getPrescriptions = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const prescriptions = await Medication.find({ doctor: doctor._id })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort('-createdAt')

    return successResponse(res, prescriptions)
  } catch (error) { next(error) }
}

// POST /doctor/prescriptions
const addPrescription = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const { patientId, medicationName, dosage, frequency, duration, notes } = req.body

    let normalizedDuration
    if (duration) {
      const now = new Date()
      const daysMatch = String(duration).match(/(\d+)/)
      const endDate = new Date(now)
      if (daysMatch) endDate.setDate(endDate.getDate() + Number(daysMatch[1]))
      normalizedDuration = {
        startDate: now,
        ...(daysMatch ? { endDate } : {}),
      }
    }

    const medication = await Medication.create({
      patient: patientId,
      doctor: doctor._id,
      name: medicationName,
      dosage,
      frequency: frequency || 'once',
      ...(normalizedDuration ? { duration: normalizedDuration } : {}),
      ...(notes ? { instructions: notes } : {}),
      status: 'active',
    })

    const populatedMedication = await Medication.findById(medication._id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })

    return successResponse(res, populatedMedication, 'Prescription added', 201)
  } catch (error) { next(error) }
}

// POST /doctor/patients/:patientId/caregivers/:caregiverId/assign
const assignCaregiverToPatient = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const { patientId, caregiverId } = req.params

    const hasCareRelationship = await Appointment.exists({
      doctor: doctor._id,
      patient: patientId,
      status: { $nin: ['cancelled', 'no-show'] },
    })

    const patient = await Patient.findOne({
      _id: patientId,
      $or: [
        { primaryDoctor: doctor._id },
        ...(hasCareRelationship ? [{ _id: patientId }] : []),
      ],
    })

    if (!patient) return errorResponse(res, 'Patient not found for this doctor', 404)

    const caregiver = await Caregiver.findById(caregiverId)
    if (!caregiver) return errorResponse(res, 'Caregiver not found', 404)

    if (!patient.assignedCaregivers.some(id => String(id) === String(caregiver._id))) {
      patient.assignedCaregivers.push(caregiver._id)
      await patient.save()
    }

    if (!caregiver.assignedPatients.some(id => String(id) === String(patient._id))) {
      caregiver.assignedPatients.push(patient._id)
      await caregiver.save()
    }

    const updatedPatient = await Patient.findById(patient._id)
      .populate('user', 'name email phoneNumber')
      .populate({ path: 'assignedCaregivers', select: 'qualification experience availability hourlyRate user', populate: { path: 'user', select: 'name email phoneNumber' } })

    return successResponse(res, updatedPatient, 'Caregiver assigned successfully')
  } catch (error) { next(error) }
}

// GET /doctor/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) return errorResponse(res, 'Doctor profile not found', 404)

    const [totalAppointments, pendingCount, completedCount] = await Promise.all([
      Appointment.countDocuments({ doctor: doctor._id }),
      Appointment.countDocuments({ doctor: doctor._id, status: { $in: ['pending','scheduled'] } }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'completed' }),
    ])

    const patientIds = await Appointment.find({ doctor: doctor._id }).distinct('patient')

    return successResponse(res, {
      totalPatients:    patientIds.length,
      totalAppointments,
      pendingCount,
      completedCount,
    })
  } catch (error) { next(error) }
}

// GET /doctor/:id
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email phoneNumber profilePicture')
    if (!doctor) return errorResponse(res, 'Doctor not found', 404)
    return successResponse(res, doctor)
  } catch (error) { next(error) }
}

// PUT /doctor/:id
const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!doctor) return errorResponse(res, 'Doctor not found', 404)
    return successResponse(res, doctor, 'Doctor updated')
  } catch (error) { next(error) }
}

module.exports = {
  getAllDoctors,
  getMyProfile,
  updateMyProfile,
  getPatients,
  getConsultations,
  getSchedule,
  getPrescriptions,
  addPrescription,
  assignCaregiverToPatient,
  getDashboardStats,
  getDoctorById,
  updateDoctor,
}

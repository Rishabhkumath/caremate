const Patient = require('../models/Patient');
const User = require('../models/User');
const Vitals = require('../models/Vitals');
const Appointment = require('../models/Appointment');
const Medication = require('../models/Medication');
const Caregiver = require('../models/Caregiver');
const CaregiverLog = require('../models/CaregiverLog');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getPatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
      .populate('user', '-passwordHash')
      .populate({ path: 'primaryDoctor', select: 'specialization rating totalReviews isVerified consultationFee department', populate: { path: 'user', select: 'name email phoneNumber' } })
      .populate({ path: 'assignedCaregivers', select: 'qualification experience servicesOffered availability hourlyRate rating totalReviews isVerified user', populate: { path: 'user', select: 'name email phoneNumber' } });

    if (!patient) {
      return errorResponse(res, 'Patient profile not found', 404);
    }

    return successResponse(res, patient);
  } catch (error) {
    next(error);
  }
};

const updatePatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return errorResponse(res, 'Patient profile not found', 404);
    }

    const {
      name,
      email,
      phoneNumber,
      bloodGroup,
      allergies,
      chronicConditions,
    } = req.body;

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = String(email).toLowerCase().trim();
    if (phoneNumber !== undefined) userUpdates.phoneNumber = phoneNumber;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates, { new: true, runValidators: true });
    }

    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (allergies !== undefined) patient.allergies = Array.isArray(allergies) ? allergies : [];
    if (chronicConditions !== undefined) patient.chronicConditions = Array.isArray(chronicConditions) ? chronicConditions : [];

    await patient.save();

    const updatedPatient = await Patient.findById(patient._id)
      .populate('user', '-passwordHash')
      .populate({ path: 'primaryDoctor', select: 'specialization rating totalReviews isVerified consultationFee department', populate: { path: 'user', select: 'name email phoneNumber' } })
      .populate({ path: 'assignedCaregivers', select: 'qualification experience servicesOffered availability hourlyRate rating totalReviews isVerified user', populate: { path: 'user', select: 'name email phoneNumber' } });

    return successResponse(res, updatedPatient, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const getPatientVitals = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vitals = await Vitals.find({
      patient: req.patientId || req.user.patientProfile,
      recordedAt: { $gte: startDate }
    }).sort('-recordedAt');

    return successResponse(res, vitals);
  } catch (error) {
    next(error);
  }
};

const recordVitals = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    const vitals = await Vitals.create({
      ...req.body,
      patient: patient._id,
      recordedBy: req.user._id
    });

    if (vitals.isAbnormal) {
      // Trigger notification for abnormal vitals
      req.app.get('notificationService').sendVitalsAlert(patient, vitals);
    }

    return successResponse(res, vitals, 'Vitals recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort('-date');

    return successResponse(res, appointments);
  } catch (error) {
    next(error);
  }
};

const getMedications = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    const medications = await Medication.find({
      patient: patient._id,
      status: 'active'
    }).populate('doctor', 'name');

    return successResponse(res, medications);
  } catch (error) {
    next(error);
  }
};

const getCaregiverLogs = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    const logs = await CaregiverLog.find({ patient: patient._id })
      .populate('caregiver', 'name qualification')
      .sort('-date');

    return successResponse(res, logs);
  } catch (error) {
    next(error);
  }
};

const approveCaregiver = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return errorResponse(res, 'Patient profile not found', 404);

    const caregiver = await Caregiver.findById(req.params.caregiverId);
    if (!caregiver) return errorResponse(res, 'Caregiver not found', 404);

    if (!patient.assignedCaregivers.some(id => String(id) === String(caregiver._id))) {
      patient.assignedCaregivers.push(caregiver._id);
      await patient.save();
    }

    if (!caregiver.assignedPatients.some(id => String(id) === String(patient._id))) {
      caregiver.assignedPatients.push(patient._id);
      await caregiver.save();
    }

    const updatedPatient = await Patient.findById(patient._id)
      .populate({ path: 'assignedCaregivers', select: 'qualification experience servicesOffered availability hourlyRate rating totalReviews isVerified user', populate: { path: 'user', select: 'name email phoneNumber' } });

    return successResponse(res, updatedPatient, 'Caregiver approved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getPatientVitals,
  recordVitals,
  getAppointments,
  getMedications,
  getCaregiverLogs,
  approveCaregiver
};

const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Medication = require('../models/Medication');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const consultationPopulate = [
  { path: 'patient', populate: { path: 'user', select: 'name email phoneNumber' } },
  { path: 'doctor', populate: { path: 'user', select: 'name email phoneNumber' } },
  { path: 'appointment', select: 'date timeSlot status type reason' },
  { path: 'prescriptions', select: 'name medicationName dosage frequency instructions notes' },
]

const populateConsultationQuery = (query) => {
  let next = query
  consultationPopulate.forEach((config) => {
    next = next.populate(config)
  })
  return next
}

const getDoctorForRequest = async (req) => {
  if (req.user.role !== 'doctor') return null
  return Doctor.findOne({ user: req.user._id })
}

const getPatientForRequest = async (req) => {
  if (req.user.role !== 'patient') return null
  return Patient.findOne({ user: req.user._id })
}

const normalizeMedicationDuration = (duration) => {
  if (!duration) return undefined

  if (typeof duration === 'object' && (duration.startDate || duration.endDate)) {
    return {
      ...(duration.startDate ? { startDate: new Date(duration.startDate) } : {}),
      ...(duration.endDate ? { endDate: new Date(duration.endDate) } : {}),
    }
  }

  const text = String(duration).trim()
  if (!text) return undefined

  const explicitDate = new Date(text)
  if (!Number.isNaN(explicitDate.getTime())) {
    return {
      startDate: new Date(),
      endDate: explicitDate,
    }
  }

  const now = new Date()
  const daysMatch = text.match(/(\d+)/)
  const endDate = new Date(now)
  if (daysMatch) {
    endDate.setDate(endDate.getDate() + Number(daysMatch[1]))
  }

  return {
    startDate: now,
    ...(daysMatch ? { endDate } : {}),
  }
}

const syncConsultationPrescriptions = async (consultation, prescriptions = []) => {
  if (!Array.isArray(prescriptions)) return

  const currentPrescriptionIds = (consultation.prescriptions || []).map((item) => String(item))
  const retainedPrescriptionIds = prescriptions
    .map((item) => item?._id || item?.id)
    .filter(Boolean)
    .map(String)
    .filter((id) => currentPrescriptionIds.includes(id))

  const newPrescriptionsPayload = prescriptions.filter((item) => (
    item &&
    !item._id &&
    !item.id &&
    String(item.medicationName || item.name || '').trim() &&
    String(item.dosage || '').trim()
  ))

  const newPrescriptions = await Promise.all(newPrescriptionsPayload.map((item) => (
    (() => {
      const normalizedDuration = normalizeMedicationDuration(item.duration)

      return Medication.create({
        patient: consultation.patient,
        doctor: consultation.doctor,
        name: String(item.medicationName || item.name).trim(),
        dosage: String(item.dosage).trim(),
        frequency: item.frequency || 'once',
        ...(normalizedDuration ? { duration: normalizedDuration } : {}),
        ...(item.notes || item.instructions ? { instructions: String(item.notes || item.instructions).trim() } : {}),
        status: 'active',
      })
    })()
  )))

  consultation.prescriptions = [
    ...retainedPrescriptionIds,
    ...newPrescriptions.map((item) => item._id),
  ]
}

const startConsultation = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    if (['pending', 'cancelled', 'no-show'].includes(appointment.status)) {
      return errorResponse(res, 'Consultation can only be added for confirmed, scheduled, in-progress, or completed appointments', 400)
    }

    const doctor = await getDoctorForRequest(req)
    if (req.user.role === 'doctor' && (!doctor || String(appointment.doctor) !== String(doctor._id))) {
      return errorResponse(res, 'Not authorized for this appointment', 403)
    }

    if (appointment.status !== 'completed') {
      appointment.status = 'in-progress';
      await appointment.save();
    }

    let consultation = await Consultation.findOne({
      appointment: appointmentId,
    });
    
    if (!consultation) {
      consultation = await Consultation.create({
        appointment: appointmentId,
        patient: appointment.patient,
        doctor: appointment.doctor,
        type: appointment.type,
        date: new Date()
      });
    } else {
      consultation.type = appointment.type
      consultation.status = 'ongoing'
      await consultation.save()
    }

    const populatedConsultation = await populateConsultationQuery(
      Consultation.findById(consultation._id)
    )

    return successResponse(res, populatedConsultation, 'Consultation started');
  } catch (error) {
    next(error);
  }
};

const updateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return errorResponse(res, 'Consultation not found', 404);
    }

    const doctor = await getDoctorForRequest(req)
    if (req.user.role === 'doctor' && (!doctor || String(consultation.doctor) !== String(doctor._id))) {
      return errorResponse(res, 'Not authorized for this consultation', 403)
    }

    const { prescriptions, ...restUpdates } = updates

    Object.assign(consultation, restUpdates)
    await syncConsultationPrescriptions(consultation, prescriptions)
    await consultation.save()

    const populatedConsultation = await populateConsultationQuery(
      Consultation.findById(consultation._id)
    )

    return successResponse(res, populatedConsultation, 'Consultation updated successfully');
  } catch (error) {
    next(error);
  }
};

const endConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, notes, prescriptions } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return errorResponse(res, 'Consultation not found', 404);
    }

    const doctor = await getDoctorForRequest(req)
    if (req.user.role === 'doctor' && (!doctor || String(consultation.doctor) !== String(doctor._id))) {
      return errorResponse(res, 'Not authorized for this consultation', 403)
    }

    consultation.diagnosis = diagnosis;
    consultation.treatment = treatment;
    consultation.notes = notes;
    consultation.status = 'completed';
    await syncConsultationPrescriptions(consultation, prescriptions)
    await consultation.save();

    // Update appointment
    await Appointment.findByIdAndUpdate(consultation.appointment, {
      status: 'completed'
    });

    const populatedConsultation = await populateConsultationQuery(
      Consultation.findById(consultation._id)
    )

    return successResponse(res, populatedConsultation, 'Consultation completed');
  } catch (error) {
    next(error);
  }
};

const getConsultations = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      const patient = await getPatientForRequest(req);
      if (!patient) return successResponse(res, []);
      query.patient = patient._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await getDoctorForRequest(req);
      if (!doctor) return successResponse(res, []);
      query.doctor = doctor._id;
    }

    const consultations = await populateConsultationQuery(
      Consultation.find(query)
    )
      .sort('-date');

    return successResponse(res, consultations);
  } catch (error) {
    next(error);
  }
};

const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const consultation = await populateConsultationQuery(
      Consultation.findById(id)
    );

    if (!consultation) {
      return errorResponse(res, 'Consultation not found', 404);
    }

    if (req.user.role === 'patient') {
      const patient = await getPatientForRequest(req)
      if (!patient || String(consultation.patient?._id || consultation.patient) !== String(patient._id)) {
        return errorResponse(res, 'Not authorized for this consultation', 403)
      }
    }

    if (req.user.role === 'doctor') {
      const doctor = await getDoctorForRequest(req)
      if (!doctor || String(consultation.doctor?._id || consultation.doctor) !== String(doctor._id)) {
        return errorResponse(res, 'Not authorized for this consultation', 403)
      }
    }

    return successResponse(res, consultation);
  } catch (error) {
    next(error);
  }
};

const addPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { medication } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return errorResponse(res, 'Consultation not found', 404);
    }

    consultation.prescriptions.push(medication);
    await consultation.save();

    return successResponse(res, consultation, 'Prescription added');
  } catch (error) {
    next(error);
  }
};

const addVitals = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vitals } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return errorResponse(res, 'Consultation not found', 404);
    }

    consultation.vitals = vitals;
    await consultation.save();

    return successResponse(res, consultation, 'Vitals recorded');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startConsultation,
  updateConsultation,
  endConsultation,
  getConsultations,
  getConsultationById,
  addPrescription,
  addVitals
};

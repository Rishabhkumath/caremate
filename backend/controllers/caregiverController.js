const Caregiver = require('../models/Caregiver');
const CaregiverLog = require('../models/CaregiverLog');
const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const MedicationReminder = require('../models/MedicationReminder');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Vitals = require('../models/Vitals');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const splitTreatmentPlan = (value) => (
  String(value || '')
    .split(/\r?\n|[.;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
);

const buildTreatmentChecklist = (consultation, existingTasks = []) => {
  if (!consultation) return existingTasks || [];

  const treatmentItems = [
    ...splitTreatmentPlan(consultation.treatment?.plan),
    ...(consultation.treatment?.procedures || []).map((item) => String(item || '').trim()).filter(Boolean),
  ];

  const uniqueItems = [...new Set(treatmentItems)];
  const existingByTask = new Map(
    (existingTasks || []).map((task) => [String(task.task || '').trim().toLowerCase(), task])
  );

  return uniqueItems.map((item) => {
    const existing = existingByTask.get(item.toLowerCase());
    return {
      task: item,
      type: 'treatment_step',
      sourceId: consultation?._id ? `treatment-${consultation._id}-${item.toLowerCase()}` : item.toLowerCase(),
      sourceLabel: 'Doctor treatment step',
      scheduledTime: consultation?.updatedAt || consultation?.createdAt || null,
      completed: !!existing?.completed,
      time: existing?.time || '',
      notes: existing?.notes || '',
    };
  });
};

const buildMedicationChecklist = (reminders = [], existingTasks = []) => {
  const existingBySource = new Map(
    (existingTasks || []).map((task) => [String(task.sourceId || ''), task])
  );

  return reminders.map((reminder) => {
    const sourceId = `reminder-${reminder._id}`;
    const existing = existingBySource.get(sourceId);
    const medicationName = reminder.medication?.name || 'Medication';
    const dosage = reminder.medication?.dosage ? ` (${reminder.medication.dosage})` : '';

    return {
      task: `Give ${medicationName}${dosage} at ${new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      type: 'medication',
      sourceId,
      sourceLabel: 'Medication reminder',
      scheduledTime: reminder.scheduledTime,
      completed: existing?.completed ?? (reminder.status === 'taken'),
      time: existing?.time || reminder.actualTime || '',
      notes: existing?.notes || reminder.notes || '',
    };
  });
};

const buildConsultationActionChecklist = (consultation, existingTasks = []) => {
  if (!consultation) return [];

  const existingBySource = new Map(
    (existingTasks || []).map((task) => [String(task.sourceId || ''), task])
  );
  const tasks = [];
  const diagnosis = typeof consultation.diagnosis === 'string'
    ? consultation.diagnosis
    : [
        consultation.diagnosis?.primary,
        ...(consultation.diagnosis?.secondary || []),
      ].filter(Boolean).join(', ');

  if (consultation.treatment?.followUp) {
    const sourceId = `followup-${consultation._id}`;
    const existing = existingBySource.get(sourceId);
    tasks.push({
      task: `Prepare patient for follow-up visit${diagnosis ? ` (${diagnosis})` : ''}`,
      type: 'follow_up',
      sourceId,
      sourceLabel: 'Doctor follow-up instruction',
      scheduledTime: consultation.treatment.followUp,
      completed: !!existing?.completed,
      time: existing?.time || '',
      notes: existing?.notes || '',
    });
  }

  if (Array.isArray(consultation.prescriptions) && consultation.prescriptions.length > 0) {
    const sourceId = `monitor-${consultation._id}`;
    const existing = existingBySource.get(sourceId);
    const medications = consultation.prescriptions
      .map((item) => item?.name || item?.medicationName)
      .filter(Boolean)
      .join(', ');

    tasks.push({
      task: `Monitor prescribed medicines: ${medications}`,
      type: 'medication_monitoring',
      sourceId,
      sourceLabel: 'Doctor prescription summary',
      scheduledTime: consultation.updatedAt || consultation.createdAt || null,
      completed: !!existing?.completed,
      time: existing?.time || '',
      notes: existing?.notes || '',
    });
  }

  return tasks;
};

const mergeChecklistItems = (...groups) => {
  const merged = [];
  const seenSources = new Set();
  const seenTasks = new Set();

  groups.flat().forEach((item) => {
    const sourceKey = String(item.sourceId || '').trim().toLowerCase();
    const taskKey = String(item.task || '').trim().toLowerCase();
    if ((sourceKey && seenSources.has(sourceKey)) || (taskKey && seenTasks.has(taskKey))) return;
    if (sourceKey) seenSources.add(sourceKey);
    if (taskKey) seenTasks.add(taskKey);
    merged.push(item);
  });

  return merged.sort((a, b) => new Date(b.scheduledTime || 0) - new Date(a.scheduledTime || 0));
};

const buildPatientCareChecklist = ({ consultation, reminders = [], existingTasks = [] }) => (
  mergeChecklistItems(
    existingTasks || [],
    buildMedicationChecklist(reminders, existingTasks),
    buildConsultationActionChecklist(consultation, existingTasks),
    buildTreatmentChecklist(consultation, existingTasks)
  )
);

const normalizeChecklistItems = (items = []) => (
  items.map((item) => (typeof item === 'string' ? { task: item } : item)).map((item) => ({
    task: item.task || '',
    type: item.type || '',
    sourceId: item.sourceId || '',
    sourceLabel: item.sourceLabel || '',
    scheduledTime: item.scheduledTime || null,
    completed: !!item.completed,
    time: item.time || '',
    notes: item.notes || '',
  }))
);

const getSubmittedChecklist = (body = {}) => {
  if (Array.isArray(body.tasks)) return body.tasks;
  if (Array.isArray(body.treatmentChecklist)) return body.treatmentChecklist;
  return null;
};

const withTreatmentChecklist = (log) => {
  const plainLog = typeof log.toObject === 'function' ? log.toObject() : log;
  const savedChecklist = plainLog.treatmentChecklist || plainLog.tasks || [];
  return {
    ...plainLog,
    treatmentChecklist: normalizeChecklistItems(savedChecklist),
  };
};

const getConsultationCareWindow = (consultation) => {
  if (!consultation) {
    return {
      appointmentId: null,
      appointmentDate: null,
      followUpDate: null,
    };
  }

  const appointment = consultation.appointment;
  const appointmentId = appointment?._id || appointment || null;
  const appointmentDate = appointment?.date || consultation.date || consultation.createdAt || null;
  const followUpDate = consultation.treatment?.followUp || appointment?.followUpDate || null;

  return {
    appointmentId,
    appointmentDate,
    followUpDate,
  };
};

const getDateOnly = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const getAssignedPatientQuery = (caregiver) => ({
  $or: [
    { assignedCaregivers: caregiver._id },
    { _id: { $in: caregiver.assignedPatients || [] } }
  ]
});

const ensureCaregiverProfile = async (user) => {
  let caregiver = await Caregiver.findOne({ user: user._id });

  if (!caregiver) {
    caregiver = await Caregiver.create({
      user: user._id,
      qualification: 'Care Assistant',
      experience: 0,
      availability: 'on-call',
      hourlyRate: 0,
      servicesOffered: ['personal care', 'medication assistance'],
    });
  }

  return caregiver;
};

const getAllCaregivers = async (req, res, next) => {
  try {
    const caregiverUsers = await User.find({ role: 'caregiver', isActive: { $ne: false } });
    await Promise.all(caregiverUsers.map(ensureCaregiverProfile));

    const caregivers = await Caregiver.find({})
      .populate('user', 'name email phoneNumber profilePicture')
      .select('user qualification experience servicesOffered availability hourlyRate rating totalReviews bio assignedPatients isVerified')
      .sort({ rating: -1, createdAt: -1 });

    return successResponse(res, caregivers);
  } catch (error) {
    next(error);
  }
};

const getCaregiverProfile = async (req, res, next) => {
  try {
    await ensureCaregiverProfile(req.user);

    const caregiver = await Caregiver.findOne({ user: req.user._id })
      .populate('user', '-passwordHash')
      .populate('assignedPatients', 'user dateOfBirth gender');

    if (!caregiver) {
      return errorResponse(res, 'Caregiver profile not found', 404);
    }

    return successResponse(res, caregiver);
  } catch (error) {
    next(error);
  }
};

const updateCaregiverProfile = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    return successResponse(res, caregiver, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignedPatients = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);
    
    const patientIds = [
      ...new Set([
        ...(caregiver.assignedPatients || []).map(id => String(id)),
      ])
    ];

    const patients = await Patient.find({
      $or: [
        { assignedCaregivers: caregiver._id },
        { _id: { $in: patientIds } }
      ]
    })
      .populate('user', 'name email phoneNumber')
      .populate({ path: 'primaryDoctor', select: 'specialization', populate: { path: 'user', select: 'name email phoneNumber' } });

    return successResponse(res, patients);
  } catch (error) {
    next(error);
  }
};

const getPatientDetails = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);

    const patient = await Patient.findOne({
      _id: patientId,
      $or: [
        { assignedCaregivers: caregiver._id },
        { _id: { $in: caregiver.assignedPatients || [] } }
      ]
    })
      .populate('user', 'name email phoneNumber')
      .populate({
        path: 'primaryDoctor',
        select: 'specialization consultationFee department isVerified',
        populate: { path: 'user', select: 'name email phoneNumber' }
      })
      .populate({
        path: 'assignedCaregivers',
        select: 'qualification availability',
        populate: { path: 'user', select: 'name email phoneNumber' }
      });

    if (!patient) {
      return errorResponse(res, 'Patient not found or not assigned to you', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLog = await CaregiverLog.findOne({
      caregiver: caregiver._id,
      patient: patientId,
      date: { $gte: today }
    });

    const pendingReminders = await MedicationReminder.find({
      patient: patientId,
      status: 'pending',
      scheduledTime: { $gte: new Date() }
    })
      .populate('medication')
      .sort('scheduledTime')
      .limit(10);

    const recentMedications = await Medication.find({ patient: patientId })
      .populate({ path: 'doctor', select: 'specialization', populate: { path: 'user', select: 'name email phoneNumber' } })
      .sort({ updatedAt: -1, prescribedDate: -1, createdAt: -1 })
      .limit(10);

    const recentAppointments = await Appointment.find({ patient: patientId })
      .populate({
        path: 'doctor',
        select: 'specialization rating totalReviews isVerified consultationFee department',
        populate: { path: 'user', select: 'name email phoneNumber' }
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    const recentConsultations = await Consultation.find({ patient: patientId })
      .populate({
        path: 'doctor',
        select: 'specialization consultationFee department isVerified',
        populate: { path: 'user', select: 'name email phoneNumber' }
      })
      .populate('prescriptions', 'name medicationName dosage frequency instructions notes')
      .sort({ updatedAt: -1, date: -1, createdAt: -1 })
      .limit(10);

    const latestVitals = await Vitals.findOne({ patient: patientId })
      .populate('recordedBy', 'name email')
      .sort({ recordedAt: -1, createdAt: -1 });

    const recentLogs = await CaregiverLog.find({ patient: patientId })
      .populate({
        path: 'caregiver',
        select: 'qualification availability',
        populate: { path: 'user', select: 'name email phoneNumber' }
      })
      .sort({ date: -1, updatedAt: -1, createdAt: -1 })
      .limit(10);

    return successResponse(res, {
      patient,
      todayLog,
      pendingReminders,
      recentMedications,
      recentAppointments,
      recentConsultations,
      latestVitals,
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

const createCaregiverLog = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);

    const isAssigned = await Patient.exists({
      _id: patientId,
      $or: [
        { assignedCaregivers: caregiver._id },
        { _id: { $in: caregiver.assignedPatients || [] } }
      ]
    });

    if (!isAssigned) {
      return errorResponse(res, 'Patient not assigned to you', 403);
    }

    const requestedDate = getDateOnly(req.body.date) || getDateOnly(new Date());
    const nextDate = addDays(requestedDate, 1);

    const submittedTasks = getSubmittedChecklist(req.body);

    let log = await CaregiverLog.findOne({
      caregiver: caregiver._id,
      patient: patientId,
      date: { $gte: requestedDate, $lt: nextDate }
    });

    if (log) {
      if (Array.isArray(submittedTasks)) {
        log.treatmentChecklist = normalizeChecklistItems(submittedTasks);
      }
      if (typeof req.body.observations === 'string') {
        log.observations = req.body.observations;
      }
      if (req.body.checkOutTime) {
        log.checkOutTime = new Date(req.body.checkOutTime);
        const checkIn = log.checkInTime ? new Date(log.checkInTime) : new Date();
        log.totalHours = Math.max((log.checkOutTime - checkIn) / (1000 * 60 * 60), 0);
      }
      await log.save();

      return successResponse(res, withTreatmentChecklist(log), 'Caregiver log updated successfully');
    }

    const latestConsultation = await Consultation.findOne({
      patient: patientId,
      status: 'completed',
    }).sort({ updatedAt: -1, date: -1, createdAt: -1 });

    const checkInTime = new Date();
    const checkOutTime = req.body.checkOutTime ? new Date(req.body.checkOutTime) : null;

    log = await CaregiverLog.create({
      date: requestedDate,
      observations: req.body.observations || '',
      treatmentChecklist: Array.isArray(submittedTasks) && submittedTasks.length > 0
        ? normalizeChecklistItems(submittedTasks)
        : buildTreatmentChecklist(latestConsultation, []),
      caregiver: caregiver._id,
      patient: patientId,
      checkInTime,
      ...(checkOutTime ? {
        checkOutTime,
        totalHours: Math.max((checkOutTime - checkInTime) / (1000 * 60 * 60), 0),
      } : {})
    });

    return successResponse(res, withTreatmentChecklist(log), 'Caregiver log created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateCaregiverLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);

    const updates = { ...req.body };
    const submittedTasks = getSubmittedChecklist(req.body);
    delete updates.tasks;
    delete updates.treatmentChecklist;

    if (Array.isArray(submittedTasks)) {
      updates.treatmentChecklist = normalizeChecklistItems(submittedTasks);
    }

    const log = await CaregiverLog.findOneAndUpdate(
      { _id: logId, caregiver: caregiver._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!log) {
      return errorResponse(res, 'Log not found', 404);
    }

    if (req.body.checkOutTime) {
      const checkIn = new Date(log.checkInTime);
      const checkOut = new Date(req.body.checkOutTime);
      log.totalHours = (checkOut - checkIn) / (1000 * 60 * 60);
      await log.save();
    }

    const medicationItems = (updates.treatmentChecklist || []).filter((item) => item.type === 'medication' && item.sourceId);
    await Promise.all(medicationItems.map(async (item) => {
      const reminderId = String(item.sourceId).replace(/^reminder-/, '');
      const reminder = await MedicationReminder.findById(reminderId);
      if (!reminder) return;

      if (item.completed) {
        reminder.status = 'taken';
        reminder.actualTime = item.time ? new Date(item.time) : new Date();
        reminder.takenBy = req.user._id;
        reminder.notes = item.notes || reminder.notes;
      }

      await reminder.save();
    }));

    return successResponse(res, withTreatmentChecklist(log), 'Log updated successfully');
  } catch (error) {
    next(error);
  }
};

const getTodayLogs = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignedPatients = await Patient.find(getAssignedPatientQuery(caregiver))
      .populate('user', 'name email phoneNumber')
      .sort({ updatedAt: -1, createdAt: -1 });

    const assignedPatientIds = assignedPatients.map((patient) => patient._id);

    const existingLogs = await CaregiverLog.find({
      caregiver: caregiver._id,
      patient: { $in: assignedPatientIds },
      date: { $gte: today }
    }).lean();

    const existingPatientIds = new Set(existingLogs.map((log) => String(log.patient)));

    const latestConsultations = await Consultation.find({
      patient: { $in: assignedPatientIds },
      status: 'completed',
    })
      .populate('appointment', 'date timeSlot status type reason followUpDate')
      .populate('prescriptions', 'name medicationName dosage frequency')
      .sort({ updatedAt: -1, date: -1, createdAt: -1 })
      .lean();

    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const reminders = await MedicationReminder.find({
      patient: { $in: assignedPatientIds },
      scheduledTime: { $gte: today, $lt: todayEnd },
      status: { $in: ['pending', 'taken', 'missed', 'skipped'] },
    })
      .populate('medication')
      .sort({ scheduledTime: -1 })
      .lean();

    const remindersByPatientId = reminders.reduce((acc, reminder) => {
      const patientId = String(reminder.patient);
      if (!acc[patientId]) acc[patientId] = [];
      acc[patientId].push(reminder);
      return acc;
    }, {});

    const consultationByPatientId = latestConsultations.reduce((acc, consultation) => {
      const patientId = String(consultation.patient);
      if (!acc[patientId]) acc[patientId] = consultation;
      return acc;
    }, {});

    const careWindows = latestConsultations
      .map(getConsultationCareWindow)
      .filter((window) => window.appointmentDate);
    const careStartDates = careWindows
      .map((window) => getDateOnly(window.appointmentDate))
      .filter(Boolean);
    const careEndDates = careWindows
      .map((window) => getDateOnly(window.followUpDate || window.appointmentDate))
      .filter(Boolean);
    const logWindowStart = careStartDates.length
      ? new Date(Math.min(...careStartDates.map((date) => date.getTime())))
      : today;
    const logWindowEnd = careEndDates.length
      ? addDays(new Date(Math.max(...careEndDates.map((date) => date.getTime()))), 1)
      : todayEnd;

    const missingPatientIds = assignedPatients
      .filter((patient) => !existingPatientIds.has(String(patient._id)))
      .map((patient) => patient._id);

    if (missingPatientIds.length > 0) {
      const autoLogs = missingPatientIds.map((patientId) => ({
        caregiver: caregiver._id,
        patient: patientId,
        date: new Date(),
        checkInTime: new Date(),
        treatmentChecklist: buildPatientCareChecklist({
          consultation: consultationByPatientId[String(patientId)],
          reminders: remindersByPatientId[String(patientId)] || [],
          existingTasks: [],
        }),
        observations: '',
      }));

      if (autoLogs.length > 0) {
        await CaregiverLog.insertMany(autoLogs);
      }
    }

    const logs = await CaregiverLog.find({
      caregiver: caregiver._id,
      date: { $gte: logWindowStart, $lt: logWindowEnd }
    })
      .populate({ path: 'patient', select: 'user', populate: { path: 'user', select: 'name email phoneNumber' } })
      .sort({ date: -1, updatedAt: -1, createdAt: -1 });

    const enrichedLogs = logs.map((log) => {
      const plainLog = typeof log.toObject === 'function' ? log.toObject() : log;
      const consultation = consultationByPatientId[String(log.patient?._id || log.patient)];
      const patientReminders = remindersByPatientId[String(log.patient?._id || log.patient)] || [];
      const careWindow = getConsultationCareWindow(consultation);
      return {
        ...plainLog,
        careWindow,
        treatmentChecklist: buildPatientCareChecklist({
          consultation,
          reminders: patientReminders,
          existingTasks: plainLog.treatmentChecklist || plainLog.tasks || [],
        }),
      };
    });

    return successResponse(res, enrichedLogs);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);

    const patients = await Patient.find({
      $or: [
        { assignedCaregivers: caregiver._id },
        { _id: { $in: caregiver.assignedPatients || [] } }
      ]
    }).populate('user', 'name email phoneNumber');

    const patientIds = patients.map(patient => patient._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await CaregiverLog.find({
      caregiver: caregiver._id,
      patient: { $in: patientIds },
      date: { $gte: today }
    });

    const loggedPatientIds = new Set(logs.map(log => String(log.patient)));

    const reminders = await MedicationReminder.find({
      patient: { $in: patientIds },
      status: 'pending'
    }).populate('medication').populate({ path: 'patient', populate: { path: 'user', select: 'name email phoneNumber' } });

    const recentConsultations = await Consultation.find({
      patient: { $in: patientIds },
      status: 'completed',
    })
      .populate('appointment', 'date timeSlot status type reason followUpDate')
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phoneNumber' } })
      .populate({
        path: 'doctor',
        select: 'specialization department',
        populate: { path: 'user', select: 'name email phoneNumber' }
      })
      .populate('prescriptions', 'name medicationName dosage frequency')
      .sort({ updatedAt: -1, date: -1, createdAt: -1 })
      .limit(20);

    const latestConsultationByPatientId = recentConsultations.reduce((acc, consultation) => {
      const patientId = String(consultation.patient?._id || consultation.patient);
      if (!acc[patientId]) acc[patientId] = consultation;
      return acc;
    }, {});

    const logTasks = patients
      .filter(patient => !loggedPatientIds.has(String(patient._id)))
      .map(patient => {
        const consultation = latestConsultationByPatientId[String(patient._id)];
        const careWindow = getConsultationCareWindow(consultation);

        return {
          _id: `daily-log-${patient._id}`,
          type: 'daily_log',
          title: `Create daily care log for ${patient.user?.name || 'Patient'}`,
          patient,
          patientId: patient._id,
          priority: 'normal',
          completed: false,
          appointmentId: careWindow.appointmentId,
          appointmentDate: careWindow.appointmentDate,
          followUpDate: careWindow.followUpDate,
        };
      });

    const medicationTasks = reminders.map(reminder => ({
      _id: reminder._id,
      type: 'medication',
      title: `Give ${reminder.medication?.name || 'Medication'}${reminder.medication?.dosage ? ` (${reminder.medication.dosage})` : ''}`,
      patient: reminder.patient,
      patientId: reminder.patient?._id || reminder.patient,
      dueTime: reminder.scheduledTime,
      priority: new Date(reminder.scheduledTime) < new Date() ? 'high' : 'normal',
      completed: false
    }));

    const consultationTasks = recentConsultations.flatMap((consultation) => {
      const patient = consultation.patient;
      const doctorName = consultation.doctor?.user?.name || consultation.doctor?.name || 'Doctor';
      const careWindow = getConsultationCareWindow(consultation);
      const diagnosis = typeof consultation.diagnosis === 'string'
        ? consultation.diagnosis
        : [
            consultation.diagnosis?.primary,
            ...(consultation.diagnosis?.secondary || []),
          ].filter(Boolean).join(', ');
      const treatmentSteps = buildTreatmentChecklist(consultation, []);
      const medicationNames = (consultation.prescriptions || [])
        .map((item) => item?.name || item?.medicationName)
        .filter(Boolean);

      const tasks = [];

      if (consultation.treatment?.followUp) {
        const followUpDate = new Date(consultation.treatment.followUp);
        tasks.push({
          _id: `consultation-followup-${consultation._id}`,
          type: 'consultation_follow_up',
          title: `Prepare ${patient?.user?.name || 'patient'} for follow-up with Dr. ${doctorName}`,
          patient,
          patientId: patient?._id || consultation.patient,
          doctor: consultation.doctor,
          dueTime: followUpDate,
          priority: followUpDate < new Date() ? 'high' : 'normal',
          completed: false,
          source: 'consultation',
          sourceLabel: 'Doctor follow-up plan',
          appointmentId: careWindow.appointmentId,
          appointmentDate: careWindow.appointmentDate,
          followUpDate: careWindow.followUpDate,
          details: [
            diagnosis ? `Diagnosis: ${diagnosis}` : '',
            treatmentSteps.length ? `Plan: ${treatmentSteps.map((item) => item.task).join(', ')}` : '',
          ].filter(Boolean).join(' | '),
          createdAt: consultation.updatedAt || consultation.createdAt,
        });
      }

      if (treatmentSteps.length > 0) {
        treatmentSteps.forEach((step, index) => {
          tasks.push({
            _id: `consultation-care-${consultation._id}-${index}`,
            type: 'consultation_care_plan',
            title: step.task,
            patient,
            patientId: patient?._id || consultation.patient,
            doctor: consultation.doctor,
            dueTime: consultation.updatedAt || consultation.createdAt,
            priority: consultation.notes ? 'high' : 'normal',
            completed: false,
            source: 'consultation',
            sourceLabel: 'Doctor treatment instruction',
            appointmentId: careWindow.appointmentId,
            appointmentDate: careWindow.appointmentDate,
            followUpDate: careWindow.followUpDate,
            details: [
              diagnosis ? `Diagnosis: ${diagnosis}` : '',
              consultation.notes ? `Notes: ${consultation.notes}` : '',
            ].filter(Boolean).join(' | '),
            createdAt: consultation.updatedAt || consultation.createdAt,
          });
        });
      }

      if (medicationNames.length > 0) {
        tasks.push({
          _id: `consultation-medications-${consultation._id}`,
          type: 'consultation_medication_monitoring',
          title: `Monitor prescribed medications for ${patient?.user?.name || 'patient'}`,
          patient,
          patientId: patient?._id || consultation.patient,
          doctor: consultation.doctor,
          dueTime: consultation.updatedAt || consultation.createdAt,
          priority: 'normal',
          completed: false,
          source: 'consultation',
          sourceLabel: 'Doctor prescription summary',
          appointmentId: careWindow.appointmentId,
          appointmentDate: careWindow.appointmentDate,
          followUpDate: careWindow.followUpDate,
          details: `Medications: ${medicationNames.join(', ')}`,
          createdAt: consultation.updatedAt || consultation.createdAt,
        });
      }

      return tasks;
    });
    const allTasks = [...medicationTasks, ...consultationTasks, ...logTasks]
      .sort((a, b) => new Date(b.dueTime || b.createdAt || 0) - new Date(a.dueTime || a.createdAt || 0));

    return successResponse(res, allTasks);
  } catch (error) {
    next(error);
  }
};

const getCaregiverStats = async (req, res, next) => {
  try {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) return errorResponse(res, 'Caregiver profile not found', 404);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const assignedPatientCount = await Patient.countDocuments({
      $or: [
        { assignedCaregivers: caregiver._id },
        { _id: { $in: caregiver.assignedPatients || [] } }
      ]
    });

    const stats = {
      totalPatients: assignedPatientCount,
      todayLogs: await CaregiverLog.countDocuments({
        caregiver: caregiver._id,
        date: { $gte: today }
      }),
      monthlyLogs: await CaregiverLog.countDocuments({
        caregiver: caregiver._id,
        date: { $gte: startOfMonth }
      }),
      pendingReminders: await MedicationReminder.countDocuments({
        patient: { $in: caregiver.assignedPatients || [] },
        status: 'pending'
      })
    };

    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

const administerMedication = async (req, res, next) => {
  try {
    const { reminderId } = req.params;
    const { status, notes } = req.body;

    const reminder = await MedicationReminder.findById(reminderId)
      .populate('medication');

    if (!reminder) {
      return errorResponse(res, 'Reminder not found', 404);
    }

    reminder.status = status;
    reminder.actualTime = new Date();
    reminder.takenBy = req.user._id;
    reminder.notes = notes;

    await reminder.save();

    // Update medication timing
    if (status === 'taken') {
      const medication = await Medication.findById(reminder.medication._id);
      const timing = medication.timing.find(t => t.time === reminder.scheduledTime.toTimeString().slice(0,5));
      if (timing) {
        timing.taken = true;
        await medication.save();
      }
    }

    return successResponse(res, reminder, 'Medication administered successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCaregivers,
  getCaregiverProfile,
  updateCaregiverProfile,
  getAssignedPatients,
  getPatientDetails,
  createCaregiverLog,
  updateCaregiverLog,
  getTodayLogs,
  getTasks,
  getCaregiverStats,
  administerMedication
};

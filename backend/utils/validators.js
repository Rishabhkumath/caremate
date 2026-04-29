const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const registerValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'caregiver']).withMessage('Invalid role'),
  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  validate
];

const loginValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

const createVitalsValidator = [
  body('bloodPressure.systolic')
    .optional()
    .isInt({ min: 70, max: 200 }).withMessage('Systolic pressure must be between 70 and 200'),
  body('bloodPressure.diastolic')
    .optional()
    .isInt({ min: 40, max: 130 }).withMessage('Diastolic pressure must be between 40 and 130'),
  body('heartRate.value')
    .optional()
    .isInt({ min: 40, max: 200 }).withMessage('Heart rate must be between 40 and 200'),
  body('temperature.value')
    .optional()
    .isFloat({ min: 95, max: 107 }).withMessage('Temperature must be between 95°F and 107°F')
    .custom((value, { req }) => {
      if (req.body.temperature?.unit === 'celsius') {
        return value >= 35 && value <= 42;
      }
      return true;
    }).withMessage('Temperature must be between 35°C and 42°C'),
  body('oxygenSaturation.value')
    .optional()
    .isInt({ min: 70, max: 100 }).withMessage('Oxygen saturation must be between 70 and 100'),
  body('bloodSugar.value')
    .optional()
    .isInt({ min: 20, max: 600 }).withMessage('Blood sugar must be between 20 and 600'),
  validate
];

const createAppointmentValidator = [
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required')
    .isMongoId().withMessage('Invalid doctor ID'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom(value => {
      const appointmentDate = new Date(value);
      const now = new Date();
      if (appointmentDate < now) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('timeSlot.startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('timeSlot.endTime')
    .notEmpty().withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
    .custom((value, { req }) => {
      if (value <= req.body.timeSlot.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('type')
    .isIn(['in-person', 'video', 'phone']).withMessage('Invalid appointment type'),
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  validate
];

const createMedicationValidator = [
  body('name')
    .notEmpty().withMessage('Medication name is required')
    .isLength({ max: 100 }).withMessage('Medication name cannot exceed 100 characters'),
  body('dosage')
    .notEmpty().withMessage('Dosage is required'),
  body('frequency')
    .notEmpty().withMessage('Frequency is required')
    .isIn(['once', 'twice', 'thrice', 'four times', 'every 4 hours', 'every 6 hours', 'every 8 hours', 'as needed'])
    .withMessage('Invalid frequency'),
  body('duration.startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  body('duration.endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date')
    .custom((value, { req }) => {
      if (req.body.duration?.startDate && value < req.body.duration.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('instructions')
    .optional()
    .isLength({ max: 500 }).withMessage('Instructions cannot exceed 500 characters'),
  validate
];

const objectIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  createVitalsValidator,
  createAppointmentValidator,
  createMedicationValidator,
  objectIdValidator,
  paginationValidator
};
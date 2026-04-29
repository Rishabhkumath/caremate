const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  CAREGIVER: 'caregiver',
  ADMIN: 'admin'
};

const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  MEDICATION_REMINDER: 'medication_reminder',
  VITALS_ALERT: 'vitals_alert',
  MESSAGE: 'message',
  SYSTEM: 'system',
  CAREGIVER_LOG: 'caregiver_log',
  CONSULTATION: 'consultation'
};

const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

const APPOINTMENT_TYPES = {
  IN_PERSON: 'in-person',
  VIDEO: 'video',
  PHONE: 'phone'
};

const MEDICATION_FREQUENCY = {
  ONCE: 'once',
  TWICE: 'twice',
  THRICE: 'thrice',
  FOUR_TIMES: 'four times',
  EVERY_4_HOURS: 'every 4 hours',
  EVERY_6_HOURS: 'every 6 hours',
  EVERY_8_HOURS: 'every 8 hours',
  AS_NEEDED: 'as needed'
};

const MEDICATION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISCONTINUED: 'discontinued'
};

const REMINDER_STATUS = {
  PENDING: 'pending',
  TAKEN: 'taken',
  MISSED: 'missed',
  SKIPPED: 'skipped'
};

const VITALS_ALERT_THRESHOLDS = {
  BLOOD_PRESSURE: {
    SYSTOLIC_HIGH: 140,
    SYSTOLIC_LOW: 90,
    DIASTOLIC_HIGH: 90,
    DIASTOLIC_LOW: 60
  },
  HEART_RATE: {
    HIGH: 100,
    LOW: 60
  },
  TEMPERATURE: {
    CELSIUS_HIGH: 38,
    CELSIUS_LOW: 36,
    FAHRENHEIT_HIGH: 100.4,
    FAHRENHEIT_LOW: 96.8
  },
  OXYGEN_SATURATION: {
    LOW: 95
  }
};

const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const CAREGIVER_SERVICES = {
  PERSONAL_CARE: 'personal care',
  MEDICATION_ASSISTANCE: 'medication assistance',
  COMPANIONSHIP: 'companionship',
  MEAL_PREPARATION: 'meal preparation',
  TRANSPORTATION: 'transportation',
  HOUSEKEEPING: 'housekeeping'
};

const CAREGIVER_AVAILABILITY = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  WEEKENDS: 'weekends',
  ON_CALL: 'on-call'
};

const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const CONSULTATION_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  FOLLOW_UP: 'follow-up'
};

const BACKGROUND_CHECK_STATUS = {
  PENDING: 'pending',
  CLEARED: 'cleared',
  FAILED: 'failed'
};

const MOOD_TYPES = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  NORMAL: 'normal',
  LOW: 'low',
  DEPRESSED: 'depressed'
};

const API_MESSAGES = {
  // Auth messages
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Invalid email or password',
  REGISTER_SUCCESS: 'Registration successful',
  REGISTER_FAILED: 'Registration failed',
  LOGOUT_SUCCESS: 'Logged out successfully',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access denied',
  
  // User messages
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists',
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_NOT_FOUND: 'Profile not found',
  
  // Appointment messages
  APPOINTMENT_CREATED: 'Appointment created successfully',
  APPOINTMENT_UPDATED: 'Appointment updated successfully',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully',
  APPOINTMENT_NOT_FOUND: 'Appointment not found',
  SLOT_NOT_AVAILABLE: 'Time slot not available',
  
  // Medication messages
  MEDICATION_CREATED: 'Medication created successfully',
  MEDICATION_UPDATED: 'Medication updated successfully',
  MEDICATION_DELETED: 'Medication deleted successfully',
  MEDICATION_NOT_FOUND: 'Medication not found',
  
  // Vitals messages
  VITALS_RECORDED: 'Vitals recorded successfully',
  VITALS_UPDATED: 'Vitals updated successfully',
  VITALS_DELETED: 'Vitals record deleted',
  VITALS_NOT_FOUND: 'Vitals record not found',
  ABNORMAL_VITALS_DETECTED: 'Abnormal vitals detected',
  
  // Consultation messages
  CONSULTATION_STARTED: 'Consultation started',
  CONSULTATION_COMPLETED: 'Consultation completed',
  CONSULTATION_UPDATED: 'Consultation updated',
  CONSULTATION_NOT_FOUND: 'Consultation not found',
  
  // Caregiver messages
  LOG_CREATED: 'Caregiver log created successfully',
  LOG_UPDATED: 'Caregiver log updated successfully',
  LOG_NOT_FOUND: 'Caregiver log not found',
  
  // Validation messages
  VALIDATION_ERROR: 'Validation error',
  INVALID_ID: 'Invalid ID format',
  
  // Server messages
  SERVER_ERROR: 'Server error',
  ROUTE_NOT_FOUND: 'Route not found',
  DATABASE_ERROR: 'Database connection error'
};

module.exports = {
  ROLES,
  NOTIFICATION_TYPES,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  MEDICATION_FREQUENCY,
  MEDICATION_STATUS,
  REMINDER_STATUS,
  VITALS_ALERT_THRESHOLDS,
  GENDERS,
  BLOOD_GROUPS,
  DAYS_OF_WEEK,
  CAREGIVER_SERVICES,
  CAREGIVER_AVAILABILITY,
  NOTIFICATION_PRIORITY,
  CONSULTATION_STATUS,
  BACKGROUND_CHECK_STATUS,
  MOOD_TYPES,
  API_MESSAGES
};
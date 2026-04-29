export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  CAREGIVER: 'caregiver',
  ADMIN: 'admin',
}

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const APPOINTMENT_STATUS_COLORS = {
  pending: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/20' },
  confirmed: { bg: 'bg-teal-400/10', text: 'text-teal-400', border: 'border-teal-400/20' },
  cancelled: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/20' },
  completed: { bg: 'bg-slate-400/10', text: 'text-slate-400', border: 'border-slate-400/20' },
}

export const MEDICATION_FREQUENCY = [
  { value: 'once', label: 'Once Daily' },
  { value: 'twice', label: 'Twice Daily' },
  { value: 'thrice', label: 'Three Times Daily' },
  { value: 'four times', label: 'Four Times Daily' },
  { value: 'every 4 hours', label: 'Every 4 Hours' },
  { value: 'every 6 hours', label: 'Every 6 Hours' },
  { value: 'every 8 hours', label: 'Every 8 Hours' },
  { value: 'as needed', label: 'As Needed' },
]

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'Geriatrics', 'Hematology',
  'Internal Medicine', 'Nephrology', 'Neurology', 'Obstetrics & Gynecology',
  'Oncology', 'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Surgery', 'Urology',
]

export const CHART_COLORS = {
  teal: '#14b8a6',
  mint: '#34d399',
  blue: '#60a5fa',
  red: '#f87171',
  yellow: '#fbbf24',
  purple: '#c084fc',
}

export const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  MEDICATION: 'medication',
  VITALS: 'vitals',
  SYSTEM: 'system',
  MESSAGE: 'message',
}

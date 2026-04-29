const mongoose = require('mongoose')

const vitalsSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bloodPressure: {
    systolic:  Number,
    diastolic: Number,
    unit: { type: String, default: 'mmHg' },
  },
  heartRate: {
    value: Number,
    unit:  { type: String, default: 'bpm' },
  },
  temperature: {
    value: Number,
    unit:  {
      type:    String,
      enum:    ['celsius', 'fahrenheit'],
      default: 'fahrenheit',        // frontend sends Fahrenheit
    },
  },
  oxygenSaturation: {
    value: Number,
    unit:  { type: String, default: '%' },
  },
  respiratoryRate: {
    value: Number,
    unit:  { type: String, default: 'breaths/min' },
  },
  bloodSugar: {
    value: Number,
    readingType: {
      type: String,
      enum: ['fasting', 'postprandial', 'random'],
      default: 'random',
    },
    unit: { type: String, default: 'mg/dL' },
  },
  weight: {
    value: Number,
    unit:  { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  },
  height: {
    value: Number,
    unit:  { type: String, enum: ['cm', 'inches'], default: 'cm' },
  },
  bmi:       Number,
  painLevel: { type: Number, min: 0, max: 10 },
  notes:     String,
  recordedAt: { type: Date, default: Date.now },
  isAbnormal: { type: Boolean, default: false },
  alerts:     [String],
}, { timestamps: true })

// Auto-detect abnormal vitals and compute BMI
vitalsSchema.pre('save', function (next) {
  // BMI
  if (this.weight?.value && this.height?.value) {
    let heightM = this.height.value
    if (this.height.unit === 'cm') heightM /= 100
    this.bmi = parseFloat((this.weight.value / (heightM * heightM)).toFixed(1))
  }

  const alerts = []

  // Blood pressure
  if (this.bloodPressure?.systolic != null && this.bloodPressure?.diastolic != null) {
    if (this.bloodPressure.systolic > 140 || this.bloodPressure.diastolic > 90)
      alerts.push('High blood pressure')
    if (this.bloodPressure.systolic < 90 || this.bloodPressure.diastolic < 60)
      alerts.push('Low blood pressure')
  }

  // Heart rate
  if (this.heartRate?.value != null) {
    if (this.heartRate.value > 100) alerts.push('High heart rate (Tachycardia)')
    if (this.heartRate.value < 60)  alerts.push('Low heart rate (Bradycardia)')
  }

  // Oxygen saturation
  if (this.oxygenSaturation?.value != null && this.oxygenSaturation.value < 95)
    alerts.push('Low oxygen saturation')

  // Temperature — normalise to Celsius for comparison
  if (this.temperature?.value != null) {
    let tempC = this.temperature.value
    if (this.temperature.unit === 'fahrenheit') tempC = (tempC - 32) * 5 / 9
    if (tempC > 38)   alerts.push('Fever')
    if (tempC < 36)   alerts.push('Low body temperature')
  }

  // Blood sugar
  if (this.bloodSugar?.value != null) {
    if (this.bloodSugar.value > 180) alerts.push('High blood sugar')
    if (this.bloodSugar.value < 70)  alerts.push('Low blood sugar (Hypoglycemia)')
  }

  this.alerts     = alerts
  this.isAbnormal = alerts.length > 0
  next()
})

module.exports = mongoose.model('Vitals', vitalsSchema)
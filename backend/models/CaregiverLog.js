const mongoose = require('mongoose');

const caregiverLogSchema = new mongoose.Schema({
  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  tasks: [mongoose.Schema.Types.Mixed],
  treatmentChecklist: [{
    task: String,
    type: String,
    sourceId: String,
    sourceLabel: String,
    scheduledTime: Date,
    completed: Boolean,
    time: String,
    notes: String
  }],
  medications: [{
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication'
    },
    administered: Boolean,
    time: String,
    dose: String,
    notes: String
  }],
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    bloodSugar: Number,
    oxygenLevel: Number,
    recordedAt: Date
  },
  meals: [{
    type: String,
    description: String,
    time: String,
    intake: String
  }],
  activities: [{
    activity: String,
    duration: Number,
    notes: String
  }],
  mood: {
    type: String,
    enum: ['excellent', 'good', 'normal', 'low', 'depressed']
  },
  observations: String,
  incidents: {
    occurred: Boolean,
    type: String,
    description: String,
    action: String
  },
  checkInTime: Date,
  checkOutTime: Date,
  totalHours: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('CaregiverLog', caregiverLogSchema);

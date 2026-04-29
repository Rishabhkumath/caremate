const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  name: {
    type: String,
    required: [true, 'Please add medication name']
  },
  dosage: {
    type: String,
    required: [true, 'Please add dosage']
  },
  frequency: {
    type: String,
    required: [true, 'Please add frequency'],
    enum: ['once', 'twice', 'thrice', 'four times', 'every 4 hours', 'every 6 hours', 'every 8 hours', 'as needed']
  },
  timing: [{
    time: String,
    taken: {
      type: Boolean,
      default: false
    }
  }],
  route: {
    type: String,
    enum: ['oral', 'topical', 'injection', 'inhalation', 'intravenous'],
    default: 'oral'
  },
  duration: {
    startDate: Date,
    endDate: Date
  },
  instructions: String,
  sideEffects: [String],
  prescribedDate: {
    type: Date,
    default: Date.now
  },
  refills: {
    total: Number,
    used: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active'
  },
  reminders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicationReminder'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Medication', medicationSchema);
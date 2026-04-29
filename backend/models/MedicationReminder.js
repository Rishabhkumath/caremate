const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  actualTime: Date,
  dose: String,
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped'],
    default: 'pending'
  },
  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  notificationSent: {
    type: Boolean,
    default: false
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);
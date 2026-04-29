const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['video', 'phone', 'in-person'],
    required: true
  },
  symptoms: [{
    symptom: String,
    duration: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],
  diagnosis: {
    primary: String,
    secondary: [String],
    notes: String
  },
  treatment: {
    plan: String,
    medications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication'
    }],
    procedures: [String],
    followUp: Date
  },
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication'
  }],
  vitals: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals'
  },
  labTests: [{
    test: String,
    ordered: Boolean,
    results: String,
    date: Date
  }],
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'follow-up'],
    default: 'ongoing'
  }
}, {
  timestamps: true
});

consultationSchema.index(
  { appointment: 1 },
  {
    unique: true,
    sparse: true,
  }
)

module.exports = mongoose.model('Consultation', consultationSchema);

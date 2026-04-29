const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify gender']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  height: Number,
  weight: Number,
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  primaryDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  assignedCaregivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver'
  }],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String,
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    }
  }],
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    validUntil: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
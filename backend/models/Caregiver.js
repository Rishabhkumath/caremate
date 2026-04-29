const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  qualification: {
    type: String,
    required: [true, 'Please add qualification']
  },
  experience: {
    type: Number,
    required: [true, 'Please add years of experience']
  },
  servicesOffered: [{
    type: String,
    enum: ['personal care', 'medication assistance', 'companionship', 'meal preparation', 'transportation', 'housekeeping']
  }],
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'weekends', 'on-call'],
    required: true
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date
  }],
  languages: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  backgroundCheck: {
    status: {
      type: String,
      enum: ['pending', 'cleared', 'failed'],
      default: 'pending'
    },
    completedDate: Date,
    reportUrl: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  bio: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Caregiver', caregiverSchema);
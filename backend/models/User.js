const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxLength: 100
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'caregiver'],
    required: true
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Only patient has this
  },
  linkedPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Only caregiver has this
  },
  pendingAlert: {
    type: Boolean,
    default: false
  },
  lastAlertText: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Avoid sending password hash in responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  audience: {
    type: String,
    enum: ['patient', 'caregiver'],
    required: true
  },
  category: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'caregiver_deescalation'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

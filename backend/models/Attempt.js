const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
  rootCause: String,
  reasoning: String,
  fix: String,
  actionsTaken: [{
    action: String,
    timestamp: Number
  }],
  hintsUsed: { type: Number, default: 0 },
  score: Number,
  sectionScores: {
    rootCause: Number,
    reasoning: Number,
    fix: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attempt', attemptSchema);

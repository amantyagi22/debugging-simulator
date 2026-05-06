const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  problemStatement: { type: String, required: true },
  actions: [{
    type: { type: String },
    label: String,
    response: String
  }],
  correctPath: [{ type: String }],
  hints: [{ type: String }],
  expectedRootCause: [{ type: String }],
  expectedReasoning: [{ type: String }],
  expectedFix: [{ type: String }],
  requiredActions: [{ type: String }],
  wrongConcepts: [{ type: String }]
});

module.exports = mongoose.model('Scenario', scenarioSchema);

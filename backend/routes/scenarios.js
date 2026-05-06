const express = require('express');
const router = express.Router();
const Scenario = require('../models/Scenario');

// GET /scenarios — list all scenarios (title + id only)
router.get('/', async (req, res) => {
  try {
    const scenarios = await Scenario.find({}, 'title problemStatement');
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET /scenarios/:id — full scenario details
router.get('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    // Don't expose expected keywords to the client
    const { 
      expectedRootCause, 
      expectedReasoning, 
      expectedFix, 
      requiredActions, 
      wrongConcepts, 
      correctPath,
      ...rest 
    } = scenario.toObject();
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

module.exports = router;

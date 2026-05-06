const express = require('express');
const router = express.Router();
const Scenario = require('../models/Scenario');
const Attempt = require('../models/Attempt');
const { GoogleGenAI } = require('@google/genai');
const fuzz = require('fuzzball');

function calculateSectionScore(answer, expectedKeywords = []) {
  if (!expectedKeywords || expectedKeywords.length === 0) return { score: 100, matched: [] };
  const lowerAnswer = (answer || '').toLowerCase();
  
  let matchedKeywords = [];
  expectedKeywords.forEach(kw => {
    if (fuzz.partial_ratio(kw.toLowerCase(), lowerAnswer) >= 75) {
      matchedKeywords.push(kw);
    }
  });

  const maxRequired = Math.min(2, expectedKeywords.length);
  const score = Math.min(100, (matchedKeywords.length / maxRequired) * 100);
  return { score, matched: matchedKeywords };
}

router.post('/', async (req, res) => {
  try {
    const { scenarioId, rootCause = '', reasoning = '', fix = '', hintsUsed = 0, actionsTaken = [] } = req.body;
    
    if (!scenarioId || !rootCause || !reasoning || !fix) {
      return res.status(400).json({ error: 'Missing structured diagnosis fields' });
    }

    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // 1. Calculate section scores individually
    const rcResult = calculateSectionScore(rootCause, scenario.expectedRootCause);
    const reasonResult = calculateSectionScore(reasoning, scenario.expectedReasoning);
    const fixResult = calculateSectionScore(fix, scenario.expectedFix);

    const sectionScores = {
      rootCause: Math.round(rcResult.score),
      reasoning: Math.round(reasonResult.score),
      fix: Math.round(fixResult.score)
    };

    let baseScore = (sectionScores.rootCause + sectionScores.reasoning + sectionScores.fix) / 3;

    // 2. Penalties & Bonuses (Thinking & Investigation)
    let penalties = [];
    let bonuses = [];
    let penaltyScore = hintsUsed * 10;
    if (hintsUsed > 0) penalties.push(`Hints used: -${hintsUsed * 10}`);

    // Missing actions
    const requiredActions = scenario.requiredActions || [];
    const actionTypes = actionsTaken.map(a => a.type || a.action);
    requiredActions.forEach(reqAction => {
      if (!actionTypes.includes(reqAction)) {
        penalties.push(`Skipped key step '${reqAction}': -10`);
        penaltyScore += 10;
      }
    });

    const correctPath = scenario.correctPath || [];
    let bonusScore = 0;
    if (correctPath.length > 0 && actionTypes.length > 0) {
      let isOptimal = true;
      for (let i = 0; i < correctPath.length; i++) {
        if (actionTypes[i] !== correctPath[i]) {
          isOptimal = false;
          break;
        }
      }
      if (isOptimal) {
        bonuses.push(`Followed optimal investigation path: +10 bonus`);
        bonusScore += 10;
      }
    }

    // Wrong concepts
    const combinedAnswer = `${rootCause} ${reasoning} ${fix}`.toLowerCase();
    const wrongConcepts = scenario.wrongConcepts || [];
    wrongConcepts.forEach(wc => {
      if (fuzz.partial_ratio(wc.toLowerCase(), combinedAnswer) >= 80) {
        penalties.push(`Identified wrong concept '${wc}': -15`);
        penaltyScore += 15;
      }
    });

    const finalScore = Math.min(100, Math.max(0, baseScore - penaltyScore + bonusScore));

    // 3. AI Coaching Feedback
    let feedback = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are an expert debugging mentor evaluating a junior engineer.
Scenario: "${scenario.title}" - ${scenario.problemStatement}

User's Structured Diagnosis:
- Root Cause: "${rootCause}" (Score: ${sectionScores.rootCause}/100)
- Reasoning: "${reasoning}" (Score: ${sectionScores.reasoning}/100)
- Fix: "${fix}" (Score: ${sectionScores.fix}/100)

Actions Taken During Investigation: ${actionTypes.join(', ')}
Penalties Applied: ${penalties.join(', ') || 'None'}

Final Score: ${Math.round(finalScore)}/100

Write 2-4 sentences of coaching feedback.
- Point out what they got right.
- Point out what concepts they missed in their reasoning or fix.
- Mention their investigation behavior (e.g., if they skipped checking the DB indexes or jumped to conclusions).
- DO NOT just recite their score. Make it sound like a senior dev giving code review feedback.`;
        
        let response;
        try {
          response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });
        } catch (primaryError) {
          console.log("Primary model failed (likely high demand), attempting fallback to gemini-2.0-flash...");
          response = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: prompt
          });
        }
        
        feedback = response.text;
      } catch (e) {
        console.error("AI Error:", e);
        feedback = 'Google AI is currently experiencing very high global demand and timed out. Your scores above are accurate, though!';
      }
    } else {
      feedback = 'Configure GEMINI_API_KEY for dynamic AI coaching.';
    }

    // 4. Save Attempt
    const attempt = new Attempt({
      scenarioId,
      rootCause,
      reasoning,
      fix,
      actionsTaken,
      hintsUsed,
      score: Math.round(finalScore),
      sectionScores
    });
    await attempt.save();

    res.json({
      score: Math.round(finalScore),
      sectionScores,
      penalties,
      bonuses,
      feedback
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

module.exports = router;

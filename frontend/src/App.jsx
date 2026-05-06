import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  
  // Investigation state
  const [activeAction, setActiveAction] = useState('logs');
  const [actionsTaken, setActionsTaken] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  // Diagnosis state
  const [rootCause, setRootCause] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [fix, setFix] = useState('');
  
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/scenarios`)
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(err => console.error('Error fetching scenarios:', err));
  }, []);

  const loadScenario = (id) => {
    fetch(`${API_URL}/scenarios/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Scenario not found. Please refresh the page to get the latest scenarios.');
          return;
        }
        setActiveScenario(data);
        setResult(null);
        setRootCause('');
        setReasoning('');
        setFix('');
        setHintsUsed(0);
        setActionsTaken([]);
        setActiveAction(null);
      })
      .catch(err => console.error('Error fetching scenario:', err));
  };

  const handleActionClick = (actionKey, actionLabel) => {
    setActiveAction(actionKey);
    // Record action if not already recorded
    if (!actionsTaken.find(a => a.type === actionKey)) {
      setActionsTaken([...actionsTaken, { type: actionKey, action: actionLabel, timestamp: Date.now() }]);
    }
  };

  const submitDiagnosis = () => {
    setIsSubmitting(true);
    setResult(null);

    setTimeout(() => {
      fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenarioId: activeScenario._id, 
          rootCause, 
          reasoning, 
          fix,
          hintsUsed,
          actionsTaken 
        })
      })
        .then(res => res.json())
        .then(data => {
          setResult(data);
          setIsSubmitting(false);
        })
        .catch(err => {
          console.error('Error submitting diagnosis:', err);
          setIsSubmitting(false);
        });
    }, 1500);
  };

  // Log rendering with syntax highlighting
  const renderFormattedLogs = (logs) => {
    if (!logs) return '';
    return logs.split('\n').map((line, index) => {
      let lineClass = 'log-line';
      if (line.includes('[ERROR]') || line.includes('FATAL')) lineClass += ' log-error';
      else if (line.includes('[WARN]')) lineClass += ' log-warn';
      else if (line.includes('[INFO]')) lineClass += ' log-info';
      
      return (
        <div key={index} className={lineClass}>
          {line}
        </div>
      );
    });
  };

  if (!activeScenario) {
    return (
      <div className="container">
        <header className="header">
          <h1>Debugging Simulator</h1>
          <p>Select a scenario to start debugging.</p>
        </header>
        <div className="scenario-list">
          {scenarios.map(scen => (
            <div key={scen._id} className="scenario-card" onClick={() => loadScenario(scen._id)}>
              <h2>{scen.title}</h2>
              <p>{scen.problemStatement}</p>
            </div>
          ))}
          {scenarios.length === 0 && <p>No scenarios found. Have you seeded the database?</p>}
        </div>
      </div>
    );
  }

  const actions = activeScenario.actions || [];
  const currentAction = actions.find(a => a.type === activeAction);

  return (
    <div className="container">
      <header className="header">
        <h1>{activeScenario.title}</h1>
        <button className="back-btn" onClick={() => setActiveScenario(null)}>← Back to list</button>
      </header>
      
      <div className="workspace">
        <div className="problem-panel">
          <h3>Problem Statement</h3>
          <p>{activeScenario.problemStatement}</p>
          
          <div className="hints">
            <h4>Hints available: {activeScenario.hints?.length - hintsUsed}</h4>
            <ul>
              {activeScenario.hints?.slice(0, hintsUsed).map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
            {hintsUsed < (activeScenario.hints?.length || 0) && (
              <button 
                className="hint-btn" 
                onClick={() => setHintsUsed(prev => prev + 1)}
              >
                Reveal Hint (Cost: 10% penalty)
              </button>
            )}
          </div>
        </div>

        <div className="editor-panel">
          <div className="tabs">
            {actions.map(btn => {
              const isCompleted = actionsTaken.some(a => a.type === btn.type);
              return (
                <button 
                  key={btn.type}
                  className={`tab ${activeAction === btn.type ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleActionClick(btn.type, btn.label)}
                >
                  {isCompleted && <span className="check-icon">✓</span>}
                  {btn.label}
                </button>
              );
            })}
          </div>
          
          <div className="code-display">
            <pre>
              <code>
                {currentAction 
                  ? currentAction.type === 'view_logs' ? renderFormattedLogs(currentAction.response) : currentAction.response
                  : 'Click an action to begin your investigation.'}
              </code>
            </pre>
          </div>
        </div>
      </div>

      <div className="diagnosis-panel structured-diagnosis">
        <h3>Submit Your Structured Diagnosis</h3>
        
        <div className="input-group">
          <label>1. Root Cause</label>
          <input 
            type="text" 
            placeholder="What is failing? (e.g. Missing index on emails...)"
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>2. Why is this happening?</label>
          <textarea 
            placeholder="Explain the technical mechanics of the issue..."
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={3}
          />
        </div>

        <div className="input-group">
          <label>3. How would you fix it?</label>
          <textarea 
            placeholder="Describe the solution or code changes..."
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            rows={3}
          />
        </div>

        <button className="submit-btn" onClick={submitDiagnosis} disabled={isSubmitting || !rootCause || !reasoning || !fix}>
          {isSubmitting ? 'Evaluating Diagnosis...' : 'Submit Diagnosis'}
        </button>

        {result && (
          <div className={`result-box ${result.score > 50 ? 'success' : 'error'}`}>
            <div className="score-header">
              <h4>Final Score: {result.score}%</h4>
            </div>
            
            <div className="section-scores">
              <span className="badge">Root Cause: {result.sectionScores.rootCause}%</span>
              <span className="badge">Reasoning: {result.sectionScores.reasoning}%</span>
              <span className="badge">Fix: {result.sectionScores.fix}%</span>
            </div>

            {result.penalties && result.penalties.length > 0 && (
              <div className="penalties-box">
                <strong>Penalties Applied:</strong>
                <ul>
                  {result.penalties.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {result.bonuses && result.bonuses.length > 0 && (
              <div className="bonuses-box">
                <strong>Bonuses Earned:</strong>
                <ul>
                  {result.bonuses.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}

            <div className="ai-feedback">
              <strong>AI Coaching Feedback:</strong>
              <p>{result.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

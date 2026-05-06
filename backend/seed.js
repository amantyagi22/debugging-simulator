require('dotenv').config();
const mongoose = require('mongoose');
const Scenario = require('./models/Scenario');

const seedData = [
  {
    title: "Memory Leak in Data Processor",
    problemStatement: "The application gradually consumes more memory over time and eventually crashes with an Out Of Memory error. Perform an interactive investigation to identify the issue.",
    actions: [
      {
        type: "view_logs",
        label: "View Logs",
        response: `[INFO] Starting data processing job...\n[INFO] Processed 1000 records. Memory usage: 150MB\n[INFO] Processed 2000 records. Memory usage: 280MB\n[INFO] Processed 3000 records. Memory usage: 410MB\n[ERROR] FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
      },
      {
        type: "view_code",
        label: "View Code",
        response: `const processedData = [];\n\nfunction processData(records) {\n  for (let record of records) {\n    const result = transformRecord(record);\n    // BUG: we are pushing to a global array and never clearing it\n    processedData.push(result);\n    saveToDatabase(result);\n  }\n}\n\nfunction transformRecord(record) {\n  return { ...record, processedAt: new Date() };\n}\n\nfunction saveToDatabase(data) {\n  // Mock db save\n}`
      },
      {
        type: "view_metrics",
        label: "View Metrics",
        response: "System memory climbs perfectly linearly over time from 150MB to crash. CPU remains stable at 12%."
      },
      {
        type: "check_db_indexes",
        label: "Check DB Indexes",
        response: "No DB latency or missing indexes detected for this operation."
      },
      {
        type: "run_explain",
        label: "Run Query Explain",
        response: "N/A - This process does not execute slow queries."
      }
    ],
    correctPath: ["view_metrics", "view_logs", "view_code"],
    hints: [
      "Look at where the data is being stored after transformation.", 
      "Is the processedData array ever cleared?"
    ],
    expectedRootCause: ["global array", "processedData", "array"],
    expectedReasoning: ["never cleared", "memory leak", "pushing", "grows"],
    expectedFix: ["clear", "empty", "processedData = []", "local scope"],
    requiredActions: ["view_logs", "view_code", "view_metrics"],
    wrongConcepts: ["database", "network", "index"]
  },
  {
    title: "API Latency Spike Under Load",
    problemStatement: `Your team owns a Node.js backend service. An API endpoint '/api/users/search' has recently become very slow in production.\n\nEarlier average response time: ~150ms\nCurrent response time under load: 2–4 seconds\n\nThis API is used heavily in search and filtering features. Users are reporting delays and occasional timeouts.\n\nContext:\n- Backend: Node.js (Express)\n- Database: MongoDB\n- Collection Size: 2 million documents\n- Traffic: 1000+ requests per minute\n\nYour task: Use investigation actions to identify the root cause, explain why, and suggest a fix.`,
    actions: [
      {
        type: "view_logs",
        label: "View Logs",
        response: `[INFO] GET /api/users/search?email=test@example.com - 200 - 3120ms\n[INFO] GET /api/users/search?email=john@doe.com - 200 - 2890ms\n[INFO] GET /api/users/search?email=alice@test.com - 200 - 3345ms\n[WARN] Slow query detected: users.find({ email: "test@example.com" }) took 2987ms`
      },
      {
        type: "view_code",
        label: "View Code",
        response: `app.get('/api/users/search', async (req, res) => {\n  try {\n    const { email } = req.query;\n\n    const user = await db.collection('users').findOne({ email });\n\n    return res.json(user);\n  } catch (err) {\n    console.error(err);\n    return res.status(500).send('Server error');\n  }\n});`
      },
      {
        type: "check_db_indexes",
        label: "Check DB Indexes",
        response: `Collection: users\nIndexes: [\n  { v: 2, key: { _id: 1 }, name: '_id_' }\n]`
      },
      {
        type: "run_explain",
        label: "Run Query Explain",
        response: `Stage: COLLSCAN\nDocuments Returned: 1\nExecution Time: 3012ms\nTotal Docs Examined: 2000000`
      },
      {
        type: "view_metrics",
        label: "View Metrics",
        response: "CPU spikes to 90% specifically on database nodes during the search API calls."
      }
    ],
    correctPath: ["view_logs", "run_explain", "check_db_indexes"],
    hints: [
      "Look at how the database is searching for the document",
      "Check if the query is optimized for large datasets",
      "What happens when no index exists on a queried field?"
    ],
    expectedRootCause: ["missing index", "no index", "index"],
    expectedReasoning: ["collection scan", "COLLSCAN", "full scan", "bottleneck"],
    expectedFix: ["createIndex", "add index", "index email"],
    requiredActions: ["check_db_indexes", "run_explain"],
    wrongConcepts: ["memory leak", "cache", "server crash"]
  }
];

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/debug-simulator';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB connected. Seeding data...');
  await Scenario.deleteMany({});
  await Scenario.insertMany(seedData);
  console.log('Database seeded successfully.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const scenarioRoutes = require('./routes/scenarios');
const submitRoutes = require('./routes/submit');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/scenarios', scenarioRoutes);
app.use('/submit', submitRoutes);

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/debug-simulator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

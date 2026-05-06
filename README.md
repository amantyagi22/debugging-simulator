# AI Debugging Simulator

An interactive, full-stack application designed to train and evaluate developers on their debugging and problem-solving skills. Unlike traditional quizzes, this simulator mimics real-world scenarios by requiring users to actively investigate logs, check database indexes, and review code before submitting a diagnosis.

The application evaluates the user's *investigation behavior* (rewarding optimal paths, penalizing skipped steps or wrong concepts) and leverages Google's Gemini AI to provide personalized coaching feedback based on their submission.

## ✨ Features
* **Interactive Investigation:** Navigate through non-linear scenarios by viewing server logs, query explains, metrics, and code snippets.
* **Thinking-Based Evaluation:** Scores are calculated based on finding the root cause, explaining the technical reasoning, and proposing a valid fix.
* **Behavior Tracking:** Penalizes skipping critical steps (e.g., guessing a DB issue without checking indexes) and rewards optimal investigation paths.
* **AI Coaching:** Integrates the Google Gemini API to act as a Senior Developer, providing nuanced feedback on what you missed in your analysis.
* **Fuzzy Keyword Matching:** Built-in tolerance for typos and synonyms using the `fuzzball` library.

## 🛠 Tech Stack
* **Frontend:** React, Vite, Vanilla CSS
* **Backend:** Node.js, Express
* **Database:** MongoDB, Mongoose
* **AI/LLM:** Google Gemini API (`@google/genai`)

---

## 🚀 Local Setup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on port 27017, or an Atlas cluster)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/debugging-simulator.git
cd debugging-simulator
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
# Local MongoDB (or replace with Atlas URI if remote)
MONGODB_URI=mongodb://127.0.0.1:27017/debug-simulator

# Get a free API key from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
```

Seed the database with the built-in scenarios:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
```
*(The server will run on http://localhost:5001)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

*(Optional)* Create a `.env` file in the `frontend/` directory if your backend is hosted elsewhere:
```env
VITE_API_URL=http://localhost:5001
```

Start the development server:
```bash
npm run dev
```
*(The app will open at http://localhost:5173)*

---

## ☁️ Deployment Guide

### Deploying the Backend (Render / Railway)
1. Set the **Root Directory** to `backend`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add `MONGODB_URI` and `GEMINI_API_KEY` to the environment variables.

### Deploying the Frontend (Vercel / Netlify)
1. Set the **Root Directory** to `frontend`.
2. Build Command: `npm run build`
3. Add `VITE_API_URL` to the environment variables, pointing to your deployed backend URL (e.g., `https://my-backend.onrender.com`).

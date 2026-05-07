const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const analysisRoutes = require('./routes/analysisRoutes')
const reportRoutes = require('./routes/reportRoutes')
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Configure CORS. Set `ALLOWED_ORIGINS` env var as a comma-separated list
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().replace(/\/$/, '')) 
  : [];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));


app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes)
app.use('/api/reports', reportRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
// Connect to DB. In non-serverless environments start the server.
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
} else {
  // In serverless/Vercel environment, attempt a DB connection but don't exit on failure.
  connectDB().catch(err => {
    console.error('DB connection failed in serverless environment:', err);
  });
  // Export the app so platform/serverless wrappers can mount it.
  module.exports = app;
}



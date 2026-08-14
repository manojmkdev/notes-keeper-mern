require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const notebookRoutes = require('./routes/notebookRoutes');
const tagRoutes = require('./routes/tagRoutes');

connectDB();

const app = express();

// Trust proxy for rate limiting (needed on hosting platforms like Render)
app.set('trust proxy', 1);

// Allow the configured frontend origin(s) to call this API
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' })); // 2mb to comfortably fit rich-text note content

// Basic rate limiting on auth endpoints to slow down brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/tags', tagRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

// Trigger restart to load new env vars
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Notes Keeper API running on port ${PORT}`));

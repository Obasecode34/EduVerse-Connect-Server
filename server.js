require('dotenv').config();
const express = require('express');
// Must be required right after 'express' and before any routes are defined —
// it monkey-patches Router so a thrown/rejected error inside an async
// controller reaches the error-handling middleware below instead of
// crashing the whole process. Without this, ANY unhandled error in ANY
// controller — not just the PDF renderer — takes the entire server down
// for every user, not just the request that failed.
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Centralized error handler — catches anything a controller throws.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EduVerse Connect API running on port ${PORT}`));

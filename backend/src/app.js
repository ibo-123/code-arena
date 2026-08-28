const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const contestRoutes = require('./routes/contestRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Add this line

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);

app.use('/api/tournaments', tournamentRoutes);

app.use('/api', contestRoutes);

app.use('/api', auditLogRoutes);

// Add admin routes - all admin endpoints are prefixed with /api/admin
app.use('/api/admin', adminRoutes);

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : undefined,
  });
});

module.exports = app;
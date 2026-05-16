const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const fs = require('fs')
const session = require('express-session')

dotenv.config()

const passport = require('./config/passport')
const connectDB = require('./config/db')

connectDB()

const app = express()

/* ─────────────────────────────────────────────── */
/* TRUST PROXY (IMPORTANT FOR RENDER) */
/* ─────────────────────────────────────────────── */

app.set('trust proxy', 1)

/* ─────────────────────────────────────────────── */
/* CREATE UPLOADS FOLDER */
/* ─────────────────────────────────────────────── */

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

/* ─────────────────────────────────────────────── */
/* CORS */
/* ─────────────────────────────────────────────── */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {

    // Allow requests without origin (mobile apps/postman)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('CORS Not Allowed'))
  },

  credentials: true,
}))

/* ─────────────────────────────────────────────── */
/* BODY PARSERS */
/* ─────────────────────────────────────────────── */

// Webhook raw body
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}))

/* ─────────────────────────────────────────────── */
/* SESSION */
/* ─────────────────────────────────────────────── */

app.use(session({
  secret: process.env.SESSION_SECRET || 'crm_secret',

  resave: false,

  saveUninitialized: false,

  proxy: true,

  cookie: {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',

    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}))

/* ─────────────────────────────────────────────── */
/* PASSPORT */
/* ─────────────────────────────────────────────── */

app.use(passport.initialize())
app.use(passport.session())

/* ─────────────────────────────────────────────── */
/* ROUTES */
/* ─────────────────────────────────────────────── */

app.use('/api/auth', require('./routes/authRoutes'))

app.use(
  '/api/auth/google',
  require('./routes/googleAuthRoutes')
)

app.use('/api/leads', require('./routes/leadRoutes'))

app.use('/api/sheets', require('./routes/sheetsRoutes'))

app.use('/api/payment', require('./routes/paymentRoutes'))

/* ─────────────────────────────────────────────── */
/* HEALTH */
/* ─────────────────────────────────────────────── */

app.get('/api/health', (req, res) => {

  res.json({
    success: true,
    message: 'CRM Backend Running',
    time: new Date(),
  })
})

/* ─────────────────────────────────────────────── */
/* ROOT */
/* ─────────────────────────────────────────────── */

app.get('/', (req, res) => {
  res.send('CRM Backend API Running...')
})

/* ─────────────────────────────────────────────── */
/* GLOBAL ERROR HANDLER */
/* ─────────────────────────────────────────────── */

app.use((err, req, res, next) => {

  console.error('❌ ERROR:', err)

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  })
})

/* ─────────────────────────────────────────────── */
/* START SERVER */
/* ─────────────────────────────────────────────── */

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {

  console.log(`
🚀 CRM API RUNNING
🌍 PORT: ${PORT}
🔗 URL: http://localhost:${PORT}
`)
})
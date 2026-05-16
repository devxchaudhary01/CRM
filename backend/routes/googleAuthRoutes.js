// routes/googleAuthRoutes.js
const express  = require('express');
const router   = express.Router();
const passport = require('../config/passport');
const { googleCallback } = require('../controllers/googleAuthController');

// Step 1: Redirect user to Google login page
router.get('/',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  })
);

// Step 2: Google redirects back here with code
router.get('/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
    session: true,
  }),
  googleCallback
);

module.exports = router;

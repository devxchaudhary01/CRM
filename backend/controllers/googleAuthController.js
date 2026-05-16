// controllers/googleAuthController.js
const jwt = require('jsonwebtoken');

const genToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

/**
 * GET /api/auth/google
 * Triggered by passport.authenticate('google') — redirects to Google
 * (No code needed here — passport handles it)
 */

/**
 * GET /api/auth/google/callback
 * Called by Google after user approves.
 * passport populates req.user.
 * We generate JWT and redirect to frontend with token in URL.
 */
exports.googleCallback = (req, res) => {
  try {
    const user  = req.user;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);

    const token = genToken(user._id);

    // Redirect to frontend — it reads token from URL param and stores it
    // Also pass needsOrgName flag if org was auto-created
    const needsOrg = user.organization?.name?.includes("'s Organization") ? '1' : '0';

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&needsOrg=${needsOrg}`
    );
  } catch(e) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

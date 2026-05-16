// config/passport.js
// Google OAuth 2.0 strategy setup

const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');
const Organization   = require('../models/Organization');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email      = profile.emails?.[0]?.value;
    const googleId   = profile.id;
    const name       = profile.displayName;
    const photo      = profile.photos?.[0]?.value || '';

    if (!email) return done(new Error('No email from Google'), null);

    // 1. Try find by googleId first (returning user)
    let user = await User.findOne({ googleId }).populate('organization');

    // 2. Try find by email (user may have registered with email before)
    if (!user) {
      user = await User.findOne({ email }).populate('organization');
      if (user) {
        // Link Google to existing account
        user.googleId   = googleId;
        user.authMethod = 'google';
        await user.save();
        return done(null, user);
      }
    } else {
      // Returning Google user — update last login
      return done(null, user);
    }

    // 3. Brand new user via Google — create org + org_owner
    // Check if any users exist for bootstrap logic
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      // First ever user → super_admin
      user = await User.create({
        name, email, googleId, authMethod:'google',
        role: 'super_admin',
      });
    } else {
      // New org_owner — we need orgName but Google doesn't give it
      // We'll create a temp org and let them rename it on first login
      const tempOrgName = `${name.split(' ')[0]}'s Organization`;
      const org  = await Organization.create({ name: tempOrgName });
      user = await User.create({
        name, email, googleId, authMethod:'google',
        role: 'org_owner', organization: org._id,
      });
      org.owner = user._id;
      await org.save();
    }

    await user.populate('organization');
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Serialize / deserialize for session (only used during OAuth callback flow)
passport.serializeUser((user, done)   => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('organization');
    done(null, user);
  } catch(e) { done(e, null); }
});

module.exports = passport;

const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

// Verifies the JWT and attaches the current user. Runs on every protected route.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing access token' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Attaches req.user if a valid token is present, but never blocks the request
// if it's missing or invalid — for routes like getJobById that are public but
// show more to an owner/admin than to an anonymous visitor.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = await User.findById(payload.sub);
  } catch (err) {
    // Invalid token on an optional route: proceed as anonymous, don't 401.
  }
  next();
}

// requireRole(['employer', 'admin']) — this is the single choke point that
// keeps a jobseeker's token from ever reaching a job-approval controller,
// regardless of what the client UI shows or hides.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Employers additionally need to be verified before they can act as one.
    if (req.user.role === 'employer' && !req.user.employerVerified) {
      return res.status(403).json({ message: 'Employer account pending verification' });
    }

    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };

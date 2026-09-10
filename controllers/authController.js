const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    language: user.language,
    employerVerified: user.employerVerified,
  };
}

async function register(req, res) {
  const { fullName, email, password, role, language } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  // Employers start unverified regardless of what they submit — verification
  // is a separate admin action, not something the register endpoint grants.
  const user = await User.create({
    fullName,
    email,
    password,
    role,
    language,
    employerVerified: role === 'employer' ? false : undefined,
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.status(201).json({ user: publicUser(user), accessToken, refreshToken });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({ user: publicUser(user), accessToken, refreshToken });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);

    // Version check lets a single "log out everywhere" action invalidate
    // every outstanding refresh token at once, without touching the DB per-token.
    if (!user || user.refreshTokenVersion !== payload.v) {
      return res.status(401).json({ message: 'Refresh token no longer valid' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

async function logoutAll(req, res) {
  req.user.refreshTokenVersion += 1;
  await req.user.save();
  res.json({ message: 'Logged out on all devices' });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

// Deliberately does NOT accept email or role here — email changes need a
// verification flow of their own, and role changes (especially to admin)
// should never be a field a user can just PATCH on themselves.
async function updateProfile(req, res) {
  const { fullName, language } = req.body;

  if (fullName !== undefined) req.user.fullName = fullName;
  if (language !== undefined) req.user.language = language;
  await req.user.save();

  res.json({ user: publicUser(req.user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  // Fetch with the password field included — it's select:false by default,
  // and req.user from requireAuth won't have it.
  const user = await User.findById(req.user._id).select('+password');
  const matches = await user.comparePassword(currentPassword);
  if (!matches) return res.status(401).json({ message: 'Current password is incorrect' });

  user.password = newPassword; // pre-save hook re-hashes this
  // Changing password invalidates every other session — a leaked old
  // password shouldn't leave existing refresh tokens still valid.
  user.refreshTokenVersion += 1;
  await user.save();

  res.json({ message: 'Password updated. Please log in again on other devices.' });
}

module.exports = { register, login, refresh, logoutAll, me, updateProfile, changePassword };

const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logoutAll, me, updateProfile, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const {
  validateBody,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../middleware/validate');

const router = express.Router();

// Brute-force guard on the two credential-entry points only.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout-all', requireAuth, logoutAll);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.patch('/change-password', requireAuth, authLimiter, validateBody(changePasswordSchema), changePassword);

module.exports = router;

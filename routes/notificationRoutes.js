const express = require('express');
const {
  listMyNotifications,
  markAsRead,
  registerPushToken,
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listMyNotifications);
router.patch('/:id/read', markAsRead);
router.post('/push-token', registerPushToken);

module.exports = router;

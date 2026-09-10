const Notification = require('../models/Notification');
const User = require('../models/User');

async function listMyNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
}

async function markAsRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ notification });
}

// Called once per device on login/app-open. Uses $addToSet, not push — a
// device re-registering the same token shouldn't accumulate duplicates.
async function registerPushToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token is required' });

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { pushTokens: token } });
  res.json({ message: 'Push token registered' });
}

module.exports = { listMyNotifications, markAsRead, registerPushToken };

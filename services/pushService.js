const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');

const expo = new Expo();

// The DB record IS the notification — it exists whether or not the push
// succeeds. A user with notifications off, an expired token, or no device
// registered yet should still see this in their in-app notification list;
// push is a best-effort nudge layered on top, not the source of truth.
async function notifyUser(userId, { type, title, body, data = {} }) {
  const notification = await Notification.create({ user: userId, type, title, body, data });

  const user = await User.findById(userId);
  const validTokens = (user?.pushTokens || []).filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return notification;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: { ...data, notificationId: notification._id.toString() },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const staleTokens = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        // DeviceNotRegistered means the token is dead — uninstalled app,
        // expired token, etc. Prune it now so future sends don't waste a slot.
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(chunk[i].to);
        }
      });
    } catch (err) {
      console.error('Push send failed for a chunk:', err.message);
    }
  }

  if (staleTokens.length > 0 && user) {
    user.pushTokens = user.pushTokens.filter((t) => !staleTokens.includes(t));
    await user.save();
  }

  return notification;
}

module.exports = { notifyUser };

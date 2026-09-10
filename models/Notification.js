const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['job_approved', 'job_rejected', 'application_status'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // Loose reference data (jobId, applicationId, new status) so the app can
    // deep-link when the notification is tapped, without a rigid schema per type.
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

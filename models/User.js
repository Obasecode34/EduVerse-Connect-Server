const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },

    // Only three roles exist. 'employer' is never self-escalated to 'admin' —
    // that promotion happens manually in the DB or via a separate admin-only route.
    role: {
      type: String,
      enum: ['jobseeker', 'employer', 'admin'],
      default: 'jobseeker',
    },

    language: {
      type: String,
      enum: ['en', 'ha', 'yo', 'ig'],
      default: 'en',
    },

    // Employers are pending until an admin verifies them — a separate gate
    // from the job-approval workflow, so a fake employer can't post at all,
    // even a job that would otherwise pass moderation.
    employerVerified: { type: Boolean, default: false },

    pushTokens: [{ type: String }],
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

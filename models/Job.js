const mongoose = require('mongoose');

// Same whitelist pattern as the resume theme: a free-text field means
// "Undergraduate" and "undergraduate" become two different filter buckets.
// This default list is a reasonable starting point, not something you
// specified — swap the array any time, nothing else depends on the values.
const SCHOLARSHIP_CLASSIFICATIONS = ['Undergraduate', 'Postgraduate', 'PhD', 'Vocational', 'International'];

const jobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },

    type: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid', 'scholarship'],
      required: true,
    },

    // Only meaningful when type === 'scholarship'.
    classification: {
      type: String,
      enum: SCHOLARSHIP_CLASSIFICATIONS,
      required: function requiredForScholarship() {
        return this.type === 'scholarship';
      },
    },

    // Two states collapse "Pending Review" and "Admin Moderation" from your
    // workflow into one: there's no meaningful difference between "waiting
    // to be reviewed" and "currently being reviewed" at the data layer —
    // an admin either has decided or hasn't. approved === public; there's
    // no separate publish step once approved.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderationNote: { type: String, trim: true },
    moderatedAt: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
module.exports.SCHOLARSHIP_CLASSIFICATIONS = SCHOLARSHIP_CLASSIFICATIONS;

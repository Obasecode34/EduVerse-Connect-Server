const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Snapshot, not a live reference. If a jobseeker edits their resume after
    // applying, the employer should still see what was submitted at the time —
    // like light from a star: what you're looking at is the state when it left,
    // not the star's current state.
    resumeSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    resumeFormat: { type: String, enum: ['pdf', 'docx'], required: true },

    coverNote: { type: String, trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
      default: 'submitted',
    },
    statusNote: { type: String, trim: true },
    statusUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

// One application per jobseeker per job — applying twice shouldn't create
// two rows, it should be rejected outright at the DB layer as a fallback
// in case a controller-level check is ever bypassed.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);

const Job = require('../models/Job');
const { notifyUser } = require('../services/pushService');

// Public feed: only ever shows approved jobs. Filters mirror your top nav
// (On-Site / Remote / Hybrid / Scholarships) plus scholarship classification.
async function listPublicJobs(req, res) {
  const { type, classification, page = 1, limit = 20 } = req.query;

  const filter = { status: 'approved' };
  if (type) filter.type = type;
  if (classification) filter.classification = classification;

  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('employer', 'fullName');

  res.json({ jobs, page: Number(page) });
}

async function getJobById(req, res) {
  const job = await Job.findById(req.params.id).populate('employer', 'fullName');
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Non-approved jobs are only visible to the owning employer or an admin —
  // otherwise a direct link would leak unmoderated content.
  const isOwner = job.employer._id.toString() === req.user?.id?.toString();
  const isAdmin = req.user?.role === 'admin';
  if (job.status !== 'approved' && !isOwner && !isAdmin) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json({ job });
}

// Employer's own jobs, any status — lets them see what's pending/rejected.
async function listMyJobs(req, res) {
  const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
  res.json({ jobs });
}

async function createJob(req, res) {
  const job = await Job.create({ ...req.body, employer: req.user._id, status: 'pending' });
  res.status(201).json({ job });
}

// Employers can only edit their own job, and only while it's still pending —
// editing an approved job would silently bypass the moderation it already passed.
async function updateJob(req, res) {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your job posting' });
  }
  if (job.status !== 'pending' && req.user.role !== 'admin') {
    return res.status(409).json({ message: 'Cannot edit a job that has already been moderated' });
  }

  Object.assign(job, req.body);
  if (req.user.role !== 'admin') job.status = 'pending'; // any employer edit resets review
  await job.save();
  res.json({ job });
}

async function deleteJob(req, res) {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your job posting' });
  }

  await job.deleteOne();
  res.json({ message: 'Job deleted' });
}

// --- Admin moderation ---

async function listPendingJobs(req, res) {
  const jobs = await Job.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .populate('employer', 'fullName email employerVerified');
  res.json({ jobs });
}

async function moderateJob(req, res) {
  const { decision, note } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.status !== 'pending') {
    return res.status(409).json({ message: `Job already ${job.status}` });
  }

  job.status = decision === 'approve' ? 'approved' : 'rejected';
  job.moderatedBy = req.user._id;
  job.moderationNote = note;
  job.moderatedAt = new Date();
  await job.save();

  // TODO (next piece): notify the employer via push here once the
  // notification service exists — approval/rejection is exactly the kind
  // of event a push notification is for.
  await notifyUser(job.employer, {
    type: job.status === 'approved' ? 'job_approved' : 'job_rejected',
    title: job.status === 'approved' ? 'Job approved' : 'Job rejected',
    body:
      job.status === 'approved'
        ? `"${job.title}" is now live.`
        : `"${job.title}" was rejected.${note ? ` Reason: ${note}` : ''}`,
    data: { jobId: job._id.toString() },
  });

  res.json({ job });
}

module.exports = {
  listPublicJobs,
  getJobById,
  listMyJobs,
  createJob,
  updateJob,
  deleteJob,
  listPendingJobs,
  moderateJob,
};

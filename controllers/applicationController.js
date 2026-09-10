const Application = require('../models/Application');
const Job = require('../models/Job');
const { notifyUser } = require('../services/pushService');

// Jobseeker applies to a job. Blocked on two conditions the client can't be
// trusted to enforce: the job must actually be approved, and no duplicate
// application for the same job/applicant pair.
async function applyToJob(req, res) {
  const job = await Job.findById(req.params.jobId);
  if (!job || job.status !== 'approved') {
    return res.status(404).json({ message: 'Job not found or not open for applications' });
  }

  try {
    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      resumeSnapshot: req.body.resumeSnapshot,
      resumeFormat: req.body.resumeFormat,
      coverNote: req.body.coverNote,
    });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already applied to this job' });
    }
    throw err;
  }
}

// Jobseeker's own application history.
async function listMyApplications(req, res) {
  const applications = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('job', 'title company type status');
  res.json({ applications });
}

// Employer views applications to their own job postings only — checked via
// the job's employer field, not trusted from the request.
async function listApplicationsForJob(req, res) {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your job posting' });
  }

  const applications = await Application.find({ job: job._id })
    .sort({ createdAt: -1 })
    .populate('applicant', 'fullName email language');
  res.json({ applications });
}

async function updateApplicationStatus(req, res) {
  const application = await Application.findById(req.params.id).populate('job');
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const isOwner = application.job.employer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your job posting' });
  }

  application.status = req.body.status;
  application.statusNote = req.body.note;
  application.statusUpdatedAt = new Date();
  await application.save();

  // TODO: push notification to the applicant on status change — same
  // notification service the job-moderation TODO is waiting on.
  await notifyUser(application.applicant, {
    type: 'application_status',
    title: 'Application update',
    body: `Your application for "${application.job.title}" is now: ${application.status}.`,
    data: { applicationId: application._id.toString(), jobId: application.job._id.toString() },
  });

  res.json({ application });
}

module.exports = {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus,
};

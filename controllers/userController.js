const User = require('../models/User');

async function listPendingEmployers(req, res) {
  const employers = await User.find({ role: 'employer', employerVerified: false }).sort({ createdAt: 1 });
  res.json({ employers });
}

async function verifyEmployer(req, res) {
  const employer = await User.findOne({ _id: req.params.id, role: 'employer' });
  if (!employer) return res.status(404).json({ message: 'Employer not found' });

  employer.employerVerified = true;
  await employer.save();
  res.json({ employer: { id: employer._id, fullName: employer.fullName, employerVerified: true } });
}

// Rejection isn't a status flip to false-forever — it's account-level, so it's
// handled as a delete rather than a third employerVerified state. A rejected
// applicant can always re-register if the rejection was a mistake or their
// situation changes; there's no legitimate case for a permanently-rejected
// employer account that still exists and can log in.
async function rejectEmployer(req, res) {
  const employer = await User.findOneAndDelete({ _id: req.params.id, role: 'employer', employerVerified: false });
  if (!employer) return res.status(404).json({ message: 'Pending employer not found' });
  res.json({ message: 'Employer application rejected' });
}

module.exports = { listPendingEmployers, verifyEmployer, rejectEmployer };

const Resume = require('../models/Resume');
const { renderResumeToPdf } = require('../services/pdfRenderer');
const { renderResumeToDocx } = require('../services/docxRenderer');

async function listMyResumes(req, res) {
  const resumes = await Resume.find({ owner: req.user._id }).sort({ updatedAt: -1 });
  res.json({ resumes });
}

async function getResume(req, res) {
  const resume = await Resume.findOne({ _id: req.params.id, owner: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json({ resume });
}

async function createResume(req, res) {
  const resume = await Resume.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ resume });
}

async function updateResume(req, res) {
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json({ resume });
}

async function deleteResume(req, res) {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json({ message: 'Resume deleted' });
}

// The one endpoint that matters most to your spec: same resume, user picks
// the format at request time via ?format=pdf|docx — nothing is pre-generated
// or stored twice, it's rendered on demand from the single JSON source of truth.
async function downloadResume(req, res) {
  const format = req.query.format;
  if (!['pdf', 'docx'].includes(format)) {
    return res.status(400).json({ message: "format must be 'pdf' or 'docx'" });
  }

  const resume = await Resume.findOne({ _id: req.params.id, owner: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });

  if (format === 'pdf') {
    const buffer = await renderResumeToPdf(resume);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resume.title}.pdf"`,
    });
    return res.send(buffer);
  }

  const buffer = await renderResumeToDocx(resume);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="${resume.title}.docx"`,
  });
  res.send(buffer);
}

module.exports = {
  listMyResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  downloadResume,
};

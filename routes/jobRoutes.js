const express = require('express');
const {
  listPublicJobs,
  getJobById,
  listMyJobs,
  createJob,
  updateJob,
  deleteJob,
  listPendingJobs,
  moderateJob,
} = require('../controllers/jobController');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { validateBody, jobSchema, jobUpdateSchema, moderationSchema } = require('../middleware/validate');

const router = express.Router();

// Public feed — no auth required.
router.get('/', listPublicJobs);

// Employer's own postings — must come before '/:id' so 'mine' isn't parsed as an ObjectId.
router.get('/mine', requireAuth, requireRole('employer'), listMyJobs);

// Admin moderation queue — also before '/:id' for the same reason.
router.get('/pending', requireAuth, requireRole('admin'), listPendingJobs);

router.get('/:id', optionalAuth, getJobById);

router.post('/', requireAuth, requireRole('employer'), validateBody(jobSchema), createJob);
router.patch('/:id', requireAuth, requireRole('employer', 'admin'), validateBody(jobUpdateSchema), updateJob);
router.delete('/:id', requireAuth, requireRole('employer', 'admin'), deleteJob);

router.patch(
  '/:id/moderate',
  requireAuth,
  requireRole('admin'),
  validateBody(moderationSchema),
  moderateJob
);

module.exports = router;

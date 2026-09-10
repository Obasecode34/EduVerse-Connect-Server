const express = require('express');
const {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody, applicationSchema, applicationStatusSchema } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/jobs/:jobId/apply',
  requireAuth,
  requireRole('jobseeker'),
  validateBody(applicationSchema),
  applyToJob
);

router.get('/mine', requireAuth, requireRole('jobseeker'), listMyApplications);

router.get(
  '/jobs/:jobId',
  requireAuth,
  requireRole('employer', 'admin'),
  listApplicationsForJob
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('employer', 'admin'),
  validateBody(applicationStatusSchema),
  updateApplicationStatus
);

module.exports = router;

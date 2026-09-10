const express = require('express');
const {
  listMyResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  downloadResume,
} = require('../controllers/resumeController');
const { requireAuth } = require('../middleware/auth');
const { validateBody, resumeSchema, resumeUpdateSchema } = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth); // every resume route requires a logged-in owner — no public resume access

router.get('/', listMyResumes);
router.post('/', validateBody(resumeSchema), createResume);
router.get('/:id', getResume);
router.patch('/:id', validateBody(resumeUpdateSchema), updateResume);
router.delete('/:id', deleteResume);
router.get('/:id/download', downloadResume); // ?format=pdf|docx

module.exports = router;

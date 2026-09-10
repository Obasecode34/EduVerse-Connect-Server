const express = require('express');
const { listPendingEmployers, verifyEmployer, rejectEmployer } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/employers/pending', listPendingEmployers);
router.patch('/employers/:id/verify', verifyEmployer);
router.delete('/employers/:id/reject', rejectEmployer);

module.exports = router;

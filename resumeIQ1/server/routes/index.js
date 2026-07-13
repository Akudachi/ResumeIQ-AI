const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ResumeController = require('../controllers/resumeController');

// Upload resume
router.post('/upload', upload.single('resume'), ResumeController.upload);

// Parse Job Description file
router.post('/parse-jd', upload.single('jd'), ResumeController.parseJD);

// Analyze resume
router.post('/analyze', ResumeController.analyze);

// Match job description
router.post('/job-match', ResumeController.jobMatch);

// Rewrite section
router.post('/rewrite', ResumeController.rewrite);

// Get report
router.get('/report/:id', ResumeController.getReport);

// Skills sub-score details
router.all('/skills', ResumeController.skills);

// Keywords sub-score details
router.all('/keywords', ResumeController.keywords);

// Recruiter feedback details
router.all('/recruiter', ResumeController.recruiter);

module.exports = router;

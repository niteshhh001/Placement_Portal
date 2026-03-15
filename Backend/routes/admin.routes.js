const express = require("express");
const router = express.Router();
const {
  createJob, updateJob, deleteJob, getAllJobs,
  getApplicants, updateApplicationStatus, exportApplicantsExcel,
  getAllStudents, verifyStudent,
  getStats, bulkNotify,
} = require("../controllers/admin.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { validate, createJobSchema } = require("../middleware/validate.middleware");

router.use(protect, adminOnly);

// Dashboard
router.get("/stats", getStats);

// Job management
router.get("/jobs", getAllJobs);
router.post("/jobs", validate(createJobSchema), createJob);
router.patch("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

// Applicant management
router.get("/jobs/:id/applicants", getApplicants);
router.get("/jobs/:id/export", exportApplicantsExcel);
router.patch("/applications/:id/status", updateApplicationStatus);

// Student management
router.get("/students", getAllStudents);
router.patch("/students/:id/verify", verifyStudent);

// Notifications
router.post("/notify", bulkNotify);

module.exports = router;
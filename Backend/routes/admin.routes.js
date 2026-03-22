const express = require("express");
const router = express.Router();

const {
  createJob, updateJob, deleteJob, getAllJobs,
  getApplicants, updateApplicationStatus, exportApplicantsExcel,
  bulkUpdateStatus, bulkImportStudents,
  getAllStudents, getStudentProfile, updateStudentProfile, lockStudentProfile,
  verifyStudent, blockStudent, unblockStudent,
  getStats, bulkNotify,
} = require("../controllers/admin.controller");


const { protect, adminOnly } = require("../middleware/auth.middleware");
const { validate, createJobSchema } = require("../middleware/validate.middleware");
const { getPerformanceStats, invalidateAll } = require("../utils/cache.util");
const AuditLog = require("../models/AuditLog.model");
const { asyncHandler } = require("../middleware/error.middleware");
router.use(protect, adminOnly);

// Dashboard
router.get("/stats", getStats);

// Cache monitoring
router.get("/cache/stats", (req, res) => {
  const stats = getPerformanceStats();
  res.json({ success: true, data: stats });
});

// Clear all cache manually
router.delete("/cache/clear", (req, res) => {
  invalidateAll();
  res.json({ success: true, message: "All cache cleared successfully." });
});

// Audit logs
router.get("/audit-logs", asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: logs });
}));

// Job management
router.get("/jobs", getAllJobs);
router.post("/jobs", validate(createJobSchema), createJob);
router.patch("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

// Applicant management
router.get("/jobs/:id/applicants", getApplicants);
router.get("/jobs/:id/export", exportApplicantsExcel);
router.patch("/applications/:id/status", updateApplicationStatus);
router.post("/jobs/:id/bulk-update", bulkUpdateStatus);

// Student management
router.get("/students", getAllStudents);
router.patch("/students/:id/verify", verifyStudent);
router.patch("/students/:id/block", blockStudent);
router.patch("/students/:id/unblock", unblockStudent);


router.post("/students/import", bulkImportStudents);

// Notifications
router.post("/notify", bulkNotify);

router.get("/students/:id", getStudentProfile);
router.patch("/students/:id/profile", updateStudentProfile);
router.patch("/students/:id/lock", lockStudentProfile);

module.exports = router;
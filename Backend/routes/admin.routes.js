const express = require("express");
const router = express.Router();
const {
  createJob,
  updateJob,
  deleteJob,
  getAllJobs,
  getStats,
} = require("../controllers/admin.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { validate, createJobSchema } = require("../middleware/validate.middleware");

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/jobs", getAllJobs);
router.post("/jobs", validate(createJobSchema), createJob);
router.patch("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

module.exports = router;
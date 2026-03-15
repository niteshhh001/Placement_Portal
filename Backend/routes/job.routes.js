const express = require("express");
const router = express.Router();
const { getJobs, getJobById, applyToJob } = require("../controllers/job.controller");
const { protect, studentOnly } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/:id/apply", studentOnly, applyToJob);

module.exports = router;
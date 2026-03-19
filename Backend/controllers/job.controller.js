const Job = require("../models/Job.model");
const Application = require("../models/Application.model");
const { asyncHandler } = require("../middleware/error.middleware");
const { withCache, invalidateCache, CACHE_KEYS, TTL } = require("../utils/cache.util");
// ── Eligibility Engine ────────────────────────────────────────────────────────
const checkEligibility = (student, job) => {
  const { eligibility } = job;
  const reasons = [];

  if (student.cgpa < eligibility.minCgpa)
    reasons.push(`CGPA must be ≥ ${eligibility.minCgpa} (yours: ${student.cgpa})`);

  // Check 10th marks
  if (eligibility.min10thMarks > 0) {
    const tenth = student.education?.find((e) => e.level === "10th");
    if (!tenth) {
      reasons.push(`10th marks required (min ${eligibility.min10thMarks}%) — please update your profile`);
    } else {
      const marks = tenth.percentage || tenth.cgpa * 10 || 0;
      if (marks < eligibility.min10thMarks) {
        reasons.push(`10th marks must be ≥ ${eligibility.min10thMarks}% (yours: ${marks}%)`);
      }
    }
  }

  // Check 12th marks
  if (eligibility.min12thMarks > 0) {
    const twelfth = student.education?.find((e) => e.level === "12th");
    if (!twelfth) {
      reasons.push(`12th marks required (min ${eligibility.min12thMarks}%) — please update your profile`);
    } else {
      const marks = twelfth.percentage || twelfth.cgpa * 10 || 0;
      if (marks < eligibility.min12thMarks) {
        reasons.push(`12th marks must be ≥ ${eligibility.min12thMarks}% (yours: ${marks}%)`);
      }
    }
  }

  const branchAllowed =
    eligibility.allowedBranches.includes("ALL") ||
    eligibility.allowedBranches.includes(student.branch);
  if (!branchAllowed)
    reasons.push(`Your branch (${student.branch}) is not eligible`);

  if (student.activeBacklogs > eligibility.maxActiveBacklogs)
    reasons.push(`Active backlogs must be ≤ ${eligibility.maxActiveBacklogs}`);

  if (student.totalBacklogs > eligibility.maxTotalBacklogs)
    reasons.push(`Total backlogs must be ≤ ${eligibility.maxTotalBacklogs}`);

  if (student.isPlaced && !eligibility.allowPlaced)
    reasons.push("Already placed students cannot apply");

  if (student.year < eligibility.minYear)
    reasons.push(`Must be in year ${eligibility.minYear}+`);

  return { eligible: reasons.length === 0, reasons };
};

// @desc    Get all open jobs with eligibility flag
// @route   GET /api/jobs
// @access  Private (student)
const getJobs = asyncHandler(async (req, res) => {
  const { status = "open", sector, search } = req.query;

  // Only cache unfiltered open jobs
  let jobs;
  if (!sector && !search && status === "open") {
    jobs = await withCache(CACHE_KEYS.OPEN_JOBS, TTL.JOBS, async () => {
      return await Job.find({ status: "open" }).sort({ createdAt: -1 });
    });
  } else {
    const query = { status };
    if (sector) query.sector = sector;
    if (search) query.companyName = { $regex: search, $options: "i" };
    jobs = await Job.find(query).sort({ createdAt: -1 });
  }

  const student = req.user;
  const jobsWithEligibility = jobs.map((job) => {
    const { eligible, reasons } = checkEligibility(student, job);
    return { ...job.toObject(), eligible, ineligibilityReasons: reasons };
  });

  res.json({ success: true, count: jobs.length, data: jobsWithEligibility });
});

// @desc    Get single job detail
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });

  let eligibilityInfo = {};
  if (req.role === "student") {
    eligibilityInfo = checkEligibility(req.user, job);
  }

  res.json({ success: true, data: { ...job.toObject(), ...eligibilityInfo } });
});

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (student)
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });

  if (job.status !== "open") {
    return res.status(400).json({ success: false, message: "This job is no longer accepting applications." });
  }

  if (new Date() > job.applicationDeadline) {
    return res.status(400).json({ success: false, message: "Application deadline has passed." });
  }

  // Server-side eligibility check — never trust frontend
  const { eligible, reasons } = checkEligibility(req.user, job);
  if (!eligible) {
    return res.status(403).json({ success: false, message: "Not eligible.", reasons });
  }

  if (!req.user.isProfileComplete) {
    return res.status(400).json({ success: false, message: "Please complete your profile before applying." });
  }
  if (!req.user.isVerified) {
  return res.status(403).json({
    success: false,
    message: "Your account is pending verification by the placement cell. Please wait for approval before applying.",
  });
}

  // Check duplicate application
  const existing = await Application.findOne({ student: req.user._id, job: job._id });
  if (existing) {
    return res.status(400).json({ success: false, message: "You have already applied to this job." });
  }

  const application = await Application.create({
    student: req.user._id,
    job: job._id,
  });

  // Increment applicant count
  await Job.findByIdAndUpdate(job._id, { $inc: { totalApplicants: 1 } });
  // Invalidate cache so applicant count updates immediately
invalidateCache(CACHE_KEYS.OPEN_JOBS, CACHE_KEYS.ALL_JOBS);
  res.status(201).json({ success: true, message: "Application submitted!", data: application });
});

module.exports = { getJobs, getJobById, applyToJob, checkEligibility };
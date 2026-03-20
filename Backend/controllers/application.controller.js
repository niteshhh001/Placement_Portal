const Application = require("../models/Application.model");
const Job = require("../models/Job.model");
const { asyncHandler } = require("../middleware/error.middleware");
const { withCache, invalidateCache } = require("../utils/cache.util");

// @desc    Get student's own applications
// @route   GET /api/applications/me
const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const cacheKey = `student_applications_${req.user._id}_p${pageNum}`;

  const result = await withCache(cacheKey, 60, async () => {
    const [applications, total] = await Promise.all([
      Application.find({ student: req.user._id })
        .populate("job", "companyName jobRole ctc driveDate location applicationDeadline")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Application.countDocuments({ student: req.user._id }),
    ]);

    return {
      count: applications.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: applications,
    };
  });

  res.json({ success: true, ...result });
});

// @desc    Get single application detail
// @route   GET /api/applications/:id
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id,
  }).populate("job").lean();

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  res.json({ success: true, data: application });
});

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id,
  });

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  if (application.status !== "applied") {
    return res.status(400).json({
      success: false,
      message: `Cannot withdraw — your application is already ${application.status}. Please contact the placement cell.`,
    });
  }

  const job = await Job.findById(application.job);
  if (job && new Date() > new Date(job.applicationDeadline)) {
    return res.status(400).json({
      success: false,
      message: "Cannot withdraw — application deadline has passed.",
    });
  }

  await Application.findByIdAndDelete(application._id);

  await Job.findByIdAndUpdate(application.job, { $inc: { totalApplicants: -1 } });

  // Invalidate student applications cache
  invalidateCache(`student_applications_${req.user._id}_p1`);

  res.json({ success: true, message: "Application withdrawn successfully." });
});

module.exports = { getMyApplications, getApplicationById, withdrawApplication };

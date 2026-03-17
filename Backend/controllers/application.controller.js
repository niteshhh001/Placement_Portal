const Application = require("../models/Application.model");
const Job = require("../models/Job.model");
const { asyncHandler } = require("../middleware/error.middleware");

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("job", "companyName jobRole ctc status driveDate rounds companyLogo location applicationDeadline")
    .sort({ appliedAt: -1 });
  res.json({ success: true, count: applications.length, data: applications });
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id,
  }).populate("job");
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }
  res.json({ success: true, data: application });
});

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

  res.json({ success: true, message: "Application withdrawn successfully." });
});

module.exports = { getMyApplications, getApplicationById, withdrawApplication };
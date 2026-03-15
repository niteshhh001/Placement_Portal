const Application = require("../models/Application.model");
const { asyncHandler } = require("../middleware/error.middleware");

// @desc    Get student's own applications
// @route   GET /api/applications/me
// @access  Private (student)
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("job", "companyName jobRole ctc status driveDate rounds companyLogo location")
    .sort({ appliedAt: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

// @desc    Get single application detail
// @route   GET /api/applications/:id
// @access  Private (student — own only)
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

module.exports = { getMyApplications, getApplicationById };
const Student = require("../models/Student.model");
const { asyncHandler } = require("../middleware/error.middleware");

// @desc    Get own profile
// @route   GET /api/student/profile
// @access  Private (student)
const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).select("-password");
  res.json({ success: true, data: student });
});

// @desc    Update profile
// @route   PATCH /api/student/profile
// @access  Private (student)
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name", "phone", "dob", "gender",
    "cgpa", "activeBacklogs", "totalBacklogs",
    "skills", "internships", "education", "section",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const student = await Student.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  student.checkProfileComplete();
  await student.save();

  res.json({ success: true, message: "Profile updated.", data: student });
});

// @desc    Upload resume
// @route   POST /api/student/resume
// @access  Private (student)
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  const student = await Student.findByIdAndUpdate(
    req.user._id,
    {
      resumeUrl: req.file.path,
      resumePublicId: req.file.filename,
    },
    { new: true }
  );

  // Auto check profile completeness after resume upload
  student.checkProfileComplete();
  await student.save();

  res.json({
    success: true,
    message: "Resume uploaded.",
    resumeUrl: student.resumeUrl,
    isProfileComplete: student.isProfileComplete,
  });
});

// @desc    Upload profile photo
// @route   POST /api/student/photo
// @access  Private (student)
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  const student = await Student.findByIdAndUpdate(
    req.user._id,
    { photoUrl: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: "Photo updated.",
    photoUrl: student.photoUrl,
  });
});

module.exports = { getProfile, updateProfile, uploadResume, uploadPhoto };
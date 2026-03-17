const Student = require("../models/Student.model");
const { asyncHandler } = require("../middleware/error.middleware");

const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).select("-password");
  res.json({ success: true, data: student });
});

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

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  // Build a clean public URL with .pdf extension
  let resumeUrl = req.file.path;

  // Make sure URL ends with .pdf
  if (!resumeUrl.endsWith(".pdf")) {
    resumeUrl = resumeUrl + ".pdf";
  }

  const student = await Student.findByIdAndUpdate(
    req.user._id,
    {
      resumeUrl: resumeUrl,
      resumePublicId: req.file.filename,
    },
    { new: true }
  );

  student.checkProfileComplete();
  await student.save();

  res.json({
    success: true,
    message: "Resume uploaded.",
    resumeUrl: student.resumeUrl,
    isProfileComplete: student.isProfileComplete,
  });
});

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
const Student = require("../models/Student.model");
const { asyncHandler } = require("../middleware/error.middleware");

const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).select("-password");
  res.json({ success: true, data: student });
});

const updateProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  const allowedFields = [
    "name", "phone", "dob", "gender",
    "cgpa", "activeBacklogs", "totalBacklogs",
    "skills", "internships", "education", "section",
  ];

  // If profile is locked — only allow safe fields
  const lockedAllowedFields = ["name", "phone", "skills", "gender", "section"];

  const fieldsToUpdate = student.isProfileLocked ? lockedAllowedFields : allowedFields;

  const updates = {};
  fieldsToUpdate.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // If locked and trying to update restricted fields — warn
  if (student.isProfileLocked) {
    const restrictedAttempts = ["cgpa", "activeBacklogs", "totalBacklogs", "education"]
      .filter((f) => req.body[f] !== undefined);
    if (restrictedAttempts.length > 0) {
      return res.status(403).json({
        success: false,
        message: "Your profile is locked. You cannot update academic details. Please contact the placement cell.",
      });
    }
  }

  const updatedStudent = await Student.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  updatedStudent.checkProfileComplete();
  await updatedStudent.save();

  res.json({ success: true, message: "Profile updated.", data: updatedStudent });
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
const contactPlacementCell = asyncHandler(async (req, res) => {
  const { name, email, category, subject, message } = req.body;

  if (!subject || !message || !category) {
    return res.status(400).json({
      success: false,
      message: "Category, subject and message are required.",
    });
  }

  const { sendEmail } = require("../utils/email.util");
  const Admin = require("../models/Admin.model");

  // Get all admin emails
  const admins = await Admin.find().select("email");
  const adminEmails = admins.map((a) => a.email).join(",");

  // Send email to admin
  await sendEmail({
    to: adminEmails,
    subject: `[${category}] ${subject} — from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Student Query</h2>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 8px 0 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 8px 0 0;"><strong>Subject:</strong> ${subject}</p>
        </div>
        <p><strong>Message:</strong></p>
        <p style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
          ${message}
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          Reply directly to this email to respond to the student.
        </p>
      </div>
    `,
  });

  // Send confirmation email to student
  await sendEmail({
    to: email,
    subject: `We received your message — ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Message Received ✅</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you within 1-2 working days.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 8px 0 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 8px 0 0;"><strong>Message:</strong> ${message}</p>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          If urgent, please call us directly at +91 98765 43210.
        </p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: "Message sent successfully! We will get back to you within 1-2 working days.",
  });
});
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters.",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from current password.",
    });
  }

  // Get student with password field
  const student = await Student.findById(req.user._id).select("+password");

  // Check current password
  const isMatch = await student.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect.",
    });
  }

  // Update password — pre save hook will hash it
  student.password = newPassword;
  await student.save();

  res.json({
    success: true,
    message: "Password changed successfully!",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadPhoto,
  contactPlacementCell,
  changePassword,
};
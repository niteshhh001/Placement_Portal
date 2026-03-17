const jwt = require("jsonwebtoken");
const Student = require("../models/Student.model");
const Admin = require("../models/Admin.model");
const Otp = require("../models/Otp.model");
const { asyncHandler } = require("../middleware/error.middleware");
const { sendEmail } = require("../utils/email.util");

const ALLOWED_DOMAIN = process.env.UNIVERSITY_DOMAIN || "dtu.ac.in";

const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
  return { accessToken, refreshToken };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Step 1 — Validate email domain + send OTP
// @route   POST /api/auth/student/register
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, branch, year, phone } = req.body;

  const emailDomain = email.split("@")[1];
  if (emailDomain !== ALLOWED_DOMAIN) {
    return res.status(400).json({
      success: false,
      message: `Only ${ALLOWED_DOMAIN} email addresses are allowed.`,
    });
  }

  const exists = await Student.findOne({ $or: [{ email }, { rollNo }] });
  if (exists) {
    const field = exists.email === email ? "Email" : "Roll number";
    return res.status(400).json({
      success: false,
      message: `${field} already registered.`,
    });
  }

  await Otp.deleteMany({ email });

  const otp = generateOTP();

  await Otp.create({
    email,
    otp,
    data: { name, email, password, rollNo, branch, year, phone },
  });

  await sendEmail({
    to: email,
    subject: "Verify your email — Placement Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Email Verification</h2>
        <p>Hi ${name},</p>
        <p>Use the OTP below to complete your registration on the Placement Portal.</p>
        <div style="background: #F3F4F6; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h1 style="letter-spacing: 8px; color: #111827; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #6B7280;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: `OTP sent to ${email}. Please verify to complete registration.`,
  });
});

// @desc    Step 2 — Verify OTP + create account
// @route   POST /api/auth/student/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "OTP expired or not found. Please register again.",
    });
  }

  if (otpRecord.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
    });
  }

  const { name, password, rollNo, branch, year, phone } = otpRecord.data;

  const student = await Student.create({
    name, email, password, rollNo, branch, year, phone,
  });

  await Otp.deleteMany({ email });

  // Notify admin about new registration
  try {
    const Admin = require("../models/Admin.model");
    const admins = await Admin.find().select("email");
    const adminEmails = admins.map((a) => a.email).join(",");

    await sendEmail({
      to: adminEmails,
      subject: "New Student Registration — Verification Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Student Registration</h2>
          <p>A new student has registered on the Placement Portal and requires verification.</p>
          <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 8px 0 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0 0;"><strong>Roll No:</strong> ${rollNo}</p>
            <p style="margin: 8px 0 0;"><strong>Branch:</strong> ${branch}</p>
            <p style="margin: 8px 0 0;"><strong>Year:</strong> ${year}</p>
          </div>
          <p>Please login to the admin portal and verify this student.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to notify admin:", err.message);
  }

  const { accessToken, refreshToken } = generateTokens(student._id, "student");

  res.status(201).json({
    success: true,
    message: "Registration successful! Welcome to the Placement Portal. Please wait for admin verification before applying.",
    accessToken,
    refreshToken,
    user: {
      id: student._id,
      name: student.name,
      email: student.email,
      rollNo: student.rollNo,
      role: "student",
      isVerified: false,
    },
  });
});

// @desc    Login — student or admin
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let user = await Admin.findOne({ email }).select("+password");
  let role = "admin";

  if (!user) {
    user = await Student.findOne({ email }).select("+password");
    role = "student";
  }

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  // Check if student is blocked — prevent login
  if (role === "student" && user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: `Your account has been debarred. Reason: ${user.blockReason || "Unfair means"}. Please contact the placement cell.`,
      isBlocked: true,
    });
  }

  const { accessToken, refreshToken } = generateTokens(user._id, role);

  res.json({
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role,
      ...(role === "student" && { rollNo: user.rollNo, branch: user.branch }),
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Refresh token required.",
    });
  }
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id, decoded.role);
  res.json({ success: true, accessToken, refreshToken: newRefresh });
});

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Send password reset OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  let user = await Student.findOne({ email });
  let role = "student";

  if (!user) {
    user = await Admin.findOne({ email });
    role = "admin";
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email.",
    });
  }

  await Otp.deleteMany({ email });

  const otp = generateOTP();

  await Otp.create({
    email,
    otp,
    data: { role },
  });

  await sendEmail({
    to: email,
    subject: "Password Reset OTP — Placement Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reset Your Password</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your Placement Portal account.</p>
        <div style="background: #F3F4F6; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h1 style="letter-spacing: 8px; color: #111827; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #6B7280;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: `OTP sent to ${email}. Please check your inbox.`,
  });
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "OTP expired or not found. Please try again.",
    });
  }

  if (otpRecord.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
    });
  }

  let user = await Student.findOne({ email });
  if (!user) {
    user = await Admin.findOne({ email });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  user.password = newPassword;
  await user.save();

  await Otp.deleteMany({ email });

  res.json({
    success: true,
    message: "Password reset successful! Please login with your new password.",
  });
});

module.exports = {
  registerStudent,
  verifyOtp,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
};
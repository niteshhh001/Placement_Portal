const jwt = require("jsonwebtoken");
const Student = require("../models/Student.model");
const Admin = require("../models/Admin.model");
const Otp = require("../models/Otp.model");
const { asyncHandler } = require("../middleware/error.middleware");
const { sendEmail } = require("../utils/email.util");

// ── Config ────────────────────────────────────────────────────────────────────
// Add your allowed university domain here
const ALLOWED_DOMAIN = process.env.UNIVERSITY_DOMAIN || "dtu.ac.in";

// Generate tokens
const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
  return { accessToken, refreshToken };
};

// Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Step 1 — Validate email domain + send OTP
// @route   POST /api/auth/student/register
// @access  Public
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, branch, year, phone } = req.body;

  // Check university email domain
  const emailDomain = email.split("@")[1];
  if (emailDomain !== ALLOWED_DOMAIN) {
    return res.status(400).json({
      success: false,
      message: `Only ${ALLOWED_DOMAIN} email addresses are allowed.`,
    });
  }

  // Check if email or rollNo already registered
  const exists = await Student.findOne({ $or: [{ email }, { rollNo }] });
  if (exists) {
    const field = exists.email === email ? "Email" : "Roll number";
    return res.status(400).json({
      success: false,
      message: `${field} already registered.`,
    });
  }

  // Delete any previous OTP for this email
  await Otp.deleteMany({ email });

  // Generate OTP
  const otp = generateOTP();

  // Save OTP + registration data temporarily
  await Otp.create({
    email,
    otp,
    data: { name, email, password, rollNo, branch, year, phone },
  });

  // Send OTP email
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
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Find OTP record
  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "OTP expired or not found. Please register again.",
    });
  }

  // Check OTP match
  if (otpRecord.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
    });
  }

  // OTP is valid — create the student account
  const { name, password, rollNo, branch, year, phone } = otpRecord.data;

  const student = await Student.create({
    name, email, password, rollNo, branch, year, phone,
  });

  // Delete OTP record
  await Otp.deleteMany({ email });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(student._id, "student");

  res.status(201).json({
    success: true,
    message: "Registration successful! Welcome to the Placement Portal.",
    accessToken,
    refreshToken,
    user: {
      id: student._id,
      name: student.name,
      email: student.email,
      rollNo: student.rollNo,
      role: "student",
    },
  });
});

// @desc    Login — student or admin
// @route   POST /api/auth/login
// @access  Public
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
// @access  Public
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
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { registerStudent, verifyOtp, login, refreshToken, getMe };
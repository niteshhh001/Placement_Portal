const jwt = require("jsonwebtoken");
const Student = require("../models/Student.model");
const Admin = require("../models/Admin.model");
const { asyncHandler } = require("../middleware/error.middleware");

const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
  return { accessToken, refreshToken };
};

const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, branch, year, phone } = req.body;
  const exists = await Student.findOne({ $or: [{ email }, { rollNo }] });
  if (exists) {
    const field = exists.email === email ? "Email" : "Roll number";
    return res.status(400).json({ success: false, message: `${field} already registered.` });
  }
  const student = await Student.create({ name, email, password, rollNo, branch, year, phone });
  const { accessToken, refreshToken } = generateTokens(student._id, "student");
  res.status(201).json({
    success: true,
    message: "Registration successful.",
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

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let user = await Admin.findOne({ email }).select("+password");
  let role = "admin";
  if (!user) {
    user = await Student.findOne({ email }).select("+password");
    role = "student";
  }
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
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

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "Refresh token required." });
  }
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id, decoded.role);
  res.json({ success: true, accessToken, refreshToken: newRefresh });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { registerStudent, login, refreshToken, getMe };
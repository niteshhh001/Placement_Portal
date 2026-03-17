const express = require("express");
const router = express.Router();
const {
  registerStudent,
  verifyOtp,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validate,
  registerRequestSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../middleware/validate.middleware");

router.post("/student/register", validate(registerRequestSchema), registerStudent);
router.post("/student/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
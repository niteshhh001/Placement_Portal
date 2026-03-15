const express = require("express");
const router = express.Router();
const { registerStudent, login, refreshToken, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate, registerStudentSchema, loginSchema } = require("../middleware/validate.middleware");

router.post("/student/register", validate(registerStudentSchema), registerStudent);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);

module.exports = router;
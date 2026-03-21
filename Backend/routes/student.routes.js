const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadResume,
  uploadPhoto,
  contactPlacementCell,
  changePassword,
} = require("../controllers/student.controller");
const { protect, studentOnly } = require("../middleware/auth.middleware");
const {
  uploadResume: resumeUpload,
  uploadPhoto: photoUpload,
} = require("../config/cloudinary");

router.use(protect, studentOnly);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/resume", resumeUpload.single("resume"), uploadResume);
router.post("/photo", photoUpload.single("photo"), uploadPhoto);
router.post("/contact", contactPlacementCell);
router.post("/change-password", changePassword);

module.exports = router;
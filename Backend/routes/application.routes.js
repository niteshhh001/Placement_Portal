const express = require("express");
const router = express.Router();
const {
  getMyApplications,
  getApplicationById,
  withdrawApplication,
} = require("../controllers/application.controller");
const { protect, studentOnly } = require("../middleware/auth.middleware");

router.use(protect, studentOnly);

router.get("/me", getMyApplications);
router.get("/:id", getApplicationById);
router.delete("/:id", withdrawApplication);

module.exports = router;
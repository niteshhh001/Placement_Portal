const jwt = require("jsonwebtoken");
const Student = require("../models/Student.model");
const Admin = require("../models/Admin.model");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
    } else {
      user = await Student.findById(decoded.id);
    }

    if (!user) return res.status(401).json({ success: false, message: "User no longer exists." });

    // Check student account status
    if (decoded.role === "student") {
      if (user.accountStatus === "pending_activation") {
        return res.status(403).json({
          success: false,
          message: "Please activate your account. Check your email for the activation link.",
          accountStatus: "pending_activation",
        });
      }

      if (user.accountStatus === "pending_verification") {
        return res.status(403).json({
          success: false,
          message: "Your account is pending verification by the placement cell.",
          accountStatus: "pending_verification",
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: `Your account has been debarred. Reason: ${user.blockReason || "Unfair means"}. Please contact the placement cell.`,
          isBlocked: true,
        });
      }
    }

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const adminOnly = (req, res, next) => {
  if (req.role !== "admin") return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  next();
};

const studentOnly = (req, res, next) => {
  if (req.role !== "student") return res.status(403).json({ success: false, message: "Access denied. Students only." });
  next();
};

module.exports = { protect, adminOnly, studentOnly };

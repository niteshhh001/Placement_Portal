require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Admin = require("../models/Admin.model");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    const existing = await Admin.findOne({ email: "admin@college.edu" });
    if (existing) { console.log("ℹ️  Admin already exists."); process.exit(0); }
    await Admin.create({
      name: "Placement Admin",
      email: "admin@college.edu",
      password: "Admin@123",
      designation: "Placement Coordinator",
    });
    console.log("✅ Admin created → admin@college.edu / Admin@123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  }
};

seedAdmin();
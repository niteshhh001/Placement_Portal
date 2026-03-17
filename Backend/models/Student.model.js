const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const educationSchema = new mongoose.Schema({
  level: { type: String, enum: ["10th", "12th", "diploma", "ug"], required: true },
  institution: String,
  board: String,
  percentage: Number,
  cgpa: Number,
  passingYear: Number,
});

const studentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, default: "student" },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, unique: true, uppercase: true },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    photoUrl: { type: String, default: "" },
    branch: { type: String, enum: ["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"], required: true },
    year: { type: Number, enum: [1, 2, 3, 4], required: true },
    section: { type: String },
    cgpa: { type: Number, min: 0, max: 10 },
    activeBacklogs: { type: Number, default: 0 },
    totalBacklogs: { type: Number, default: 0 },
    education: [educationSchema],
    skills: [{ type: String }],
    internships: [{ company: String, role: String, duration: String, description: String }],
    resumeUrl: { type: String, default: "" },
    resumePublicId: { type: String, default: "" },
    isPlaced: { type: Boolean, default: false },
    placedAt: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    placedCompany: { type: String },
    ctcOffered: { type: Number },
    isProfileComplete: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: "" },
  },
  { timestamps: true }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

studentSchema.methods.checkProfileComplete = function () {
  const required = [this.name, this.rollNo, this.phone, this.branch, this.cgpa, this.resumeUrl];
  this.isProfileComplete = required.every(Boolean);
  return this.isProfileComplete;
};

module.exports = mongoose.model("Student", studentSchema);
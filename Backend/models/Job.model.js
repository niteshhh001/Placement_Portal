const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date },
  venue: { type: String },
  description: { type: String },
});

const jobSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    companyLogo: { type: String, default: "" },
    companyWebsite: { type: String },
    companyDescription: { type: String },
    sector: {
      type: String,
      enum: ["IT", "Core", "Finance", "Consulting", "Government", "Other"],
      default: "IT",
    },
    jobRole: { type: String, required: true },
    jobType: { type: String, enum: ["Full-time", "Intern", "Intern+PPO", "Intern+FTE"], default: "Full-time" },    location: [{ type: String }],
    ctc: { type: Number, required: true },
    stipend: { type: Number },
    bond: { type: Number, default: 0 },
    bondDetails: { type: String },
    jobDescription: { type: String },
    eligibility: {
  minCgpa: { type: Number, default: 0 },
  min10thMarks: { type: Number, default: 0 },
  min12thMarks: { type: Number, default: 0 },
  allowedBranches: {
    type: [String],
    enum: ["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER", "ALL"],
    default: ["ALL"],
  },
  maxActiveBacklogs: { type: Number, default: 0 },
  maxTotalBacklogs: { type: Number, default: 0 },
  allowPlaced: { type: Boolean, default: false },
  minYear: { type: Number, default: 4 },
    },
    applicationDeadline: { type: Date, required: true },
    driveDate: { type: Date },
    rounds: [roundSchema],
    status: {
      type: String,
      enum: ["upcoming", "open", "closed", "completed"],
      default: "open",
    },
    isDreamCompany: { type: Boolean, default: false },
    totalApplicants: { type: Number, default: 0 },
    totalSelected: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, "eligibility.allowedBranches": 1 });

module.exports = mongoose.model("Job", jobSchema);
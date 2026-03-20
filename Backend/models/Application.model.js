const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "aptitude", "gd", "technical", "hr", "selected", "rejected", "on-hold"],
      default: "applied",
    },
    roundsCleared: [
      {
        roundName: String,
        clearedAt: Date,
        remarks: String,
      },
    ],
    adminRemarks: { type: String },
    offerLetterUrl: { type: String },
    offerAccepted: { type: Boolean },
    offerAcceptedAt: { type: Date },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, job: 1 }, { unique: true });

applicationSchema.index({ student: 1, appliedAt: -1 }); // speeds up student's applications query
applicationSchema.index({ job: 1, student: 1 }, { unique: true }); // already exists but make sure
applicationSchema.index({ job: 1, status: 1 }); // speeds up admin applicants query

module.exports = mongoose.model("Application", applicationSchema);
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    performedByName: { type: String },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    jobName: { type: String },
    status: { type: String },
    fileName: { type: String },
    totalProvided: { type: Number, default: 0 },
    totalMatched: { type: Number, default: 0 },
    totalUpdated: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    notFound: [{ type: String }],
    duplicates: [{ type: String }],
    alreadySameStatus: [{ type: String }],
    errors: [{ type: String }],
    isDryRun: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
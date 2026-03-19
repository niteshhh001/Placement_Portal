const Job = require("../models/Job.model");
const Student = require("../models/Student.model");
const {
  withCache,
  invalidateCache,
  invalidateAll,
  CACHE_KEYS,
  TTL,
  getPerformanceStats,
} = require("../utils/cache.util");
const { asyncHandler } = require("../middleware/error.middleware");
//const Job = require("../models/Job.model");
//const Student = require("../models/Student.model");
const Application = require("../models/Application.model");
const XLSX = require("xlsx");
//const { asyncHandler } = require("../middleware/error.middleware");
const { sendEmail } = require("../utils/email.util");
// Create job posting
const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, createdBy: req.user._id });

  // Send email to all students instantly
  try {
    const allStudents = await Student.find().select("email name");

    if (allStudents.length > 0) {
      const emails = allStudents.map((s) => s.email).join(",");

      await sendEmail({
        to: emails,
        subject: `New Placement Drive — ${job.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">New Placement Opportunity!</h2>
            <p>Dear Student,</p>
            <p>A new company has been added to the placement portal. Login to check your eligibility and apply before the deadline!</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #111827;">${job.companyName}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6B7280; width: 140px;">Role</td>
                  <td style="padding: 6px 0; font-weight: 600;">${job.jobRole}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">CTC</td>
                  <td style="padding: 6px 0; font-weight: 600;">₹${job.ctc} LPA</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Job Type</td>
                  <td style="padding: 6px 0;">${job.jobType}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Location</td>
                  <td style="padding: 6px 0;">${job.location?.join(", ") || "TBD"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Sector</td>
                  <td style="padding: 6px 0;">${job.sector}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Min CGPA</td>
                  <td style="padding: 6px 0;">${job.eligibility.minCgpa}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Eligible Branches</td>
                  <td style="padding: 6px 0;">${job.eligibility.allowedBranches.join(", ")}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Apply By</td>
                  <td style="padding: 6px 0; color: #DC2626; font-weight: 600;">
                    ${new Date(job.applicationDeadline).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Drive Date</td>
                  <td style="padding: 6px 0;">
                    ${job.driveDate
                      ? new Date(job.driveDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric"
                        })
                      : "To be announced"}
                  </td>
                </tr>
              </table>
            </div>

            ${job.jobDescription
              ? `<p><strong>About the Role:</strong> ${job.jobDescription}</p>`
              : ""}

            ${job.rounds && job.rounds.length > 0
              ? `<p><strong>Selection Rounds:</strong> ${job.rounds.map((r) => r.name).join(" → ")}</p>`
              : ""}

            <p style="margin-top: 20px;">
              <a href="${process.env.CLIENT_URL}/jobs" 
                style="background: #4F46E5; color: white; padding: 12px 24px; 
                border-radius: 6px; text-decoration: none; font-weight: 600;">
                View & Apply Now
              </a>
            </p>

            <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
              This is an automated notification from your college placement portal.<br>
              Please do not reply to this email.
            </p>
          </div>
        `,
      });

      console.log(`📧 Job notification sent to ${allStudents.length} students`);
    }
  } catch (err) {
    console.error("❌ Failed to send job notification:", err.message);
  }
    // Invalidate cache so new job appears immediately
  invalidateCache(CACHE_KEYS.ALL_JOBS, CACHE_KEYS.OPEN_JOBS, CACHE_KEYS.STATS);


  res.status(201).json({
    success: true,
    message: "Job posting created.",
    data: job,
  });
});

// Update job posting
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });
  invalidateCache(CACHE_KEYS.ALL_JOBS, CACHE_KEYS.STATS);
  res.json({ success: true, data: job });
});

// Close a job
const deleteJob = asyncHandler(async (req, res) => {
  await Job.findByIdAndUpdate(req.params.id, { status: "closed" });
  invalidateCache(CACHE_KEYS.ALL_JOBS, CACHE_KEYS.STATS);
  res.json({ success: true, message: "Job closed successfully." });
});

// Get all jobs (admin view)
const getAllJobs = asyncHandler(async (req, res) => {
  const data = await withCache(CACHE_KEYS.ALL_JOBS, TTL.JOBS, async () => {
    return await Job.find().sort({ createdAt: -1 });
  });
  res.json({ success: true, count: data.length, data });
});

// Dashboard stats
const getStats = asyncHandler(async (req, res) => {
  const data = await withCache(CACHE_KEYS.STATS, TTL.STATS, async () => {
    const [totalStudents, placedStudents, totalJobs, totalApplications] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isPlaced: true }),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: "$branch",
          total: { $sum: 1 },
          placed: { $sum: { $cond: ["$isPlaced", 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const placedStudentsData = await Student.find(
      { isPlaced: true, ctcOffered: { $exists: true, $ne: null } },
      { ctcOffered: 1 }
    );

    const packages = placedStudentsData.map((s) => s.ctcOffered).sort((a, b) => a - b);
    const avgPackage = packages.length
      ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2)
      : 0;
    const maxPackage = packages.length ? packages[packages.length - 1] : 0;
    const minPackage = packages.length ? packages[0] : 0;

    let medianPackage = 0;
    if (packages.length > 0) {
      const mid = Math.floor(packages.length / 2);
      medianPackage = packages.length % 2 !== 0
        ? packages[mid]
        : ((packages[mid - 1] + packages[mid]) / 2).toFixed(2);
    }

    const companiesVisited = await Job.countDocuments();
    const companiesHired = await Job.countDocuments({ totalSelected: { $gt: 0 } });

    const topCompanies = await Job.find({ totalSelected: { $gt: 0 } })
      .sort({ totalSelected: -1 })
      .limit(5)
      .select("companyName jobRole ctc totalSelected totalApplicants");

    const currentYear = new Date().getFullYear();
    const monthlyTrend = await Student.aggregate([
      {
        $match: {
          isPlaced: true,
          updatedAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      { $group: { _id: { $month: "$updatedAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const packageDistribution = await Student.aggregate([
      { $match: { isPlaced: true, ctcOffered: { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: "$ctcOffered",
          boundaries: [0, 3, 5, 8, 12, 20, 50],
          default: "50+ LPA",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const yearStats = await Student.aggregate([
      {
        $group: {
          _id: "$year",
          total: { $sum: 1 },
          placed: { $sum: { $cond: ["$isPlaced", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      overview: {
        totalStudents,
        placedStudents,
        unplacedStudents: totalStudents - placedStudents,
        placementRate: totalStudents
          ? ((placedStudents / totalStudents) * 100).toFixed(1)
          : 0,
        totalJobs,
        totalApplications,
        companiesVisited,
        companiesHired,
      },
      packageStats: { avgPackage, maxPackage, minPackage, medianPackage },
      branchStats,
      yearStats,
      monthlyTrend,
      packageDistribution,
      topCompanies,
    };
  });

  res.json({ success: true, data });
});
// @desc    Get all applicants for a job
// @route   GET /api/admin/jobs/:id/applicants
const getApplicants = asyncHandler(async (req, res) => {
  const { status, branch, minCgpa } = req.query;
  const query = { job: req.params.id };
  if (status) query.status = status;

  let applicants = await Application.find(query)
    .populate("student", "name rollNo email phone branch cgpa activeBacklogs isPlaced photoUrl resumeUrl")
    .sort({ appliedAt: -1 });

  // Optional filters
  if (branch) applicants = applicants.filter((a) => a.student?.branch === branch);
  if (minCgpa) applicants = applicants.filter((a) => a.student?.cgpa >= parseFloat(minCgpa));

  res.json({ success: true, count: applicants.length, data: applicants });
});

// @desc    Update application status
// @route   PATCH /api/admin/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks, roundName } = req.body;

  const application = await Application.findById(req.params.id)
    .populate("student job");
  if (!application) return res.status(404).json({ success: false, message: "Application not found." });

  application.status = status;
  if (adminRemarks) application.adminRemarks = adminRemarks;

  // Track round cleared
  if (roundName) {
    application.roundsCleared.push({
      roundName,
      clearedAt: new Date(),
      remarks: adminRemarks,
    });
  }

  await application.save();

  // If selected — mark student as placed
  if (status === "selected") {
    await Student.findByIdAndUpdate(application.student._id, {
      isPlaced: true,
      placedAt: application.job._id,
      placedCompany: application.job.companyName,
      ctcOffered: application.job.ctc,
    });
    await Job.findByIdAndUpdate(application.job._id, { $inc: { totalSelected: 1 } });

    await sendEmail({
      to: application.student.email,
      subject: `Congratulations! Selected at ${application.job.companyName}`,
      html: `
        <h2>Congratulations, ${application.student.name}!</h2>
        <p>You have been <strong>selected</strong> for <strong>${application.job.jobRole}</strong> 
        at <strong>${application.job.companyName}</strong>.</p>
        <p>CTC: ₹${application.job.ctc} LPA</p>
        <p>The placement cell will share the offer letter shortly.</p>
      `,
    });
  }

  if (status === "rejected") {
    await sendEmail({
      to: application.student.email,
      subject: `Update on your application at ${application.job.companyName}`,
      html: `
        <p>Dear ${application.student.name},</p>
        <p>We regret to inform you that you were not selected for 
        <strong>${application.job.jobRole}</strong> at <strong>${application.job.companyName}</strong>.</p>
        <p>Keep applying — best of luck!</p>
      `,
    });
  }
  invalidateCache(CACHE_KEYS.STATS);
  res.json({ success: true, message: "Status updated.", data: application });
});

// @desc    Export applicants to Excel
// @route   GET /api/admin/jobs/:id/export
const exportApplicantsExcel = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });

const applications = await Application.find({ job: req.params.id })
  .populate("student", "name rollNo email phone branch cgpa activeBacklogs totalBacklogs isPlaced resumeUrl")
  .sort({ appliedAt: -1 });

const rows = applications.map((app, i) => ({
  "#": i + 1,
  "Name": app.student?.name || "N/A",
  "Roll No": app.student?.rollNo || "N/A",
  "Email": app.student?.email || "N/A",
  "Phone": app.student?.phone || "N/A",
  "Branch": app.student?.branch || "N/A",
  "CGPA": app.student?.cgpa || "N/A",
  "Active Backlogs": app.student?.activeBacklogs ?? 0,
  "Total Backlogs": app.student?.totalBacklogs ?? 0,
  "Status": app.status,
  "Applied At": new Date(app.appliedAt).toLocaleDateString("en-IN"),
  "Remarks": app.adminRemarks || "",
  "Resume Link": app.student?.resumeUrl
    ? app.student.resumeUrl.replace("/raw/upload/", "/image/upload/")
    : "Not uploaded",
}));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applicants");

ws["!cols"] = [
  { wch: 4 },  // #
  { wch: 25 }, // Name
  { wch: 14 }, // Roll No
  { wch: 30 }, // Email
  { wch: 14 }, // Phone
  { wch: 8 },  // Branch
  { wch: 8 },  // CGPA
  { wch: 14 }, // Active Backlogs
  { wch: 14 }, // Total Backlogs
  { wch: 14 }, // Status
  { wch: 14 }, // Applied At
  { wch: 30 }, // Remarks
  { wch: 80 }, // Resume Link
];

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `${job.companyName.replace(/\s+/g, "_")}_applicants.xlsx`;

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// @desc    Get all students
// @route   GET /api/admin/students
const getAllStudents = asyncHandler(async (req, res) => {
  const { branch, year, isPlaced, minCgpa, search } = req.query;

  // Only use cache when no filters applied
  if (!branch && !year && !isPlaced && !minCgpa && !search) {
    const data = await withCache(CACHE_KEYS.ALL_STUDENTS, TTL.STUDENTS, async () => {
      return await Student.find().sort({ name: 1 });
    });
    return res.json({ success: true, count: data.length, data });
  }

  // With filters — skip cache
  const query = {};
  if (branch) query.branch = branch;
  if (year) query.year = parseInt(year);
  if (isPlaced !== undefined) query.isPlaced = isPlaced === "true";
  if (minCgpa) query.cgpa = { $gte: parseFloat(minCgpa) };
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { rollNo: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const students = await Student.find(query).sort({ name: 1 });
  res.json({ success: true, count: students.length, data: students });
});

// @desc    Verify a student
// @route   PATCH /api/admin/students/:id/verify
const verifyStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  // Send verification email to student
  await sendEmail({
    to: student.email,
    subject: "Account Verified — You can now apply to companies!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16A34A;">Account Verified! ✅</h2>
        <p>Dear ${student.name},</p>
        <p>Your placement portal account has been <strong>verified</strong> by the placement cell.</p>
        <p>You can now login and apply to companies on the portal.</p>
        <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Roll No:</strong> ${student.rollNo}</p>
          <p style="margin: 8px 0 0;"><strong>Branch:</strong> ${student.branch}</p>
        </div>
        <p>Good luck with your placements!</p>
      </div>
    `,
  });
  invalidateCache(CACHE_KEYS.ALL_STUDENTS, CACHE_KEYS.STATS);
  res.json({ success: true, message: "Student verified. Email sent.", data: student });
});

// @desc    Bulk notify students
// @route   POST /api/admin/notify
const bulkNotify = asyncHandler(async (req, res) => {
  const { jobId, subject, message, branches } = req.body;

  const query = { isVerified: true, isProfileComplete: true };
  if (branches && branches.length) query.branch = { $in: branches };

  if (jobId) {
    const job = await Job.findById(jobId);
    if (job) {
      query.cgpa = { $gte: job.eligibility.minCgpa };
      query.activeBacklogs = { $lte: job.eligibility.maxActiveBacklogs };
      if (!job.eligibility.allowedBranches.includes("ALL")) {
        query.branch = { $in: job.eligibility.allowedBranches };
      }
    }
  }

  const students = await Student.find(query).select("email name");
  const emails = students.map((s) => s.email);

  await sendEmail({ to: emails.join(","), subject, html: message });
  res.json({ success: true, message: `Notification sent to ${emails.length} students.` });
});

// Block a student
const blockStudent = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    {
      isBlocked: true,
      blockReason: reason || "Unfair means in placement process",
    },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  // Send email to student
  await sendEmail({
    to: student.email,
    subject: "Account Debarred — Placement Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Account Debarred</h2>
        <p>Dear ${student.name},</p>
        <p>Your placement portal account has been <strong>debarred</strong> by the placement cell.</p>
        <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #DC2626;">
          <p style="margin: 0;"><strong>Reason:</strong> ${reason || "Unfair means in placement process"}</p>
        </div>
        <p>You will no longer be able to access the placement portal or apply to any companies.</p>
        <p>If you believe this is a mistake, please contact the placement cell immediately.</p>
      </div>
    `,
  });
  invalidateCache(CACHE_KEYS.ALL_STUDENTS);
  res.json({
    success: true,
    message: `${student.name} has been debarred.`,
    data: student,
  });
});

// Unblock a student
const unblockStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    {
      isBlocked: false,
      blockReason: "",
    },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  // Send email to student
  await sendEmail({
    to: student.email,
    subject: "Account Reinstated — Placement Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16A34A;">Account Reinstated</h2>
        <p>Dear ${student.name},</p>
        <p>Your placement portal account has been <strong>reinstated</strong> by the placement cell.</p>
        <p>You can now login and apply to companies again.</p>
        <p>Please ensure you follow all placement rules going forward.</p>
      </div>
    `,
  });
  invalidateCache(CACHE_KEYS.ALL_STUDENTS);
  res.json({
    success: true,
    message: `${student.name} has been reinstated.`,
    data: student,
  });
});

module.exports = {
  createJob, updateJob, deleteJob, getAllJobs,
  getApplicants, updateApplicationStatus, exportApplicantsExcel,
  getAllStudents, verifyStudent, blockStudent, unblockStudent,
  getStats, bulkNotify,
};
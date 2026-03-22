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
const AuditLog = require("../models/AuditLog.model");
const crypto = require("crypto");

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
  const { status, branch, page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const cacheKey = `applicants_${req.params.id}_p${pageNum}_s${status || "all"}_b${branch || "all"}`;

  const result = await withCache(cacheKey, 60, async () => {
    const query = { job: req.params.id };
    if (status) query.status = status;

    const [applicants, total] = await Promise.all([
      Application.find(query)
        .populate("student", "name rollNo email phone branch cgpa activeBacklogs isPlaced photoUrl resumeUrl")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Application.countDocuments(query),
    ]);

    let filtered = applicants;
    if (branch) filtered = applicants.filter((a) => a.student?.branch === branch);

    return {
      count: filtered.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: filtered,
    };
  });

  res.json({ success: true, ...result });
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
  // Invalidate applicants cache for this job
invalidateCache(`applicants_${application.job}_p1_sall_ball`);
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
  const { branch, year, isPlaced, minCgpa, search, page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Use cache only when no filters applied
  const hasFilters = branch || year || isPlaced || minCgpa || search;

  if (!hasFilters) {
    const cacheKey = `all_students_p${pageNum}`;
    const result = await withCache(cacheKey, TTL.STUDENTS, async () => {
      const [students, total] = await Promise.all([
        Student.find().sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
        Student.countDocuments(),
      ]);
      return {
        count: students.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: students,
      };
    });
    return res.json({ success: true, ...result });
  }

  // With filters — skip cache, hit DB directly
  const query = {};
  if (branch) query.branch = branch;
  if (year) query.year = parseInt(year);
  if (isPlaced !== undefined && isPlaced !== "") query.isPlaced = isPlaced === "true";
  if (minCgpa) query.cgpa = { $gte: parseFloat(minCgpa) };
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { rollNo: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const [students, total] = await Promise.all([
    Student.find(query).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
    Student.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: students.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    data: students,
  });
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
invalidateCache(CACHE_KEYS.ALL_STUDENTS, "all_students_p1", "all_students_p2", "all_students_p3");
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
invalidateCache(CACHE_KEYS.ALL_STUDENTS, "all_students_p1", "all_students_p2", "all_students_p3");
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
invalidateCache(CACHE_KEYS.ALL_STUDENTS, "all_students_p1", "all_students_p2", "all_students_p3");
  res.json({
    success: true,
    message: `${student.name} has been reinstated.`,
    data: student,
  });
});
const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const {
    status,
    rollNumbers,
    isDryRun = false,
    fileName = "unknown",
  } = req.body;

  if (!rollNumbers || !Array.isArray(rollNumbers) || rollNumbers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide roll numbers array.",
    });
  }

  // Normalize roll numbers
  const normalizeRollNo = (r) => {
    return String(r)
      .toUpperCase()
      .trim()
      .replace(/[-_\s\/]/g, "")  // remove dashes, underscores, spaces, slashes
      .replace(/^0+/, "");        // remove leading zeros
  };

  const normalizedInput = rollNumbers.map(normalizeRollNo);

  // Remove duplicates
  const uniqueInput = [...new Set(normalizedInput)];
  const duplicates = normalizedInput.filter(
    (r, i) => normalizedInput.indexOf(r) !== i
  );

  // Find all students
  const allStudents = await Student.find({}, { rollNo: 1, name: 1, email: 1 });

  // Match with normalization
  const matchedStudents = allStudents.filter((s) =>
    uniqueInput.includes(normalizeRollNo(s.rollNo))
  );

  const matchedRollNos = matchedStudents.map((s) => normalizeRollNo(s.rollNo));
  const notFound = uniqueInput.filter((r) => !matchedRollNos.includes(r));

  if (matchedStudents.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No students found with provided roll numbers.",
      data: {
        totalProvided: rollNumbers.length,
        totalMatched: 0,
        notFound: uniqueInput,
      },
    });
  }

  const studentIds = matchedStudents.map((s) => s._id);

  // Find applications for this job
  const applications = await Application.find({
    job: req.params.id,
    student: { $in: studentIds },
  }).populate("student job");

  // Find already same status (skip these)
  const alreadySameStatus = applications
    .filter((app) => app.status === status)
    .map((app) => app.student?.rollNo);

  // Applications that need updating
  const toUpdate = applications.filter((app) => app.status !== status);

  // DRY RUN — return preview without updating
  if (isDryRun) {
    return res.json({
      success: true,
      isDryRun: true,
      message: "Dry run complete — no changes made.",
      preview: {
        totalProvided: rollNumbers.length,
        uniqueProvided: uniqueInput.length,
        duplicatesInFile: duplicates.length,
        duplicates,
        totalMatched: matchedStudents.length,
        notFound: notFound.length,
        notFoundList: notFound,
        alreadySameStatus: alreadySameStatus.length,
        alreadySameStatusList: alreadySameStatus,
        willBeUpdated: toUpdate.length,
        students: toUpdate.map((app) => ({
          name: app.student?.name,
          rollNo: app.student?.rollNo,
          currentStatus: app.status,
          newStatus: status,
        })),
      },
    });
  }

  // ACTUAL UPDATE — process in batches
  const updated = [];
  const errors = [];

  for (const app of toUpdate) {
    try {
      app.status = status;
      await app.save();

      // Send email only if status actually changed
      if (status === "shortlisted") {
        await sendEmail({
          to: app.student.email,
          subject: `Eligible for Online Assessment — ${app.job.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Congratulations! 🎉</h2>
              <p>Dear ${app.student.name},</p>
              <p>You are <strong>eligible for the Online Assessment</strong> at 
              <strong>${app.job.companyName}</strong>.</p>
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Role:</strong> ${app.job.jobRole}</p>
                <p style="margin: 8px 0 0;"><strong>CTC:</strong> ₹${app.job.ctc} LPA</p>
              </div>
              <p>Please check the placement portal for further updates and exam details.</p>
            </div>
          `,
        });
      }

      if (status === "aptitude") {
        await sendEmail({
          to: app.student.email,
          subject: `Aptitude Test Cleared — ${app.job.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Aptitude Test Cleared! 🎉</h2>
              <p>Dear ${app.student.name},</p>
              <p>You have cleared the <strong>Aptitude Test</strong> at 
              <strong>${app.job.companyName}</strong> and are now eligible for the next round.</p>
              <p>Please check the portal for further updates.</p>
            </div>
          `,
        });
      }

      if (status === "technical") {
        await sendEmail({
          to: app.student.email,
          subject: `Eligible for Technical Interview — ${app.job.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Eligible for Technical Interview! 🎉</h2>
              <p>Dear ${app.student.name},</p>
              <p>You are <strong>eligible for the Technical Interview</strong> at 
              <strong>${app.job.companyName}</strong>.</p>
              <p>Please check the portal for interview schedule and details.</p>
            </div>
          `,
        });
      }

      if (status === "hr") {
        await sendEmail({
          to: app.student.email,
          subject: `Eligible for HR Interview — ${app.job.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Eligible for HR Interview! 🎉</h2>
              <p>Dear ${app.student.name},</p>
              <p>You are <strong>eligible for the HR Interview</strong> at 
              <strong>${app.job.companyName}</strong>.</p>
              <p>Please check the portal for interview schedule and details.</p>
            </div>
          `,
        });
      }

      if (status === "selected") {
        await Student.findByIdAndUpdate(app.student._id, {
          isPlaced: true,
          placedAt: app.job._id,
          placedCompany: app.job.companyName,
          ctcOffered: app.job.ctc,
        });
        await Job.findByIdAndUpdate(app.job._id, { $inc: { totalSelected: 1 } });

        await sendEmail({
          to: app.student.email,
          subject: `Finally Selected at ${app.job.companyName}! 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #16A34A;">Congratulations! You are Finally Selected! 🎉</h2>
              <p>Dear ${app.student.name},</p>
              <p>You have been <strong>finally selected</strong> for 
              <strong>${app.job.jobRole}</strong> at 
              <strong>${app.job.companyName}</strong>.</p>
              <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0;"><strong>CTC:</strong> ₹${app.job.ctc} LPA</p>
              </div>
              <p>The placement cell will share the offer letter shortly. Congratulations!</p>
            </div>
          `,
        });
      }

      if (status === "rejected") {
        await sendEmail({
          to: app.student.email,
          subject: `Update on your application — ${app.job.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #DC2626;">Application Update</h2>
              <p>Dear ${app.student.name},</p>
              <p>We regret to inform you that you were not selected for 
              <strong>${app.job.jobRole}</strong> at 
              <strong>${app.job.companyName}</strong>.</p>
              <p>Keep applying — better opportunities await!</p>
            </div>
          `,
        });
      }

      updated.push(app.student?.rollNo);
    } catch (err) {
      errors.push(`${app.student?.rollNo}: ${err.message}`);
    }
  }

  // Save audit log
  try {
    const job = await Job.findById(req.params.id).select("companyName");
    await AuditLog.create({
      action: "bulk_status_update",
      performedBy: req.user._id,
      performedByName: req.user.name,
      job: req.params.id,
      jobName: job?.companyName,
      status,
      fileName,
      totalProvided: rollNumbers.length,
      totalMatched: matchedStudents.length,
      totalUpdated: updated.length,
      totalSkipped: alreadySameStatus.length,
      notFound,
      duplicates,
      alreadySameStatus,
      errors,
      isDryRun: false,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }

  // Invalidate cache
  invalidateCache(CACHE_KEYS.STATS);

  res.json({
    success: true,
    message: `${updated.length} students updated successfully!`,
    data: {
      totalProvided: rollNumbers.length,
      uniqueProvided: uniqueInput.length,
      duplicatesInFile: duplicates.length,
      duplicates,
      totalMatched: matchedStudents.length,
      totalUpdated: updated.length,
      totalSkipped: alreadySameStatus.length,
      notFound,
      errors,
    },
  });
});

// @desc    Get single student full profile
// @route   GET /api/admin/students/:id
const getStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select("-password");
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }
  res.json({ success: true, data: student });
});

// @desc    Admin update student profile
// @route   PATCH /api/admin/students/:id/profile
const updateStudentProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name", "phone", "cgpa", "activeBacklogs", "totalBacklogs",
    "branch", "year", "section", "gender", "education", "skills",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select("-password");

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  // Recalculate profile completeness
  student.checkProfileComplete();
  await student.save();

  // Invalidate cache
  invalidateCache(CACHE_KEYS.ALL_STUDENTS, "all_students_p1", "all_students_p2");

  res.json({ success: true, message: "Student profile updated.", data: student });
});

// @desc    Lock/unlock student profile
// @route   PATCH /api/admin/students/:id/lock
const lockStudentProfile = asyncHandler(async (req, res) => {
  const { lock } = req.body;

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { isProfileLocked: lock },
    { new: true }
  ).select("-password");

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  invalidateCache(CACHE_KEYS.ALL_STUDENTS, "all_students_p1");

  // Send email to student
  await sendEmail({
    to: student.email,
    subject: lock
      ? "Your profile has been locked — Placement Portal"
      : "Your profile has been unlocked — Placement Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: ${lock ? "#DC2626" : "#16A34A"};">
          Profile ${lock ? "Locked 🔒" : "Unlocked 🔓"}
        </h2>
        <p>Dear ${student.name},</p>
        ${lock
          ? `<p>Your placement portal profile has been <strong>locked</strong> by the placement cell.</p>
             <p>You can still update your <strong>resume, photo, name and skills</strong> but academic details like CGPA, 10th and 12th marks cannot be changed.</p>`
          : `<p>Your placement portal profile has been <strong>unlocked</strong> by the placement cell.</p>
             <p>You can now update all your profile details.</p>`
        }
        <p>If you have any questions, please contact the placement cell.</p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: `Profile ${lock ? "locked" : "unlocked"} successfully.`,
    data: student,
  });
});

const bulkImportStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide students array.",
    });
  }

  const results = {
    imported: [],
    skipped: [],
    errors: [],
  };

  // Process in batches of 50
  const batchSize = 50;
  const emailQueue = [];

  for (const row of students) {
    try {
      const { name, email, rollNo, branch, year, phone } = row;

      // Validate required fields
      if (!name || !email || !rollNo || !branch) {
        results.errors.push({
          row: rollNo || email,
          reason: "Missing required fields (name, email, rollNo, branch)",
        });
        continue;
      }

      // Check if email domain is valid
      const emailDomain = email.split("@")[1];
      const allowedDomain = process.env.UNIVERSITY_DOMAIN || "dtu.ac.in";
      if (emailDomain !== allowedDomain) {
        results.errors.push({
          row: rollNo,
          reason: `Invalid email domain. Must be @${allowedDomain}`,
        });
        continue;
      }

      // Check if student already exists
      const existing = await Student.findOne({
        $or: [{ email }, { rollNo }],
      });

      if (existing) {
        results.skipped.push({
          row: rollNo,
          reason: existing.email === email
            ? "Email already registered"
            : "Roll number already registered",
          accountStatus: existing.accountStatus,
        });
        continue;
      }

      // Generate activation token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

     // Parse academic data from row
const cgpa = row.cgpa ? parseFloat(row.cgpa) : undefined;
const tenth_percentage = row.tenth_percentage || row.tenth || row["10th"] ? parseFloat(row.tenth_percentage || row.tenth || row["10th"]) : undefined;
const twelfth_percentage = row.twelfth_percentage || row.twelfth || row["12th"] ? parseFloat(row.twelfth_percentage || row.twelfth || row["12th"]) : undefined;
const tenth_board = row.tenth_board || row.board_10 || "";
const twelfth_board = row.twelfth_board || row.board_12 || "";

// Build education array
const education = [];
if (tenth_percentage) {
  education.push({
    level: "10th",
    percentage: tenth_percentage,
    board: tenth_board,
  });
}
if (twelfth_percentage) {
  education.push({
    level: "12th",
    percentage: twelfth_percentage,
    board: twelfth_board,
  });
}

// Create student account
const student = await Student.create({
  name,
  email,
  rollNo: rollNo.toString().toUpperCase().trim(),
  branch: branch.toUpperCase().trim(),
  year: parseInt(year) || 4,
  phone: phone?.toString() || "",
  password: crypto.randomBytes(16).toString("hex"),
  accountStatus: "pending_activation",
  source: "admin_import",
  isVerified: true,
  activationToken: hashedToken,
  activationTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
  // Academic data — auto-locked
  ...(cgpa && { cgpa }),
  ...(education.length > 0 && { education }),
  isProfileLocked: education.length > 0 || cgpa ? true : false,
});

      results.imported.push({
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
      });

      // Queue activation email
      emailQueue.push({ student, rawToken });

    } catch (err) {
      results.errors.push({
        row: row.rollNo || row.email,
        reason: err.message,
      });
    }
  }

  // Send activation emails in batches of 50
  for (let i = 0; i < emailQueue.length; i += batchSize) {
    const batch = emailQueue.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ({ student, rawToken }) => {
        const activationUrl = `${process.env.CLIENT_URL}/activate?token=${rawToken}`;
        try {
          await sendEmail({
            to: student.email,
            subject: "Welcome to Placement Portal — Activate Your Account",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Welcome to Placement Portal! 🎉</h2>
                <p>Dear ${student.name},</p>
                <p>Your account has been created by the placement cell. Click below to activate your account and set your password.</p>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 0;"><strong>Roll No:</strong> ${student.rollNo}</p>
                  <p style="margin: 8px 0 0;"><strong>Branch:</strong> ${student.branch}</p>
                  <p style="margin: 8px 0 0;"><strong>Email:</strong> ${student.email}</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${activationUrl}"
                    style="background: #4F46E5; color: white; padding: 12px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                    Activate My Account
                  </a>
                </div>
                <p style="color: #6B7280; font-size: 14px;">
                  This link expires in <strong>7 days</strong>.
                  If it expires, use the "Resend Activation" option on the login page.
                </p>
                <p style="color: #6B7280; font-size: 12px;">
                  Or copy this link: ${activationUrl}
                </p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error(`Failed to send activation email to ${student.email}:`, emailErr.message);
        }
      })
    );
  }

  // Invalidate students cache
  invalidateCache(CACHE_KEYS.ALL_STUDENTS, CACHE_KEYS.STATS, "all_students_p1");

  res.json({
    success: true,
    message: `Import complete! ${results.imported.length} students imported.`,
    data: {
      totalProvided: students.length,
      imported: results.imported.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      importedList: results.imported,
      skippedList: results.skipped,
      errorList: results.errors,
    },
  });
});

module.exports = {
  createJob, updateJob, deleteJob, getAllJobs,
  getApplicants, updateApplicationStatus, exportApplicantsExcel,
  bulkUpdateStatus, bulkImportStudents,
  getAllStudents, getStudentProfile, updateStudentProfile, lockStudentProfile,
  verifyStudent, blockStudent, unblockStudent,
  getStats, bulkNotify,
};
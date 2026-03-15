const Job = require("../models/Job.model");
const Student = require("../models/Student.model");
const { asyncHandler } = require("../middleware/error.middleware");

// Create job posting
const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: "Job posting created.", data: job });
});

// Update job posting
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });
  res.json({ success: true, data: job });
});

// Close a job
const deleteJob = asyncHandler(async (req, res) => {
  await Job.findByIdAndUpdate(req.params.id, { status: "closed" });
  res.json({ success: true, message: "Job closed successfully." });
});

// Get all jobs (admin view)
const getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  res.json({ success: true, count: jobs.length, data: jobs });
});

// Dashboard stats
const getStats = asyncHandler(async (req, res) => {
  const Application = require("../models/Application.model");

  const [totalStudents, placedStudents, totalJobs, totalApplications] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ isPlaced: true }),
    Job.countDocuments(),
    Application.countDocuments(),
  ]);

  // Branch wise stats
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

  // Package stats — avg, max, median
  const placedStudentsData = await Student.find(
    { isPlaced: true, ctcOffered: { $exists: true, $ne: null } },
    { ctcOffered: 1 }
  );

  const packages = placedStudentsData
    .map((s) => s.ctcOffered)
    .sort((a, b) => a - b);

  const avgPackage = packages.length
    ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2)
    : 0;

  const maxPackage = packages.length ? packages[packages.length - 1] : 0;
  const minPackage = packages.length ? packages[0] : 0;

  // Median calculation
  let medianPackage = 0;
  if (packages.length > 0) {
    const mid = Math.floor(packages.length / 2);
    medianPackage =
      packages.length % 2 !== 0
        ? packages[mid]
        : ((packages[mid - 1] + packages[mid]) / 2).toFixed(2);
  }

  // Companies visited vs hired
  const companiesVisited = await Job.countDocuments();
  const companiesHired = await Job.countDocuments({ totalSelected: { $gt: 0 } });

  // Top hiring companies
  const topCompanies = await Job.find({ totalSelected: { $gt: 0 } })
    .sort({ totalSelected: -1 })
    .limit(5)
    .select("companyName jobRole ctc totalSelected totalApplicants");

  // Month wise placement trend (current year)
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
    {
      $group: {
        _id: { $month: "$updatedAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Package distribution buckets
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

  // Year wise stats
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

  res.json({
    success: true,
    data: {
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
      packageStats: {
        avgPackage,
        maxPackage,
        minPackage,
        medianPackage,
      },
      branchStats,
      yearStats,
      monthlyTrend,
      packageDistribution,
      topCompanies,
    },
  });
});

module.exports = { createJob, updateJob, deleteJob, getAllJobs, getStats };
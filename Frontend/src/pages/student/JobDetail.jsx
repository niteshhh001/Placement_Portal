import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await API.get(`/jobs/${id}`);
      setJob(res.data.data);
    } catch (err) {
      toast.error("Job not found");
      navigate("/student/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await API.post(`/jobs/${id}/apply`);
      toast.success("Application submitted successfully!");
      setApplied(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!job) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <Toaster position="top-right" />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{job.companyName}</h1>
              {job.isDreamCompany && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  Dream Company
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">{job.jobRole}</p>
          </div>

          {/* Apply Button */}
        {!user?.isVerified ? (
  <span className="shrink-0 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
    ⏳ Verification Pending
  </span>
) : job.eligible ? (
  <button
    onClick={handleApply}
    disabled={applying || applied}
    className="shrink-0 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {applied ? "Applied ✓" : applying ? "Applying..." : "Apply Now"}
  </button>
) : (
  <span className="shrink-0 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
    Not Eligible
  </span>
)}
        </div>

        {/* Ineligibility reasons */}
        {!job.eligible && job.ineligibilityReasons?.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-xs font-medium text-red-700 mb-1">Why you're not eligible:</p>
            <ul className="space-y-0.5">
              {job.ineligibilityReasons.map((r, i) => (
                <li key={i} className="text-xs text-red-600">• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">CTC</p>
            <p className="font-medium text-gray-900 mt-0.5">₹{job.ctc} LPA</p>
          </div>
          <div>
            <p className="text-gray-500">Job Type</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.jobType}</p>
          </div>
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.location?.join(", ") || "TBD"}</p>
          </div>
          <div>
            <p className="text-gray-500">Sector</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.sector}</p>
          </div>
          <div>
            <p className="text-gray-500">Application Deadline</p>
            <p className="font-medium text-red-600 mt-0.5">
  {new Date(job.applicationDeadline).toLocaleString("en-IN", {
  day: "numeric", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: true
})}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Drive Date</p>
            <p className="font-medium text-gray-900 mt-0.5">
              {job.driveDate
                ? new Date(job.driveDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric"
                  })
                : "To be announced"}
            </p>
          </div>
          {job.bond > 0 && (
            <div>
              <p className="text-gray-500">Bond</p>
              <p className="font-medium text-gray-900 mt-0.5">{job.bond} year(s)</p>
            </div>
          )}
        </div>

        {job.jobDescription && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Job Description</p>
            <p className="text-sm text-gray-700">{job.jobDescription}</p>
          </div>
        )}
      </div>

      {/* Eligibility Criteria */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Eligibility Criteria</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Minimum CGPA</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.eligibility?.minCgpa}</p>
          </div>
          <div>
            <p className="text-gray-500">Allowed Branches</p>
            <p className="font-medium text-gray-900 mt-0.5">
              {job.eligibility?.allowedBranches?.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Max Active Backlogs</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.eligibility?.maxActiveBacklogs}</p>
          </div>
          <div>
            <p className="text-gray-500">Max Total Backlogs</p>
            <p className="font-medium text-gray-900 mt-0.5">{job.eligibility?.maxTotalBacklogs}</p>
          </div>
        </div>
      </div>

      {/* Selection Rounds */}
      {job.rounds?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Selection Rounds</h2>
          <div className="space-y-3">
            {job.rounds.map((round, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-700">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{round.name}</p>
                  {round.venue && <p className="text-xs text-gray-500 mt-0.5">📍 {round.venue}</p>}
                  {round.date && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      📅 {new Date(round.date).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
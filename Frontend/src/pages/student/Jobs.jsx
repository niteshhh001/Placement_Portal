import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
const SECTORS = ["All", "IT", "Core", "Finance", "Consulting", "Government", "Other"];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [showEligible, setShowEligible] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await API.get("/jobs");
      setJobs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter((job) => {
    const matchSearch = job.companyName.toLowerCase().includes(search.toLowerCase()) ||
      job.jobRole.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || job.sector === sector;
    const matchEligible = !showEligible || job.eligible;
    return matchSearch && matchSector && matchEligible;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} jobs found</p>
      </div>

      {/* Verification Pending Banner */}
  {!user?.isVerified && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
    <span className="text-yellow-500 text-xl shrink-0">⏳</span>
    <div>
      <p className="text-sm font-medium text-yellow-800">Account not verified yet</p>
      <p className="text-xs text-yellow-700 mt-1">
        You can browse jobs but the Apply button will be enabled only after admin verification.
      </p>
    </div>
  </div>
)}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showEligible}
            onChange={(e) => setShowEligible(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600"
          />
          Eligible only
        </label>
      </div>

      {/* Job Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No jobs found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{job.companyName}</h3>
                    {job.isDreamCompany && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        Dream Company
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${job.eligible
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }`}>
                      {job.eligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.jobRole}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    <span>💰 ₹{job.ctc} LPA</span>
                    <span>📍 {job.location?.join(", ") || "TBD"}</span>
                    <span>🏢 {job.sector}</span>
                    <span>📅 Apply by {new Date(job.applicationDeadline).toLocaleDateString("en-IN")}</span>
                  </div>

                  {/* Ineligibility reasons */}
                  {!job.eligible && job.ineligibilityReasons?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.ineligibilityReasons.map((reason, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to={`/student/jobs/${job._id}`}
                  className="shrink-0 text-sm font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
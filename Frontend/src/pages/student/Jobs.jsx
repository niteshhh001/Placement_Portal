import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";
import { JobsListSkeleton } from "../../components/Skeleton";
const SECTORS = ["IT", "Core", "Finance", "Consulting", "Government", "Analytics", "Other"];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [showEligible, setShowEligible] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, [page, filterSector]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filterSector && { sector: filterSector }),
        ...(search && { search }),
      });
      const res = await API.get(`/jobs?${params}`);
      setJobs(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // Filter eligible only on frontend (already paginated from backend)
  const displayed = showEligible ? jobs.filter((j) => j.eligible) : jobs;

if (loading) return <JobsListSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Showing {jobs.length} of {total} jobs
        </p>
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
          value={filterSector}
          onChange={(e) => { setFilterSector(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
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
      {displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No jobs found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayed.map((job) => (
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
                    <span>📅 Apply by {new Date(job.applicationDeadline).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit", hour12: true
                    })}</span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 px-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => { setPage(p); window.scrollTo(0, 0); }}
          />
        </div>
      )}
    </div>
  );
}
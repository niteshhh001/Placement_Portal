import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          API.get("/applications/me"),
          API.get("/jobs"),
        ]);
        setApplications(appsRes.data.data);
        setJobs(jobsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Profile completion calculation
  const profileFields = [
    user?.name, user?.email, user?.phone,
    user?.branch, user?.cgpa, user?.resumeUrl,
  ];
  const filled = profileFields.filter(Boolean).length;
  const completion = Math.round((filled / profileFields.length) * 100);

  const statusColors = {
    applied: "bg-blue-100 text-blue-700",
    shortlisted: "bg-yellow-100 text-yellow-700",
    selected: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    technical: "bg-purple-100 text-purple-700",
    hr: "bg-orange-100 text-orange-700",
    aptitude: "bg-indigo-100 text-indigo-700",
    gd: "bg-pink-100 text-pink-700",
    "on-hold": "bg-gray-100 text-gray-700",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with your placements today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Applications</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{applications.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Shortlisted</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {applications.filter(a => a.status === "shortlisted").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Selected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {applications.filter(a => a.status === "selected").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Open Jobs</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {jobs.filter(j => j.eligible).length}
          </p>
        </div>
      </div>

      {/* Profile Completion */}
      {completion < 100 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-indigo-900">Profile Completion</p>
            <span className="text-sm font-bold text-indigo-700">{completion}%</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2 mb-3">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-indigo-700 mb-2">
            Complete your profile to apply to more companies.
          </p>
          <Link
            to="/student/profile"
            className="text-xs font-medium text-indigo-700 hover:underline"
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/student/applications" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No applications yet.</p>
            <Link to="/student/jobs" className="text-indigo-600 text-sm font-medium hover:underline mt-1 block">
              Browse jobs →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.slice(0, 5).map((app) => (
              <div key={app._id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.job?.companyName}</p>
                  <p className="text-xs text-gray-500">{app.job?.jobRole}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eligible Jobs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Jobs You Can Apply To</h2>
          <Link to="/student/jobs" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {jobs.filter(j => j.eligible).length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No eligible jobs right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {jobs.filter(j => j.eligible).slice(0, 4).map((job) => (
              <div key={job._id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.companyName}</p>
                  <p className="text-xs text-gray-500">{job.jobRole} • ₹{job.ctc} LPA</p>
                </div>
                <Link
                  to={`/student/jobs/${job._id}`}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
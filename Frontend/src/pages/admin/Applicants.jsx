import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";

const statusOptions = [
  "applied", "shortlisted", "aptitude", "gd",
  "technical", "hr", "selected", "rejected", "on-hold"
];

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

export default function Applicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [remarks, setRemarks] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [applicantsRes, jobRes] = await Promise.all([
        API.get(`/admin/jobs/${id}/applicants`),
        API.get(`/admin/jobs`),
      ]);
      setApplicants(applicantsRes.data.data);
      const foundJob = jobRes.data.data.find((j) => j._id === id);
      setJob(foundJob);
    } catch (err) {
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    setUpdating(applicationId);
    try {
      await API.patch(`/admin/applications/${applicationId}/status`, {
        status,
        adminRemarks: remarks[applicationId] || "",
      });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await API.get(`/admin/jobs/${id}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${job?.companyName}_applicants.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel downloaded!");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const filtered = applicants.filter((a) => {
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchBranch = !filterBranch || a.student?.branch === filterBranch;
    return matchStatus && matchBranch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {job?.companyName} — Applicants
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {applicants.length} total applicants • {job?.jobRole}
          </p>
        </div>
        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
        >
          📥 Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Branches</option>
          {["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          Showing {filtered.length} of {applicants.length}
        </span>
      </div>

      {/* Applicants Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No applicants found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">CGPA</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Update</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((app, i) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{app.student?.name}</p>
                      <p className="text-xs text-gray-500">{app.student?.rollNo}</p>
                      <p className="text-xs text-gray-400">{app.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{app.student?.branch}</td>
                    <td className="px-4 py-3 text-gray-600">{app.student?.cgpa}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Add remark..."
                        value={remarks[app._id] || app.adminRemarks || ""}
                        onChange={(e) => setRemarks({ ...remarks, [app._id]: e.target.value })}
                        className="w-36 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app._id, e.target.value)}
                        disabled={updating === app._id}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {app.student?.resumeUrl ? (
                        <a
  
    href={`https://docs.google.com/viewer?url=${encodeURIComponent(app.student.resumeUrl)}&embedded=true`}
    target="_blank"
    rel="noreferrer"
    className="text-xs text-indigo-600 hover:underline font-medium"
  >
    View
  </a>
) : (
  <span className="text-xs text-gray-400">None</span>
)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
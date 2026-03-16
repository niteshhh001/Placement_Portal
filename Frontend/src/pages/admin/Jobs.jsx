import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";

const statusColors = {
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  upcoming: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-700",
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await API.get("/admin/jobs");
      setJobs(res.data.data);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const closeJob = async (id) => {
    if (!window.confirm("Close this job posting?")) return;
    try {
      await API.delete(`/admin/jobs/${id}`);
      toast.success("Job closed");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to close job");
    }
  };

  const exportExcel = async (id, companyName) => {
    try {
      const res = await API.get(`/admin/jobs/${id}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${companyName}_applicants.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel downloaded!");
    } catch (err) {
      toast.error("Export failed");
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-500 text-sm mt-1">{jobs.length} total postings</p>
        </div>
        <Link
          to="/admin/jobs/create"
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No job postings yet.</p>
          <Link to="/admin/jobs/create" className="text-indigo-600 text-sm font-medium hover:underline mt-2 block">
            Create your first job →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">CTC</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Applicants</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deadline</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{job.companyName}</td>
                  <td className="px-6 py-4 text-gray-600">{job.jobRole}</td>
                  <td className="px-6 py-4 text-gray-600">₹{job.ctc} LPA</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/jobs/${job._id}/applicants`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {job.totalApplicants} applied
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(job.applicationDeadline).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/jobs/${job._id}/applicants`}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => exportExcel(job._id, job.companyName)}
                        className="text-xs text-green-600 hover:underline font-medium"
                      >
                        Export
                      </button>
                      {job.status === "open" && (
                        <button
                          onClick={() => closeJob(job._id)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
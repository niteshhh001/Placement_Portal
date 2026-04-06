import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import Pagination from "../../components/Pagination";
import { ApplicationsListSkeleton } from "../../components/Skeleton";
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

const statusSteps = ["applied", "aptitude", "gd", "technical", "hr", "selected"];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      const res = await API.get(`/applications/me?${params}`);
      setApplications(res.data.data);
      setTotal(res.data.total || res.data.count);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId, companyName) => {
    if (!window.confirm(`Are you sure you want to withdraw from ${companyName}? This cannot be undone.`)) return;
    setWithdrawing(applicationId);
    try {
      await API.delete(`/applications/${applicationId}`);
      toast.success(`Application withdrawn from ${companyName}`);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw");
    } finally {
      setWithdrawing(null);
    }
  };

  const canWithdraw = (app) => {
    if (app.status !== "applied") return false;
    if (!app.job?.applicationDeadline) return true;
    return new Date() <= new Date(app.job.applicationDeadline);
  };

if (loading) return <ApplicationsListSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} application{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">You haven't applied to any jobs yet.</p>
          <Link to="/student/jobs" className="text-indigo-600 text-sm font-medium hover:underline mt-2 block">
            Browse Jobs →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {applications.map((app) => (
              <div key={app._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                {/* Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setSelected(selected === app._id ? null : app._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-700 font-bold text-sm">
                        {app.job?.companyName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{app.job?.companyName}</p>
                      <p className="text-sm text-gray-500">
                        {app.job?.jobRole} • ₹{app.job?.ctc} LPA
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>
                      {app.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {selected === app._id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded */}
                {selected === app._id && (
                  <div className="border-t border-gray-100 p-5 space-y-4">

                    {/* Progress Stepper */}
                    {app.status !== "rejected" && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-3">Progress</p>
                        <div className="flex items-center">
                          {statusSteps.map((step, i) => {
                            const currentIndex = statusSteps.indexOf(app.status);
                            const isDone = i <= currentIndex;
                            const isLast = i === statusSteps.length - 1;
                            return (
                              <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${isDone ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                                    {isDone ? "✓" : i + 1}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 capitalize hidden sm:block">{step}</p>
                                </div>
                                {!isLast && (
                                  <div className={`flex-1 h-0.5 mx-1 ${i < currentIndex ? "bg-indigo-600" : "bg-gray-200"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rejected Banner */}
                    {app.status === "rejected" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700 font-medium">Not selected this time</p>
                        <p className="text-xs text-red-600 mt-0.5">Keep applying — better opportunities await!</p>
                      </div>
                    )}

                    {/* Selected Banner */}
                    {app.status === "selected" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700 font-medium">🎉 Congratulations! You have been selected!</p>
                        <p className="text-xs text-green-600 mt-0.5">The placement cell will share the offer letter shortly.</p>
                      </div>
                    )}

                    {/* Rounds Cleared */}
                    {app.roundsCleared?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Rounds Cleared</p>
                        <div className="space-y-2">
                          {app.roundsCleared.map((round, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-700">{round.roundName}</span>
                              <span className="text-gray-400 text-xs">
                                {new Date(round.clearedAt).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Remarks */}
                    {app.adminRemarks && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Remarks</p>
                        <p className="text-sm text-gray-700">{app.adminRemarks}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN")}</span>
                        {app.job?.driveDate && (
                          <span>Drive: {new Date(app.job.driveDate).toLocaleDateString("en-IN")}</span>
                        )}
                        {app.offerLetterUrl && (
                          <a
                            href={app.offerLetterUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 font-medium hover:underline"
                          >
                            Download Offer Letter
                          </a>
                        )}
                      </div>

                      {/* Withdraw Button */}
                      {canWithdraw(app) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(app._id, app.job?.companyName);
                          }}
                          disabled={withdrawing === app._id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {withdrawing === app._id ? "Withdrawing..." : "Withdraw Application"}
                        </button>
                      )}

                      {/* Can't withdraw message */}
                      {app.status !== "applied" && app.status !== "rejected" && app.status !== "selected" && (
                        <span className="text-xs text-gray-400 italic">
                          Cannot withdraw — already in process
                        </span>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 px-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  setSelected(null);
                  window.scrollTo(0, 0);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
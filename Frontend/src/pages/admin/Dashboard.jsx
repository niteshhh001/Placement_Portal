import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  const { overview, packageStats, branchStats, topCompanies, monthlyTrend } = stats;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Placement season overview</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: overview.totalStudents, color: "text-gray-900" },
          { label: "Placed Students", value: overview.placedStudents, color: "text-green-600" },
          { label: "Placement Rate", value: `${overview.placementRate}%`, color: "text-indigo-600" },
          { label: "Companies Visited", value: overview.companiesVisited, color: "text-blue-600" },
          { label: "Avg Package", value: `₹${packageStats.avgPackage} LPA`, color: "text-purple-600" },
          { label: "Max Package", value: `₹${packageStats.maxPackage} LPA`, color: "text-green-600" },
          { label: "Median Package", value: `₹${packageStats.medianPackage} LPA`, color: "text-orange-600" },
          { label: "Total Applications", value: overview.totalApplications, color: "text-gray-900" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Branch Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Branch-wise Placement</h2>
          {branchStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {branchStats.map((branch) => {
                const rate = branch.total > 0
                  ? Math.round((branch.placed / branch.total) * 100)
                  : 0;
                return (
                  <div key={branch._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{branch._id}</span>
                      <span className="text-gray-500">
                        {branch.placed}/{branch.total} ({rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Hiring Companies</h2>
            <Link to="/admin/jobs" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {!topCompanies || topCompanies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No placements yet</p>
          ) : (
            <div className="space-y-3">
              {topCompanies.map((company, i) => (
                <div key={company._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{company.companyName}</p>
                      <p className="text-xs text-gray-500">{company.jobRole}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {company.totalSelected} hired
                    </p>
                    <p className="text-xs text-gray-500">₹{company.ctc} LPA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Placement Trend</h2>
          {!monthlyTrend || monthlyTrend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No placement data this year</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {monthlyTrend.map((month) => {
                const maxCount = Math.max(...monthlyTrend.map((m) => m.count));
                const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                return (
                  <div key={month._id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-600 font-medium">{month.count}</span>
                    <div
                      className="w-full bg-indigo-500 rounded-t"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    />
                    <span className="text-xs text-gray-400">
                      {monthNames[month._id - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/jobs/create"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <span className="text-2xl">➕</span>
              <span className="text-sm font-medium text-gray-700">Post New Job</span>
            </Link>
            <Link
              to="/admin/students"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <span className="text-2xl">🎓</span>
              <span className="text-sm font-medium text-gray-700">View Students</span>
            </Link>
            <Link
              to="/admin/notifications"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <span className="text-2xl">📢</span>
              <span className="text-sm font-medium text-gray-700">Send Notification</span>
            </Link>
            <Link
              to="/admin/jobs"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <span className="text-2xl">📋</span>
              <span className="text-sm font-medium text-gray-700">Manage Jobs</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
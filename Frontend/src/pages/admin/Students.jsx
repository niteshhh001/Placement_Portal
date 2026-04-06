import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import ResumeViewer from "../../components/ResumeViewer";
import Pagination from "../../components/Pagination";
import { StudentsTableSkeleton } from "../../components/Skeleton";
export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterPlaced, setFilterPlaced] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [viewingResume, setViewingResume] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    fetchStudents();
  }, [page, filterBranch, filterPlaced, filterVerified]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(filterBranch && { branch: filterBranch }),
        ...(filterPlaced && { isPlaced: filterPlaced }),
        ...(search && { search }),
      });
      const res = await API.get(`/admin/students?${params}`);
      setStudents(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const verifyStudent = async (id) => {
    try {
      await API.patch(`/admin/students/${id}/verify`);
      toast.success("Student verified! Email sent.");
      fetchStudents();
    } catch (err) {
      toast.error("Failed to verify student");
    }
  };

  const blockStudent = async (id, name) => {
    const reason = window.prompt(`Enter reason for debarring ${name}:`);
    if (!reason) return;
    try {
      await API.patch(`/admin/students/${id}/block`, { reason });
      toast.success(`${name} has been debarred`);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to debar student");
    }
  };

  const unblockStudent = async (id, name) => {
    if (!window.confirm(`Reinstate ${name}'s account?`)) return;
    try {
      await API.patch(`/admin/students/${id}/unblock`);
      toast.success(`${name} has been reinstated`);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to reinstate student");
    }
  };

  const openResume = (url) => setViewingResume(url);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registered students</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 text-sm flex-wrap">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              Placed: {students.filter((s) => s.isPlaced).length}
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              Pending: {students.filter((s) => s.accountStatus === "pending_verification").length}
            </span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
              Not Activated: {students.filter((s) => s.accountStatus === "pending_activation").length}
            </span>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              Debarred: {students.filter((s) => s.isBlocked).length}
            </span>
          </div>
          <Link
            to="/admin/students/import"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
             Import Students
          </Link>
        </div>
      </div>

      {/* Pending Verification Alert */}
      {students.filter((s) => s.accountStatus === "pending_verification").length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-500 text-xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              {students.filter((s) => s.accountStatus === "pending_verification").length} student(s) waiting for verification
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              These students cannot apply until verified.
            </p>
          </div>
          <button
            onClick={() => { setFilterVerified("unverified"); setPage(1); }}
            className="shrink-0 text-xs font-medium text-yellow-700 border border-yellow-300 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition"
          >
            Show Pending
          </button>
        </div>
      )}

      {/* Not Activated Alert */}
      {students.filter((s) => s.accountStatus === "pending_activation").length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-orange-500 text-xl shrink-0">📧</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              {students.filter((s) => s.accountStatus === "pending_activation").length} imported student(s) haven't activated their account yet
            </p>
            <p className="text-xs text-orange-700 mt-1">
              They need to click the activation link sent to their email.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, roll no, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterBranch}
          onChange={handleFilterChange(setFilterBranch)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Branches</option>
          {["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterPlaced}
          onChange={handleFilterChange(setFilterPlaced)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Students</option>
          <option value="true">Placed</option>
          <option value="false">Unplaced</option>
        </select>
        <select
          value={filterVerified}
          onChange={handleFilterChange(setFilterVerified)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="verified">Verified</option>
          <option value="unverified">Pending Verification</option>
          <option value="pending_activation">Not Activated</option>
        </select>
        {(filterVerified || filterBranch || filterPlaced || search) && (
          <button
            onClick={() => {
              setFilterVerified("");
              setFilterBranch("");
              setFilterPlaced("");
              setSearch("");
              setPage(1);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg"
          >
            Clear all ×
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Showing {students.length} of {total} students
      </p>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">CGPA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Backlogs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Placed At</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
      <StudentsTableSkeleton rows={8} />
    </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student._id}
                    className={`hover:bg-gray-50 ${
                      student.isBlocked
                        ? "bg-red-50"
                        : student.accountStatus === "pending_activation"
                        ? "bg-orange-50"
                        : student.accountStatus === "pending_verification"
                        ? "bg-yellow-50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-700">
                              {student.name?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.rollNo}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                          {student.source === "admin_import" && (
                            <span className="text-xs text-indigo-500">📥 Imported</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.branch}</td>
                    <td className="px-4 py-3 text-gray-600">{student.cgpa || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{student.activeBacklogs ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {student.isBlocked ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit bg-red-100 text-red-700">
                            Debarred
                          </span>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit
                            ${student.isPlaced ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {student.isPlaced ? "Placed" : "Unplaced"}
                          </span>
                        )}
                        {student.accountStatus === "pending_activation" && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit bg-orange-100 text-orange-700">
                             Not Activated
                          </span>
                        )}
                        {student.accountStatus === "pending_verification" && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit bg-yellow-100 text-yellow-700">
                             Pending Verification
                          </span>
                        )}
                        {student.accountStatus === "active" && (
                          <span className="text-xs text-green-600"> Active</span>
                        )}
                        {student.isProfileLocked && (
                          <span className="text-xs text-orange-600"> Locked</span>
                        )}
                        {student.isBlocked && student.blockReason && (
                          <span className="text-xs text-red-500 italic truncate max-w-32">
                            {student.blockReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {student.isPlaced ? (
                        <div>
                          <p className="font-medium text-gray-900">{student.placedCompany}</p>
                          <p className="text-xs text-green-600">₹{student.ctcOffered} LPA</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/students/${student._id}`}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View
                        </Link>
                        {student.resumeUrl && (
                          <button
                            onClick={() => openResume(student.resumeUrl)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            Resume
                          </button>
                        )}
                        {student.accountStatus === "pending_verification" && (
                          <button
                            onClick={() => verifyStudent(student._id)}
                            className="text-xs text-green-600 hover:underline font-medium bg-green-50 px-2 py-1 rounded"
                          >
                            ✓ Verify
                          </button>
                        )}
                        {!student.isBlocked ? (
                          <button
                            onClick={() => blockStudent(student._id, student.name)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Debar
                          </button>
                        ) : (
                          <button
                            onClick={() => unblockStudent(student._id, student.name)}
                            className="text-xs text-green-600 hover:underline font-medium"
                          >
                            Reinstate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {viewingResume && (
        <ResumeViewer url={viewingResume} onClose={() => setViewingResume(null)} />
      )}
    </div>
  );
}
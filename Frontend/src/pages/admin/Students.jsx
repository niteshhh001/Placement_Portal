import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterPlaced, setFilterPlaced] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(res.data.data);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const verifyStudent = async (id) => {
    try {
      await API.patch(`/admin/students/${id}/verify`);
      toast.success("Student verified!");
      fetchStudents();
    } catch (err) {
      toast.error("Failed to verify student");
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchBranch = !filterBranch || s.branch === filterBranch;
    const matchPlaced = filterPlaced === "" ||
      (filterPlaced === "true" ? s.isPlaced : !s.isPlaced);
    return matchSearch && matchBranch && matchPlaced;
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} registered students</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            {students.filter((s) => s.isPlaced).length} Placed
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
            {students.filter((s) => !s.isPlaced).length} Unplaced
          </span>
        </div>
      </div>

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
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Branches</option>
          {["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterPlaced}
          onChange={(e) => setFilterPlaced(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Students</option>
          <option value="true">Placed</option>
          <option value="false">Unplaced</option>
        </select>
      </div>

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
              {filtered.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
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
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{student.branch}</td>
                  <td className="px-4 py-3 text-gray-600">{student.cgpa || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{student.activeBacklogs ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit
                        ${student.isPlaced ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {student.isPlaced ? "Placed" : "Unplaced"}
                      </span>
                      {!student.isVerified && (
                        <span className="text-xs text-orange-600">Not verified</span>
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
                    <div className="flex items-center gap-2">
                     {student.resumeUrl && (
                        <a
  
    href={`https://docs.google.com/viewer?url=${encodeURIComponent(student.resumeUrl)}&embedded=true`}
    target="_blank"
    rel="noreferrer"
    className="text-xs text-indigo-600 hover:underline"
  >
    Resume
  </a>
)}
                      {!student.isVerified && (
                        <button
                          onClick={() => verifyStudent(student._id)}
                          className="text-xs text-green-600 hover:underline font-medium"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
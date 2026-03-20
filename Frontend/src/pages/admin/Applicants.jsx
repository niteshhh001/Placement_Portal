import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import API from "../../api/axios";
import ResumeViewer from "../../components/ResumeViewer";
import Pagination from "../../components/Pagination";

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

const bulkStatusOptions = [
  { value: "shortlisted", label: " Eligible for Online Assessment" },
  { value: "aptitude", label: " Online Assessment  Cleared" },
  { value: "gd", label: " Group Discussion Cleared" },
  { value: "technical", label: " Eligible for Technical Interview" },
  { value: "hr", label: " Eligible for HR Interview" },
  { value: "selected", label: " Finally Selected" },
  { value: "rejected", label: " Not Selected" },
];

// Smart column detection
const detectRollNumbers = (rows) => {
  const rollKeywords = ["roll", "enrollment", "enrolment", "id", "student", "registration", "reg"];
  let rollColIndex = -1;

  // Try to find header row
  const headerRow = rows[0]?.map((h) => String(h || "").toLowerCase());
  if (headerRow) {
    rollColIndex = headerRow.findIndex((h) =>
      rollKeywords.some((k) => h.includes(k))
    );
  }

  const rollNos = [];

  if (rollColIndex >= 0) {
    // Extract from detected column (skip header)
    rows.slice(1).forEach((row) => {
      const val = row[rollColIndex];
      if (val && String(val).trim()) {
        rollNos.push(String(val).trim().toUpperCase());
      }
    });
  } else {
    // No header detected — extract all values that look like roll numbers
    rows.forEach((row) => {
      row.forEach((cell) => {
        const val = String(cell || "").trim().toUpperCase();
        if (
          val.length > 3 &&
          val.length < 30 &&
          !["ROLL NO", "ROLLNO", "ROLL NUMBER", "S.NO", "SNO",
            "NAME", "STUDENT NAME", "BRANCH", "DEPARTMENT",
            "EMAIL", "PHONE", "CGPA"].includes(val)
        ) {
          rollNos.push(val);
        }
      });
    });
  }

  return [...new Set(rollNos)];
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
  const [viewingResume, setViewingResume] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // Bulk update states
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("shortlisted");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [parsedRollNumbers, setParsedRollNumbers] = useState([]);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

useEffect(() => {
  fetchData();
}, [id, page, filterStatus, filterBranch]);

const fetchData = async () => {
  try {
    const params = new URLSearchParams({
      page,
      limit: LIMIT,
      ...(filterStatus && { status: filterStatus }),
      ...(filterBranch && { branch: filterBranch }),
    });

    const [applicantsRes, jobRes] = await Promise.all([
      API.get(`/admin/jobs/${id}/applicants?${params}`),
      API.get(`/admin/jobs`),
    ]);
    setApplicants(applicantsRes.data.data);
    setTotal(applicantsRes.data.total);
    setTotalPages(applicantsRes.data.totalPages);
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

  const openResume = (url) => {
    setViewingResume(url);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setShowPreview(false);
    setUpdateResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Support multi-sheet
      const allRollNos = [];
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const rollNos = detectRollNumbers(rows);
        allRollNos.push(...rollNos);
      });

      const unique = [...new Set(allRollNos)];
      setParsedRollNumbers(unique);
      toast.success(`${unique.length} roll numbers detected from ${workbook.SheetNames.length} sheet(s)`);
    };
    reader.readAsArrayBuffer(file);
  };

  // Dry run — preview before actual update
  const handleDryRun = async () => {
    if (parsedRollNumbers.length === 0) {
      toast.error("Please upload an Excel file first");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await API.post(`/admin/jobs/${id}/bulk-update`, {
        status: bulkStatus,
        rollNumbers: parsedRollNumbers,
        isDryRun: true,
        fileName,
      });
      setPreview(res.data.preview);
      setShowPreview(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Preview failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Actual update after preview confirmed
  const handleBulkUpdate = async () => {
    setBulkLoading(true);
    try {
      const res = await API.post(`/admin/jobs/${id}/bulk-update`, {
        status: bulkStatus,
        rollNumbers: parsedRollNumbers,
        isDryRun: false,
        fileName,
      });
      setUpdateResult(res.data.data);
      setShowPreview(false);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const resetBulkUpdate = () => {
    setShowBulkUpdate(false);
    setParsedRollNumbers([]);
    setFileName("");
    setPreview(null);
    setShowPreview(false);
    setUpdateResult(null);
    setBulkStatus("shortlisted");
  };



  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between flex-wrap gap-3">
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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowBulkUpdate(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
              Bulk Update 
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
             Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
  value={filterStatus}
  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <option value="">All Statuses</option>
  {statusOptions.map((s) => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
<select
  value={filterBranch}
  onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <option value="">All Branches</option>
  {["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"].map((b) => (
    <option key={b} value={b}>{b}</option>
  ))}
</select>
<span className="text-sm text-gray-500 self-center">
  Showing {applicants.length} of {total}
</span>
      </div>

      {/* Applicants Table */}
      {applicants.length === 0 ? (
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
                {applicants.map((app, i) => (
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
                        <button
                          onClick={() => openResume(app.student.resumeUrl)}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
          <div className="border-t border-gray-200 px-4">
  <Pagination
    page={page}
    totalPages={totalPages}
    onPageChange={(p) => setPage(p)}
  />
</div>
        </div>
        
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={resetBulkUpdate}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Bulk Update from Company Excel
              </h2>
              <button
                onClick={resetBulkUpdate}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Upload the Excel file received from the company. Roll numbers will be
              auto-detected and application statuses updated automatically.
            </p>

            {/* Status Selection */}
            {!showPreview && !updateResult && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    These students are eligible for / cleared
                  </label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {bulkStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel from company
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-400 transition">
                    <span className="text-2xl mb-2">📊</span>
                    <span className="text-sm font-medium text-gray-700">
                      {fileName || "Click to upload Excel / CSV file"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Supports .xlsx, .xls, .csv — Roll numbers auto-detected from any column
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleExcelUpload}
                    />
                  </label>
                </div>

                {/* Detected Roll Numbers Preview */}
                {parsedRollNumbers.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-indigo-900 mb-2">
                      {parsedRollNumbers.length} roll numbers detected
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {parsedRollNumbers.slice(0, 20).map((r) => (
                        <span
                          key={r}
                          className="text-xs bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200"
                        >
                          {r}
                        </span>
                      ))}
                      {parsedRollNumbers.length > 20 && (
                        <span className="text-xs text-indigo-500">
                          +{parsedRollNumbers.length - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetBulkUpdate}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDryRun}
                    disabled={bulkLoading || parsedRollNumbers.length === 0}
                    className="flex-1 border border-indigo-300 text-indigo-700 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-50 transition disabled:opacity-50"
                  >
                    {bulkLoading ? "Checking..." : "🔍 Preview Changes"}
                  </button>
                </div>
              </>
            )}

            {/* Preview / Dry Run Results */}
            {showPreview && preview && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Preview — No changes made yet</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{preview.totalMatched}</p>
                      <p className="text-xs text-gray-500 mt-1">Students matched</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-2xl font-bold text-green-600">{preview.willBeUpdated}</p>
                      <p className="text-xs text-gray-500 mt-1">Will be updated</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{preview.alreadySameStatus}</p>
                      <p className="text-xs text-gray-500 mt-1">Already same status</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-2xl font-bold text-red-600">{preview.notFound}</p>
                      <p className="text-xs text-gray-500 mt-1">Not found</p>
                    </div>
                  </div>

                  {preview.duplicatesInFile > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800">
                        ⚠️ {preview.duplicatesInFile} duplicate roll numbers in file — will be ignored
                      </p>
                    </div>
                  )}

                  {preview.notFoundList?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-800 mb-1">
                         Roll numbers not found in portal:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {preview.notFoundList.map((r) => (
                          <span key={r} className="text-xs bg-white text-red-600 px-2 py-0.5 rounded border border-red-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.students?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Students that will be updated:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {preview.students.map((s, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white border border-gray-100 rounded px-3 py-1.5">
                            <span className="font-medium text-gray-900">{s.name}</span>
                            <span className="text-gray-500">{s.rollNo}</span>
                            <span className="text-gray-400">{s.currentStatus} → <strong className="text-indigo-600">{s.newStatus}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    ← Go Back
                  </button>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={bulkLoading || preview.willBeUpdated === 0}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {bulkLoading
                      ? "Updating..."
                      : `✅ Confirm Update ${preview.willBeUpdated} Students`}
                  </button>
                </div>
              </div>
            )}

            {/* Update Result */}
            {updateResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <span className="text-3xl">✅</span>
                  <p className="text-lg font-semibold text-green-800 mt-2">
                    Update Complete!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {updateResult.totalUpdated} students updated successfully
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-bold text-gray-900">{updateResult.totalUpdated}</p>
                    <p className="text-xs text-gray-500">Updated</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-bold text-gray-900">{updateResult.totalSkipped}</p>
                    <p className="text-xs text-gray-500">Skipped (same status)</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-bold text-red-600">{updateResult.notFound?.length || 0}</p>
                    <p className="text-xs text-gray-500">Not found</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-bold text-yellow-600">{updateResult.errors?.length || 0}</p>
                    <p className="text-xs text-gray-500">Errors</p>
                  </div>
                </div>

                {updateResult.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                    {updateResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600">{e}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={resetBulkUpdate}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {viewingResume && (
        <ResumeViewer
          url={viewingResume}
          onClose={() => setViewingResume(null)}
        />
      )}
    </div>
  );
}
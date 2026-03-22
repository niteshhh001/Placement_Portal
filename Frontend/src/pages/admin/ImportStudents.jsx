import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import API from "../../api/axios";

const REQUIRED_COLUMNS = ["name", "email", "rollno", "branch"];
const BRANCH_OPTIONS = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"];

export default function ImportStudents() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [parsedStudents, setParsedStudents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=result

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setParsedStudents([]);
    setResult(null);
    setStep(1);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          toast.error("Excel file is empty or has no data rows");
          return;
        }

        // Detect headers
        const headers = rows[0].map((h) => String(h || "").toLowerCase().trim().replace(/\s+/g, ""));

        // Map column indexes
const colMap = {
  name: headers.findIndex((h) => h.includes("name") && !h.includes("company")),
  email: headers.findIndex((h) => h.includes("email")),
  rollno: headers.findIndex((h) => h.includes("roll") || h.includes("enrollment") || h.includes("id")),
  branch: headers.findIndex((h) => h.includes("branch") || h.includes("dept") || h.includes("department")),
  year: headers.findIndex((h) => h.includes("year")),
  phone: headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("contact")),
  cgpa: headers.findIndex((h) => h.includes("cgpa") || h.includes("gpa")),
  tenth: headers.findIndex((h) => h.includes("10th") || h.includes("tenth") || h.includes("ssc")),
  twelfth: headers.findIndex((h) => h.includes("12th") || h.includes("twelfth") || h.includes("hsc") || h.includes("inter")),
  tenth_board: headers.findIndex((h) => h.includes("10") && h.includes("board")),
  twelfth_board: headers.findIndex((h) => h.includes("12") && h.includes("board")),
};

        // Check required columns
        const missingCols = REQUIRED_COLUMNS.filter((col) => colMap[col] === -1);
        if (missingCols.length > 0) {
          toast.error(`Missing columns: ${missingCols.join(", ")}`);
          return;
        }

        // Parse rows
        const students = [];
        const parseErrors = [];

       rows.slice(1).forEach((row, i) => {
  const rowNum = i + 2;
  const name = row[colMap.name]?.toString().trim();
  const email = row[colMap.email]?.toString().trim().toLowerCase();
  const rollNo = row[colMap.rollno]?.toString().trim().toUpperCase();
  const branch = row[colMap.branch]?.toString().trim().toUpperCase();
  const year = row[colMap.year] ? parseInt(row[colMap.year]) : 4;
  const phone = row[colMap.phone]?.toString().trim() || "";
  const cgpa = colMap.cgpa >= 0 && row[colMap.cgpa] ? parseFloat(row[colMap.cgpa]) : undefined;
  const tenth_percentage = colMap.tenth >= 0 && row[colMap.tenth] ? parseFloat(row[colMap.tenth]) : undefined;
  const twelfth_percentage = colMap.twelfth >= 0 && row[colMap.twelfth] ? parseFloat(row[colMap.twelfth]) : undefined;
  const tenth_board = colMap.tenth_board >= 0 ? row[colMap.tenth_board]?.toString().trim() || "" : "";
  const twelfth_board = colMap.twelfth_board >= 0 ? row[colMap.twelfth_board]?.toString().trim() || "" : "";

  if (!name || !email || !rollNo || !branch) {
    parseErrors.push(`Row ${rowNum}: Missing required fields`);
    return;
  }

  if (!email.includes("@")) {
    parseErrors.push(`Row ${rowNum}: Invalid email — ${email}`);
    return;
  }

  students.push({
    name, email, rollNo, branch, year, phone,
    cgpa, tenth_percentage, twelfth_percentage,
    tenth_board, twelfth_board,
  });
});

        setParsedStudents(students);
        setErrors(parseErrors);

        if (students.length > 0) {
          setStep(2);
          toast.success(`${students.length} students detected from Excel`);
        } else {
          toast.error("No valid students found in Excel");
        }
      } catch (err) {
        toast.error("Failed to parse Excel file");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedStudents.length === 0) return;
    setLoading(true);
    try {
      const res = await API.post("/admin/students/import", {
        students: parsedStudents,
      });
      setResult(res.data.data);
      setStep(3);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

const downloadTemplate = () => {
  const template = [
    ["Name", "Email", "Roll No", "Branch", "Year", "Phone", "CGPA", "10th %", "12th %", "10th Board", "12th Board"],
    ["Nitesh Kumar Jha", "nitesh@dtu.ac.in", "2K22/IT/116", "IT", "3", "9876543210", "9.5", "92.5", "88.0", "CBSE", "CBSE"],
    ["Sanjay Kumar", "sanjay@dtu.ac.in", "2K22/CS/098", "CSE", "3", "9876543211", "8.45", "85.0", "79.5", "CBSE", "CBSE"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(template);

  // Set column widths
  ws["!cols"] = [
    { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 8 },
    { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 12 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "student_import_template.xlsx");
};

  return (
    <div className="max-w-4xl space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            Import students from Excel — activation emails sent automatically
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {["Upload Excel", "Preview & Validate", "Import Result"].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${step === i + 1 ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
              {label}
            </span>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Upload */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Template Download */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-indigo-500 text-xl shrink-0">💡</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-800">
                Download the template first
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                Use our Excel template to ensure correct column format.
                Required columns: Name, Email, Roll No, Branch
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="shrink-0 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
            >
               Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-indigo-400 transition">
              <span className="text-4xl mb-3">📊</span>
              <span className="text-sm font-medium text-gray-700">
                {fileName || "Click to upload Excel file"}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Supports .xlsx, .xls — columns auto-detected
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          {/* Column mapping info */}
         <div className="bg-white rounded-xl border border-gray-200 p-4">
  <p className="text-sm font-medium text-gray-700 mb-3">Auto-detected columns:</p>
  <div className="grid grid-cols-2 gap-2 text-xs">
    {[
      { field: "Name", keywords: "name", required: true },
      { field: "Email", keywords: "email", required: true },
      { field: "Roll No", keywords: "roll, enrollment, id", required: true },
      { field: "Branch", keywords: "branch, dept", required: true },
      { field: "Year", keywords: "year", required: false },
      { field: "Phone", keywords: "phone, mobile", required: false },
      { field: "CGPA", keywords: "cgpa, gpa", required: false },
      { field: "10th %", keywords: "10th, tenth, ssc", required: false },
      { field: "12th %", keywords: "12th, twelfth, hsc", required: false },
      { field: "10th Board", keywords: "10 + board", required: false },
      { field: "12th Board", keywords: "12 + board", required: false },
    ].map((col) => (
      <div key={col.field} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
        <span className={`font-medium ${col.required ? "text-red-600" : "text-gray-700"}`}>
          {col.field} {col.required && "*"}
        </span>
        <span className="text-gray-400">→ {col.keywords}</span>
      </div>
    ))}
  </div>
  <p className="text-xs text-red-500 mt-2">* Required fields</p>
  <p className="text-xs text-orange-600 mt-1">
    🔒 If CGPA or marks are provided, student profile will be automatically locked
  </p>
</div>
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{parsedStudents.length}</p>
              <p className="text-xs text-green-600 mt-1">Ready to import</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{errors.length}</p>
              <p className="text-xs text-red-600 mt-1">Rows with errors</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{parsedStudents.length}</p>
              <p className="text-xs text-indigo-600 mt-1">Activation emails to send</p>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 mb-2">
                ⚠️ {errors.length} rows will be skipped:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                Preview — {parsedStudents.length} students
              </p>
              <p className="text-xs text-gray-500">Showing first 10</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
  <thead className="bg-gray-50">
    <tr>
      <th className="text-left px-4 py-2 text-xs text-gray-500">#</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">Name</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">Email</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">Roll No</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">Branch</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">CGPA</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">10th %</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">12th %</th>
      <th className="text-left px-4 py-2 text-xs text-gray-500">Lock</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {parsedStudents.slice(0, 10).map((s, i) => (
      <tr key={i} className="hover:bg-gray-50">
        <td className="px-4 py-2 text-gray-500">{i + 1}</td>
        <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
        <td className="px-4 py-2 text-gray-600">{s.email}</td>
        <td className="px-4 py-2 text-gray-600">{s.rollNo}</td>
        <td className="px-4 py-2 text-gray-600">{s.branch}</td>
        <td className="px-4 py-2 text-gray-600">{s.cgpa || "—"}</td>
        <td className="px-4 py-2 text-gray-600">{s.tenth_percentage ? `${s.tenth_percentage}%` : "—"}</td>
        <td className="px-4 py-2 text-gray-600">{s.twelfth_percentage ? `${s.twelfth_percentage}%` : "—"}</td>
        <td className="px-4 py-2">
          {(s.cgpa || s.tenth_percentage || s.twelfth_percentage) ? (
            <span className="text-xs text-orange-600">🔒 Auto</span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
            </div>
            {parsedStudents.length > 10 && (
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
                + {parsedStudents.length - 10} more students
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setFileName(""); setParsedStudents([]); setErrors([]); }}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              ← Upload Different File
            </button>
            <button
              onClick={handleImport}
              disabled={loading || parsedStudents.length === 0}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Importing..." : `✅ Import ${parsedStudents.length} Students`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Result */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <span className="text-4xl">✅</span>
            <h2 className="text-lg font-semibold text-green-800 mt-3">Import Complete!</h2>
            <p className="text-sm text-green-700 mt-1">
              Activation emails sent to all imported students.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{result.imported}</p>
              <p className="text-xs text-gray-500 mt-1">Successfully imported</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{result.skipped}</p>
              <p className="text-xs text-gray-500 mt-1">Skipped (already exists)</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{result.errors}</p>
              <p className="text-xs text-gray-500 mt-1">Errors</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{result.totalProvided}</p>
              <p className="text-xs text-gray-500 mt-1">Total provided</p>
            </div>
          </div>

          {/* Skipped list */}
          {result.skippedList?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Skipped students:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.skippedList.map((s, i) => (
                  <p key={i} className="text-xs text-yellow-700">
                    {s.row} — {s.reason} ({s.accountStatus})
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Error list */}
          {result.errorList?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.errorList.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">
                    {e.row} — {e.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setFileName(""); setParsedStudents([]); setErrors([]); setResult(null); }}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Import More Students
            </button>
            <button
              onClick={() => navigate("/admin/students")}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              View All Students →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
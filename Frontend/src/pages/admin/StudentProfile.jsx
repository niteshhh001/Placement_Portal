import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import ResumeViewer from "../../components/ResumeViewer";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [viewingResume, setViewingResume] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const res = await API.get(`/admin/students/${id}`);
      setStudent(res.data.data);
      const s = res.data.data;
      const tenth = s.education?.find((e) => e.level === "10th") || {};
      const twelfth = s.education?.find((e) => e.level === "12th") || {};
      reset({
        name: s.name,
        phone: s.phone,
        cgpa: s.cgpa,
        activeBacklogs: s.activeBacklogs,
        totalBacklogs: s.totalBacklogs,
        section: s.section,
        gender: s.gender,
        tenth_institution: tenth.institution || "",
        tenth_percentage: tenth.percentage || "",
        tenth_board: tenth.board || "",
        tenth_passingYear: tenth.passingYear || "",
        twelfth_institution: twelfth.institution || "",
        twelfth_percentage: twelfth.percentage || "",
        twelfth_board: twelfth.board || "",
        twelfth_passingYear: twelfth.passingYear || "",
      });
    } catch (err) {
      toast.error("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const educationArray = [];
      if (data.tenth_institution || data.tenth_percentage) {
        educationArray.push({
          level: "10th",
          institution: data.tenth_institution,
          board: data.tenth_board,
          percentage: data.tenth_percentage ? parseFloat(data.tenth_percentage) : undefined,
          passingYear: data.tenth_passingYear ? parseInt(data.tenth_passingYear) : undefined,
        });
      }
      if (data.twelfth_institution || data.twelfth_percentage) {
        educationArray.push({
          level: "12th",
          institution: data.twelfth_institution,
          board: data.twelfth_board,
          percentage: data.twelfth_percentage ? parseFloat(data.twelfth_percentage) : undefined,
          passingYear: data.twelfth_passingYear ? parseInt(data.twelfth_passingYear) : undefined,
        });
      }

      await API.patch(`/admin/students/${id}/profile`, {
        name: data.name,
        phone: data.phone,
        cgpa: parseFloat(data.cgpa),
        activeBacklogs: parseInt(data.activeBacklogs),
        totalBacklogs: parseInt(data.totalBacklogs),
        section: data.section,
        gender: data.gender,
        education: educationArray,
      });

      toast.success("Profile updated successfully!");
      setEditMode(false);
      fetchStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLockToggle = async () => {
    setLocking(true);
    try {
      await API.patch(`/admin/students/${id}/lock`, {
        lock: !student.isProfileLocked,
      });
      toast.success(`Profile ${!student.isProfileLocked ? "locked" : "unlocked"} successfully!`);
      fetchStudent();
    } catch (err) {
      toast.error("Failed to update lock status");
    } finally {
      setLocking(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!student) return null;

  const tenth = student.education?.find((e) => e.level === "10th");
  const twelfth = student.education?.find((e) => e.level === "12th");

  return (
    <div className="max-w-3xl space-y-6">
      <Toaster position="top-right" />

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Back to Students
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-700">
                  {student.name?.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-sm text-gray-500">{student.email}</p>
              <p className="text-sm text-gray-500">
                {student.rollNo} • {student.branch} • Year {student.year}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {student.isVerified ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Pending</span>
                )}
                {student.isPlaced && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Placed at {student.placedCompany}
                  </span>
                )}
                {student.isBlocked && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Debarred</span>
                )}
                {student.isProfileLocked && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔒 Profile Locked</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleLockToggle}
              disabled={locking}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50
                ${student.isProfileLocked
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                }`}
            >
              {locking
                ? "Updating..."
                : student.isProfileLocked
                ? " Unlock Profile"
                : " Lock Profile"
              }
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-sm px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              {editMode ? "Cancel Edit" : " Edit Profile"}
            </button>
            {student.resumeUrl && (
              <button
                onClick={() => setViewingResume(student.resumeUrl)}
                className="text-sm px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition"
              >
                 View Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lock Notice */}
      {student.isProfileLocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-orange-500 text-xl shrink-0">🔒</span>
          <div>
            <p className="text-sm font-medium text-orange-800">Profile is locked</p>
            <p className="text-xs text-orange-700 mt-1">
              Student cannot update CGPA, marks or education details.
              They can still update resume, name, photo and skills.
            </p>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editMode ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Edit Student Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("name")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("phone")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("cgpa")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("section")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("activeBacklogs")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Backlogs</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("totalBacklogs")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("gender")}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* 10th */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">10th Standard</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">School Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("tenth_institution")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                  <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("tenth_percentage")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Board</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("tenth_board")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Passing Year</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("tenth_passingYear")} />
                </div>
              </div>
            </div>

            {/* 12th */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">12th Standard</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">School Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("twelfth_institution")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                  <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("twelfth_percentage")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Board</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("twelfth_board")} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Passing Year</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("twelfth_passingYear")} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {/* Academic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Academic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">CGPA</p>
                <p className="font-medium text-gray-900 mt-0.5">{student.cgpa || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Section</p>
                <p className="font-medium text-gray-900 mt-0.5">{student.section || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Active Backlogs</p>
                <p className="font-medium text-gray-900 mt-0.5">{student.activeBacklogs ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Backlogs</p>
                <p className="font-medium text-gray-900 mt-0.5">{student.totalBacklogs ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 mt-0.5">{student.phone || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium text-gray-900 mt-0.5 capitalize">{student.gender || "—"}</p>
              </div>
            </div>
          </div>

          {/* 10th & 12th */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">School Education</h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p className="font-medium text-gray-700 border-b pb-1">10th Standard</p>
                <div>
                  <p className="text-gray-500">School</p>
                  <p className="font-medium text-gray-900 mt-0.5">{tenth?.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Percentage</p>
                  <p className="font-medium text-gray-900 mt-0.5">{tenth?.percentage ? `${tenth.percentage}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Board</p>
                  <p className="font-medium text-gray-900 mt-0.5">{tenth?.board || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Passing Year</p>
                  <p className="font-medium text-gray-900 mt-0.5">{tenth?.passingYear || "—"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-gray-700 border-b pb-1">12th Standard</p>
                <div>
                  <p className="text-gray-500">School</p>
                  <p className="font-medium text-gray-900 mt-0.5">{twelfth?.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Percentage</p>
                  <p className="font-medium text-gray-900 mt-0.5">{twelfth?.percentage ? `${twelfth.percentage}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Board</p>
                  <p className="font-medium text-gray-900 mt-0.5">{twelfth?.board || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Passing Year</p>
                  <p className="font-medium text-gray-900 mt-0.5">{twelfth?.passingYear || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {student.skills?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <span key={skill} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Placement Info */}
          {student.isPlaced && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h2 className="font-semibold text-green-900 mb-3">Placement Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Company</p>
                  <p className="font-medium text-green-900 mt-0.5">{student.placedCompany}</p>
                </div>
                <div>
                  <p className="text-green-700">CTC Offered</p>
                  <p className="font-medium text-green-900 mt-0.5">₹{student.ctcOffered} LPA</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewingResume && (
        <ResumeViewer url={viewingResume} onClose={() => setViewingResume(null)} />
      )}
    </div>
  );
}
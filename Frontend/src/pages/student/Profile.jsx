import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ResumeViewer from "../../components/ResumeViewer";
import { ProfileSkeleton } from "../../components/Skeleton";
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [viewingResume, setViewingResume] = useState(null);
  const [education, setEducation] = useState({
    tenth: { level: "10th", institution: "", board: "", percentage: "", passingYear: "" },
    twelfth: { level: "12th", institution: "", board: "", percentage: "", passingYear: "" },
  });

  const { refreshUser } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/student/profile");
      setProfile(res.data.data);
      setSkills(res.data.data.skills || []);

      const edu = res.data.data.education || [];
      const tenth = edu.find((e) => e.level === "10th") || {};
      const twelfth = edu.find((e) => e.level === "12th") || {};

      setEducation({
        tenth: {
          level: "10th",
          institution: tenth.institution || "",
          board: tenth.board || "",
          percentage: tenth.percentage || "",
          passingYear: tenth.passingYear || "",
        },
        twelfth: {
          level: "12th",
          institution: twelfth.institution || "",
          board: twelfth.board || "",
          percentage: twelfth.percentage || "",
          passingYear: twelfth.passingYear || "",
        },
      });

      reset({
        phone: res.data.data.phone,
        cgpa: res.data.data.cgpa,
        activeBacklogs: res.data.data.activeBacklogs,
        totalBacklogs: res.data.data.totalBacklogs,
        section: res.data.data.section,
        gender: res.data.data.gender,
      });
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const educationArray = [];

      if (education.tenth.institution || education.tenth.percentage) {
        educationArray.push({
          level: "10th",
          institution: education.tenth.institution,
          board: education.tenth.board,
          percentage: education.tenth.percentage ? parseFloat(education.tenth.percentage) : undefined,
          passingYear: education.tenth.passingYear ? parseInt(education.tenth.passingYear) : undefined,
        });
      }

      if (education.twelfth.institution || education.twelfth.percentage) {
        educationArray.push({
          level: "12th",
          institution: education.twelfth.institution,
          board: education.twelfth.board,
          percentage: education.twelfth.percentage ? parseFloat(education.twelfth.percentage) : undefined,
          passingYear: education.twelfth.passingYear ? parseInt(education.twelfth.passingYear) : undefined,
        });
      }

      await API.patch("/student/profile", {
        ...data,
        skills,
        education: educationArray,
      });
      toast.success("Profile updated!");
      await refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }
    setUploadingResume(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      await API.post("/student/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Resume uploaded!");
      await refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error("Resume upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      await API.post("/student/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo updated!");
      fetchProfile();
    } catch (err) {
      toast.error("Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const openResume = (url) => setViewingResume(url);

  const isLocked = profile?.isProfileLocked;

  const fields = [
    profile?.name, profile?.email, profile?.phone,
    profile?.branch, profile?.cgpa, profile?.resumeUrl,
  ];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  // Locked input class
  const lockedInputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed";
  const normalInputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

if (loading) return <ProfileSkeleton />;

  return (
    <div className="max-w-2xl space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Keep your profile up to date for better placement chances.
        </p>
      </div>

      {/* Profile Completion */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Profile Completion</p>
          <span className={`text-sm font-bold ${completion === 100 ? "text-green-600" : "text-indigo-600"}`}>
            {completion}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${completion === 100 ? "bg-green-500" : "bg-indigo-600"}`}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Profile Locked Banner */}
      {isLocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-orange-500 text-xl shrink-0">🔒</span>
          <div>
            <p className="text-sm font-medium text-orange-800">Profile is locked by placement cell</p>
            <p className="text-xs text-orange-700 mt-1">
              Your academic details (CGPA, backlogs, 10th & 12th marks) are locked and cannot be changed.
              You can still update your <strong>name, phone, photo, resume and skills</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Photo + Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-700">
                  {profile?.name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-sm text-gray-500">
              {profile?.rollNo} • {profile?.branch} • Year {profile?.year}
            </p>
            <label className="mt-2 text-xs text-indigo-600 font-medium cursor-pointer hover:underline block">
              {uploadingPhoto ? "Uploading..." : "Change Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                className={normalInputClass}
                {...register("phone", {
                  pattern: { value: /^[6-9]\d{9}$/, message: "Invalid phone" }
                })}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className={normalInputClass}
                {...register("gender")}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* CGPA — locked if profile is locked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGPA {isLocked && <span className="text-orange-500 text-xs">🔒 Locked</span>}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                disabled={isLocked}
                className={isLocked ? lockedInputClass : normalInputClass}
                {...register("cgpa", { min: 0, max: 10, valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                type="text"
                className={normalInputClass}
                {...register("section")}
              />
            </div>

            {/* Active Backlogs — locked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Backlogs {isLocked && <span className="text-orange-500 text-xs">🔒 Locked</span>}
              </label>
              <input
                type="number"
                min="0"
                disabled={isLocked}
                className={isLocked ? lockedInputClass : normalInputClass}
                {...register("activeBacklogs", { valueAsNumber: true })}
              />
            </div>

            {/* Total Backlogs — locked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Backlogs {isLocked && <span className="text-orange-500 text-xs">🔒 Locked</span>}
              </label>
              <input
                type="number"
                min="0"
                disabled={isLocked}
                className={isLocked ? lockedInputClass : normalInputClass}
                {...register("totalBacklogs", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Skills — always editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-indigo-400 hover:text-indigo-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Education Details — locked if profile is locked */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Education Details
              </label>
              {isLocked && (
                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  🔒 Academic details locked
                </span>
              )}
            </div>
            <div className="space-y-3">

              {/* 10th */}
              <div className={`border rounded-lg p-4 space-y-3 ${isLocked ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}>
                <p className="text-sm font-medium text-gray-700">10th Standard</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="School name"
                      disabled={isLocked}
                      value={education.tenth.institution}
                      onChange={(e) => setEducation({ ...education, tenth: { ...education.tenth, institution: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 92.5"
                      disabled={isLocked}
                      value={education.tenth.percentage}
                      onChange={(e) => setEducation({ ...education, tenth: { ...education.tenth, percentage: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Board</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE"
                      disabled={isLocked}
                      value={education.tenth.board}
                      onChange={(e) => setEducation({ ...education, tenth: { ...education.tenth, board: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Passing Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2018"
                      disabled={isLocked}
                      value={education.tenth.passingYear}
                      onChange={(e) => setEducation({ ...education, tenth: { ...education.tenth, passingYear: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                </div>
              </div>

              {/* 12th */}
              <div className={`border rounded-lg p-4 space-y-3 ${isLocked ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}>
                <p className="text-sm font-medium text-gray-700">12th Standard</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="School name"
                      disabled={isLocked}
                      value={education.twelfth.institution}
                      onChange={(e) => setEducation({ ...education, twelfth: { ...education.twelfth, institution: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 88.5"
                      disabled={isLocked}
                      value={education.twelfth.percentage}
                      onChange={(e) => setEducation({ ...education, twelfth: { ...education.twelfth, percentage: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Board</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE"
                      disabled={isLocked}
                      value={education.twelfth.board}
                      onChange={(e) => setEducation({ ...education, twelfth: { ...education.twelfth, board: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Passing Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2020"
                      disabled={isLocked}
                      value={education.twelfth.passingYear}
                      onChange={(e) => setEducation({ ...education, twelfth: { ...education.twelfth, passingYear: e.target.value } })}
                      className={isLocked ? "w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-orange-50 text-gray-500 cursor-not-allowed" : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Resume — always editable */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Resume</h2>
        {profile?.resumeUrl ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">📄</span>
              <span className="text-sm text-green-700 font-medium">Resume uploaded</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openResume(profile.resumeUrl)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                View
              </button>
              <label className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                {uploadingResume ? "Uploading..." : "Replace"}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
            {/* Change Password */}
            <ChangePasswordSection />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-indigo-400 transition">
            <span className="text-2xl mb-2">📄</span>
            <span className="text-sm font-medium text-gray-700">
              {uploadingResume ? "Uploading..." : "Upload Resume (PDF)"}
            </span>
            <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleResumeUpload}
            />
          </label>
        )}
      </div>

      {viewingResume && (
        <ResumeViewer url={viewingResume} onClose={() => setViewingResume(null)} />
      )}
    </div>
  );
  function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await API.post("/student/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showNew ? "Hide" : "Show"}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      newPassword.length >= level * 3
                        ? newPassword.length >= 10
                          ? "bg-green-500"
                          : newPassword.length >= 7
                          ? "bg-yellow-500"
                          : "bg-red-400"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs mt-1 text-gray-500">
                {newPassword.length < 6
                  ? "Too short"
                  : newPassword.length < 8
                  ? "Weak"
                  : newPassword.length < 10
                  ? "Medium"
                  : "Strong"}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {/* Match indicator */}
          {confirmPassword && (
            <p className={`text-xs mt-1 ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
              {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";

const BRANCHES = ["ALL", "CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"];

export default function CreateJob() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState(["ALL"]);
  const [rounds, setRounds] = useState([{ name: "", venue: "" }]);
  const navigate = useNavigate();

  const toggleBranch = (branch) => {
    if (branch === "ALL") {
      setSelectedBranches(["ALL"]);
      return;
    }
    const withoutAll = selectedBranches.filter((b) => b !== "ALL");
    if (withoutAll.includes(branch)) {
      const updated = withoutAll.filter((b) => b !== branch);
      setSelectedBranches(updated.length === 0 ? ["ALL"] : updated);
    } else {
      setSelectedBranches([...withoutAll, branch]);
    }
  };

  const addRound = () => setRounds([...rounds, { name: "", venue: "" }]);
  const removeRound = (i) => setRounds(rounds.filter((_, idx) => idx !== i));
  const updateRound = (i, field, value) => {
    const updated = [...rounds];
    updated[i][field] = value;
    setRounds(updated);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/admin/jobs", {
        ...data,
        ctc: parseFloat(data.ctc),
        location: data.location.split(",").map((l) => l.trim()),
        eligibility: {
          minCgpa: parseFloat(data.minCgpa),
          allowedBranches: selectedBranches,
          maxActiveBacklogs: parseInt(data.maxActiveBacklogs),
          maxTotalBacklogs: parseInt(data.maxTotalBacklogs),
          allowPlaced: data.allowPlaced === "true",
          minYear: parseInt(data.minYear),
        },
        rounds: rounds.filter((r) => r.name.trim() !== ""),
      });
      toast.success("Job posted successfully!");
      setTimeout(() => navigate("/admin/jobs"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Toaster position="top-right" />
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details below. An email will be sent to all students automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Company Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Company Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Google"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("companyName", { required: "Company name is required" })}
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("sector")}
              >
                {["IT", "Core", "Finance", "Consulting", "Government", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                placeholder="https://company.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("companyWebsite")}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
              <textarea
                rows={2}
                placeholder="Brief about the company..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("companyDescription")}
              />
            </div>
          </div>
        </div>

        {/* Job Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("jobRole", { required: "Job role is required" })}
              />
              {errors.jobRole && <p className="text-red-500 text-xs mt-1">{errors.jobRole.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("jobType")}
              >
                <option value="Full-time">Full-time</option>
                <option value="Intern">Internship</option>
                <option value="Intern+PPO">Intern + PPO</option>
                <option value="Intern+FTE">Intern + FTE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTC (LPA)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 12"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("ctc", { required: "CTC is required" })}
              />
              {errors.ctc && <p className="text-red-500 text-xs mt-1">{errors.ctc.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bond (years)</label>
              <input
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("bond")}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locations (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, Hyderabad, Pune"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("location")}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                rows={3}
                placeholder="Describe the role and responsibilities..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("jobDescription")}
              />
            </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Application Deadline
  </label>
  <input
    type="datetime-local"
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    {...register("applicationDeadline", { required: "Deadline is required" })}
  />
  {errors.applicationDeadline && (
    <p className="text-red-500 text-xs mt-1">{errors.applicationDeadline.message}</p>
  )}
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Drive Date</label>
  <input
    type="datetime-local"
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    {...register("driveDate")}
  />
</div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isDreamCompany"
                className="rounded border-gray-300 text-indigo-600"
                {...register("isDreamCompany")}
              />
              <label htmlFor="isDreamCompany" className="text-sm text-gray-700">
                Mark as Dream Company
              </label>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Eligibility Criteria</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("minCgpa")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Year</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("minYear")}
              >
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Backlogs</label>
              <input
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("maxActiveBacklogs")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Backlogs</label>
              <input
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("maxTotalBacklogs")}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="allowPlaced"
                className="rounded border-gray-300 text-indigo-600"
                {...register("allowPlaced")}
              />
              <label htmlFor="allowPlaced" className="text-sm text-gray-700">
                Allow already placed students to apply
              </label>
            </div>
          </div>

          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Branches</label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition
                    ${selectedBranches.includes(branch)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rounds */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Selection Rounds</h2>
            <button
              type="button"
              onClick={addRound}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + Add Round
            </button>
          </div>
          <div className="space-y-3">
            {rounds.map((round, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  placeholder="Round name (e.g. Aptitude Test)"
                  value={round.name}
                  onChange={(e) => updateRound(i, "name", e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Venue"
                  value={round.venue}
                  onChange={(e) => updateRound(i, "venue", e.target.value)}
                  className="w-32 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRound(i)}
                    className="text-red-500 hover:text-red-700 text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Posting Job..." : "Post Job & Notify Students"}
        </button>
      </form>
    </div>
  );
}
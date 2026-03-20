import { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import API from "../../api/axios";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"];

export default function Notifications() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);

  const toggleBranch = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await API.post("/admin/notify", {
        subject: data.subject,
        message: data.message,
        branches: selectedBranches.length > 0 ? selectedBranches : undefined,
      });
      toast.success(res.data.message);
      reset();
      setSelectedBranches([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
        <p className="text-gray-500 text-sm mt-1">
          Send bulk email to students. Leave branch filter empty to send to all.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Branches (optional — leave empty for all)
            </label>
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
            {selectedBranches.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2">
                Sending to: {selectedBranches.join(", ")}
              </p>
            )}
            {selectedBranches.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Sending to all branches
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              placeholder="e.g. Important Placement Update"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={6}
              placeholder="Type your message here..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("message", { required: "Message is required" })}
            />
            {errors.message && (
              <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : " Send Notification"}
          </button>
        </div>
      </form>
    </div>
  );
}
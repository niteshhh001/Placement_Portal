import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import API from "../api/axios";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER"];
const DOMAIN = import.meta.env.VITE_UNIVERSITY_DOMAIN;

export default function Register() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  // Step 1 — Submit registration form
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/auth/student/register", data);
      setEmail(data.email);
      setStep(2);
      toast.success(`OTP sent to ${data.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      const res = await API.post("/auth/student/verify-otp", { email, otp });
      toast.success("Registration successful!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    try {
      await API.post("/auth/student/register", { email });
      toast.success("New OTP sent!");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 1 ? `Use your @${DOMAIN} email` : `Enter OTP sent to ${email}`}
          </p>
        </div>

        {/* Step 1 — Registration Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
                <input
                  type="email"
                  placeholder={`you@${DOMAIN}`}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("email", {
                    required: "Email is required",
                    validate: (val) =>
                      val.endsWith(`@${DOMAIN}`) || `Only @${DOMAIN} emails allowed`,
                  })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  placeholder="20CSE001"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("rollNo", { required: "Roll number is required" })}
                />
                {errors.rollNo && <p className="text-red-500 text-xs mt-1">{errors.rollNo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("phone", { required: "Phone is required", pattern: { value: /^[6-9]\d{9}$/, message: "Invalid phone number" } })}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("branch", { required: "Branch is required" })}
                >
                  <option value="">Select</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("year", { required: "Year is required", valueAsNumber: true })}
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={verifying}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center">
              <button
                onClick={resendOtp}
                className="text-sm text-indigo-600 hover:underline"
              >
                Resend OTP
              </button>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to registration
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
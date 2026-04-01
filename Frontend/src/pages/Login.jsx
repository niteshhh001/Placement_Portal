import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isBlocked = new URLSearchParams(window.location.search).get("blocked");

  const resendActivation = async () => {
    setResending(true);
    try {
      await API.post("/auth/resend-activation", { email: accountStatus.email });
      toast.success("Activation link sent! Check your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setAccountStatus(null);
    try {
      const res = await API.post("/auth/login", data);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err) {
      const status = err.response?.data?.accountStatus;
      if (status === "pending_activation") {
        setAccountStatus({
          type: "pending_activation",
          email: err.response?.data?.email || data.email,
        });
      } else if (status === "pending_verification") {
        setAccountStatus({ type: "pending_verification" });
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
    {/* Header */}
     <div className="text-center mb-8">
  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
    <img
      src="/logo.png"
      alt="Placement Portal"
      className="w-8 h-8 object-contain"
    />
  </div>

  <h1 className="text-2xl font-bold text-gray-900">
    Placement Portal
  </h1>

  <p className="text-gray-500 mt-1 text-sm">
    Sign in to your account
  </p>
     </div>

        {/* Blocked Banner */}
        {isBlocked && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
            Your account has been debarred. Please contact the placement cell.
          </div>
        )}

        {/* Pending Activation Banner */}
        {accountStatus?.type === "pending_activation" && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl shrink-0">📧</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Account not activated yet
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Check your email for the activation link sent by the placement cell.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resendActivation}
              disabled={resending}
              className="w-full text-sm text-yellow-700 border border-yellow-300 py-2 rounded-lg hover:bg-yellow-100 transition disabled:opacity-50"
            >
              {resending ? "Sending..." : "📨 Resend Activation Link"}
            </button>
          </div>
        )}

        {/* Pending Verification Banner */}
        {accountStatus?.type === "pending_verification" && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-blue-500 text-xl shrink-0">⏳</span>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Account pending verification
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Your account is being reviewed by the placement cell.
                You will be notified once approved.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@dtu.ac.in"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
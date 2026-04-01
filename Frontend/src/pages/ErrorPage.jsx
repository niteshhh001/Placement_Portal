import { useNavigate, useSearchParams } from "react-router-dom";

export default function ErrorPage({ code, message }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get error code from props or URL query param (?code=404)
  const errorCode = code || parseInt(searchParams.get("code")) || 404;

  const errorDetails = {
    400: {
      title: "Bad Request",
      description: "The request was invalid or cannot be served.",
      emoji: "⚠️",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    401: {
      title: "Unauthorized",
      description: "You need to login to access this page.",
      emoji: "🔒",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    403: {
      title: "Forbidden",
      description: "You don't have permission to access this page.",
      emoji: "🚫",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    404: {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
      emoji: "🔍",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
    500: {
      title: "Server Error",
      description: "Something went wrong on our end. Please try again later.",
      emoji: "🛠️",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  };

  const error = errorDetails[errorCode] || {
    title: "Unexpected Error",
    description: message || "Something unexpected happened.",
    emoji: "❗",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">

        {/* Error Card */}
        <div className={`${error.bg} ${error.border} border rounded-2xl p-8 space-y-4`}>
          <span className="text-6xl block">{error.emoji}</span>
          <div>
            <h1 className={`text-4xl font-bold ${error.color}`}>{errorCode}</h1>
            <h2 className="text-xl font-semibold text-gray-900 mt-2">{error.title}</h2>
            <p className="text-gray-500 text-sm mt-2">{error.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Go to Home
          </button>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="text-xs text-gray-400">Placement Portal</span>
        </div>

      </div>
    </div>
  );
}
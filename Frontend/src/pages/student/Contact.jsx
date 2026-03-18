import { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function Contact() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/student/contact", data);
      toast.success("Message sent successfully!");
      setSubmitted(true);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Placement Cell</h1>
        <p className="text-gray-500 text-sm mt-1">
          Have a query or issue? Reach out to us and we'll get back to you.
        </p>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center gap-2">
          <span className="text-2xl">📧</span>
          <p className="text-xs font-medium text-gray-500">Email</p>
          <p className="text-sm font-medium text-indigo-600">placements@college.edu</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center gap-2">
          <span className="text-2xl">📞</span>
          <p className="text-xs font-medium text-gray-500">Phone</p>
          <p className="text-sm font-medium text-indigo-600">+91 98765 43210</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center gap-2">
          <span className="text-2xl">🕐</span>
          <p className="text-xs font-medium text-gray-500">Office Hours</p>
          <p className="text-sm font-medium text-gray-700">Mon–Fri, 9AM–5PM</p>
        </div>
      </div>

      {/* Success State */}
      {submitted ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <span className="text-4xl">✅</span>
          <h2 className="text-lg font-semibold text-gray-900">Message Sent!</h2>
          <p className="text-sm text-gray-500">
            We have received your message and will get back to you within 1-2 working days.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        /* Contact Form */
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Send us a message</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  readOnly
                  {...register("name")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  readOnly
                  {...register("email")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("category", { required: "Please select a category" })}
              >
                <option value="">Select a category</option>
                <option value="Application Issue">Application Issue</option>
                <option value="Profile Issue">Profile Issue</option>
                <option value="Resume Upload Issue">Resume Upload Issue</option>
                <option value="Company Query">Company Query</option>
                <option value="Verification Issue">Verification Issue</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief subject of your query"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("subject", { required: "Subject is required" })}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Describe your issue or query in detail..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("message", {
                  required: "Message is required",
                  minLength: { value: 20, message: "Message must be at least 20 characters" }
                })}
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
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              q: "How long does account verification take?",
              a: "Account verification usually takes 1-2 working days after registration."
            },
            {
              q: "Can I apply to multiple companies?",
              a: "Yes, you can apply to multiple companies unless you have been placed and the job doesn't allow placed students."
            },
            {
              q: "Can I withdraw my application?",
              a: "Yes, you can withdraw your application as long as the status is still 'applied' and the deadline hasn't passed."
            },
            {
              q: "What file format is accepted for resume?",
              a: "Only PDF format is accepted. Maximum file size is 5MB."
            },
            {
              q: "I forgot my password, what should I do?",
              a: "Click on 'Forgot Password' on the login page. An OTP will be sent to your registered email."
            },
          ].map((faq, i) => (
            <FAQ key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQ({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
        <p className="text-sm font-medium text-gray-900">{question}</p>
        <span className="text-gray-400 text-sm shrink-0 ml-2">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}
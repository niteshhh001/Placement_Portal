import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentLayout from "./components/StudentLayout";
import Dashboard from "./pages/student/Dashboard";
import Jobs from "./pages/student/Jobs";
import JobDetail from "./pages/student/JobDetail";
import Applications from "./pages/student/Applications";
import Profile from "./pages/student/Profile";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminJobs from "./pages/admin/Jobs";
import CreateJob from "./pages/admin/CreateJob";
import Applicants from "./pages/admin/Applicants";
import AdminStudents from "./pages/admin/Students";
import Notifications from "./pages/admin/Notifications";
import ForgotPassword from "./pages/ForgotPassword";
import Contact from "./pages/student/Contact";
import StudentProfile from "./pages/admin/StudentProfile";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Student */}
          <Route path="/student" element={
            <RoleRoute role="student">
              <StudentLayout />
            </RoleRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="applications" element={<Applications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={
            <RoleRoute role="admin">
              <AdminLayout />
            </RoleRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="jobs/create" element={<CreateJob />} />
            <Route path="jobs/:id/applicants" element={<Applicants />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="students/:id" element={<StudentProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
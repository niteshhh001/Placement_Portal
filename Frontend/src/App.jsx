import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RoleRoute } from "./auth/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Activate from "./pages/Activate";
import ErrorPage from "./pages/ErrorPage";

import StudentLayout from "./components/StudentLayout";
import Dashboard from "./pages/student/Dashboard";
import Jobs from "./pages/student/Jobs";
import JobDetail from "./pages/student/JobDetail";
import Applications from "./pages/student/Applications";
import Profile from "./pages/student/Profile";
import Contact from "./pages/student/Contact";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminJobs from "./pages/admin/Jobs";
import CreateJob from "./pages/admin/CreateJob";
import Applicants from "./pages/admin/Applicants";
import AdminStudents from "./pages/admin/Students";
import Notifications from "./pages/admin/Notifications";
import StudentProfile from "./pages/admin/StudentProfile";
import ImportStudents from "./pages/admin/ImportStudents";

function App() {
  return (
    
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/error" element={<ErrorPage />} />

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <RoleRoute role="student">
                  <StudentLayout />
                </RoleRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="applications" element={<Applications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <RoleRoute role="admin">
                  <AdminLayout />
                </RoleRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="jobs/create" element={<CreateJob />} />
              <Route path="jobs/:id/applicants" element={<Applicants />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/import" element={<ImportStudents />} />
              <Route path="students/:id" element={<StudentProfile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* 404 catch all */}
            <Route
              path="*"
              element={<ErrorPage code={404} message="Page not found" />}
            />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    
  );
}

export default App;

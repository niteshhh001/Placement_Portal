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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

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
          </Route>

          {/* Admin — Week 10 */}
          <Route path="/admin/*" element={
            <RoleRoute role="admin">
              <div className="flex items-center justify-center h-screen text-gray-500">
                Admin dashboard — coming in Week 10!
              </div>
            </RoleRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
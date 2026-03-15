import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Student routes — Week 8 */}
          <Route path="/student/*" element={
            <RoleRoute role="student">
              <div className="flex items-center justify-center h-screen text-gray-500">
                Student dashboard coming in Week 8!
              </div>
            </RoleRoute>
          } />

          {/* Admin routes — Week 10 */}
          <Route path="/admin/*" element={
            <RoleRoute role="admin">
              <div className="flex items-center justify-center h-screen text-gray-500">
                Admin dashboard coming in Week 10!
              </div>
            </RoleRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
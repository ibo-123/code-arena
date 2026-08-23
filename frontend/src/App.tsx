import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Bracket } from "./pages/Bracket";
import { Live } from "./pages/Live";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminContests } from "./pages/admin/AdminContests";
import { AdminBracket } from "./pages/admin/AdminBracket";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminParticipants } from "./pages/admin/AdminParticipants";
import { AdminLogs } from "./pages/admin/AdminLogs";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/live" element={<Live />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="contests" element={<AdminContests />} />
            <Route path="bracket" element={<AdminBracket />} />
            <Route path="groups" element={<AdminGroups />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

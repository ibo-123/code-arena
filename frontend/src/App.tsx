import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

import { AdminProvider } from "./context/AdminContext";
import AdminLayout from "./components/layout/AdminLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Bracket } from "./pages/Bracket";
import { Live } from "./pages/Live";
import { Leaderboard } from "./pages/Leaderboard";
import { Results } from "./pages/Results";
import { ContestDetails } from "./pages/ContestDetails";
import { TournamentDetails } from "./pages/TournamentDetails";
import { Champion } from "./pages/Champion";

import { Dashboard } from "./pages/Dashboard";
// ✅ Fix: Use default import for ParticipantProfile
import ParticipantProfile from "./pages/ParticipantProfile";

import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminContests } from "./pages/admin/AdminContests";
import { AdminBracket } from "./pages/admin/AdminBracket";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminParticipants } from "./pages/admin/AdminParticipants";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminResults } from "./pages/admin/AdminResults";
import { AdminSettings } from "./pages/admin/AdminSettings";

import CreateTournament from "./pages/admin/CreateTournament";
import EditTournament from "./pages/admin/EditTournament";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* =====================================================
              PUBLIC ROUTES
          ====================================================== */}

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/live" element={<Live />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/results" element={<Results />} />
          <Route path="/contests/:id" element={<ContestDetails />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/champion" element={<Champion />} />

          {/* =====================================================
              PROTECTED USER ROUTES
          ====================================================== */}

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ParticipantProfile />} />
          </Route>

          {/* =====================================================
              ADMIN ROUTES
          ====================================================== */}

          <Route path="/admin" element={<AdminRoute />}>
            <Route
              element={
                <AdminProvider>
                  <AdminLayout />
                </AdminProvider>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="contests" element={<AdminContests />} />
              <Route path="bracket" element={<AdminBracket />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="participants" element={<AdminParticipants />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="tournaments/create" element={<CreateTournament />} />
              <Route path="tournaments/:id/edit" element={<EditTournament />} />
            </Route>
          </Route>

          {/* =====================================================
              FALLBACK
          ====================================================== */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

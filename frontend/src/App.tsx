
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
import { ParticipantProfile } from "./pages/ParticipantProfile";

import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminContests } from "./pages/admin/AdminContests";
import { AdminBracket } from "./pages/admin/AdminBracket";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminParticipants } from "./pages/admin/AdminParticipants";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminResults } from "./pages/admin/AdminResults";

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

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/bracket"
            element={<Bracket />}
          />

          <Route
            path="/live"
            element={<Live />}
          />

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          <Route
            path="/results"
            element={<Results />}
          />

          <Route
            path="/contests/:id"
            element={<ContestDetails />}
          />

          <Route
            path="/tournaments/:id"
            element={<TournamentDetails />}
          />

          <Route
            path="/champion"
            element={<Champion />}
          />

          {/* =====================================================
              PROTECTED USER ROUTES
          ====================================================== */}

          <Route element={<ProtectedRoute />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/profile"
              element={<ParticipantProfile />}
            />

          </Route>

          {/* =====================================================
              ADMIN ROUTES
          ====================================================== */}

          <Route
            path="/admin"
            element={<AdminRoute />}
          >
            <Route
              element={
                <AdminProvider>
                  <AdminLayout />
                </AdminProvider>
              }
            >

              {/* Admin Dashboard */}
              <Route
                index
                element={<AdminDashboard />}
              />

              {/* Contest Management */}
              <Route
                path="contests"
                element={<AdminContests />}
              />

              {/* Tournament Bracket */}
              <Route
                path="bracket"
                element={<AdminBracket />}
              />

              {/* Groups */}
              <Route
                path="groups"
                element={<AdminGroups />}
              />

              {/* Participants */}
              <Route
                path="participants"
                element={<AdminParticipants />}
              />

              {/* Audit Logs */}
              <Route
                path="logs"
                element={<AdminLogs />}
              />

              {/* Results */}
              <Route
                path="results"
                element={<AdminResults />}
              />

              {/* Create Tournament */}
              <Route
                path="tournaments/create"
                element={<CreateTournament />}
              />

              {/* Edit Tournament */}
              <Route
                path="tournaments/:id/edit"
                element={<EditTournament />}
              />

            </Route>
          </Route>

          {/* =====================================================
              FALLBACK
          ====================================================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

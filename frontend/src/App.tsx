import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { ParticipantLayout } from "./layouts/ParticipantLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Public Pages
import { Home } from "./pages/public/Home";
import { Tournaments } from "./pages/public/Tournaments";
import { TournamentDetails } from "./pages/public/TournamentDetails";
import { Bracket } from "./pages/public/Bracket";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";

// Participant Pages
import { Dashboard } from "./pages/participant/Dashboard";
import { MyTournaments } from "./pages/participant/MyTournaments";
import { ParticipantTournament } from "./pages/participant/ParticipantTournament";
import { ContestDetails } from "./pages/participant/ContestDetails";
import { Standings } from "./pages/participant/Standings";
import { Invitations } from "./pages/participant/Invitations";
import { Profile } from "./pages/participant/Profile";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminTournaments } from "./pages/admin/AdminTournaments";
import { AdminTournamentDetail } from "./pages/admin/AdminTournamentDetail";
import { AdminParticipants } from "./pages/admin/AdminParticipants";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminContests } from "./pages/admin/AdminContests";
import { AdminInvitations } from "./pages/admin/AdminInvitations";
import { AdminVideos } from "./pages/admin/AdminVideos";
import { AdminStandings } from "./pages/admin/AdminStandings";
import { AdminBracket } from "./pages/admin/AdminBracket";
import { AdminSettings } from "./pages/admin/AdminSettings";

// Route Guards
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* =============================================
              PUBLIC ROUTES
          ============================================== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetails />} />
            <Route path="/tournaments/:id/bracket" element={<Bracket />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* =============================================
              PARTICIPANT ROUTES
          ============================================== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ParticipantLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/tournaments" element={<MyTournaments />} />
              <Route path="/dashboard/tournaments/:id" element={<ParticipantTournament />} />
              <Route
                path="/dashboard/tournaments/:id/contests/:contestId"
                element={<ContestDetails />}
              />
              <Route path="/dashboard/standings" element={<Standings />} />
              <Route path="/dashboard/invitations" element={<Invitations />} />
              <Route path="/dashboard/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* =============================================
              ADMIN ROUTES
          ============================================== */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tournaments" element={<AdminTournaments />} />
              <Route path="/admin/tournaments/:id" element={<AdminTournamentDetail />} />
              <Route path="/admin/tournaments/:id/participants" element={<AdminParticipants />} />
              <Route path="/admin/tournaments/:id/groups" element={<AdminGroups />} />
              <Route path="/admin/tournaments/:id/contests" element={<AdminContests />} />
              <Route path="/admin/tournaments/:id/invitations" element={<AdminInvitations />} />
              <Route path="/admin/tournaments/:id/videos" element={<AdminVideos />} />
              <Route path="/admin/tournaments/:id/standings" element={<AdminStandings />} />
              <Route path="/admin/tournaments/:id/bracket" element={<AdminBracket />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

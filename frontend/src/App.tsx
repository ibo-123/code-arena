import "./App.css"
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Bracket } from './pages/Bracket'
import { Leaderboard } from './pages/Leaderboard'
import { Live } from './pages/Live'
import { ContestDetails } from './pages/ContestDetails'
import { Results } from './pages/Results'
import { ParticipantProfile } from './pages/ParticipantProfile'
import { Champion } from './pages/Champion'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminParticipants } from './pages/admin/AdminParticipants'
import { AdminGroups } from './pages/admin/AdminGroups'
import { AdminContests } from './pages/admin/AdminContests'
import { AdminResults } from './pages/admin/AdminResults'
import { AdminBracket } from './pages/admin/AdminBracket'
import { AdminLogs } from './pages/admin/AdminLogs'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { AdminLayout } from './components/layout/AdminLayout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/live" element={<Live />} />
          <Route path="/contests/:contestId" element={<ContestDetails />} />
          <Route path="/results/:contestId" element={<Results />} />
          <Route path="/participants/:participantId" element={<ParticipantProfile />} />
          <Route path="/champion" element={<Champion />} />

          {/* Protected Participant Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/participants" element={<AdminParticipants />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/contests" element={<AdminContests />} />
              <Route path="/admin/results" element={<AdminResults />} />
              <Route path="/admin/bracket" element={<AdminBracket />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

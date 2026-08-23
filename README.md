# Code Arena 2026

![Platform Status](https://img.shields.io/badge/status-active-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-blue)
![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Express%20%7C%20MongoDB-green)
![Build Status](https://img.shields.io/badge/build-passing-success)

**Code Arena 2026** is a competitive programming tournament platform designed for managing round-robin group stages and playoff brackets with real-time Codeforces API integration.

---

## 📐 System Architecture

The application is structured as a decoupled full-stack monorepo:

```text
code-arena/
├── backend/                  # Node.js + Express REST API Server
│   └── src/
│       ├── config/           # Database & environmental configurations
│       ├── controllers/      # Route controllers (Auth, Tournament, Contest, Admin)
│       ├── middleware/       # JWT Auth & Role-Based Access Control (RBAC)
│       ├── models/           # Mongoose schemas (User, Tournament, Participant, Contest, Match, AuditLog)
│       ├── routes/           # API endpoints routing
│       └── services/         # Codeforces API synchronization service
└── frontend/                 # React 19 + TypeScript + Vite Single Page Application
    └── src/
        ├── components/       # UI components & shared layouts (Auth, Navigation, Admin)
        ├── context/          # Global AuthContext provider
        ├── pages/            # Public & Participant routes (Home, Live, Bracket, Standings, Profile)
        │   └── admin/        # Admin Management pages (Dashboard, Participants, Groups, Contests, Results, Logs)
        ├── services/         # Typed API clients (tournamentApi, contestApi, adminApi, authApi)
        ├── styles/           # Modern Glassmorphic CSS design system
        └── types/            # Centralized TypeScript domain interfaces
```

---

## 🌟 Core Features & Modules

### 1. Public & Participant Features
- **Championship Hub (`/`)**: Hero page featuring tournament countdown, prize structures, and stage paths.
- **Leaderboard (`/leaderboard`)**: Real-time standings filterable by overall score, group seedings (Groups A–D), and playoff status.
- **Tournament Bracket (`/bracket`)**: Dynamic knockout tree rendering Quarter Finals, Semi Finals, Grand Final, and Champion crowning.
- **Live Arena (`/live`)**: Active competition center displaying live contest cards, direct Codeforces links, and live standings.
- **Contest Details & Submissions (`/contests/:id`, `/results/:id`)**: Detailed contest problem breakdowns, point tallies, and problem-by-problem solve status.
- **Participant Profile (`/participants/:id`)**: Competitor statistics card showing total score, seed, current status, and Codeforces profile link.
- **Grand Champion (`/champion`)**: Hall of Fame crowning page for the tournament winner.

### 2. Admin Control Portal
- **Overview Dashboard (`/admin`)**: Real-time tournament statistics, total registration count, and stage advancement triggers.
- **Group Stage Draw (`/admin/groups`)**: Group seeding allocations across Groups A–D.
- **Participants Directory (`/admin/participants`)**: Complete player directory with status toggles and seed assignments.
- **Codeforces Integration (`/admin/contests`)**: Attach Codeforces contests by ID/URL, duration, and target round.
- **Score Synchronization (`/admin/results`)**: Automated Codeforces API standings fetch and point distribution.
- **Playoff Management (`/admin/bracket`)**: Knockout bracket state control and matchup progression.
- **Audit Logs (`/admin/logs`)**: System audit log trail capturing all administrative actions.

---

## 🔌 API Specifications

### Base Endpoint: `/api`

| Module | Route | Method | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/auth/register` | `POST` | Public | Register a new competitor account |
| **Auth** | `/auth/login` | `POST` | Public | Authenticate user & receive JWT token |
| **Auth** | `/auth/me` | `GET` | Authenticated | Retrieve authenticated user profile |
| **Tournaments** | `/tournaments` | `GET` | Public | List active and upcoming tournaments |
| **Tournaments** | `/tournaments/:id` | `GET` | Public | Get tournament details |
| **Tournaments** | `/tournaments/:id/join` | `POST` | Authenticated | Join tournament as participant |
| **Tournaments** | `/tournaments/:id/start` | `POST` | Admin | Start tournament and trigger group draw |
| **Tournaments** | `/tournaments/:id/advance/:stage` | `POST` | Admin | Advance tournament stage (group-stage, QF, SF, complete) |
| **Tournaments** | `/tournaments/:id/leaderboard` | `GET` | Public | Fetch overall leaderboard |
| **Tournaments** | `/tournaments/:id/bracket` | `GET` | Public | Fetch bracket and match data |
| **Contests** | `/tournaments/:id/contests` | `GET` / `POST` | Public / Admin | List or attach Codeforces contests |
| **Contests** | `/tournaments/:id/contests/:contestId/sync` | `POST` | Admin | Sync standings directly from Codeforces API |
| **Admin** | `/admin/logs` | `GET` | Admin | Fetch system audit logs |

---

## 📊 Comprehensive Verification Status

The codebase has undergone a full system audit and verification check:

- **TypeScript Compilation:** `npx tsc --project tsconfig.app.json --noEmit` — **0 Errors** (Strict `verbatimModuleSyntax` compliant).
- **ESLint Code Quality:** `npm run lint` — **0 Errors, 0 Warnings** (Fast Refresh & React hooks rule compliant).
- **Production Bundle:** `npm run build` — **Built Successfully** (`dist/` index bundle generated in < 5s).
- **Module Resolution:** All 18 routes, page exports, API clients, and UI component re-exports are mapped and fully resolved.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Local or MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
# Configure environment variables in backend/.env
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/code-arena
# JWT_SECRET=your_jwt_secret
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure environment variables in frontend/.env
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

The frontend application will run locally at `http://localhost:5173`.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for details.

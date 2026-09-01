// ============================================================
// User Types
// ============================================================
export interface User {
  _id: string;
  id?: string; // For backward compatibility
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARTICIPANT';
  codeforcesUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  codeforcesUsername?: string;
}

// ============================================================
// Tournament Types – CANONICAL DATE FIELDS
// ============================================================
export type TournamentStatus = 'REGISTRATION' | 'GROUP_STAGE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'COMPLETED';
export type TournamentStage = 'GROUP_STAGE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface Tournament {
  _id: string;
  name: string;
  description: string;
  status: TournamentStatus;
  currentStage: TournamentStage;
  currentRound?: string;          // alias for currentStage
  maxParticipants: number;
  participantCount?: number;

  // ---- CANONICAL DATE FIELDS (use these) ----
  registrationStart?: string;     // ISO 8601 UTC
  registrationEnd?: string;       // ISO 8601 UTC
  tournamentStart?: string;       // ISO 8601 UTC
  tournamentEnd?: string;         // ISO 8601 UTC

  // ---- LEGACY (avoid using) ----
  /** @deprecated Use `tournamentStart` instead */
  startDate?: Date;
  /** @deprecated Use `tournamentEnd` instead */
  endDate?: Date;

  // Format & structure
  numberOfGroups?: number;
  participantsPerGroup?: number;
  qualifiersPerGroup?: number;
  playoffFormat?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Participant Types
// ============================================================
export type ParticipantStatus = 'ACTIVE' | 'ELIMINATED' | 'ADVANCED' | 'CHAMPION';

export interface Participant {
  _id: string;
  userId: string;
  tournamentId: string;
  user: User;
  group?: string;
  seed?: number;
  rank?: number;
  score?: number;
  solved?: number;
  penalty?: number;
  status: ParticipantStatus;
  currentRound?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Contest Types
// ============================================================
export type ContestStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export interface Contest {
  _id: string;
  tournamentId: string;
  codeforcesContestId: number;
  codeforcesContestName: string;
  name?: string;
  codeforcesUrl: string;
  type: string;
  phase: string;
  startTime: Date;
  durationSeconds: number;
  durationMinutes?: number;
  stage: TournamentStage;
  round?: string;
  group?: string;
  matchNumber?: number;
  status: ContestStatus;
  published: boolean;
  publishedAt?: Date;
  lastSyncedAt?: Date;
  syncedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Result Types
// ============================================================
export interface ProblemResult {
  problemIndex: string;
  problemName: string;
  points: number;
  solved: boolean;
  wrongAttempts: number;
  bestSubmissionTime?: number;
}

export interface Result {
  _id: string;
  contestId: string;
  tournamentId: string;
  participantId: string;
  codeforcesHandle: string;
  rank: number;
  points: number;
  score: number;
  penalty: number;
  solvedCount: number;
  solved: number;
  problemResults: ProblemResult[];
  syncedAt: Date;
  participant?: {
    _id: string;
    user?: {
      username?: string;
      name?: string;
      codeforcesUsername?: string;
    };
    group?: string;
  };
}

// ============================================================
// Leaderboard Types
// ============================================================
export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  username: string;
  name?: string;
  codeforcesUsername: string;
  group?: string;
  solved: number;
  score: number;
  penalty: number;
}

// ============================================================
// Bracket Types
// ============================================================
export interface Match {
  matchNumber: number;
  participants: Participant[];
  winner?: Participant;
  contest?: Contest;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
}

export type BracketMatch = Match;

export interface Bracket {
  tournamentId: string;
  groupStage: Record<string, Participant[]>;
  quarterFinal: BracketMatch[];
  semiFinal: BracketMatch[];
  final?: BracketMatch;
  champion?: Participant;
}

// ============================================================
// Audit Log Types
// ============================================================
export interface AuditLog {
  _id: string;
  action: string;
  description: string;
  admin: User;
  tournament?: string;
  details: unknown;
  createdAt: Date;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
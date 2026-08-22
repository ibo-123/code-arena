export type Role = 'PARTICIPANT' | 'ADMIN'
export type ParticipantStatus = 'REGISTERED' | 'ACTIVE' | 'ADVANCED' | 'ELIMINATED' | 'CHAMPION'
export type ContestStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'COMPLETED'
export type TournamentStatus = 'REGISTRATION' | 'GROUP_STAGE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'COMPLETED'
export type Round = 'GROUP_STAGE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL'

export interface User {
  _id: string
  name: string
  username: string
  email: string
  codeforcesUsername: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Tournament {
  _id: string
  name: string
  description?: string
  status: TournamentStatus
  currentRound: Round
  maxParticipants: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface Participant {
  _id: string
  user: User
  tournament: string
  group: string
  seed: number
  status: ParticipantStatus
  currentRound: Round
  score: number
  solved: number
  penalty: number
  rank?: number
  createdAt: string
  updatedAt: string
}

export interface Contest {
  _id: string
  name: string
  tournament: string
  round: Round
  group?: string
  matchNumber?: number
  codeforcesContestId: number
  codeforcesUrl: string
  status: ContestStatus
  startTime: string
  durationMinutes: number
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ProblemResult {
  problemIndex: string
  status: 'SOLVED' | 'FAILED' | 'NOT_ATTEMPTED'
  points: number
  attempts: number
}

export interface ContestResult {
  _id: string
  participant: Participant
  contest: Contest
  rank: number
  score: number
  solved: number
  penalty: number
  problemResults: ProblemResult[]
  createdAt: string
}

export interface LeaderboardEntry {
  participantId: string
  username: string
  name: string
  codeforcesUsername: string
  group: string
  rank: number
  score: number
  solved: number
  penalty: number
  status: ParticipantStatus
  problemResults?: ProblemResult[]
}

export interface Match {
  matchNumber: number
  round: Round
  participants: Participant[]
  winner?: Participant
  contest?: Contest
  status: 'PENDING' | 'LIVE' | 'COMPLETED'
}

export interface Bracket {
  groupStage: {
    A: Participant[]
    B: Participant[]
    C: Participant[]
    D: Participant[]
  }
  quarterFinal: Match[]
  semiFinal: Match[]
  final: Match | null
  champion?: Participant
}

export interface AuditLog {
  _id: string
  tournament: string
  action: string
  admin: User
  target?: string
  description: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  username: string
  email: string
  password: string
  codeforcesUsername: string
}

export interface AuthResponse {
  user: User
  token: string
}

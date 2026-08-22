export type Role = 'PARTICIPANT' | 'ADMIN'
export type ParticipantStatus = 'REGISTERED' | 'ACTIVE' | 'ADVANCED' | 'ELIMINATED' | 'CHAMPION'

export interface User {
  _id?: string
  id?: string
  name: string
  username: string
  email?: string
  codeforcesUsername: string
  role: Role
}

export interface Tournament {
  _id: string
  name: string
  description?: string
  status: string
  currentRound: string
  maxParticipants: number
}

export interface Participant {
  _id: string
  user: User
  group?: string
  seed?: number
  status: ParticipantStatus
  currentRound: string
}

export interface Contest {
  _id: string
  name: string
  round: string
  group?: string
  matchNumber?: number
  codeforcesContestId: number
  codeforcesUrl: string
  status: string
  startTime: string
  durationMinutes: number
  lastSyncedAt?: string
}

export interface Result {
  _id: string
  participant: Participant
  rank: number
  score: number
  solved: number
  penalty: number
  problemResults?: { problemIndex: string; status: string; points: number }[]
}

export interface LeaderboardEntry {
  rank: number
  participantId: string
  name: string
  username: string
  codeforcesUsername: string
  solved: number
  score: number
  penalty: number
  problemResults?: { problemIndex?: string; status: string; points: number }[]
}

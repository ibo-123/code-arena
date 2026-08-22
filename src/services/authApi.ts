import { api } from './api'
import type { User } from '../types'

interface LoginResponse {
  token: string
  user: User
}

interface RegisterResponse {
  token: string
  user: User
}

interface MeResponse {
  user: User
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  register: (data: { name: string; username: string; email: string; password: string; codeforcesUsername: string }) =>
    api.post<RegisterResponse>('/auth/register', data),

  me: () =>
    api.get<MeResponse>('/auth/me'),
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User } from '../types'

interface AuthValue { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (data: { name: string; username: string; email: string; password: string; codeforcesUsername: string }) => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthValue | null>(null)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { const token = localStorage.getItem('code-arena-token'); if (!token) { setLoading(false); return }; authApi.me().then(({ user: current }) => setUser(current)).catch(() => localStorage.removeItem('code-arena-token')).finally(() => setLoading(false)) }, [])
  const login = async (email: string, password: string) => { const response = await authApi.login(email, password); localStorage.setItem('code-arena-token', response.token); setUser(response.user) }
  const register = async (data: { name: string; username: string; email: string; password: string; codeforcesUsername: string }) => { await authApi.register(data); await login(data.email, data.password) }
  const logout = () => { localStorage.removeItem('code-arena-token'); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value }

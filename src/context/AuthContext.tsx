import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../services/authApi.js'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

interface RegisterData {
  name: string
  username: string
  email: string
  password: string
  codeforcesUsername: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await authApi.me()
          setUser(response.user)
        } catch {
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const logout = async () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

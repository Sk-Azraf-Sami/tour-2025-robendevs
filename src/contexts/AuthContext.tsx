import React, { useState, useEffect } from 'react'
import { AuthContext, type User } from './auth'
import { AuthService } from '../services/AuthService'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('tour-2025-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Try team login first (using username field from Firestore)
      const team = await AuthService.loginTeam(email, password)
      if (team) {
        const userObj: User = {
          id: team.id,
          email: team.username, // teams use username field as email
          name: team.username,
          role: 'team'
        }
        setUser(userObj)
        localStorage.setItem('tour-2025-user', JSON.stringify(userObj))
        setIsLoading(false)
        return true
      }

      // Try admin login
      const admin = await AuthService.loginAdmin(email, password)
      if (admin) {
        const userObj: User = {
          id: admin.id,
          email: admin.username,
          name: 'Admin',
          role: 'admin'
        }
        setUser(userObj)
        localStorage.setItem('tour-2025-user', JSON.stringify(userObj))
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tour-2025-user')
  }

  const value = {
    user,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
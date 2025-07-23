import React from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'team'
  teamId?: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const DUMMY_USERS = [
  {
    id: '1',
    email: 'admin@robendevs.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as const
  },
  {
    id: '2',
    email: 'team@example.com',
    password: 'team123',
    name: 'Team User',
    role: 'team' as const,
    teamId: 'TEAM-MAIN'
  },
  {
    id: '3',
    email: 'team1@example.com',
    password: 'team123',
    name: 'Team Alpha',
    role: 'team' as const,
    teamId: 'TEAM-ALPHA'
  },
  {
    id: '4',
    email: 'team2@example.com',
    password: 'team123',
    name: 'Team Beta',
    role: 'team' as const,
    teamId: 'TEAM-BETA'
  }
]

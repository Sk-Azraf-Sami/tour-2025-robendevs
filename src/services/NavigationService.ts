import type { User } from '../contexts/auth'

/**
 * Navigation service to handle routing logic based on user roles
 */
export class NavigationService {
  /**
   * Get the appropriate redirect path based on user role
   */
  static getRedirectPath(user: User | null): string {
    if (!user) {
      return '/login'
    }

    switch (user.role) {
      case 'admin':
        return '/admin'
      case 'participant':
      case 'team':
        return '/team/dashboard'
      default:
        return '/'
    }
  }

  /**
   * Check if user can access admin routes
   */
  static canAccessAdmin(user: User | null): boolean {
    return user?.role === 'admin'
  }

  /**
   * Check if user can access team routes
   */
  static canAccessTeam(user: User | null): boolean {
    return user?.role === 'participant' || user?.role === 'team'
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(user: User | null): boolean {
    return user !== null
  }

  /**
   * Get user display name for team features
   */
  static getTeamDisplayName(user: User): string {
    if (user.role === 'team' && user.teamId) {
      return user.teamId
    }
    return user.name
  }

  /**
   * Get appropriate dashboard title based on user role
   */
  static getDashboardTitle(user: User): string {
    switch (user.role) {
      case 'admin':
        return 'Admin Dashboard'
      case 'participant':
      case 'team':
        return 'Team Dashboard'
      default:
        return 'Dashboard'
    }
  }
}

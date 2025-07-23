import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirestoreService } from './FireStoreService';
import type { Team, Admin } from '../types';

export class AuthService {
  static async loginTeam(username: string, password: string): Promise<Team | null> {
    try {
      // For teams, we'll use custom authentication since they don't have email
      const teams = await FirestoreService.getAllTeams();
      const team = teams.find(t => 
        t.username === username && 
        t.passwordHash === this.hashPassword(password)
      );
      return team || null;
    } catch (error) {
      console.error('Team login error:', error);
      return null;
    }
  }

  static async loginAdmin(username: string, password: string): Promise<Admin | null> {
    try {
      // Simple hardcoded admin check as per PRD
      if (username === 'admin' && password === 'admin123') {
        return {
          id: 'admin',
          username: 'admin',
          passwordHash: this.hashPassword('admin123')
        };
      }
      return null;
    } catch (error) {
      console.error('Admin login error:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  private static hashPassword(password: string): string {
    // Simple hash for demo - use proper hashing in production
    return btoa(password);
  }
}
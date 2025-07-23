import { FirestoreService } from './FireStoreService';
import type { Puzzle } from '../types';

export class GameService {
  static async startGame(): Promise<void> {
    const teams = await FirestoreService.getAllTeams();
    const puzzles = await FirestoreService.getAllPuzzles();
    const settings = await FirestoreService.getGlobalSettings();

    if (!settings) throw new Error('Global settings not found');

    // Randomize roadmaps for each team
    for (const team of teams) {
      const shuffledPuzzleIds = this.shuffleArray([...puzzles.map(p => p.id)]);
      const roadmap = shuffledPuzzleIds.slice(0, settings.n_checkpoints);
      
      await FirestoreService.updateTeam(team.id, {
        roadmap,
        currentIndex: 0,
        totalTime: 0,
        totalPoints: 0,
        legs: [],
        isActive: true
      });
    }
  }

  static async submitCheckpoint(
    teamId: string, 
    qrCode: string, 
    mcqAnswer: number
  ): Promise<{ success: boolean; puzzle?: Puzzle; message: string }> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return { success: false, message: 'Team not found' };

    if (team.currentIndex >= team.roadmap.length) {
      return { success: false, message: 'Game completed' };
    }

    const currentPuzzleId = team.roadmap[team.currentIndex];
    const puzzle = await FirestoreService.getPuzzle(currentPuzzleId);
    
    if (!puzzle || puzzle.code !== qrCode) {
      return { success: false, message: 'Invalid QR code for current checkpoint' };
    }

    const mcq = await FirestoreService.getMCQ(currentPuzzleId);
    if (!mcq) return { success: false, message: 'MCQ not found' };

    const selectedOption = mcq.options[mcqAnswer];
    if (!selectedOption) return { success: false, message: 'Invalid answer' };

    const settings = await FirestoreService.getGlobalSettings();
    if (!settings) return { success: false, message: 'Settings not found' };

    // Calculate points and time
    const currentTime = Date.now();
    const legStartTime = team.legs[team.currentIndex]?.startTime || currentTime;
    const timeSpent = Math.floor((currentTime - legStartTime) / 60000); // minutes
    const timeBonus = Math.max(0, settings.base_points - (timeSpent * settings.bonus_per_minute));

    const newLeg = {
      checkpointId: currentPuzzleId,
      startTime: legStartTime,
      endTime: currentTime,
      mcqPoints: selectedOption.value,
      timeBonus
    };

    const updatedLegs = [...team.legs];
    updatedLegs[team.currentIndex] = newLeg;

    const totalPoints = team.totalPoints + selectedOption.value + timeBonus;
    const totalTime = team.totalTime + timeSpent;

    await FirestoreService.updateTeam(teamId, {
      legs: updatedLegs,
      currentIndex: team.currentIndex + 1,
      totalPoints,
      totalTime
    });

    return { success: true, puzzle, message: 'Checkpoint completed successfully' };
  }

  static async getNextPuzzle(teamId: string): Promise<Puzzle | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team || team.currentIndex >= team.roadmap.length) return null;

    const nextPuzzleId = team.roadmap[team.currentIndex];
    return await FirestoreService.getPuzzle(nextPuzzleId);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
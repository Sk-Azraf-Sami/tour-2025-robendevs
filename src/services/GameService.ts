import { FirestoreService } from './FireStoreService';
import type { Puzzle, MCQ, MCQOption, TeamLeg } from '../types';

interface TeamProgress {
  roadmap: string[];
  currentIndex: number;
  totalPoints: number;
  elapsedTime: number;
  isGameActive: boolean;
  legs: TeamLeg[];
}

interface QRValidationResult {
  success: boolean;
  mcq?: MCQ;
  message: string;
}

interface MCQSubmissionResult {
  success: boolean;
  isGameComplete: boolean;
  puzzle?: Puzzle;
  pointsEarned: number;
  timeBonus: number;
  message: string;
}

export class GameService {
  static async startGame(): Promise<void> {
    const teams = await FirestoreService.getAllTeams();
    const settings = await FirestoreService.getGlobalSettings();

    if (!settings) throw new Error('Global settings not found');

    // Simply activate teams with their existing roadmaps from database
    for (const team of teams) {
      // Validate that team has a roadmap - roadmap should already exist in database
      if (!team.roadmap || team.roadmap.length === 0) {
        throw new Error(`Team ${team.id} does not have a roadmap configured in database`);
      }
      
      await FirestoreService.updateTeam(team.id, {
        currentIndex: 0,
        totalTime: 0,
        totalPoints: 0,
        legs: [],
        isActive: true,
        gameStartTime: Date.now()
      });
    }
  }

  static async getTeamProgress(teamId: string): Promise<TeamProgress | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;

    // Calculate real-time elapsed time since game started
    const currentTime = Date.now();
    const gameStartTime = team.gameStartTime || currentTime;
    const elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);

    return {
      roadmap: team.roadmap,
      currentIndex: team.currentIndex,
      totalPoints: team.totalPoints,
      elapsedTime,
      isGameActive: team.isActive,
      legs: team.legs
    };
  }

  static async validateQRCode(teamId: string, qrCode: string): Promise<QRValidationResult> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      return { success: false, message: 'Team not found' };
    }

    if (!team.isActive) {
      return { success: false, message: 'Game is not active for this team' };
    }

    if (team.currentIndex >= team.roadmap.length) {
      return { success: false, message: 'Game completed - no more checkpoints' };
    }

    const currentPuzzleId = team.roadmap[team.currentIndex];
    
    // Get the puzzle directly by its ID (since roadmap contains puzzle IDs)
    const currentPuzzle = await FirestoreService.getPuzzle(currentPuzzleId);
    
    if (!currentPuzzle) {
      return { success: false, message: `Current puzzle not found for ID: ${currentPuzzleId}` };
    }

    if (currentPuzzle.code !== qrCode) {
      return { 
        success: false, 
        message: `Wrong QR code! You need to find the QR code: "${currentPuzzle.code}". This QR code belongs to a different puzzle.` 
      };
    }

    // Get a random MCQ from database
    const allMCQs = await FirestoreService.getAllMCQs();
    if (allMCQs.length === 0) {
      return { success: false, message: 'No MCQ questions available' };
    }

    const randomMCQ = allMCQs[Math.floor(Math.random() * allMCQs.length)];

    // Mark the start time for this leg if it's the first scan
    const legStartTime = team.legs[team.currentIndex]?.startTime || Date.now();
    const updatedLegs = [...team.legs];
    if (!updatedLegs[team.currentIndex]) {
      updatedLegs[team.currentIndex] = {
        checkpointId: currentPuzzleId,
        startTime: legStartTime,
        mcqPoints: 0,
        timeBonus: 0
      };
      
      await FirestoreService.updateTeam(teamId, { legs: updatedLegs });
    }

    return { 
      success: true, 
      mcq: randomMCQ,
      message: 'QR code validated successfully. Please answer the MCQ question.' 
    };
  }

  static async submitMCQAnswer(
    teamId: string, 
    qrCode: string, 
    answerOptionId: string
  ): Promise<MCQSubmissionResult> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      return { success: false, isGameComplete: false, pointsEarned: 0, timeBonus: 0, message: 'Team not found' };
    }

    if (team.currentIndex >= team.roadmap.length) {
      return { 
        success: false, 
        isGameComplete: true, 
        pointsEarned: 0, 
        timeBonus: 0, 
        message: 'Game already completed' 
      };
    }

    const currentPuzzleId = team.roadmap[team.currentIndex];
    
    // Get the puzzle directly by its ID (since roadmap contains puzzle IDs)
    const currentPuzzle = await FirestoreService.getPuzzle(currentPuzzleId);
    
    if (!currentPuzzle || currentPuzzle.code !== qrCode) {
      return { 
        success: false, 
        isGameComplete: false, 
        pointsEarned: 0, 
        timeBonus: 0, 
        message: 'Invalid QR code for current puzzle' 
      };
    }

    // Get all MCQs and find the one with the matching option
    const allMCQs = await FirestoreService.getAllMCQs();
    let selectedOption: MCQOption | null = null;

    for (const mcq of allMCQs) {
      const option = mcq.options.find((opt: MCQOption, index: number) => 
        `option_${index}` === answerOptionId || opt.id === answerOptionId
      );
      if (option) {
        selectedOption = option;
        break;
      }
    }

    if (!selectedOption) {
      return { 
        success: false, 
        isGameComplete: false, 
        pointsEarned: 0, 
        timeBonus: 0, 
        message: 'Invalid answer option' 
      };
    }

    const settings = await FirestoreService.getGlobalSettings();
    if (!settings) {
      return { 
        success: false, 
        isGameComplete: false, 
        pointsEarned: 0, 
        timeBonus: 0, 
        message: 'Game settings not found' 
      };
    }

    // Calculate time bonus/penalty based on PRD specifications
    const currentTime = Date.now();
    const legStartTime = team.legs[team.currentIndex]?.startTime || currentTime;
    const timeSpentSeconds = Math.floor((currentTime - legStartTime) / 1000);
    const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);
    
    // Time bonus calculation following PRD requirements
    // Start with base points, apply bonus for fast completion or penalty for slow completion
    let timeBonus = 0;
    
    // Quick completion bonus (under 2 minutes gets bonus)
    if (timeSpentMinutes < 2) {
      timeBonus = settings.bonus_per_minute * (2 - timeSpentMinutes);
    }
    // Normal completion (2-5 minutes) gets no bonus/penalty  
    else if (timeSpentMinutes <= 5) {
      timeBonus = 0;
    }
    // Slow completion penalty (over 5 minutes gets penalty)
    else {
      const penaltyMinutes = timeSpentMinutes - 5;
      timeBonus = -(penaltyMinutes * settings.penalty_points);
    }
    
    // Ensure time bonus/penalty doesn't go below zero total
    timeBonus = Math.max(-settings.base_points, timeBonus);

    const mcqPoints = selectedOption.value || 0;
    const totalPointsEarned = mcqPoints + timeBonus;

    // Update team leg
    const updatedLegs = [...team.legs];
    updatedLegs[team.currentIndex] = {
      ...updatedLegs[team.currentIndex],
      endTime: currentTime,
      mcqPoints,
      timeBonus,
      mcqAnswerOptionId: answerOptionId
    };

    const newCurrentIndex = team.currentIndex + 1;
    const isGameComplete = newCurrentIndex >= team.roadmap.length;
    const newTotalPoints = team.totalPoints + totalPointsEarned;
    
    // Update total time to current elapsed time in seconds
    const gameStartTime = team.gameStartTime || currentTime;
    const newTotalTime = Math.floor((currentTime - gameStartTime) / 1000);

    await FirestoreService.updateTeam(teamId, {
      legs: updatedLegs,
      currentIndex: newCurrentIndex,
      totalPoints: newTotalPoints,
      totalTime: newTotalTime,
      isActive: !isGameComplete
    });

    let nextPuzzle: Puzzle | undefined;
    if (!isGameComplete) {
      const nextPuzzleId = team.roadmap[newCurrentIndex];
      nextPuzzle = await FirestoreService.getPuzzle(nextPuzzleId) || undefined;
    }

    return {
      success: true,
      isGameComplete,
      puzzle: nextPuzzle,
      pointsEarned: totalPointsEarned,
      timeBonus,
      message: isGameComplete 
        ? `Congratulations! Game completed with ${newTotalPoints} points!`
        : `Checkpoint completed! You earned ${totalPointsEarned} points. Find the next checkpoint using the puzzle clue.`
    };
  }

  static async getPuzzleForCheckpoint(puzzleId: string): Promise<Puzzle | null> {
    return await FirestoreService.getPuzzle(puzzleId);
  }

  static async getMCQForCheckpoint(): Promise<MCQ | null> {
    // Since MCQs are random according to PRD, we'll get a random one from the database
    const allMCQs = await FirestoreService.getAllMCQs();
    if (allMCQs.length === 0) return null;
    
    return allMCQs[Math.floor(Math.random() * allMCQs.length)];
  }

  // Get current checkpoint info for team
  static async getCurrentCheckpoint(teamId: string): Promise<{checkpointId: string; puzzle: Puzzle | null} | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team || team.currentIndex >= team.roadmap.length) return null;
    
    const currentPuzzleId = team.roadmap[team.currentIndex];
    const puzzle = await FirestoreService.getPuzzle(currentPuzzleId);
    
    return {
      checkpointId: currentPuzzleId,
      puzzle
    };
  }

  // Get next checkpoint puzzle for team (used after MCQ completion)
  static async getNextCheckpointPuzzle(teamId: string): Promise<Puzzle | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;
    
    const nextIndex = team.currentIndex + 1;
    if (nextIndex >= team.roadmap.length) return null; // Game complete
    
    const nextPuzzleId = team.roadmap[nextIndex];
    return await FirestoreService.getPuzzle(nextPuzzleId);
  }

  static async initializeTeamRoadmap(teamId: string): Promise<void> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) throw new Error('Team not found');
    
    // Validate that team has a roadmap - roadmap should already exist in database
    if (!team.roadmap || team.roadmap.length === 0) {
      throw new Error(`Team ${teamId} does not have a roadmap configured in database`);
    }
    
    // Reset team progress but keep existing roadmap from database
    await FirestoreService.updateTeam(teamId, {
      currentIndex: 0,
      totalTime: 0,
      totalPoints: 0,
      legs: [],
      isActive: true,
      gameStartTime: Date.now()
    });
  }

  // Get starting checkpoint puzzle for initial game state
  static async getStartingCheckpointPuzzle(): Promise<Puzzle | null> {
    const allPuzzles = await FirestoreService.getAllPuzzles();
    return allPuzzles.find(puzzle => puzzle.isStarting === true) || null;
  }

  // Get all checkpoints with their puzzles (useful for admin monitoring)
  static async getAllCheckpointsWithPuzzles(): Promise<{[checkpointId: string]: Puzzle}> {
    const allPuzzles = await FirestoreService.getAllPuzzles();
    const checkpointMap: {[checkpointId: string]: Puzzle} = {};
    
    allPuzzles.forEach(puzzle => {
      if (puzzle.checkpoint) {
        checkpointMap[puzzle.checkpoint] = puzzle;
      }
    });
    
    return checkpointMap;
  }

  // Get team leaderboard data
  static async getTeamLeaderboard(): Promise<Array<{
    teamId: string;
    username: string;
    totalPoints: number;
    totalTime: number;
    currentIndex: number;
    isActive: boolean;
    completionPercentage: number;
  }>> {
    const teams = await FirestoreService.getAllTeams();
    
    return teams.map(team => ({
      teamId: team.id,
      username: team.username,
      totalPoints: team.totalPoints,
      totalTime: team.totalTime,
      currentIndex: team.currentIndex,
      isActive: team.isActive,
      completionPercentage: team.roadmap.length > 0 
        ? Math.round((team.currentIndex / team.roadmap.length) * 100)
        : 0
    })).sort((a, b) => {
      // Sort by completion percentage first, then by points, then by time (lower is better)
      if (a.completionPercentage !== b.completionPercentage) {
        return b.completionPercentage - a.completionPercentage;
      }
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.totalTime - b.totalTime;
    });
  }

  // Check if team has completed the game
  static async isGameComplete(teamId: string): Promise<boolean> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return false;
    
    return team.currentIndex >= team.roadmap.length;
  }

  // Get team statistics
  static async getTeamStats(teamId: string): Promise<{
    totalCheckpoints: number;
    completedCheckpoints: number;
    remainingCheckpoints: number;
    averageTimePerCheckpoint: number;
    averagePointsPerCheckpoint: number;
  } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;
    
    const totalCheckpoints = team.roadmap.length;
    const completedCheckpoints = team.currentIndex;
    const remainingCheckpoints = totalCheckpoints - completedCheckpoints;
    
    const averageTimePerCheckpoint = completedCheckpoints > 0 
      ? Math.round(team.totalTime / completedCheckpoints)
      : 0;
    
    const averagePointsPerCheckpoint = completedCheckpoints > 0
      ? Math.round(team.totalPoints / completedCheckpoints)
      : 0;
    
    return {
      totalCheckpoints,
      completedCheckpoints,
      remainingCheckpoints,
      averageTimePerCheckpoint,
      averagePointsPerCheckpoint
    };
  }

  // Debug method to test backend integration
  static async debugTeamInfo(teamId: string): Promise<void> {
    console.log('=== TEAM DEBUG INFO ===');
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      console.log('Team not found:', teamId);
      return;
    }
    
    console.log('Team ID:', team.id);
    console.log('Username:', team.username);
    console.log('Roadmap:', team.roadmap);
    console.log('Current Index:', team.currentIndex);
    console.log('Total Points:', team.totalPoints);
    console.log('Total Time:', team.totalTime);
    console.log('Is Active:', team.isActive);
    console.log('Game Start Time:', team.gameStartTime ? new Date(team.gameStartTime).toISOString() : 'Not started');
    console.log('Legs:', team.legs);
    
    if (team.currentIndex < team.roadmap.length) {
      const currentCheckpointId = team.roadmap[team.currentIndex];
      console.log('Current Checkpoint ID:', currentCheckpointId);
      
      const currentPuzzle = await FirestoreService.getPuzzle(currentCheckpointId);
      console.log('Current Checkpoint Puzzle:', currentPuzzle);
    }
    
    console.log('=== END DEBUG ===');
  }
}
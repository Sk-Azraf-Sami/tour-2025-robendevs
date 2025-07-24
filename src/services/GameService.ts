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
  puzzle?: Puzzle;  // For first checkpoint that completes immediately
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

interface TeamLegDetails {
  mcqPoints: number;
  puzzlePoints: number;
  timeBonus: number;
  timeTaken: number;
  isCompleted: boolean;
}

interface LastCompletedCheckpoint {
  checkpoint: string;
  completedAt: string;
  totalPoints: number;
  timeTaken: number;
}

interface RoadmapProgress {
  checkpoint: string;
  index: number;
  status: 'completed' | 'current' | 'upcoming';
  points?: number;
  timeTaken?: number;
}

interface TeamMonitoringData {
  teamId: string;
  username: string;
  currentCheckpoint: string;
  currentCheckpointName: string;
  currentCheckpointStartTime?: string;
  timeSinceLastScan?: number;
  timeOnCurrentCheckpoint?: string;
  completionPercentage: number;
  totalPoints: number;
  totalTime: number;
  totalTimeFormatted: string;
  isActive: boolean;
  gameStartTime?: number;
  gameStartTimeFormatted?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'stuck';
  currentLegDetails?: TeamLegDetails;
  lastCompletedCheckpoint?: LastCompletedCheckpoint;
  roadmapProgress: RoadmapProgress[];
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
      
      // Initialize legs array with one object for each puzzle in the roadmap
      const initialLegs: TeamLeg[] = [];
      for (let i = 0; i < team.roadmap.length; i++) {
        const puzzleId = team.roadmap[i];
        const puzzle = await FirestoreService.getPuzzle(puzzleId);
        
        initialLegs.push({
          puzzleId,
          checkpoint: puzzle?.checkpoint || `cp_${i}`,
          startTime: 0, // Will be set when QR is scanned
          endTime: 0,   // Will be set when MCQ is answered (or same as start for first)
          mcqPoints: 0,
          puzzlePoints: 0,
          timeBonus: 0,
          timeTaken: 0,
          isFirstCheckpoint: i === 0 && puzzle?.checkpoint === 'cp_0'
        });
      }
      
      await FirestoreService.updateTeam(team.id, {
        currentIndex: 0,
        totalTime: 0,
        totalPoints: 0,
        legs: initialLegs,
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

    // Mark the start time for this leg when QR is scanned
    const currentTime = Date.now();
    const updatedLegs = [...team.legs];
    const currentLeg = updatedLegs[team.currentIndex];
    
    if (currentLeg && currentLeg.startTime === 0) {
      // First scan of this checkpoint - record start time
      currentLeg.startTime = currentTime;
      
      // Special handling for first checkpoint (cp_0) - no MCQ, immediate completion
      if (currentLeg.isFirstCheckpoint) {
        const settings = await FirestoreService.getGlobalSettings();
        if (settings) {
          currentLeg.endTime = currentTime; // Same as start time for first checkpoint
          currentLeg.timeTaken = 0; // No time taken for first checkpoint
          currentLeg.puzzlePoints = settings.base_points; // Base points for puzzle completion
          currentLeg.mcqPoints = 0; // No MCQ points for first checkpoint
          currentLeg.timeBonus = 0; // No time bonus for instant completion
        }
        
        // Update team progress immediately for first checkpoint
        const newCurrentIndex = team.currentIndex + 1;
        const isGameComplete = newCurrentIndex >= team.roadmap.length;
        const pointsEarned = currentLeg.puzzlePoints;
        const newTotalPoints = team.totalPoints + pointsEarned;
        
        await FirestoreService.updateTeam(teamId, {
          legs: updatedLegs,
          currentIndex: newCurrentIndex,
          totalPoints: newTotalPoints,
          isActive: !isGameComplete
        });
        
        if (isGameComplete) {
          return { 
            success: true, 
            message: `Game completed! You earned ${pointsEarned} points at the first checkpoint. Total: ${newTotalPoints} points!` 
          };
        } else {
          // Get next puzzle for the team
          const nextPuzzleId = team.roadmap[newCurrentIndex];
          const nextPuzzle = await FirestoreService.getPuzzle(nextPuzzleId);
          return { 
            success: true, 
            message: `First checkpoint completed! You earned ${pointsEarned} points. Find the next checkpoint using this puzzle clue.`,
            mcq: undefined, // No MCQ for first checkpoint
            puzzle: nextPuzzle || undefined
          };
        }
      } else {
        // Regular checkpoint - save start time and continue to MCQ
        await FirestoreService.updateTeam(teamId, { legs: updatedLegs });
      }
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

    // Check if this is the first checkpoint (should not have MCQ)
    const currentLeg = team.legs[team.currentIndex];
    if (currentLeg?.isFirstCheckpoint) {
      return { 
        success: false, 
        isGameComplete: false, 
        pointsEarned: 0, 
        timeBonus: 0, 
        message: 'First checkpoint does not require MCQ answer' 
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
    const legStartTime = currentLeg?.startTime || currentTime;
    const timeSpentSeconds = Math.floor((currentTime - legStartTime) / 1000);
    const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);
    
    // Time bonus calculation following PRD requirements
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
    
    // Ensure time bonus/penalty doesn't make total negative
    const mcqPoints = selectedOption.value || 0;
    const puzzlePoints = settings.base_points; // Base points for puzzle completion
    const minimumTotal = -(mcqPoints + puzzlePoints); // Prevent negative total
    timeBonus = Math.max(minimumTotal, timeBonus);

    const totalPointsEarned = mcqPoints + puzzlePoints + timeBonus;

    // Update team leg with complete information
    const updatedLegs = [...team.legs];
    updatedLegs[team.currentIndex] = {
      ...currentLeg,
      endTime: currentTime,
      mcqPoints,
      puzzlePoints,
      timeBonus,
      timeTaken: timeSpentSeconds,
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
        : `Checkpoint completed! You earned ${totalPointsEarned} points (MCQ: ${mcqPoints}, Puzzle: ${puzzlePoints}, Time: ${timeBonus > 0 ? '+' : ''}${timeBonus}). Find the next checkpoint using the puzzle clue.`
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
    
    // Initialize legs array with one object for each puzzle in the roadmap
    const initialLegs: TeamLeg[] = [];
    for (let i = 0; i < team.roadmap.length; i++) {
      const puzzleId = team.roadmap[i];
      const puzzle = await FirestoreService.getPuzzle(puzzleId);
      
      initialLegs.push({
        puzzleId,
        checkpoint: puzzle?.checkpoint || `cp_${i}`,
        startTime: 0, // Will be set when QR is scanned
        endTime: 0,   // Will be set when MCQ is answered (or same as start for first)
        mcqPoints: 0,
        puzzlePoints: 0,
        timeBonus: 0,
        timeTaken: 0,
        isFirstCheckpoint: i === 0 && puzzle?.checkpoint === 'cp_0'
      });
    }
    
    // Reset team progress but keep existing roadmap from database
    await FirestoreService.updateTeam(teamId, {
      currentIndex: 0,
      totalTime: 0,
      totalPoints: 0,
      legs: initialLegs,
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

  // Get team leaderboard data with detailed leg information
  static async getTeamLeaderboard(): Promise<Array<{
    teamId: string;
    username: string;
    totalPoints: number;
    totalTime: number;
    currentIndex: number;
    isActive: boolean;
    completionPercentage: number;
    lastCheckpointTime?: number;
    averageTimePerCheckpoint: number;
    currentCheckpointName?: string;
  }>> {
    const teams = await FirestoreService.getAllTeams();
    
    return teams.map(team => {
      const completedLegs = team.legs.filter(leg => leg.endTime && leg.endTime > 0);
      const averageTimePerCheckpoint = completedLegs.length > 0 
        ? Math.round(completedLegs.reduce((sum, leg) => sum + leg.timeTaken, 0) / completedLegs.length)
        : 0;
      
      const lastCompletedLeg = completedLegs[completedLegs.length - 1];
      const currentCheckpointName = team.currentIndex < team.legs.length 
        ? team.legs[team.currentIndex]?.checkpoint 
        : undefined;
      
      return {
        teamId: team.id,
        username: team.username,
        totalPoints: team.totalPoints,
        totalTime: team.totalTime,
        currentIndex: team.currentIndex,
        isActive: team.isActive,
        completionPercentage: team.roadmap.length > 0 
          ? Math.round((team.currentIndex / team.roadmap.length) * 100)
          : 0,
        lastCheckpointTime: lastCompletedLeg?.endTime,
        averageTimePerCheckpoint,
        currentCheckpointName
      };
    }).sort((a, b) => {
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

  // Get team statistics with detailed leg breakdown
  static async getTeamStats(teamId: string): Promise<{
    totalCheckpoints: number;
    completedCheckpoints: number;
    remainingCheckpoints: number;
    averageTimePerCheckpoint: number;
    averagePointsPerCheckpoint: number;
    fastestCheckpoint?: { checkpoint: string; time: number; };
    slowestCheckpoint?: { checkpoint: string; time: number; };
    highestScoringCheckpoint?: { checkpoint: string; points: number; };
    totalMCQPoints: number;
    totalPuzzlePoints: number;
    totalTimeBonus: number;
  } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;
    
    const totalCheckpoints = team.roadmap.length;
    const completedLegs = team.legs.filter(leg => leg.endTime && leg.endTime > 0);
    const completedCheckpoints = completedLegs.length;
    const remainingCheckpoints = totalCheckpoints - completedCheckpoints;
    
    const averageTimePerCheckpoint = completedCheckpoints > 0 
      ? Math.round(completedLegs.reduce((sum, leg) => sum + leg.timeTaken, 0) / completedCheckpoints)
      : 0;
    
    const averagePointsPerCheckpoint = completedCheckpoints > 0
      ? Math.round(team.totalPoints / completedCheckpoints)
      : 0;
    
    // Find fastest and slowest checkpoints (excluding first checkpoint with 0 time)
    const timedLegs = completedLegs.filter(leg => leg.timeTaken > 0);
    const fastestCheckpoint = timedLegs.length > 0 
      ? timedLegs.reduce((min, leg) => leg.timeTaken < min.timeTaken ? leg : min)
      : undefined;
    const slowestCheckpoint = timedLegs.length > 0 
      ? timedLegs.reduce((max, leg) => leg.timeTaken > max.timeTaken ? leg : max)
      : undefined;
    
    // Find highest scoring checkpoint
    const highestScoringCheckpoint = completedLegs.length > 0 
      ? completedLegs.reduce((max, leg) => {
          const legTotal = leg.mcqPoints + leg.puzzlePoints + leg.timeBonus;
          const maxTotal = max.mcqPoints + max.puzzlePoints + max.timeBonus;
          return legTotal > maxTotal ? leg : max;
        })
      : undefined;
    
    // Calculate totals by category
    const totalMCQPoints = completedLegs.reduce((sum, leg) => sum + leg.mcqPoints, 0);
    const totalPuzzlePoints = completedLegs.reduce((sum, leg) => sum + leg.puzzlePoints, 0);
    const totalTimeBonus = completedLegs.reduce((sum, leg) => sum + leg.timeBonus, 0);
    
    return {
      totalCheckpoints,
      completedCheckpoints,
      remainingCheckpoints,
      averageTimePerCheckpoint,
      averagePointsPerCheckpoint,
      fastestCheckpoint: fastestCheckpoint ? { 
        checkpoint: fastestCheckpoint.checkpoint, 
        time: fastestCheckpoint.timeTaken 
      } : undefined,
      slowestCheckpoint: slowestCheckpoint ? { 
        checkpoint: slowestCheckpoint.checkpoint, 
        time: slowestCheckpoint.timeTaken 
      } : undefined,
      highestScoringCheckpoint: highestScoringCheckpoint ? { 
        checkpoint: highestScoringCheckpoint.checkpoint, 
        points: highestScoringCheckpoint.mcqPoints + highestScoringCheckpoint.puzzlePoints + highestScoringCheckpoint.timeBonus 
      } : undefined,
      totalMCQPoints,
      totalPuzzlePoints,
      totalTimeBonus
    };
  }

  // Get detailed team progress for admin monitoring (per PRD requirement)
  static async getTeamDetailedProgress(teamId: string): Promise<{
    team: {
      id: string;
      username: string;
      currentCheckpoint: string;
      completionPercentage: number;
      totalPoints: number;
      totalTime: number;
      isActive: boolean;
    };
    legs: Array<{
      checkpointId: string;
      checkpoint: string;
      status: 'not_started' | 'in_progress' | 'completed';
      startTime?: string;
      endTime?: string;
      timeTaken: number;
      mcqPoints: number;
      puzzlePoints: number;
      timeBonus: number;
      totalPoints: number;
      mcqAnswerOptionId?: string;
      isFirstCheckpoint: boolean;
    }>;
  } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;
    
    const currentCheckpoint = team.currentIndex < team.legs.length 
      ? team.legs[team.currentIndex].checkpoint 
      : 'completed';
    
    const completionPercentage = team.roadmap.length > 0 
      ? Math.round((team.currentIndex / team.roadmap.length) * 100)
      : 0;
    
    const detailedLegs = team.legs.map((leg, index) => {
      let status: 'not_started' | 'in_progress' | 'completed';
      
      if (index < team.currentIndex) {
        status = 'completed';
      } else if (index === team.currentIndex && leg.startTime > 0) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }
      
      return {
        checkpointId: leg.puzzleId,
        checkpoint: leg.checkpoint,
        status,
        startTime: leg.startTime > 0 ? new Date(leg.startTime).toISOString() : undefined,
        endTime: leg.endTime && leg.endTime > 0 ? new Date(leg.endTime).toISOString() : undefined,
        timeTaken: leg.timeTaken,
        mcqPoints: leg.mcqPoints,
        puzzlePoints: leg.puzzlePoints,
        timeBonus: leg.timeBonus,
        totalPoints: leg.mcqPoints + leg.puzzlePoints + leg.timeBonus,
        mcqAnswerOptionId: leg.mcqAnswerOptionId,
        isFirstCheckpoint: leg.isFirstCheckpoint
      };
    });
    
    return {
      team: {
        id: team.id,
        username: team.username,
        currentCheckpoint,
        completionPercentage,
        totalPoints: team.totalPoints,
        totalTime: team.totalTime,
        isActive: team.isActive
      },
      legs: detailedLegs
    };
  }

  // Get real-time monitoring data for all teams (admin dashboard)
  static async getAllTeamsMonitoringData(): Promise<TeamMonitoringData[]> {
    const teams = await FirestoreService.getAllTeams();
    const currentTime = Date.now();
    
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    return teams.map(team => {
      const currentCheckpoint = team.currentIndex < team.roadmap.length 
        ? team.roadmap[team.currentIndex]
        : 'completed';
      
      const currentCheckpointName = team.currentIndex < team.roadmap.length
        ? `Checkpoint ${team.currentIndex + 1}: ${team.roadmap[team.currentIndex]}`
        : 'Game Completed';
      
      const completionPercentage = team.roadmap.length > 0 
        ? Math.round((team.currentIndex / team.roadmap.length) * 100)
        : 0;
      
      let status: 'not_started' | 'in_progress' | 'completed' | 'stuck';
      let currentCheckpointStartTime: string | undefined;
      let timeSinceLastScan: number | undefined;
      let timeOnCurrentCheckpoint: string | undefined;
      let currentLegDetails: TeamLegDetails | undefined = undefined;
      let lastCompletedCheckpoint: LastCompletedCheckpoint | undefined = undefined;
      
      // Build roadmap progress
      const roadmapProgress = team.roadmap.map((checkpointId, index) => {
        const leg = team.legs[index];
        let legStatus: 'completed' | 'current' | 'upcoming';
        
        if (index < team.currentIndex) {
          legStatus = 'completed';
        } else if (index === team.currentIndex) {
          legStatus = 'current';
        } else {
          legStatus = 'upcoming';
        }
        
        return {
          checkpoint: checkpointId,
          index: index + 1,
          status: legStatus,
          points: leg && leg.endTime ? leg.mcqPoints + leg.puzzlePoints + leg.timeBonus : undefined,
          timeTaken: leg && leg.endTime ? leg.timeTaken : undefined
        };
      });
      
      if (completionPercentage === 100) {
        status = 'completed';
        
        // Get last completed checkpoint info
        const lastLeg = team.legs[team.legs.length - 1];
        if (lastLeg && lastLeg.endTime) {
          lastCompletedCheckpoint = {
            checkpoint: lastLeg.checkpoint,
            completedAt: new Date(lastLeg.endTime).toLocaleString(),
            totalPoints: lastLeg.mcqPoints + lastLeg.puzzlePoints + lastLeg.timeBonus,
            timeTaken: lastLeg.timeTaken
          };
        }
      } else if (team.currentIndex < team.legs.length) {
        const currentLeg = team.legs[team.currentIndex];
        if (currentLeg && currentLeg.startTime > 0) {
          status = 'in_progress';
          currentCheckpointStartTime = new Date(currentLeg.startTime).toLocaleString();
          timeSinceLastScan = Math.floor((currentTime - currentLeg.startTime) / 1000);
          timeOnCurrentCheckpoint = formatTime(timeSinceLastScan);
          
          currentLegDetails = {
            mcqPoints: currentLeg.mcqPoints,
            puzzlePoints: currentLeg.puzzlePoints,
            timeBonus: currentLeg.timeBonus,
            timeTaken: currentLeg.timeTaken,
            isCompleted: !!currentLeg.endTime
          };
          
          // Mark as stuck if no progress for more than 15 minutes
          if (timeSinceLastScan > 900) {
            status = 'stuck';
          }
        } else {
          status = 'not_started';
        }
        
        // Get last completed checkpoint if any
        if (team.currentIndex > 0) {
          const prevLeg = team.legs[team.currentIndex - 1];
          if (prevLeg && prevLeg.endTime) {
            lastCompletedCheckpoint = {
              checkpoint: prevLeg.checkpoint,
              completedAt: new Date(prevLeg.endTime).toLocaleString(),
              totalPoints: prevLeg.mcqPoints + prevLeg.puzzlePoints + prevLeg.timeBonus,
              timeTaken: prevLeg.timeTaken
            };
          }
        }
      } else {
        status = 'not_started';
      }
      
      // Calculate total elapsed time since game start
      const totalTimeElapsed = team.gameStartTime 
        ? Math.floor((currentTime - team.gameStartTime) / 1000)
        : team.totalTime;
      
      return {
        teamId: team.id,
        username: team.username,
        currentCheckpoint,
        currentCheckpointName,
        currentCheckpointStartTime,
        timeSinceLastScan,
        timeOnCurrentCheckpoint,
        completionPercentage,
        totalPoints: team.totalPoints,
        totalTime: totalTimeElapsed,
        totalTimeFormatted: formatTime(totalTimeElapsed),
        isActive: team.isActive,
        gameStartTime: team.gameStartTime,
        gameStartTimeFormatted: team.gameStartTime ? new Date(team.gameStartTime).toLocaleString() : undefined,
        status,
        currentLegDetails,
        lastCompletedCheckpoint,
        roadmapProgress
      };
    }).sort((a, b) => {
      // Sort by completion percentage desc, then by total points desc, then by total time asc
      if (a.completionPercentage !== b.completionPercentage) {
        return b.completionPercentage - a.completionPercentage;
      }
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.totalTime - b.totalTime;
    });
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
    console.log('Legs (detailed):');
    team.legs.forEach((leg, index) => {
      console.log(`  Leg ${index}:`, {
        puzzleId: leg.puzzleId,
        checkpoint: leg.checkpoint,
        startTime: leg.startTime ? new Date(leg.startTime).toISOString() : 'Not started',
        endTime: leg.endTime ? new Date(leg.endTime).toISOString() : 'Not completed',
        timeTaken: `${leg.timeTaken}s`,
        mcqPoints: leg.mcqPoints,
        puzzlePoints: leg.puzzlePoints,
        timeBonus: leg.timeBonus,
        totalPoints: leg.mcqPoints + leg.puzzlePoints + leg.timeBonus,
        isFirstCheckpoint: leg.isFirstCheckpoint
      });
    });
    
    if (team.currentIndex < team.roadmap.length) {
      const currentCheckpointId = team.roadmap[team.currentIndex];
      console.log('Current Checkpoint ID:', currentCheckpointId);
      
      const currentPuzzle = await FirestoreService.getPuzzle(currentCheckpointId);
      console.log('Current Checkpoint Puzzle:', currentPuzzle);
    }
    
    console.log('=== END DEBUG ===');
  }

  // Admin control: Start game for all teams
  static async startGameFromAdmin(): Promise<{ success: boolean; message: string; teamsActivated: number }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      const settings = await FirestoreService.getGlobalSettings();
      
      if (!settings) {
        throw new Error('Global settings not found. Please configure game settings first.');
      }

      if (teams.length === 0) {
        throw new Error('No teams found. Please create teams before starting the game.');
      }

      // Validate that all teams have roadmaps
      const teamsWithoutRoadmaps = teams.filter(team => !team.roadmap || team.roadmap.length === 0);
      if (teamsWithoutRoadmaps.length > 0) {
        throw new Error(`${teamsWithoutRoadmaps.length} teams don't have roadmaps configured. Please ensure all teams have valid roadmaps.`);
      }

      const gameStartTime = Date.now();
      let teamsActivated = 0;

      // Initialize and activate all teams
      for (const team of teams) {
        // Initialize legs array if not exists or empty
        let legs = team.legs || [];
        
        if (legs.length === 0 && team.roadmap && team.roadmap.length > 0) {
          // Create legs for each checkpoint in the roadmap
          legs = team.roadmap.map((puzzleId, index) => ({
            puzzleId,
            checkpoint: puzzleId,
            startTime: 0,
            endTime: 0,
            mcqPoints: 0,
            puzzlePoints: 0,
            timeBonus: 0,
            timeTaken: 0,
            mcqAnswerOptionId: undefined,
            isFirstCheckpoint: index === 0
          }));
        }

        // Update team with game start data
        await FirestoreService.updateTeam(team.id, {
          isActive: true,
          gameStartTime,
          currentIndex: 0,
          totalTime: 0,
          legs
        });
        
        teamsActivated++;
      }

      return {
        success: true,
        message: `Game started successfully! ${teamsActivated} teams are now active and ready to play.`,
        teamsActivated
      };
    } catch (error) {
      console.error('Start game error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start game',
        teamsActivated: 0
      };
    }
  }

  // Admin control: Pause/Resume game
  static async pauseResumeGame(pause: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      
      if (teams.length === 0) {
        throw new Error('No teams found to pause/resume.');
      }

      let updatedTeams = 0;
      
      for (const team of teams) {
        // Only update teams that have started the game
        if (team.gameStartTime && team.gameStartTime > 0) {
          await FirestoreService.updateTeam(team.id, { isActive: !pause });
          updatedTeams++;
        }
      }

      if (updatedTeams === 0) {
        throw new Error('No active teams found to pause/resume. Start the game first.');
      }

      return {
        success: true,
        message: pause 
          ? `Game paused for ${updatedTeams} teams. Teams can no longer progress until resumed.` 
          : `Game resumed for ${updatedTeams} teams. Teams can now continue playing.`
      };
    } catch (error) {
      console.error('Pause/Resume game error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update game state'
      };
    }
  }

  // Admin control: Stop game
  static async stopGame(): Promise<{ success: boolean; message: string }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      
      if (teams.length === 0) {
        throw new Error('No teams found to stop.');
      }

      let stoppedTeams = 0;
      
      for (const team of teams) {
        // Only stop teams that have actually started
        if (team.gameStartTime && team.gameStartTime > 0) {
          await FirestoreService.updateTeam(team.id, { 
            isActive: false
            // Note: We don't mark as completed (currentIndex = roadmap.length) 
            // because that would indicate they finished normally
          });
          stoppedTeams++;
        }
      }

      if (stoppedTeams === 0) {
        return {
          success: true,
          message: 'No active games found to stop.'
        };
      }

      return {
        success: true,
        message: `Game stopped for ${stoppedTeams} teams. All team progress has been preserved.`
      };
    } catch (error) {
      console.error('Stop game error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop game'
      };
    }
  }

  // Admin control: Reset game progress for all teams
  static async resetGame(): Promise<{ success: boolean; message: string; teamsReset: number }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      const settings = await FirestoreService.getGlobalSettings();
      
      if (!settings) {
        throw new Error('Global settings not found');
      }

      let teamsReset = 0;
      
      for (const team of teams) {
        // Reset team progress completely
        const resetData = {
          currentIndex: 0,
          totalPoints: 0,
          totalTime: 0,
          isActive: false,
          gameStartTime: 0,
          legs: [] as TeamLeg[]
        };

        // Initialize empty legs array for all checkpoints
        if (team.roadmap && team.roadmap.length > 0) {
          resetData.legs = team.roadmap.map((puzzleId, index) => ({
            puzzleId,
            checkpoint: puzzleId,
            startTime: 0,
            endTime: 0,
            mcqPoints: 0,
            puzzlePoints: 0,
            timeBonus: 0,
            timeTaken: 0,
            mcqAnswerOptionId: undefined,
            isFirstCheckpoint: index === 0
          }));
        }

        await FirestoreService.updateTeam(team.id, resetData);
        teamsReset++;
      }

      return {
        success: true,
        message: `Game progress reset for ${teamsReset} teams. Ready to start fresh.`,
        teamsReset
      };
    } catch (error) {
      console.error('Reset game error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset game',
        teamsReset: 0
      };
    }
  }
}
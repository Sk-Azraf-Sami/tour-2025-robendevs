import { FirestoreService } from "./FireStoreService";
import type { Puzzle, MCQ, MCQOption, TeamLeg, Team } from "../types";

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
  mcq?: MCQ; // MCQ for this checkpoint (all checkpoints require MCQ)
  puzzle?: Puzzle; // Unused - legacy field for backward compatibility
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
  status: "completed" | "current" | "upcoming";
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
  status: "not_started" | "in_progress" | "completed" | "stuck";
  currentLegDetails?: TeamLegDetails;
  lastCompletedCheckpoint?: LastCompletedCheckpoint;
  roadmapProgress: RoadmapProgress[];
}

export class GameService {
  static async startGame(): Promise<void> {
    const teams = await FirestoreService.getAllTeams();
    const settings = await FirestoreService.getGlobalSettings();

    if (!settings) throw new Error("Global settings not found");

    // Simply activate teams with their existing roadmaps from database
    for (const team of teams) {
      // Validate that team has a roadmap - roadmap should already exist in database
      if (!team.roadmap || team.roadmap.length === 0) {
        throw new Error(
          `Team ${team.id} does not have a roadmap configured in database`
        );
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
          endTime: 0, // Will be set when MCQ is answered (or same as start for first)
          mcqPoints: 0,
          puzzlePoints: 0,
          timeBonus: 0,
          timeTaken: 0,
          isFirstCheckpoint: puzzle?.checkpoint === "cp_0", // Fix: Check for cp_0 specifically, not index
        });
      }

      await FirestoreService.updateTeam(team.id, {
        currentIndex: 0,
        totalTime: 0,
        totalPoints: 0,
        legs: initialLegs,
        isActive: true,
        gameStartTime: Date.now(),
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
      legs: team.legs,
    };
  }

  static async validateQRCode(
    teamId: string,
    qrCode: string
  ): Promise<QRValidationResult> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      return { success: false, message: "Team not found" };
    }

    if (!team.isActive) {
      return { success: false, message: "Game is not active for this team" };
    }

    if (team.currentIndex >= team.roadmap.length) {
      return {
        success: false,
        message: "Game completed - no more checkpoints",
      };
    }

    const currentPuzzleId = team.roadmap[team.currentIndex];

    // Get the puzzle directly by its ID (since roadmap contains puzzle IDs)
    const currentPuzzle = await FirestoreService.getPuzzle(currentPuzzleId);

    if (!currentPuzzle) {
      return {
        success: false,
        message: `Current puzzle not found for ID: ${currentPuzzleId}`,
      };
    }

    if (currentPuzzle.code !== qrCode) {
      return {
        success: false,
        message: `Wrong QR code. Please try again.`,
      };
    }

    // Get a random MCQ from database
    const allMCQs = await FirestoreService.getAllMCQs();
    if (allMCQs.length === 0) {
      return { success: false, message: "No MCQ questions available" };
    }

    const mcqIndex = team.currentIndex % allMCQs.length;
    const serialMCQ = allMCQs[mcqIndex];

    // Mark the start time for this leg when QR is scanned
    const currentTime = Date.now();
    const updatedLegs = [...team.legs];
    const currentLeg = updatedLegs[team.currentIndex];

    if (currentLeg && currentLeg.startTime === 0) {
      // First scan of this checkpoint - record start time
      currentLeg.startTime = currentTime;

      // All checkpoints (including cp_0) now require MCQ - save start time and continue to MCQ
      await FirestoreService.updateTeam(teamId, { legs: updatedLegs });
    }

    return {
      success: true,
      mcq: serialMCQ,
      message:
        "QR code validated successfully. Please answer the MCQ question.",
    };
  }

  static async submitMCQAnswer(
    teamId: string,
    qrCode: string,
    answerOptionId: string
  ): Promise<MCQSubmissionResult> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      return {
        success: false,
        isGameComplete: false,
        pointsEarned: 0,
        timeBonus: 0,
        message: "Team not found",
      };
    }

    if (team.currentIndex >= team.roadmap.length) {
      return {
        success: false,
        isGameComplete: true,
        pointsEarned: 0,
        timeBonus: 0,
        message: "Game already completed",
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
        message: "Invalid QR code for current puzzle",
      };
    }

    // Get all MCQs and find the one with the matching option
    const allMCQs = await FirestoreService.getAllMCQs();
    let selectedOption: MCQOption | null = null;

    for (const mcq of allMCQs) {
      const option = mcq.options.find(
        (opt: MCQOption, index: number) =>
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
        message: "Invalid answer option",
      };
    }

    const settings = await FirestoreService.getGlobalSettings();
    if (!settings) {
      return {
        success: false,
        isGameComplete: false,
        pointsEarned: 0,
        timeBonus: 0,
        message: "Game settings not found",
      };
    }

    // Calculate time bonus/penalty based on PRD specifications and round_time setting
    const currentTime = Date.now();
    const currentLeg = team.legs[team.currentIndex];
    const legStartTime = currentLeg?.startTime || currentTime;
    const timeSpentSeconds = Math.floor((currentTime - legStartTime) / 1000);
    const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);

    // Use round_time from settings for threshold calculations
    const roundTimeMinutes = settings.round_time || 5; // Default to 5 minutes if not set
    const bonusThreshold = Math.max(1, Math.floor(roundTimeMinutes * 0.6)); // 60% of round time for bonus

    // Time bonus calculation following PRD requirements with configurable round time
    let timeBonus = 0;

    // Quick completion bonus (under bonus threshold gets bonus)
    if (timeSpentMinutes < bonusThreshold) {
      timeBonus =
        settings.bonus_per_minute * (bonusThreshold - timeSpentMinutes);
    }
    // Normal completion (within round time) gets no bonus/penalty
    else if (timeSpentMinutes <= roundTimeMinutes) {
      timeBonus = 0;
    }
    // Slow completion penalty (over round time gets penalty)
    else {
      const penaltyMinutes = timeSpentMinutes - roundTimeMinutes;
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
      mcqAnswerOptionId: answerOptionId,
    };

    const newCurrentIndex = team.currentIndex + 1;
    const isGameComplete = newCurrentIndex >= team.roadmap.length;
    const newTotalPoints = team.totalPoints + totalPointsEarned;

    // Set start time for next checkpoint if not game complete
    if (!isGameComplete && newCurrentIndex < updatedLegs.length) {
      const nextLeg = updatedLegs[newCurrentIndex];
      if (nextLeg && nextLeg.startTime === 0) {
        nextLeg.startTime = currentTime; // Start timing for next checkpoint
      }
    }

    // Update total time to current elapsed time in seconds
    const gameStartTime = team.gameStartTime || currentTime;
    const newTotalTime = Math.floor((currentTime - gameStartTime) / 1000);

    await FirestoreService.updateTeam(teamId, {
      legs: updatedLegs,
      currentIndex: newCurrentIndex,
      totalPoints: newTotalPoints,
      totalTime: newTotalTime,
      isActive: !isGameComplete,
    });

    let nextPuzzle: Puzzle | undefined;
    if (!isGameComplete) {
      const nextPuzzleId = team.roadmap[newCurrentIndex];
      nextPuzzle =
        (await FirestoreService.getPuzzle(nextPuzzleId)) || undefined;
    }

    return {
      success: true,
      isGameComplete,
      puzzle: nextPuzzle,
      pointsEarned: totalPointsEarned,
      timeBonus,
      message: isGameComplete
        ? `Congratulations! Game completed with ${newTotalPoints} points!`
        : `Checkpoint completed! You earned ${totalPointsEarned} points (MCQ: ${mcqPoints}, Puzzle: ${puzzlePoints}, Time: ${timeBonus > 0 ? "+" : ""}${timeBonus}). Find the next checkpoint using the puzzle clue.`,
    };
  }

  static async getPuzzleForCheckpoint(
    puzzleId: string
  ): Promise<Puzzle | null> {
    return await FirestoreService.getPuzzle(puzzleId);
  }

  static async getMCQForCheckpoint(teamId: string): Promise<MCQ | null> {
    const allMCQs = await FirestoreService.getAllMCQs();
    if (allMCQs.length === 0) return null;

    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;

    const mcqIndex = team.currentIndex % allMCQs.length;
    return allMCQs[mcqIndex];
  }

  // Get current checkpoint info for team
  static async getCurrentCheckpoint(
    teamId: string
  ): Promise<{ checkpointId: string; puzzle: Puzzle | null } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team || team.currentIndex >= team.roadmap.length) return null;

    const currentPuzzleId = team.roadmap[team.currentIndex];
    const puzzle = await FirestoreService.getPuzzle(currentPuzzleId);

    return {
      checkpointId: currentPuzzleId,
      puzzle,
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
    if (!team) throw new Error("Team not found");

    // Validate that team has a roadmap - roadmap should already exist in database
    if (!team.roadmap || team.roadmap.length === 0) {
      throw new Error(
        `Team ${teamId} does not have a roadmap configured in database`
      );
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
        endTime: 0, // Will be set when MCQ is answered (or same as start for first)
        mcqPoints: 0,
        puzzlePoints: 0,
        timeBonus: 0,
        timeTaken: 0,
        isFirstCheckpoint: puzzle?.checkpoint === "cp_0", // Fix: Check for cp_0 specifically, not index
      });
    }

    // Reset team progress but keep existing roadmap from database
    await FirestoreService.updateTeam(teamId, {
      currentIndex: 0,
      totalTime: 0,
      totalPoints: 0,
      legs: initialLegs,
      isActive: true,
      gameStartTime: Date.now(),
    });
  }

  // Get starting checkpoint puzzle for initial game state
  static async getStartingCheckpointPuzzle(): Promise<Puzzle | null> {
    const allPuzzles = await FirestoreService.getAllPuzzles();
    return allPuzzles.find((puzzle) => puzzle.isStarting === true) || null;
  }

  // Get all checkpoints with their puzzles (useful for admin monitoring)
  static async getAllCheckpointsWithPuzzles(): Promise<{
    [checkpointId: string]: Puzzle;
  }> {
    const allPuzzles = await FirestoreService.getAllPuzzles();
    const checkpointMap: { [checkpointId: string]: Puzzle } = {};

    allPuzzles.forEach((puzzle) => {
      if (puzzle.checkpoint) {
        checkpointMap[puzzle.checkpoint] = puzzle;
      }
    });

    return checkpointMap;
  }

  // Get team leaderboard data with detailed leg information
  static async getTeamLeaderboard(): Promise<
    Array<{
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
    }>
  > {
    const teams = await FirestoreService.getAllTeams();

    return teams
      .map((team) => {
        const completedLegs = team.legs.filter(
          (leg) => leg.endTime && leg.endTime > 0
        );
        const averageTimePerCheckpoint =
          completedLegs.length > 0
            ? Math.round(
                completedLegs.reduce((sum, leg) => sum + leg.timeTaken, 0) /
                  completedLegs.length
              )
            : 0;

        const lastCompletedLeg = completedLegs[completedLegs.length - 1];
        const currentCheckpointName =
          team.currentIndex < team.legs.length
            ? team.legs[team.currentIndex]?.checkpoint
            : undefined;

        return {
          teamId: team.id,
          username: team.username,
          totalPoints: team.totalPoints,
          totalTime: team.totalTime,
          currentIndex: team.currentIndex,
          isActive: team.isActive,
          completionPercentage:
            team.roadmap.length > 0
              ? Math.round((team.currentIndex / team.roadmap.length) * 100)
              : 0,
          lastCheckpointTime: lastCompletedLeg?.endTime,
          averageTimePerCheckpoint,
          currentCheckpointName,
        };
      })
      .sort((a, b) => {
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
    fastestCheckpoint?: { checkpoint: string; time: number };
    slowestCheckpoint?: { checkpoint: string; time: number };
    highestScoringCheckpoint?: { checkpoint: string; points: number };
    totalMCQPoints: number;
    totalPuzzlePoints: number;
    totalTimeBonus: number;
  } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;

    const totalCheckpoints = team.roadmap.length;
    const completedLegs = team.legs.filter(
      (leg) => leg.endTime && leg.endTime > 0
    );
    const completedCheckpoints = completedLegs.length;
    const remainingCheckpoints = totalCheckpoints - completedCheckpoints;

    const averageTimePerCheckpoint =
      completedCheckpoints > 0
        ? Math.round(
            completedLegs.reduce((sum, leg) => sum + leg.timeTaken, 0) /
              completedCheckpoints
          )
        : 0;

    const averagePointsPerCheckpoint =
      completedCheckpoints > 0
        ? Math.round(team.totalPoints / completedCheckpoints)
        : 0;

    // Find fastest and slowest checkpoints (excluding first checkpoint with 0 time)
    const timedLegs = completedLegs.filter((leg) => leg.timeTaken > 0);
    const fastestCheckpoint =
      timedLegs.length > 0
        ? timedLegs.reduce((min, leg) =>
            leg.timeTaken < min.timeTaken ? leg : min
          )
        : undefined;
    const slowestCheckpoint =
      timedLegs.length > 0
        ? timedLegs.reduce((max, leg) =>
            leg.timeTaken > max.timeTaken ? leg : max
          )
        : undefined;

    // Find highest scoring checkpoint
    const highestScoringCheckpoint =
      completedLegs.length > 0
        ? completedLegs.reduce((max, leg) => {
            const legTotal = leg.mcqPoints + leg.puzzlePoints + leg.timeBonus;
            const maxTotal = max.mcqPoints + max.puzzlePoints + max.timeBonus;
            return legTotal > maxTotal ? leg : max;
          })
        : undefined;

    // Calculate totals by category
    const totalMCQPoints = completedLegs.reduce(
      (sum, leg) => sum + leg.mcqPoints,
      0
    );
    const totalPuzzlePoints = completedLegs.reduce(
      (sum, leg) => sum + leg.puzzlePoints,
      0
    );
    const totalTimeBonus = completedLegs.reduce(
      (sum, leg) => sum + leg.timeBonus,
      0
    );

    return {
      totalCheckpoints,
      completedCheckpoints,
      remainingCheckpoints,
      averageTimePerCheckpoint,
      averagePointsPerCheckpoint,
      fastestCheckpoint: fastestCheckpoint
        ? {
            checkpoint: fastestCheckpoint.checkpoint,
            time: fastestCheckpoint.timeTaken,
          }
        : undefined,
      slowestCheckpoint: slowestCheckpoint
        ? {
            checkpoint: slowestCheckpoint.checkpoint,
            time: slowestCheckpoint.timeTaken,
          }
        : undefined,
      highestScoringCheckpoint: highestScoringCheckpoint
        ? {
            checkpoint: highestScoringCheckpoint.checkpoint,
            points:
              highestScoringCheckpoint.mcqPoints +
              highestScoringCheckpoint.puzzlePoints +
              highestScoringCheckpoint.timeBonus,
          }
        : undefined,
      totalMCQPoints,
      totalPuzzlePoints,
      totalTimeBonus,
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
      status: "not_started" | "in_progress" | "completed";
      startTime?: string;
      endTime?: string;
      timeTaken: number;
      mcqPoints: number;
      puzzlePoints: number;
      timeBonus: number;
      totalPoints: number;
      mcqAnswerOptionId?: string | null;
      isFirstCheckpoint: boolean;
    }>;
  } | null> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) return null;

    const currentCheckpoint =
      team.currentIndex < team.legs.length
        ? team.legs[team.currentIndex].checkpoint
        : "completed";

    const completionPercentage =
      team.roadmap.length > 0
        ? Math.round((team.currentIndex / team.roadmap.length) * 100)
        : 0;

    const detailedLegs = team.legs.map((leg, index) => {
      let status: "not_started" | "in_progress" | "completed";

      if (index < team.currentIndex) {
        status = "completed";
      } else if (index === team.currentIndex && leg.startTime > 0) {
        status = "in_progress";
      } else {
        status = "not_started";
      }

      return {
        checkpointId: leg.puzzleId,
        checkpoint: leg.checkpoint,
        status,
        startTime:
          leg.startTime > 0 ? new Date(leg.startTime).toISOString() : undefined,
        endTime:
          leg.endTime && leg.endTime > 0
            ? new Date(leg.endTime).toISOString()
            : undefined,
        timeTaken: leg.timeTaken,
        mcqPoints: leg.mcqPoints,
        puzzlePoints: leg.puzzlePoints,
        timeBonus: leg.timeBonus,
        totalPoints: leg.mcqPoints + leg.puzzlePoints + leg.timeBonus,
        mcqAnswerOptionId: leg.mcqAnswerOptionId,
        isFirstCheckpoint: leg.isFirstCheckpoint,
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
        isActive: team.isActive,
      },
      legs: detailedLegs,
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
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    return teams
      .map((team) => {
        const currentCheckpoint =
          team.currentIndex < team.roadmap.length
            ? team.roadmap[team.currentIndex]
            : "completed";

        const currentCheckpointName =
          team.currentIndex < team.roadmap.length
            ? `Checkpoint ${team.currentIndex + 1}: ${team.roadmap[team.currentIndex]}`
            : "Game Completed";

        const completionPercentage =
          team.roadmap.length > 0
            ? Math.round((team.currentIndex / team.roadmap.length) * 100)
            : 0;

        let status: "not_started" | "in_progress" | "completed" | "stuck";
        let currentCheckpointStartTime: string | undefined;
        let timeSinceLastScan: number | undefined;
        let timeOnCurrentCheckpoint: string | undefined;
        let currentLegDetails: TeamLegDetails | undefined = undefined;
        let lastCompletedCheckpoint: LastCompletedCheckpoint | undefined =
          undefined;

        // Build roadmap progress
        const roadmapProgress = team.roadmap.map((checkpointId, index) => {
          const leg = team.legs[index];
          let legStatus: "completed" | "current" | "upcoming";

          if (index < team.currentIndex) {
            legStatus = "completed";
          } else if (index === team.currentIndex) {
            legStatus = "current";
          } else {
            legStatus = "upcoming";
          }

          return {
            checkpoint: checkpointId,
            index: index + 1,
            status: legStatus,
            points:
              leg && leg.endTime
                ? leg.mcqPoints + leg.puzzlePoints + leg.timeBonus
                : undefined,
            timeTaken: leg && leg.endTime ? leg.timeTaken : undefined,
          };
        });

        if (completionPercentage === 100) {
          status = "completed";

          // Get last completed checkpoint info
          const lastLeg = team.legs[team.legs.length - 1];
          if (lastLeg && lastLeg.endTime) {
            lastCompletedCheckpoint = {
              checkpoint: lastLeg.checkpoint,
              completedAt: new Date(lastLeg.endTime).toLocaleString(),
              totalPoints:
                lastLeg.mcqPoints + lastLeg.puzzlePoints + lastLeg.timeBonus,
              timeTaken: lastLeg.timeTaken,
            };
          }
        } else if (team.currentIndex < team.legs.length) {
          const currentLeg = team.legs[team.currentIndex];
          if (currentLeg && currentLeg.startTime > 0) {
            status = "in_progress";
            currentCheckpointStartTime = new Date(
              currentLeg.startTime
            ).toLocaleString();
            timeSinceLastScan = Math.floor(
              (currentTime - currentLeg.startTime) / 1000
            );
            timeOnCurrentCheckpoint = formatTime(timeSinceLastScan);

            currentLegDetails = {
              mcqPoints: currentLeg.mcqPoints,
              puzzlePoints: currentLeg.puzzlePoints,
              timeBonus: currentLeg.timeBonus,
              timeTaken: currentLeg.timeTaken,
              isCompleted: !!currentLeg.endTime,
            };

            // Mark as stuck if no progress for more than 15 minutes
            if (timeSinceLastScan > 900) {
              status = "stuck";
            }
          } else {
            status = "not_started";
          }

          // Get last completed checkpoint if any
          if (team.currentIndex > 0) {
            const prevLeg = team.legs[team.currentIndex - 1];
            if (prevLeg && prevLeg.endTime) {
              lastCompletedCheckpoint = {
                checkpoint: prevLeg.checkpoint,
                completedAt: new Date(prevLeg.endTime).toLocaleString(),
                totalPoints:
                  prevLeg.mcqPoints + prevLeg.puzzlePoints + prevLeg.timeBonus,
                timeTaken: prevLeg.timeTaken,
              };
            }
          }
        } else {
          status = "not_started";
        }

        // Calculate total elapsed time based on team status
        let totalTimeElapsed: number;
        
        if (completionPercentage === 100) {
          // For completed teams: Use checkpoint-based calculation (first start to last end)
          const firstLeg = team.legs.find(leg => leg.startTime > 0);
          const lastLeg = team.legs.filter(leg => leg.endTime && leg.endTime > 0).pop();
          
          if (firstLeg && lastLeg && firstLeg.startTime && lastLeg.endTime) {
            totalTimeElapsed = Math.floor((lastLeg.endTime - firstLeg.startTime) / 1000);
          } else {
            // Fallback to game-based calculation if checkpoint data is incomplete
            totalTimeElapsed = team.gameStartTime
              ? Math.floor((currentTime - team.gameStartTime) / 1000)
              : team.totalTime;
          }
        } else {
          // For active/incomplete teams: Use game-based calculation (real-time)
          totalTimeElapsed = team.gameStartTime
            ? Math.floor((currentTime - team.gameStartTime) / 1000)
            : team.totalTime;
        }

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
          gameStartTimeFormatted: team.gameStartTime
            ? new Date(team.gameStartTime).toLocaleString()
            : undefined,
          status,
          currentLegDetails,
          lastCompletedCheckpoint,
          roadmapProgress,
        };
      })
      .sort((a, b) => {
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
    console.log("=== TEAM DEBUG INFO ===");
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      console.log("Team not found:", teamId);
      return;
    }

    console.log("Team ID:", team.id);
    console.log("Username:", team.username);
    console.log("Roadmap:", team.roadmap);
    console.log("Current Index:", team.currentIndex);
    console.log("Total Points:", team.totalPoints);
    console.log("Total Time:", team.totalTime);
    console.log("Is Active:", team.isActive);
    console.log(
      "Game Start Time:",
      team.gameStartTime
        ? new Date(team.gameStartTime).toISOString()
        : "Not started"
    );
    console.log("Legs (detailed):");
    team.legs.forEach((leg, index) => {
      console.log(`  Leg ${index}:`, {
        puzzleId: leg.puzzleId,
        checkpoint: leg.checkpoint,
        startTime: leg.startTime
          ? new Date(leg.startTime).toISOString()
          : "Not started",
        endTime: leg.endTime
          ? new Date(leg.endTime).toISOString()
          : "Not completed",
        timeTaken: `${leg.timeTaken}s`,
        mcqPoints: leg.mcqPoints,
        puzzlePoints: leg.puzzlePoints,
        timeBonus: leg.timeBonus,
        totalPoints: leg.mcqPoints + leg.puzzlePoints + leg.timeBonus,
        isFirstCheckpoint: leg.isFirstCheckpoint,
      });
    });

    if (team.currentIndex < team.roadmap.length) {
      const currentCheckpointId = team.roadmap[team.currentIndex];
      console.log("Current Checkpoint ID:", currentCheckpointId);

      const currentPuzzle =
        await FirestoreService.getPuzzle(currentCheckpointId);
      console.log("Current Checkpoint Puzzle:", currentPuzzle);
    }

    console.log("=== END DEBUG ===");
  }

  // Get overall game status for admin monitoring
  static async getGameStatus(): Promise<{
    status: "waiting" | "active" | "paused" | "stopped" | "completed";
    activeTeams: number;
    pausedTeams: number;
    completedTeams: number;
    totalTeams: number;
    averageProgress: number;
    totalPoints: number;
  }> {
    // Get game status from global settings (centralized approach)
    const settings = await FirestoreService.getGlobalSettings();
    const teams = await FirestoreService.getAllTeams();

    const totalTeams = teams.length;
    const activeTeams = teams.filter(
      (t) => t.isActive && t.gameStartTime && t.gameStartTime > 0
    ).length;
    const pausedTeams = teams.filter(
      (t) =>
        !t.isActive &&
        t.gameStartTime &&
        t.gameStartTime > 0 &&
        t.currentIndex < t.roadmap.length
    ).length;
    const completedTeams = teams.filter(
      (t) => t.currentIndex >= t.roadmap.length
    ).length;

    const averageProgress =
      totalTeams > 0
        ? teams.reduce((acc, team) => {
            const progress =
              team.roadmap.length > 0
                ? (team.currentIndex / team.roadmap.length) * 100
                : 0;
            return acc + progress;
          }, 0) / totalTeams
        : 0;

    const totalPoints = teams.reduce((acc, team) => acc + team.totalPoints, 0);

    // Use centralized game status from settings, with fallback to team-based calculation
    let status: "waiting" | "active" | "paused" | "stopped" | "completed" =
      settings?.gameStatus || "waiting";

    // Override with calculated status only if no centralized status exists
    if (!settings?.gameStatus) {
      if (completedTeams === totalTeams && totalTeams > 0) {
        status = "completed";
      } else if (!teams.some((t) => t.gameStartTime && t.gameStartTime > 0)) {
        status = "waiting";
      } else if (activeTeams > 0) {
        status = "active";
      } else if (pausedTeams > 0) {
        status = "paused";
      } else {
        status = "stopped";
      }
    }

    return {
      status,
      activeTeams,
      pausedTeams,
      completedTeams,
      totalTeams,
      averageProgress: Math.round(averageProgress),
      totalPoints,
    };
  }

  // Admin control: Start game for all teams
  static async startGameFromAdmin(): Promise<{
    success: boolean;
    message: string;
    teamsActivated: number;
  }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      const settings = await FirestoreService.getGlobalSettings();

      if (!settings) {
        throw new Error(
          "Global settings not found. Please configure game settings first."
        );
      }

      if (teams.length === 0) {
        throw new Error(
          "No teams found. Please create teams before starting the game."
        );
      }

      // Validate that all teams have roadmaps
      const teamsWithoutRoadmaps = teams.filter(
        (team) => !team.roadmap || team.roadmap.length === 0
      );
      if (teamsWithoutRoadmaps.length > 0) {
        throw new Error(
          `${teamsWithoutRoadmaps.length} teams don't have roadmaps configured. Please ensure all teams have valid roadmaps.`
        );
      }

      const gameStartTime = Date.now();
      let teamsActivated = 0;

      // Initialize and activate ALL teams (resetting any existing progress)
      for (const team of teams) {
        // Create fresh legs for each checkpoint in the roadmap
        const legs = await Promise.all(
          team.roadmap.map(async (puzzleId) => {
            const puzzle = await FirestoreService.getPuzzle(puzzleId);
            return {
              puzzleId,
              checkpoint: puzzle?.checkpoint || puzzleId,
              startTime: 0,
              endTime: 0,
              mcqPoints: 0,
              puzzlePoints: 0,
              timeBonus: 0,
              timeTaken: 0,
              mcqAnswerOptionId: null,
              isFirstCheckpoint: puzzle?.checkpoint === "cp_0", // Fix: Check for cp_0 specifically, not index
            };
          })
        );

        // Reset team completely and activate
        await FirestoreService.updateTeam(team.id, {
          isActive: true,
          gameStartTime,
          currentIndex: 0,
          totalTime: 0,
          totalPoints: 0,
          legs,
        });

        teamsActivated++;
      }

      // Update global game state
      await FirestoreService.updateGlobalSettings({
        gameStatus: "active",
        gameStartTime,
        lastStateChange: gameStartTime,
      });

      return {
        success: true,
        message: `Game started successfully! ${teamsActivated} teams are now active and ready to play. All previous progress has been cleared for a fresh start.`,
        teamsActivated,
      };
    } catch (error) {
      console.error("Start game error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to start game",
        teamsActivated: 0,
      };
    }
  }

  // Admin control: Pause/Resume game
  static async pauseResumeGame(
    pause: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const teams = await FirestoreService.getAllTeams();

      if (teams.length === 0) {
        throw new Error("No teams found to pause/resume.");
      }

      let updatedTeams = 0;
      const currentTime = Date.now();

      for (const team of teams) {
        if (pause) {
          // Pause: Set ALL teams to inactive (regardless of current state)
          await FirestoreService.updateTeam(team.id, { isActive: false });
          updatedTeams++;
        } else {
          // Resume: Set ALL teams that haven't completed the game to active
          const isCompleted = team.currentIndex >= team.roadmap.length;

          if (!isCompleted) {
            await FirestoreService.updateTeam(team.id, { isActive: true });
            updatedTeams++;
          }
        }
      }

      // Update global game state
      await FirestoreService.updateGlobalSettings({
        gameStatus: pause ? "paused" : "active",
        lastStateChange: currentTime,
      });

      return {
        success: true,
        message: pause
          ? `Game paused for all teams. ${updatedTeams} teams are now inactive and cannot progress.`
          : `Game resumed for ${updatedTeams} teams. All non-completed teams are now active and can continue playing.`,
      };
    } catch (error) {
      console.error("Pause/Resume game error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update game state",
      };
    }
  }

  // Admin control: Reset game progress for all teams
  static async resetGame(): Promise<{
    success: boolean;
    message: string;
    teamsReset: number;
  }> {
    try {
      const teams = await FirestoreService.getAllTeams();
      const settings = await FirestoreService.getGlobalSettings();

      if (!settings) {
        throw new Error("Global settings not found");
      }

      await FirestoreService.updateGlobalSettings({
        gameStatus: "waiting",
        gameStartTime: 0,
        lastStateChange: Date.now(),
      });

      if (teams.length === 0) {
        return {
          success: true,
          message: "Game state reset successfully. Ready for new game.",
          teamsReset: 0,
        };
      }

      let teamsReset = 0;

      for (const team of teams) {
        const resetData: Partial<Team> = {
          currentIndex: 0,
          totalPoints: 0,
          totalTime: 0,
          isActive: false,
          gameStartTime: 0,
          // Fix: ensure no undefined values in legs
          legs:
            team.roadmap && team.roadmap.length > 0
              ? await Promise.all(
                  team.roadmap.map(async (puzzleId) => {
                    const puzzle = await FirestoreService.getPuzzle(puzzleId);
                    return {
                      puzzleId,
                      checkpoint: puzzle?.checkpoint || puzzleId,
                      startTime: 0,
                      endTime: 0,
                      mcqPoints: 0,
                      puzzlePoints: 0,
                      timeBonus: 0,
                      timeTaken: 0,
                      mcqAnswerOptionId: null,
                      isFirstCheckpoint: puzzle?.checkpoint === "cp_0", // Fix: Check for cp_0 specifically, not index
                    };
                  })
                )
              : [],
        };

        await FirestoreService.updateTeam(team.id, resetData);
        teamsReset++;
      }

      return {
        success: true,
        message: `Game completely reset! All progress cleared for ${teamsReset} teams. All checkpoint progress, points, times, and game state have been reset. Game is now in waiting state and can be started fresh.`,
        teamsReset,
      };
    } catch (error) {
      console.error("Reset game error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to reset game",
        teamsReset: 0,
      };
    }
  }

  /**
   * Debug timing issues for a specific team
   * Helps identify missing start/end times and timing inconsistencies
   */
  static async debugTeamTiming(teamId: string): Promise<{
    teamId: string;
    currentStatus: string;
    timingIssues: string[];
    legs: Array<{
      index: number;
      checkpoint: string;
      startTime: number;
      endTime: number | undefined;
      timeTaken: number;
      mcqPoints: number;
      puzzlePoints: number;
      timeBonus: number;
      isFirstCheckpoint: boolean;
      status: string;
    }>;
    recommendations: string[];
  }> {
    const team = await FirestoreService.getTeam(teamId);
    if (!team) {
      return {
        teamId,
        currentStatus: "Team not found",
        timingIssues: ["Team does not exist in database"],
        legs: [],
        recommendations: ["Verify team ID is correct"],
      };
    }

    const timingIssues: string[] = [];
    const recommendations: string[] = [];
    let currentStatus = "Unknown";

    // Analyze current status
    if (!team.isActive) {
      currentStatus = "Inactive";
    } else if (team.currentIndex >= team.roadmap.length) {
      currentStatus = "Game Completed";
    } else if (team.currentIndex === 0) {
      currentStatus = "At Starting Checkpoint";
    } else {
      currentStatus = `On Checkpoint ${team.currentIndex + 1} of ${team.roadmap.length}`;
    }

    // Check timing data for each leg
    team.legs.forEach((leg, index) => {
      const checkpointLabel = `Checkpoint ${index} (${leg.checkpoint})`;

      if (leg.isFirstCheckpoint) {
        // First checkpoint (cp_0) now requires MCQ like other checkpoints
        if (index < team.currentIndex) {
          // Completed first checkpoint should have proper timing and points data
          if (leg.startTime === 0) {
            timingIssues.push(
              `${checkpointLabel}: Missing start time for completed first checkpoint`
            );
            recommendations.push(`Set start time for ${checkpointLabel}`);
          }
          if (leg.endTime === 0) {
            timingIssues.push(
              `${checkpointLabel}: Missing end time for completed first checkpoint`
            );
            recommendations.push(`Set end time for ${checkpointLabel}`);
          }
          if (
            leg.timeTaken === 0 &&
            leg.startTime > 0 &&
            leg.endTime &&
            leg.endTime > 0
          ) {
            timingIssues.push(
              `${checkpointLabel}: Time taken should be calculated`
            );
            recommendations.push(
              `Calculate timeTaken = (endTime - startTime) / 1000`
            );
          }
        }
      } else {
        // Regular checkpoints - check for timing issues
        if (index < team.currentIndex) {
          // Completed checkpoint should have timing data
          if (leg.startTime === 0) {
            timingIssues.push(
              `${checkpointLabel}: Missing start time for completed checkpoint`
            );
            recommendations.push(`Set start time for ${checkpointLabel}`);
          }
          if (leg.endTime === 0) {
            timingIssues.push(
              `${checkpointLabel}: Missing end time for completed checkpoint`
            );
            recommendations.push(`Set end time for ${checkpointLabel}`);
          }
          if (
            leg.timeTaken === 0 &&
            leg.startTime > 0 &&
            (leg.endTime || 0) > 0
          ) {
            timingIssues.push(
              `${checkpointLabel}: Time taken not calculated properly`
            );
            recommendations.push(
              `Recalculate timeTaken = (endTime - startTime) / 1000`
            );
          }
        } else if (index === team.currentIndex) {
          // Current checkpoint - check partial timing
          if (leg.startTime > 0 && leg.endTime === 0) {
            // Team is currently on this checkpoint (QR scanned but MCQ not answered)
            const timeOnCheckpoint = Math.floor(
              (Date.now() - leg.startTime) / 1000 / 60
            );
            if (timeOnCheckpoint > 15) {
              timingIssues.push(
                `${checkpointLabel}: Team stuck for ${timeOnCheckpoint} minutes`
              );
              recommendations.push("Check if team needs assistance");
            }
          } else if (leg.startTime === 0) {
            // Team hasn't started this checkpoint yet (expected)
          }
        } else {
          // Future checkpoint should have no timing data
          if (leg.startTime > 0 || (leg.endTime || 0) > 0) {
            timingIssues.push(
              `${checkpointLabel}: Future checkpoint has timing data`
            );
            recommendations.push("Reset timing data for future checkpoints");
          }
        }
      }
    });

    // Check for missing gameStartTime
    if (!team.gameStartTime) {
      timingIssues.push("Missing game start time");
      recommendations.push("Set gameStartTime when admin starts the game");
    }

    // Overall timing consistency
    if (team.legs.length !== team.roadmap.length) {
      timingIssues.push(
        `Legs count (${team.legs.length}) doesn't match roadmap length (${team.roadmap.length})`
      );
      recommendations.push("Reinitialize legs array to match roadmap");
    }

    return {
      teamId,
      currentStatus,
      timingIssues,
      legs: team.legs.map((leg, index) => ({
        index,
        checkpoint: leg.checkpoint,
        startTime: leg.startTime,
        endTime: leg.endTime,
        timeTaken: leg.timeTaken,
        mcqPoints: leg.mcqPoints,
        puzzlePoints: leg.puzzlePoints,
        timeBonus: leg.timeBonus,
        isFirstCheckpoint: leg.isFirstCheckpoint,
        status:
          index < team.currentIndex
            ? "completed"
            : index === team.currentIndex
              ? "current"
              : "future",
      })),
      recommendations,
    };
  }

  /**
   * Get timing statistics for admin monitoring
   */
  static async getTimingStatistics(): Promise<{
    totalTeams: number;
    activeTeams: number;
    completedTeams: number;
    stuckTeams: { teamId: string; stuckMinutes: number; checkpoint: string }[];
    averageTimePerCheckpoint: { [checkpoint: string]: number };
  }> {
    const teams = await FirestoreService.getAllTeams();
    const stuckTeams: {
      teamId: string;
      stuckMinutes: number;
      checkpoint: string;
    }[] = [];
    const checkpointTimes: { [checkpoint: string]: number[] } = {};

    let activeTeams = 0;
    let completedTeams = 0;
    const currentTime = Date.now();

    for (const team of teams) {
      if (!team.isActive) continue;

      if (team.currentIndex >= team.roadmap.length) {
        completedTeams++;
        continue;
      }

      activeTeams++;

      // Check for stuck teams
      const currentLeg = team.legs[team.currentIndex];
      if (currentLeg && currentLeg.startTime > 0 && currentLeg.endTime === 0) {
        const stuckMinutes = Math.floor(
          (currentTime - currentLeg.startTime) / 1000 / 60
        );
        if (stuckMinutes > 15) {
          stuckTeams.push({
            teamId: team.id,
            stuckMinutes,
            checkpoint: currentLeg.checkpoint,
          });
        }
      }

      // Collect timing data for completed checkpoints (now including first checkpoint)
      team.legs.forEach((leg, index) => {
        if (index < team.currentIndex && leg.timeTaken > 0) {
          if (!checkpointTimes[leg.checkpoint]) {
            checkpointTimes[leg.checkpoint] = [];
          }
          checkpointTimes[leg.checkpoint].push(leg.timeTaken);
        }
      });
    }

    // Calculate averages
    const averageTimePerCheckpoint: { [checkpoint: string]: number } = {};
    Object.keys(checkpointTimes).forEach((checkpoint) => {
      const times = checkpointTimes[checkpoint];
      averageTimePerCheckpoint[checkpoint] = Math.round(
        times.reduce((sum, time) => sum + time, 0) / times.length
      );
    });

    return {
      totalTeams: teams.length,
      activeTeams,
      completedTeams,
      stuckTeams: stuckTeams.sort((a, b) => b.stuckMinutes - a.stuckMinutes),
      averageTimePerCheckpoint,
    };
  }
}

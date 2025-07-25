export interface GlobalSettings {
  id: string;
  n_checkpoints: number;
  base_points: number;
  bonus_per_minute: number;
  penalty_points: number;
  max_teams: number;
  max_participants: number;
  game_duration: number;
  round_time: number; // Time in minutes for each checkpoint before penalty applies
  gameName: string;
  enable_hints: boolean;
  enable_timer: boolean;
  allow_retries: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  // Game state management fields
  gameStatus?: 'waiting' | 'active' | 'paused' | 'completed';
  gameStartTime?: number;
  lastStateChange?: number;
}

export interface Team {
  id: string;
  username: string;
  passwordHash: string;
  roadmap: string[];
  currentIndex: number;
  totalTime: number;
  totalPoints: number;
  legs: TeamLeg[];  // REQUIRED: Detailed checkpoint progress tracking per PRD
  isActive: boolean;
  gameStartTime?: number;
  createdAt?: string; 
  members: number
}

export interface TeamLeg {
  puzzleId: string;                    // Puzzle ID from team's roadmap
  checkpoint: string;                  // Checkpoint extracted from puzzle (e.g., "cp_0", "cp_1")
  startTime: number;                   // When QR code is scanned (puzzle starts)
  endTime?: number;                    // When MCQ is answered (puzzle completed)
  mcqPoints: number;                   // Static points from MCQ answer choice
  puzzlePoints: number;                // Points for completing this puzzle (base_points)
  timeBonus: number;                   // Bonus/penalty based on completion time
  timeTaken: number;                   // Total time in seconds for this checkpoint
  mcqAnswerOptionId?: string | null;          // Which MCQ option was selected
  isFirstCheckpoint: boolean;          // Special handling for cp_0 (no MCQ, same start/end time)
}

export interface MCQ {
  id: string;
  text: string;
  options: MCQOption[];
}

export interface MCQOption {
  id?: string;
  text: string;
  value: number;
}

export interface Puzzle {
  id: string;
  checkpoint: string;
  text: string;
  imageURL?: string;
  code: string;
  isStarting?: boolean;
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
}

// Team-specific UI types
export interface TeamData {
  currentCheckpoint: number;
  totalCheckpoints: number;
  totalTime: number;
  totalPoints: number;
  status: 'waiting' | 'active' | 'completed';
  nextLocation: string;
}

export interface TeamActivity {
  action: string;
  time: string;
  points: string;
}

export interface TeamProgress {
  currentCheckpoint: number;
  totalCheckpoints: number;
  totalPoints: number;
  elapsedTime: number;
  isGameActive: boolean;
  currentStage: 'scan' | 'mcq' | 'puzzle' | 'complete';
  currentMCQ?: MCQ;
  currentPuzzle?: Puzzle;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'team' | 'admin';
  teamId?: string;
}

// QR Scanner types
export interface QRScanResult {
  code: string;
  isValid: boolean;
  checkpointId?: string;
}

// MCQ types for team UI
export interface MCQQuestionData {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    points: number;
  }>;
  correctAnswer: string;
  timeLimit: number;
}

// Puzzle types for team UI
export interface PuzzleData {
  id: string;
  text: string;
  imageURL?: string;
  code: string;
  nextLocation: string;
  hint: string;
}
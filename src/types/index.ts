export interface GlobalSettings {
  id: string;
  n_checkpoints: number;
  base_points: number;
  bonus_per_minute: number;
}

export interface Team {
  id: string;
  username: string;
  passwordHash: string;
  roadmap: string[];
  currentIndex: number;
  totalTime: number;
  totalPoints: number;
  legs: TeamLeg[];
  isActive: boolean;
}

export interface TeamLeg {
  checkpointId: string;
  startTime: number;
  endTime?: number;
  mcqPoints: number;
  timeBonus: number;
}

export interface MCQ {
  id: string;
  text: string;
  options: MCQOption[];
}

export interface MCQOption {
  text: string;
  value: number;
}

export interface Puzzle {
  id: string;
  text: string;
  imageURL?: string;
  code: string;
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
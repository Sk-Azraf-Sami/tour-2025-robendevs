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
  createdAt?: string; 
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

// Additional types for UI components
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
  name: string;
  type: 'team' | 'admin';
}
// Team game constants
export const TEAM_CONSTANTS = {
  MCQ_TIME_LIMIT: 180, // 3 minutes in seconds
  SCAN_TIMEOUT: 30, // 30 seconds for QR scan timeout
  AUTO_REDIRECT_DELAY: 2000, // 2 seconds delay for auto redirects
  TIMER_UPDATE_INTERVAL: 1000, // 1 second for timer updates
} as const

// Valid checkpoint codes for simulation
export const VALID_QR_CODES = [
  'EXPLORER_STATUE_001',
  'RED_DOOR_PUZZLE_002',
  'LIBRARY_ENTRANCE_003',
  'MUSEUM_GARDEN_004',
  'CLOCK_TOWER_005',
  'FOUNTAIN_PLAZA_006',
  'UNIVERSITY_HALL_007',
  'PARK_MONUMENT_008',
] as const

// Team status types
export const TEAM_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const

// Game stages
export const GAME_STAGES = {
  SCAN: 'scan',
  MCQ: 'mcq',
  PUZZLE: 'puzzle',
  COMPLETE: 'complete',
} as const

// Points configuration
export const POINTS_CONFIG = {
  CORRECT_MCQ: 10,
  INCORRECT_MCQ: 0,
  TIME_BONUS_PER_MINUTE: 1,
  CHECKPOINT_BASE: 5,
} as const

// UI Messages
export const MESSAGES = {
  QR_SCAN_SUCCESS: 'QR Code Scanned! Checkpoint verified. Proceeding to MCQ.',
  QR_SCAN_ERROR: 'Invalid QR Code - This QR code is not for your current checkpoint.',
  CODE_VERIFY_SUCCESS: 'Code Verified! Checkpoint confirmed. Proceeding to MCQ.',
  CODE_VERIFY_ERROR: 'Invalid Code - Please check the code and try again.',
  MCQ_CORRECT: 'Correct Answer! Well done! You earned 10 points.',
  MCQ_INCORRECT: 'Incorrect Answer - Don\'t worry, you can still continue to the puzzle.',
  MCQ_TIMEOUT: 'Time\'s up! Don\'t worry, you can still continue to the puzzle.',
  PUZZLE_COMPLETE: 'Puzzle Completed! Great work! You can now proceed to the next checkpoint.',
} as const

// Locations for demonstration
export const DEMO_LOCATIONS = [
  'Central Library - Main Entrance',
  'University Museum - Garden',
  'Clock Tower - East Side',
  'Student Plaza - Fountain',
  'Academic Building - Red Door',
  'Science Hall - Laboratory Wing',
  'Sports Complex - Main Gate',
  'Arts Center - Sculpture Garden',
] as const

# TREASURE HUNT DATABASE SCHEMA - DETAILED IMPLEMENTATION

## Overview
This document describes the complete database schema implementation for the treasure hunt system, aligned with the PRD requirements and Firebase database structure.

## Database Collections

### 1. Teams Collection
```javascript
{
  id: string,                    // Auto-generated team ID
  username: string,              // Team login username
  passwordHash: string,          // Hashed password for authentication
  roadmap: string[],             // Array of puzzle IDs in unique order for this team
  currentIndex: number,          // Current position in roadmap (0-based)
  totalTime: number,            // Total elapsed time in seconds
  totalPoints: number,          // Cumulative points earned
  legs: TeamLeg[],              // Detailed progress tracking (one per checkpoint)
  isActive: boolean,            // Whether game is active for this team
  gameStartTime?: number,       // Timestamp when game started
  createdAt?: string,           // Team creation timestamp
  members: number               // Number of team members
}
```

### 2. TeamLeg Structure (Per PRD Requirements)
```javascript
{
  puzzleId: string,             // Puzzle ID from team's roadmap
  checkpoint: string,           // Checkpoint name (e.g., "cp_0", "cp_1")
  startTime: number,            // When QR code is scanned (puzzle starts)
  endTime: number,              // When MCQ is answered (puzzle completed)
  mcqPoints: number,            // Static points from MCQ answer choice
  puzzlePoints: number,         // Points for completing puzzle (base_points)
  timeBonus: number,            // Bonus/penalty based on completion time
  timeTaken: number,            // Total time in seconds for this checkpoint
  mcqAnswerOptionId?: string,   // Which MCQ option was selected
  isFirstCheckpoint: boolean    // Special handling for cp_0
}
```

### 3. Puzzles Collection
```javascript
{
  id: string,                   // Puzzle ID (referenced in team roadmaps)
  checkpoint: string,           // Checkpoint identifier (cp_0, cp_1, etc.)
  text: string,                 // Puzzle hint text
  imageURL?: string,            // Optional puzzle image
  code: string,                 // QR code value for this checkpoint
  isStarting: boolean           // Whether this is the starting checkpoint
}
```

### 4. MCQs Collection
```javascript
{
  id: string,                   // MCQ ID
  text: string,                 // Question text
  options: MCQOption[]          // Array of answer options
}
```

### 5. MCQOption Structure
```javascript
{
  id?: string,                  // Option ID
  text: string,                 // Option text
  value: number                 // Points awarded for selecting this option
}
```

### 6. GlobalSettings Collection
```javascript
{
  id: string,                   // Settings ID
  n_checkpoints: number,        // Total number of checkpoints
  base_points: number,          // Base points per puzzle completion
  bonus_per_minute: number,     // Bonus points for fast completion
  penalty_points: number,       // Penalty points for slow completion
  max_teams: number,            // Maximum number of teams
  max_participants: number,     // Maximum participants per team
  game_duration: number,        // Game duration in minutes
  gameName: string,             // Name of the game
  enable_hints: boolean,        // Whether hints are enabled
  enable_timer: boolean,        // Whether timer is shown
  allow_retries: boolean,       // Whether retries are allowed
  email_notifications: boolean, // Email notifications setting
  push_notifications: boolean   // Push notifications setting
}
```

## Scoring System Implementation

### Point Calculation (Per PRD)
1. **MCQ Points**: Static points from selected answer option (`mcqOption.value`)
2. **Puzzle Points**: Base points for completing puzzle (`settings.base_points`)
3. **Time Bonus/Penalty**: 
   - Fast completion (< 2 minutes): `bonus_per_minute * (2 - minutes_taken)`
   - Normal completion (2-5 minutes): No bonus/penalty
   - Slow completion (> 5 minutes): `-(penalty_per_minute * (minutes_taken - 5))`

### Total Points Per Checkpoint
```
Total = MCQ Points + Puzzle Points + Time Bonus/Penalty
```

## Time Tracking System

### Leg Lifecycle
1. **QR Scan**: `startTime` recorded when valid QR code is scanned
2. **MCQ Answer**: `endTime` recorded when MCQ is submitted
3. **Time Calculation**: `timeTaken = (endTime - startTime) / 1000` seconds
4. **Special Case**: First checkpoint (cp_0) has `startTime = endTime` and `timeTaken = 0`

### Real-time Tracking
- Game start time tracked in `team.gameStartTime`
- Total elapsed time calculated as `(Date.now() - gameStartTime) / 1000`
- Individual checkpoint times tracked in each leg

## Game Flow Implementation

### 1. Game Initialization
```typescript
GameService.startGame()
```
- Validates all teams have roadmaps
- Initializes legs array with one object per checkpoint
- Sets game start time and activates teams

### 2. QR Code Scanning
```typescript
GameService.validateQRCode(teamId, qrCode)
```
- Validates QR against current checkpoint in roadmap
- Records start time for checkpoint
- Special handling for first checkpoint (immediate completion)
- Returns MCQ for regular checkpoints

### 3. MCQ Submission
```typescript
GameService.submitMCQAnswer(teamId, qrCode, answerOptionId)
```
- Calculates all point types (MCQ, puzzle, time)
- Records end time and updates leg data
- Advances to next checkpoint
- Returns puzzle for next checkpoint

## Special Cases

### First Checkpoint (cp_0)
- No MCQ required
- `startTime = endTime` (same timestamp)
- `timeTaken = 0`
- `mcqPoints = 0`
- Only receives `puzzlePoints` (base_points)
- Immediately advances to next checkpoint

### Game Completion
- When `currentIndex >= roadmap.length`
- Team marked as inactive (`isActive = false`)
- Final scores calculated and stored

## Admin Monitoring Features

### Real-time Dashboard Data
```typescript
GameService.getAllTeamsMonitoringData()
```
Returns:
- Current checkpoint for each team
- Time since last scan
- Completion percentage
- Status: not_started | in_progress | completed | stuck

### Detailed Team Progress
```typescript
GameService.getTeamDetailedProgress(teamId)
```
Returns:
- Complete leg breakdown
- Individual checkpoint times and scores
- Progress status for each checkpoint

### Team Statistics
```typescript
GameService.getTeamStats(teamId)
```
Returns:
- Average time per checkpoint
- Fastest/slowest checkpoints
- Highest scoring checkpoint
- Point breakdown by category

## Database Indexing Recommendations

### Firestore Indexes
1. **Teams Collection**:
   - Composite: `isActive`, `totalPoints` (desc), `totalTime` (asc)
   - Single: `currentIndex`, `gameStartTime`

2. **Puzzles Collection**:
   - Single: `checkpoint`, `isStarting`
   - Single: `code` (for QR validation)

3. **MCQs Collection**:
   - No special indexes needed (small collection)

## Performance Considerations

### Optimization Strategies
1. **Batch Updates**: Team progress updates use single write operations
2. **Efficient Queries**: Direct puzzle lookup by ID in roadmaps
3. **Real-time Calculations**: Time calculations done client-side to reduce database load
4. **Caching**: MCQ data can be cached since it doesn't change during game

### Scalability
- Supports 50+ concurrent teams
- Real-time monitoring without performance impact
- Efficient leaderboard calculations

## Data Validation Rules

### Team Roadmap Validation
- Must contain valid puzzle IDs
- All teams must have same number of checkpoints
- First checkpoint should be cp_0 for all teams

### Leg Data Validation
- `startTime` must be set before `endTime`
- `timeTaken` must be non-negative
- Points cannot be negative (after bonus/penalty calculation)

### MCQ Validation
- Selected option must exist in database
- Option values must be numeric

This schema provides complete audit trail for team progress, supports real-time monitoring, and implements all PRD requirements for scoring and time tracking.

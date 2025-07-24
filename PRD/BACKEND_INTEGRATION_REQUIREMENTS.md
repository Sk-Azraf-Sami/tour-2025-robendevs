# TEAM INTERFACE BACKEND INTEGRATION REQUIREMENTS

## Overview
The team interface has been refactored to align with the updated PRD requirements for a roadmap-based treasure hunt system. Below are the specific backend integration points needed.

## Core Concept: Roadmap System
- Each team gets a unique `roadmap[]` array containing checkpoint IDs in a specific order
- Teams visit the same checkpoints but in different sequences (except first checkpoint)
- Only QR codes matching `roadmap[currentIndex]` are accepted
- Progress is tracked via `currentIndex` which increments after each successful checkpoint

## Required Backend Service Methods

### 1. Team Progress Management
```typescript
// Get team's current game state
GameService.getTeamProgress(teamId: string): Promise<{
  roadmap: string[]           // Unique checkpoint order for this team
  currentIndex: number        // Current position in roadmap (0-based)
  totalPoints: number         // Cumulative points earned
  totalTime: number          // Total elapsed time in seconds
  legs: TeamLeg[]            // History of completed checkpoints
  isActive: boolean          // Whether game is active for this team
}>

// Initialize team roadmap when game starts
GameService.initializeTeamRoadmap(teamId: string): Promise<void>
```

### 2. QR Code Validation
```typescript
// Validate QR code against team's current checkpoint
GameService.validateQRCode(teamId: string, qrCode: string): Promise<{
  success: boolean
  message: string
  mcq?: MCQData              // MCQ for this checkpoint if valid
}>

// Backend Logic:
// 1. Get team's roadmap and currentIndex
// 2. Check if qrCode matches checkpoint at roadmap[currentIndex]
// 3. If match: return MCQ for that checkpoint
// 4. If no match: return error message indicating correct checkpoint needed
```

### 3. MCQ Submission & Progress Update
```typescript
// Submit MCQ answer and advance to next checkpoint
GameService.submitMCQAnswer(teamId: string, qrCode: string, answerOptionId: string): Promise<{
  success: boolean
  message: string
  pointsEarned: number       // MCQ points + time bonus
  puzzle?: PuzzleData        // Puzzle for NEXT checkpoint
  isGameComplete: boolean    // True if this was the last checkpoint
}>

// Backend Logic:
// 1. Validate MCQ answer for current checkpoint
// 2. Calculate points: selected option value + time bonus/penalty
// 3. Create TeamLeg record with checkpoint details
// 4. Increment currentIndex and update team totals
// 5. Return puzzle for roadmap[currentIndex] (next checkpoint)
```

### 4. Puzzle Management
```typescript
// Get puzzle for specific checkpoint
GameService.getPuzzleForCheckpoint(checkpointId: string): Promise<PuzzleData>

// Get MCQ for specific checkpoint  
GameService.getMCQForCheckpoint(checkpointId: string): Promise<MCQData>
```

## Data Models Required

### TeamLeg (Progress Tracking)
```typescript
interface TeamLeg {
  checkpointId: string        // Which checkpoint was completed
  startTime: number          // When team started this checkpoint
  endTime: number           // When team completed MCQ
  mcqPoints: number         // Points from MCQ answer
  timeBonus: number         // Bonus/penalty based on completion time
  mcqAnswerOptionId: string // Which option they selected
}
```

### Updated Team Model
```typescript
interface Team {
  id: string
  username: string
  passwordHash: string
  roadmap: string[]          // [cp0, cp5, cp2, cp7, cp1] - unique order
  currentIndex: number       // Current position in roadmap
  totalTime: number         // Cumulative time
  totalPoints: number       // Cumulative points
  legs: TeamLeg[]           // History of completed checkpoints
  isActive: boolean         // Game state
  createdAt: string
}
```

## Frontend Implementation Status

### ✅ Completed Components
1. **TeamGameFlow.tsx** - Main integrated flow component
2. **PuzzleView.tsx** - Updated to remove auto-completion
3. **QRScanner.tsx** - Enhanced with mock validation codes
4. **TeamRoadmapStatus.tsx** - Roadmap visualization component
5. **Router.tsx** - Updated to use new integrated flow

### 🔄 Current Mock Implementations (Replace with Backend)
1. **QR Code Validation** - Currently uses hardcoded valid codes
2. **MCQ Retrieval** - Uses static mock MCQ data
3. **Puzzle Generation** - Uses static mock puzzle data
4. **Progress Tracking** - Simulated in frontend state
5. **Roadmap Generation** - Hardcoded example roadmap

### 📝 Key Comments in Code
- All major backend integration points are marked with `// TODO:` comments
- Mock data sections are clearly labeled for replacement
- Validation logic is documented with expected backend behavior

## Game Flow Implementation

### Current User Journey:
1. **Scan Stage**: Team scans QR code at checkpoint location
2. **Validation**: System checks if QR matches `roadmap[currentIndex]`
3. **MCQ Stage**: If valid, show MCQ for that checkpoint
4. **Submission**: Calculate points, save progress, increment index
5. **Puzzle Stage**: Show puzzle with clues for NEXT checkpoint location
6. **Repeat**: Return to scan stage for next checkpoint

### Critical Validation Rules:
- QR codes only work for the team's current checkpoint
- Puzzles always hint toward the NEXT checkpoint in the roadmap
- All teams visit all checkpoints but in different orders
- First checkpoint (index 0) should be the same for all teams

## Testing Strategy
- Mock buttons in QRScanner provide different test scenarios
- GameFlow includes comprehensive error handling
- Progress tracking shows realistic game state progression
- All user messaging explains the roadmap concept clearly

## Next Steps for Backend Integration
1. Implement the GameService methods listed above
2. Replace all mock data with actual Firestore calls
3. Test QR code validation with real checkpoint codes
4. Verify roadmap generation creates unique team routes
5. Ensure point calculation includes time bonuses correctly

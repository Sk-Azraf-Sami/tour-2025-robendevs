# Admin Game Control System - User Guide

## Overview
The Admin Monitor page now includes comprehensive game control functionality that allows administrators to manage the treasure hunt game lifecycle with proper safeguards and confirmations.

## Game Control Features

### 🚀 Start Game
**When to use**: When all teams are ready and you want to begin the treasure hunt.

**What it does**:
- Activates all teams with configured roadmaps
- Sets game start timestamp for all teams
- Initializes checkpoint tracking (legs array) for each team
- Validates that all teams have proper roadmaps before starting

**Button Location**: Available when game status is "Waiting"

**Validations**:
- Ensures global settings are configured
- Verifies all teams have valid roadmaps
- Checks that teams exist before starting

### ⏸️ Pause Game
**When to use**: When you need to temporarily halt all team progress (e.g., emergency, break time).

**What it does**:
- Sets all active teams to inactive state
- Preserves all current progress and timing
- Teams cannot scan QR codes or submit answers while paused

**Button Location**: Available when game status is "Active"

### ▶️ Resume Game
**When to use**: To continue a paused game.

**What it does**:
- Reactivates all previously active teams
- Teams can continue from their current checkpoint
- All progress and timing continues from pause point

**Button Location**: Available when game status is "Paused"

### 🛑 Stop Game
**When to use**: To end the game while preserving all team progress.

**What it does**:
- Deactivates all teams
- Preserves all checkpoint completions, points, and times
- Teams can no longer progress, but admin can view final results
- Does NOT reset progress (use Reset for that)

**Button Location**: Available when game status is "Active" or "Paused"

### 🔄 Reset Game (DANGEROUS)
**When to use**: To completely restart the game from scratch (typically before a new event).

**What it does**:
- ⚠️ **PERMANENTLY DELETES ALL TEAM PROGRESS**
- Resets all teams to checkpoint 0
- Clears all points and completion times
- Resets all leg tracking data
- Stops any active game

**Button Location**: Available in all game states (with restricted visibility)

**Safety Features**:
1. **Double Confirmation**: Requires two separate confirmation dialogs
2. **Text Verification**: Must type "RESET GAME" exactly to confirm
3. **Warning Messages**: Clear warnings about data loss
4. **Team Count Display**: Shows how many teams will be affected

## Game Status Indicators

### Status Display
The game status card shows the current state:
- **Waiting to Start**: No teams are active, ready to begin
- **Game Active**: Teams are actively playing
- **Game Paused**: Game is temporarily halted
- **Game Completed**: All teams have finished or game was stopped

### Team Statistics
Real-time statistics are displayed:
- **Active Teams**: Currently playing teams
- **Completed Teams**: Teams that finished all checkpoints
- **Average Progress**: Overall completion percentage
- **Total Points**: Sum of all team points

## Team Monitoring

### Real-time Team Data
The table shows live information for each team:
- Current checkpoint and time spent
- Progress percentage with visual progress bar
- Total points with current leg breakdown
- Total elapsed time
- Team status (Not Started, In Progress, Completed, Stuck)

### Detailed Team View
Click "Details" on any team to see:
- Complete checkpoint history
- Points breakdown per checkpoint
- Performance statistics
- Roadmap progress timeline

## Best Practices

### Starting a Game
1. ✅ Verify all teams are present and ready
2. ✅ Confirm global settings are properly configured
3. ✅ Check that all teams have valid roadmaps
4. ✅ Announce the start to all teams
5. ✅ Click "Start Game" in the monitor

### During the Game
1. 👁️ Monitor team progress regularly
2. 🔍 Look for "stuck" teams (slow progress warnings)
3. ⏸️ Use Pause for breaks or emergencies
4. 📊 Export data periodically for backup

### Ending a Game
1. 🛑 Use "Stop Game" to end with preserved results
2. 📋 Export final results before any reset
3. 🔄 Only use "Reset Game" when starting completely fresh

### Emergency Procedures
- **Technical Issues**: Use Pause to halt progress while resolving
- **Safety Concerns**: Use Stop to immediately end the game
- **Data Corruption**: Export data before attempting any fixes

## Security Features

### Reset Protection
The reset function includes multiple safety layers:
1. Initial warning about permanent data loss
2. Second confirmation with team count
3. Text input verification ("RESET GAME")
4. Clear indication of affected teams

### Error Handling
All game control actions include:
- Comprehensive error messages
- Validation of prerequisites
- Rollback on failure
- User feedback for all operations

## Troubleshooting

### Common Issues

**"No teams found to start"**
- Solution: Create teams first in the Teams management section

**"Teams don't have roadmaps configured"**
- Solution: Ensure all teams have valid checkpoint sequences

**"Global settings not found"**
- Solution: Configure game settings before starting

**"No active teams found to pause/resume"**
- Solution: Start the game first, then pause/resume

### Data Recovery
- Export team data regularly through the team details drawer
- All team progress is preserved unless explicitly reset
- Contact technical support for database-level recovery

## API Integration

### Backend Methods Used
- `GameService.startGameFromAdmin()`: Comprehensive game initialization
- `GameService.pauseResumeGame(boolean)`: State management
- `GameService.stopGame()`: Safe game termination
- `GameService.resetGame()`: Complete progress reset

### Real-time Updates
- Game status updates every 10 seconds
- Team progress is monitored in real-time
- Firestore listeners provide instant updates

This game control system provides administrators with powerful tools to manage treasure hunts while maintaining data integrity and providing appropriate safeguards against accidental data loss.

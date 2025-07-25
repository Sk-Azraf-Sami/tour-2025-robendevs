/**
 * TEST SCRIPT: First Checkpoint Fix Verification
 * 
 * This script tests the fix for the first checkpoint issue where teams
 * would get "invalid QR code" error when scanning the correct cp_0 code.
 * 
 * The issue was that isFirstCheckpoint was incorrectly set based on roadmap index
 * instead of checkpoint type (cp_0).
 */

const { GameService } = require('./src/services/GameService');
const { FirestoreService } = require('./src/services/FireStoreService');

async function testFirstCheckpointFix() {
  console.log('🧪 TESTING FIRST CHECKPOINT FIX');
  console.log('================================');

  try {
    // Test scenario: Team with cp_0 at different positions in roadmap
    const testTeam = {
      id: 'test_team_001',
      username: 'TestTeam1',
      roadmap: ['puzzle_456', 'puzzle_123', 'puzzle_789'], // cp_0 is puzzle_123 at index 1
      currentIndex: 1, // Team is at cp_0 (second position in their roadmap)
      isActive: true,
      legs: [
        {
          puzzleId: 'puzzle_456',
          checkpoint: 'cp_2',
          startTime: 1643723400000,
          endTime: 1643723460000,
          isFirstCheckpoint: false,
          mcqPoints: 10,
          puzzlePoints: 20,
          timeBonus: 5
        },
        {
          puzzleId: 'puzzle_123', 
          checkpoint: 'cp_0',
          startTime: 0,
          endTime: 0,
          isFirstCheckpoint: true, // This should be true because checkpoint is cp_0
          mcqPoints: 0,
          puzzlePoints: 0,
          timeBonus: 0
        },
        {
          puzzleId: 'puzzle_789',
          checkpoint: 'cp_1', 
          startTime: 0,
          endTime: 0,
          isFirstCheckpoint: false,
          mcqPoints: 0,
          puzzlePoints: 0,
          timeBonus: 0
        }
      ],
      totalPoints: 35
    };

    const testPuzzle = {
      id: 'puzzle_123',
      checkpoint: 'cp_0',
      code: 'PUZZLE_717316',
      text: 'Starting checkpoint puzzle',
      isStarting: true
    };

    console.log('📋 Test Setup:');
    console.log(`Team roadmap: [${testTeam.roadmap.join(', ')}]`);
    console.log(`Current index: ${testTeam.currentIndex} (should be at cp_0)`);
    console.log(`CP_0 puzzle ID: ${testPuzzle.id}`);
    console.log(`CP_0 QR code: ${testPuzzle.code}`);
    console.log('');

    // Mock FirestoreService for testing
    const originalGetTeam = FirestoreService.getTeam;
    const originalGetPuzzle = FirestoreService.getPuzzle;
    const originalUpdateTeam = FirestoreService.updateTeam;

    FirestoreService.getTeam = async (teamId) => {
      return teamId === 'test_team_001' ? testTeam : null;
    };

    FirestoreService.getPuzzle = async (puzzleId) => {
      return puzzleId === 'puzzle_123' ? testPuzzle : null;
    };

    FirestoreService.updateTeam = async (teamId, updates) => {
      console.log(`📝 Team updated: ${teamId}`);
      console.log('   Updates:', JSON.stringify(updates, null, 2));
      return Promise.resolve();
    };

    // Test 1: Validate correct QR code for cp_0
    console.log('🧪 Test 1: Scanning correct CP_0 QR code');
    console.log('Scanning QR code: PUZZLE_717316 (should be valid for cp_0)');
    
    const result = await GameService.validateQRCode('test_team_001', 'PUZZLE_717316');
    
    console.log('Result:', {
      success: result.success,
      message: result.message,
      hasMCQ: !!result.mcq,
      hasPuzzle: !!result.puzzle
    });

    if (result.success && !result.mcq && result.puzzle) {
      console.log('✅ PASS: First checkpoint correctly skipped MCQ and returned next puzzle');
    } else if (result.success && result.mcq) {
      console.log('❌ FAIL: First checkpoint incorrectly required MCQ');
    } else {
      console.log('❌ FAIL: QR validation failed unexpectedly');
    }

    // Test 2: Validate wrong QR code
    console.log('');
    console.log('🧪 Test 2: Scanning wrong QR code');
    console.log('Scanning QR code: WRONG_CODE_123 (should be invalid)');
    
    const wrongResult = await GameService.validateQRCode('test_team_001', 'WRONG_CODE_123');
    
    console.log('Result:', {
      success: wrongResult.success,
      message: wrongResult.message
    });

    if (!wrongResult.success && wrongResult.message.includes('PUZZLE_717316')) {
      console.log('✅ PASS: Wrong QR code correctly rejected with helpful message');
    } else {
      console.log('❌ FAIL: Wrong QR code handling incorrect');
    }

    // Restore original methods
    FirestoreService.getTeam = originalGetTeam;
    FirestoreService.getPuzzle = originalGetPuzzle;
    FirestoreService.updateTeam = originalUpdateTeam;

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }

  console.log('');
  console.log('🎯 EXPECTED BEHAVIOR:');
  console.log('1. When team scans correct cp_0 QR code, it should:');
  console.log('   - Return success: true');
  console.log('   - NOT return an MCQ (mcq: undefined)');
  console.log('   - Return the puzzle for next checkpoint');
  console.log('   - Update team currentIndex to move to next checkpoint');
  console.log('');
  console.log('2. When team scans wrong QR code, it should:');
  console.log('   - Return success: false');
  console.log('   - Show helpful error message with correct code');
  console.log('');
  console.log('🔧 FIX IMPLEMENTED:');
  console.log('- Changed isFirstCheckpoint logic from "index === 0" to "checkpoint === cp_0"');
  console.log('- This ensures cp_0 is treated as first checkpoint regardless of roadmap position');
  console.log('- Removed incorrect logic that started timing next checkpoint prematurely');
}

// Run the test
testFirstCheckpointFix().catch(console.error);

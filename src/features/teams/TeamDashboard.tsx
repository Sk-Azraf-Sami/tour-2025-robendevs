import { useState, useEffect } from 'react'
import { Card, Button, Progress, Typography, Badge} from 'antd'
import { QrcodeOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons'
import QRScanner from './QRScanner'
import MCQQuestion from './MCQQuestion'
import PuzzleView from './PuzzleView'
import { useAuth } from '../../contexts/auth'
// Import FireStoreService and GameService for backend integration
import { FirestoreService } from '../../services/FireStoreService'
// import { GameService } from '../../services/GameService'
// Import types
import type { Puzzle } from '../../types'
// Import types and constants
// import { GAME_STAGES, POINTS_CONFIG } from './constants'
// import type { TeamProgress as TeamProgressType, MCQ, Puzzle } from '../../types'

const { Title, Text } = Typography

/**
 * Local MCQ interfaces to match component expectations
 */
interface MCQOption {
  id: string
  text: string
  points: number
}

interface MCQ {
  id: string
  text: string
  options: MCQOption[]
}

/**
 * Interface representing team's progress in the game
 * 
 * BACKEND INTEGRATION:
 * This interface should match data coming from Firestore with appropriate types
 * The 'any' types should be replaced with proper interfaces (MCQ, Puzzle)
 */
interface TeamProgress {
  currentCheckpoint: number
  totalCheckpoints: number
  totalPoints: number
  elapsedTime: number
  isGameActive: boolean
  gameStartTime?: number
  currentStage: 'scan' | 'mcq' | 'puzzle' | 'complete'
  currentMCQ?: MCQ  // Using local MCQ type that matches component expectations
  currentPuzzle?: Puzzle  // Using proper Puzzle type from types/index.ts
}

export default function TeamDashboard() {
  const { user } = useAuth()
  /**
   * BACKEND INTEGRATION:
   * 1. Replace this useState with a useEffect that fetches the team data from Firestore
   * 2. Use the team's ID from the auth context to get the specific team document
   * 3. Transform the Firestore data to match the TeamProgress interface
   * 
   * Example:
   * useEffect(() => {
   *   if (!user?.id) return;
   *   
   *   // Set up a real-time listener to the team document
   *   const unsubscribe = FirestoreService.subscribeToTeam(user.id, (teamData) => {
   *     if (!teamData) return;
   *     
   *     // Map Firestore data to local state
   *     setProgress({
   *       currentCheckpoint: teamData.currentIndex + 1,
   *       totalCheckpoints: teamData.roadmap.length,
   *       totalPoints: teamData.totalPoints,
   *       elapsedTime: teamData.totalTime,
   *       isGameActive: teamData.isActive,
   *       currentStage: determineCurrentStage(teamData),
   *       // Fetch current MCQ and puzzle if needed
   *     });
   *   });
   *   
   *   return () => unsubscribe();
   * }, [user]);
   */
  const [progress, setProgress] = useState<TeamProgress>({
    currentCheckpoint: 1,
    totalCheckpoints: 5,
    totalPoints: 0,
    elapsedTime: 0,
    isGameActive: true,
    currentStage: 'scan'
  })
  const [showScanner, setShowScanner] = useState(false)

  // Real-time timer that syncs with Firebase gameStartTime
  useEffect(() => {
    if (!progress.isGameActive) return
    
    const updateElapsedTime = () => {
      setProgress(prev => {
        // Calculate elapsed time from gameStartTime if available
        if (prev.gameStartTime) {
          const currentTime = Date.now();
          const elapsedTime = Math.floor((currentTime - prev.gameStartTime) / 1000);
          return {
            ...prev,
            elapsedTime,
          };
        }
        // Fallback to incrementing local time if no gameStartTime
        return {
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        };
      });
    };

    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [progress.isGameActive, progress.gameStartTime]);

  // Real-time listener for team status changes (admin start/pause/resume actions)
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = FirestoreService.subscribeToTeam(user.id, (team) => {
      if (!team) return;
      
      // Update game state based on real-time team data
      setProgress((prev) => {
        const currentTime = Date.now();
        const hasStatusChanged = prev.isGameActive !== team.isActive;
        const hasGameStartTimeChanged = prev.gameStartTime !== team.gameStartTime;
        
        if (hasStatusChanged || hasGameStartTimeChanged) {
          console.log(`TeamDashboard: Game status changed: ${prev.isGameActive} -> ${team.isActive}`);
          console.log(`TeamDashboard: Game start time: ${prev.gameStartTime} -> ${team.gameStartTime}`);
          
          // Calculate real-time elapsed time from gameStartTime
          const elapsedTime = team.gameStartTime 
            ? Math.floor((currentTime - team.gameStartTime) / 1000)
            : 0;
          
          return {
            ...prev,
            isGameActive: team.isActive,
            gameStartTime: team.gameStartTime,
            elapsedTime,
            // Also sync other important fields that might have changed
            totalPoints: team.totalPoints,
            currentCheckpoint: team.currentIndex + 1,
          };
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQRScanned = (qrData: string) => {
    /**
     * BACKEND INTEGRATION:
     * This function should:
     * 1. Verify the QR code against the team's current checkpoint
     * 2. Get the corresponding MCQ for this checkpoint
     * 3. Update the team's progress in Firestore
     * 
     * Example:
     * async function verifyQRAndProceed(qrCode: string) {
     *   if (!user?.id) return;
     *   
     *   try {
     *     // Verify QR code and fetch MCQ
     *     const result = await GameService.verifyCheckpointQR(user.id, qrCode);
     *     
     *     if (result.success) {
     *       // If valid, update team document and proceed to MCQ
     *       setProgress(prev => ({ ...prev, currentStage: 'mcq', currentMCQ: result.mcq }));
     *     } else {
     *       // Show error message
     *       message.error(result.message || 'Invalid QR code');
     *     }
     *   } catch (error) {
     *     console.error('Error verifying QR:', error);
     *     message.error('An error occurred while verifying the QR code');
     *   }
     * }
     * 
     * verifyQRAndProceed(qrData);
     */
    
    // Handle QR scan logic here
    console.log('QR Scanned:', qrData)
    setShowScanner(false)
    setProgress(prev => ({ ...prev, currentStage: 'mcq' }))
  }

  const handleMCQSubmit = (answer: { optionId: string; points: number }) => {
    /**
     * BACKEND INTEGRATION:
     * This function should:
     * 1. Submit the MCQ answer to the backend
     * 2. Calculate points based on answer
     * 3. Update the team's points in Firestore
     * 4. Fetch the puzzle for the current checkpoint
     * 
     * Example:
     * async function submitMCQAnswer(mcqAnswer: { optionId: string; points: number }) {
     *   if (!user?.id) return;
     *   
     *   try {
     *     // Submit answer and get next puzzle
     *     const result = await GameService.submitMCQAnswer(
     *       user.id, 
     *       progress.currentMCQ?.id, 
     *       mcqAnswer.optionId
     *     );
     *     
     *     if (result.success) {
     *       // Update local state with new points and move to puzzle stage
     *       setProgress(prev => ({ 
     *         ...prev, 
     *         currentStage: 'puzzle',
     *         totalPoints: prev.totalPoints + mcqAnswer.points,
     *         currentPuzzle: result.puzzle
     *       }));
     *     } else {
     *       message.error(result.message || 'Failed to submit answer');
     *     }
     *   } catch (error) {
     *     console.error('Error submitting MCQ answer:', error);
     *     message.error('An error occurred while submitting your answer');
     *   }
     * }
     * 
     * submitMCQAnswer(answer);
     */
    
    // Handle MCQ submission
    console.log('MCQ Answer:', answer)
    setProgress(prev => ({ 
      ...prev, 
      currentStage: 'puzzle',
      totalPoints: prev.totalPoints + (answer.points || 0)
    }))
  }

  const handlePuzzleComplete = () => {
    /**
     * BACKEND INTEGRATION:
     * This function should:
     * 1. Mark the current checkpoint as completed in Firestore
     * 2. Update the team's currentIndex to move to the next checkpoint
     * 3. If all checkpoints are complete, mark the team as finished
     * 
     * Example:
     * async function completeCheckpoint() {
     *   if (!user?.id) return;
     *   
     *   try {
     *     // Complete current checkpoint and prepare for next
     *     const result = await GameService.completeCheckpoint(user.id);
     *     
     *     if (result.isGameComplete) {
     *       // Game is finished
     *       setProgress(prev => ({ 
     *         ...prev, 
     *         currentStage: 'complete',
     *         isGameActive: false
     *       }));
     *     } else {
     *       // Move to next checkpoint
     *       setProgress(prev => ({ 
     *         ...prev, 
     *         currentCheckpoint: prev.currentCheckpoint + 1,
     *         currentStage: 'scan'
     *       }));
     *     }
     *   } catch (error) {
     *     console.error('Error completing checkpoint:', error);
     *     message.error('An error occurred while updating your progress');
     *   }
     * }
     * 
     * completeCheckpoint();
     */
    
    // Move to next checkpoint
    const nextCheckpoint = progress.currentCheckpoint + 1
    if (nextCheckpoint > progress.totalCheckpoints) {
      setProgress(prev => ({ 
        ...prev, 
        currentStage: 'complete',
        isGameActive: false
      }))
    } else {
      setProgress(prev => ({ 
        ...prev, 
        currentCheckpoint: nextCheckpoint,
        currentStage: 'scan'
      }))
    }
  }

  if (progress.currentStage === 'complete') {
    /**
     * BACKEND INTEGRATION:
     * For the completion screen:
     * 1. Display final stats from Firestore data
     * 2. Possibly send a completion notification to admins
     * 3. Consider adding a leaderboard or final ranking
     */
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <div className="mb-6">
            <TrophyOutlined className="text-6xl text-yellow-500 mb-4" />
            <Title level={2} className="text-green-600">Congratulations!</Title>
            <Text className="text-lg">You've completed the treasure hunt!</Text>
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <Text strong>Total Time:</Text>
              <Text>{formatTime(progress.elapsedTime)}</Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Total Points:</Text>
              <Text className="text-green-600 font-bold">{progress.totalPoints}</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <Title level={4} className="mb-0">Team Dashboard</Title>
            <Text className="text-gray-600">Welcome, {user?.name}</Text>
          </div>
          <Badge 
            count={`${progress.currentCheckpoint}/${progress.totalCheckpoints}`} 
            style={{ backgroundColor: '#1890ff' }} 
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Progress Card */}
        <Card className="shadow-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Text strong>Checkpoint Progress</Text>
              <Text className="text-blue-600">
                {progress.currentCheckpoint} of {progress.totalCheckpoints}
              </Text>
            </div>
            <Progress 
              percent={(progress.currentCheckpoint / progress.totalCheckpoints) * 100} 
              strokeColor="#1890ff"
              className="mb-0"
            />
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ClockCircleOutlined className="text-blue-500 mr-2" />
                <Text strong>Time</Text>
              </div>
              <Text className="text-lg font-mono">{formatTime(progress.elapsedTime)}</Text>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrophyOutlined className="text-yellow-500 mr-2" />
                <Text strong>Points</Text>
              </div>
              <Text className="text-lg font-bold text-green-600">{progress.totalPoints}</Text>
            </div>
          </div>
        </Card>

        {/* Main Action Card */}
        <Card className="shadow-lg">
          {progress.currentStage === 'scan' && (
            <div className="text-center space-y-4">
              <QrcodeOutlined className="text-6xl text-blue-500 mb-4" />
              <Title level={3}>Checkpoint {progress.currentCheckpoint}</Title>
              <Text className="text-gray-600 block mb-4">
                Scan the QR code at your current location to proceed
              </Text>
              <Button 
                type="primary" 
                size="large" 
                icon={<QrcodeOutlined />}
                onClick={() => setShowScanner(true)}
                className="w-full"
              >
                Scan QR Code
              </Button>
            </div>
          )}

          {progress.currentStage === 'mcq' && (
            /**
             * BACKEND INTEGRATION:
             * 1. The currentMCQ prop should be fetched from Firestore
             * 2. Structure should match the MCQQuestionProps interface
             */
            <MCQQuestion 
              question={progress.currentMCQ}
              onSubmit={handleMCQSubmit}
            />
          )}

          {progress.currentStage === 'puzzle' && (
            /**
             * BACKEND INTEGRATION:
             * 1. The currentPuzzle prop should be fetched from Firestore
             * 2. Structure should match the PuzzleViewProps interface 
             */
            <PuzzleView 
              puzzle={progress.currentPuzzle}
              onProceedToScan={handlePuzzleComplete}
            />
          )}
        </Card>

        {/* Help Card */}
        <Card size="small" className="bg-blue-50 border-blue-200">
          <Text className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Look for QR codes near landmarks, signs, or designated checkpoint areas.
          </Text>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        /**
         * BACKEND INTEGRATION:
         * The QR scanner component should be connected to actual camera
         * functionality with proper error handling for device permissions
         * Consider using a library like 'react-qr-reader' for production
         */
        <QRScanner 
          onScan={handleQRScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
/**
 * TEAM GAME FLOW - ALIGNED WITH UPDATED PRD REQUIREMENTS
 * =====================================================
 * 
 * This component implements the new roadmap-based treasure hunt system where:
 * 
 * 1. ROADMAP PROGRESSION:
 *    - Each team gets a unique checkpoint roadmap (different order of same checkpoints)
 *    - roadmap[] = array of checkpoint IDs in unique order for each team
 *    - currentIndex = tracks which checkpoint the team is currently on
 *    - Example: roadmap = [cp0, cp5, cp2, cp7, cp1], currentIndex = 1 means cp5 is current
 * 
 * 2. STEP-BY-STEP FLOW:
 *    a) Team scans QR code → System validates if code matches roadmap[currentIndex]
 *    b) If valid → Show MCQ for that checkpoint
 *    c) Team submits answer → Backend calculates points (MCQ points + time bonus/penalty)
 *    d) Save progress → Increment currentIndex → Show puzzle for NEXT checkpoint
 *    e) Puzzle gives clues to find roadmap[currentIndex] location
 * 
 * 3. KEY VALIDATION RULES:
 *    - QR codes only work if they match the team's expected checkpoint
 *    - All teams visit ALL checkpoints but in different orders
 *    - Puzzle at checkpoint N hints toward location of checkpoint N+1
 *    - First checkpoint (cp0) is same for all teams
 * 
 * 4. BACKEND INTEGRATION POINTS:
 *    - GameService.getTeamProgress(teamId) → get roadmap, currentIndex, points
 *    - GameService.validateQRCode(teamId, qrCode) → check if code matches current checkpoint
 *    - GameService.submitMCQAnswer(teamId, qrCode, answer) → save progress, get next puzzle
 *    - GameService.getNextPuzzle(teamId) → get puzzle for roadmap[currentIndex]
 * 
 * 5. DUMMY IMPLEMENTATIONS:
 *    - All GameService calls are currently mocked with dummy data
 *    - Real backend integration should replace these mock implementations
 *    - QR scanner uses mock buttons for development (replace with actual camera)
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Typography, Progress, Alert, message, Spin } from 'antd'
import { 
  QrcodeOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined
} from '@ant-design/icons'
import QRScanner from './QRScanner'
import MCQQuestion from './MCQQuestion'
import PuzzleView from './PuzzleView'
// import TeamRoadmapStatus from './TeamRoadmapStatus'
// import { GameService } from '../../services/GameService'

const { Title, Text } = Typography

// Types for the game state management
interface MCQData {
  id: string
  text: string
  options: Array<{
    id: string
    text: string
    points: number
  }>
}

interface PuzzleData {
  id: string
  text: string
  imageURL?: string
  hint?: string
}

interface TeamGameState {
  currentStage: 'loading' | 'scan' | 'mcq' | 'puzzle' | 'complete'
  currentCheckpointIndex: number
  totalCheckpoints: number
  totalPoints: number
  elapsedTime: number
  isGameActive: boolean
  roadmap: string[] // Array of checkpoint IDs in order for this team
  currentMCQ?: MCQData
  currentPuzzle?: PuzzleData
  scannedCode?: string
}

export default function TeamGameFlow() {
  // Remove unused user for now
  // const { user } = useAuth()
  const [gameState, setGameState] = useState<TeamGameState>({
    currentStage: 'loading',
    currentCheckpointIndex: 0,
    totalCheckpoints: 8, // TODO: Get from backend settings
    totalPoints: 0,
    elapsedTime: 0,
    isGameActive: true,
    roadmap: [], // TODO: Fetch from backend team data
  })
  const [showScanner, setShowScanner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScannedData, setLastScannedData] = useState<string | null>(null)

  // DUMMY DATA - Replace with actual backend calls
  const mockMCQ = {
    id: 'mcq-1',
    text: 'What year was this landmark established?',
    options: [
      { id: 'a', text: '1885', points: 5 },
      { id: 'b', text: '1892', points: 10 },
      { id: 'c', text: '1901', points: 0 },
      { id: 'd', text: '1875', points: 2 },
    ]
  }
  const mockPuzzle = {
    id: 'puzzle-1',
    text: 'Where shadows dance with morning light, and ancient wisdom meets the sight. Look for the guardian made of stone, where knowledge seekers are never alone.',
    imageURL: 'https://via.placeholder.com/400x300?text=Library+Entrance',
    hint: 'This place is filled with books and learning. Look for the stone statue at the entrance.'
  }

  // Timer effect for elapsed time
  useEffect(() => {
    if (!gameState.isGameActive) return
    
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.isGameActive])

  // Initialize game state on mount
  const initializeGameState = useCallback(async () => {
    try {
      // TODO: Replace with actual backend calls
      // const teamData = await GameService.getTeamProgress(user.id)
      // const currentPuzzle = await GameService.getNextPuzzle(user.id)
      
      // For now, use mock data
      const mockRoadmap = ['cp1', 'cp3', 'cp5', 'cp2', 'cp7', 'cp4', 'cp6', 'cp8']
      setGameState(prev => ({
        ...prev,
        currentStage: 'scan',
        roadmap: mockRoadmap,
        currentCheckpointIndex: 2, // Simulate being on checkpoint 3
        totalPoints: 45, // Simulate some points earned
        elapsedTime: 1800, // Simulate 30 minutes elapsed
      }))
    } catch (error) {
      console.error('Failed to initialize game state:', error)
      message.error('Failed to load game state. Please try again.')
    }
  }, [])

  useEffect(() => {
    initializeGameState()
  }, [initializeGameState])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQRScanned = async (qrCode: string) => {
    setIsProcessing(true)
    setShowScanner(false)
    
    try {
      // TODO: Replace with actual backend validation
      // This should call: GameService.validateQRCode(teamId, qrCode)
      // Backend logic:
      // 1. Get team's roadmap and currentIndex
      // 2. Check if qrCode matches the checkpoint at roadmap[currentIndex] 
      // 3. Return success/failure with appropriate message
      
      // MOCK VALIDATION LOGIC (replace with backend call)
      const expectedCheckpointId = gameState.roadmap[gameState.currentCheckpointIndex]
      const validCodes = [`${expectedCheckpointId}-QR-CODE`, 'VALID-CODE-123'] // Mock valid codes
      
      if (validCodes.includes(qrCode.toUpperCase())) {
        message.success('QR Code verified! Proceeding to question.')
        
        // TODO: Backend should return the MCQ for this checkpoint
        // const mcq = await GameService.getMCQForCheckpoint(expectedCheckpointId)
        setGameState(prev => ({
          ...prev,
          currentStage: 'mcq',
          currentMCQ: mockMCQ, // Replace with actual MCQ from backend
          scannedCode: qrCode
        }))
      } else {
        // This enforces the roadmap system - only correct checkpoint QR codes work
        message.error(`Invalid QR code for your current checkpoint. You need to find checkpoint ${expectedCheckpointId}.`)
      }
    } catch (error) {
      console.error('QR validation failed:', error)
      message.error('Failed to validate QR code. Please try again.')
    }
    
    setIsProcessing(false)
  }

  const handleMCQSubmit = async (answer: { optionId: string; points: number }) => {
    setIsProcessing(true)
    
    try {
      // TODO: Replace with actual backend submission
      // This should call: GameService.submitMCQAnswer(teamId, scannedCode, answer.optionId)
      // Backend logic:
      // 1. Validate that the MCQ answer belongs to the current checkpoint
      // 2. Calculate points: MCQ points + time bonus/penalty
      // 3. Save leg progress with: checkpointId, startTime, endTime, mcqPoints, timeBonus
      // 4. Update team: increment currentIndex, add total points/time
      // 5. Return puzzle for NEXT checkpoint (roadmap[currentIndex + 1])
      
      // MOCK SUBMISSION LOGIC (replace with backend call)
      message.success(`Correct! You earned ${answer.points} points.`)
      
      // This simulates the backend incrementing currentIndex and returning next puzzle
      const nextCheckpointIndex = gameState.currentCheckpointIndex + 1
      
      setGameState(prev => ({
        ...prev,
        currentStage: 'puzzle',
        totalPoints: prev.totalPoints + answer.points,
        currentPuzzle: mockPuzzle, // TODO: Replace with puzzle for roadmap[nextCheckpointIndex]
        currentCheckpointIndex: nextCheckpointIndex // This happens in backend, but simulated here
      }))
    } catch (error) {
      console.error('MCQ submission failed:', error)
      message.error('Failed to submit answer. Please try again.')
    }
    
    setIsProcessing(false)
  }

  const handlePuzzleRead = () => {
    // User has read the puzzle and is ready to find the next location
    // The puzzle contains clues to find roadmap[currentCheckpointIndex] 
    // (which was updated in handleMCQSubmit)
    
    // Check if game is complete
    if (gameState.currentCheckpointIndex >= gameState.totalCheckpoints) {
      setGameState(prev => ({
        ...prev,
        currentStage: 'complete',
        isGameActive: false
      }))
      message.success('Congratulations! You have completed the treasure hunt!')
      return
    }
    
    // Move to scan stage for the NEXT checkpoint
    setGameState(prev => ({
      ...prev,
      currentStage: 'scan',
      currentMCQ: undefined,
      currentPuzzle: undefined,
      scannedCode: undefined
    }))
    
    message.info(`Now find the location described in the puzzle and scan the QR code for checkpoint ${gameState.currentCheckpointIndex + 1}!`)
  }

  const getProgressPercentage = () => {
    return (gameState.currentCheckpointIndex / gameState.totalCheckpoints) * 100
  }

  const getCurrentCheckpointNumber = () => {
    return gameState.currentCheckpointIndex + 1
  }

  if (gameState.currentStage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <Spin size="large" />
          <Title level={4} className="mt-4">Loading Game State...</Title>
          <Text type="secondary">Please wait while we load your progress</Text>
        </Card>
      </div>
    )
  }

  if (gameState.currentStage === 'complete') {
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
              <Text>{formatTime(gameState.elapsedTime)}</Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Total Points:</Text>
              <Text className="text-green-600 font-bold">{gameState.totalPoints}</Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Checkpoints:</Text>
              <Text>{gameState.totalCheckpoints}/{gameState.totalCheckpoints}</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Progress */}
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
          Checkpoint {getCurrentCheckpointNumber()} of {gameState.totalCheckpoints}
        </Title>
        <Text type="secondary" className="text-sm sm:text-base">Follow the roadmap to complete your treasure hunt</Text>
      </div>

      {/* Progress Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 mx-2 sm:mx-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <Text strong className="text-sm sm:text-base">Overall Progress</Text>
            <Text type="secondary" className="text-xs sm:text-sm">{Math.round(getProgressPercentage())}% Complete</Text>
          </div>
          <Progress percent={getProgressPercentage()} strokeColor="#4f46e5" />
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-1">
                <ClockCircleOutlined className="text-blue-500 mr-1 text-sm sm:text-base" />
                <Text strong className="text-xs sm:text-sm">Time</Text>
              </div>
              <Text className="text-sm sm:text-base font-mono">{formatTime(gameState.elapsedTime)}</Text>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1">
                <TrophyOutlined className="text-yellow-500 mr-1 text-sm sm:text-base" />
                <Text strong className="text-xs sm:text-sm">Points</Text>
              </div>
              <Text className="text-sm sm:text-base font-bold text-green-600">{gameState.totalPoints}</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Stage-specific Content */}
      {gameState.currentStage === 'scan' && (
        <Card className="mx-2 sm:mx-0">
          <div className="text-center space-y-4">
            <QrcodeOutlined className="text-6xl text-blue-500 mb-4" />
            <Title level={3} className="text-base sm:text-lg">Scan QR Code</Title>
            <Text className="text-gray-600 block mb-4 text-sm sm:text-base">
              Find and scan the QR code at your current checkpoint location
            </Text>
            
            <Alert
              message="🗺️ Roadmap System - How It Works"
              description={
                <div className="text-left space-y-2">
                  <p><strong>Your Unique Route:</strong> Your team follows a personalized path through {gameState.totalCheckpoints} checkpoints. Other teams visit the same locations but in different orders.</p>
                  <p><strong>Current Target:</strong> You are looking for checkpoint {getCurrentCheckpointNumber()} of {gameState.totalCheckpoints}. Only the QR code for THIS specific checkpoint will work.</p>
                  <p><strong>The Flow:</strong> Scan QR → Answer MCQ → Get Puzzle → Find Next Location → Repeat</p>
                  <p><strong>Scoring:</strong> Earn points from correct answers plus time bonuses for speed!</p>
                </div>
              }
              type="info"
              showIcon
              className="mb-4 text-left text-sm sm:text-base"
            />
            
            <Button 
              type="primary" 
              size="large" 
              icon={<QrcodeOutlined />}
              onClick={() => setShowScanner(true)}
              className="w-full"
              loading={isProcessing}
            >
              Scan QR Code for Checkpoint {getCurrentCheckpointNumber()}
            </Button>
          </div>
        </Card>
      )}

      {gameState.currentStage === 'mcq' && gameState.currentMCQ && (
        <div className="mx-2 sm:mx-0">
          <MCQQuestion 
            question={gameState.currentMCQ}
            onSubmit={handleMCQSubmit}
          />
        </div>
      )}

      {gameState.currentStage === 'puzzle' && gameState.currentPuzzle && (
        <div className="mx-2 sm:mx-0">
          <PuzzleView 
            puzzle={gameState.currentPuzzle}
            onProceedToScan={handlePuzzleRead}
          />
        </div>
      )}

      {/* Help Card */}
      <Card size="small" className="bg-blue-50 border-blue-200 mx-2 sm:mx-0">
        <div className="space-y-2">
          <Text className="text-sm text-blue-700 font-semibold block">
            🎯 Remember: Each checkpoint follows the same pattern
          </Text>
          <div className="text-xs text-blue-600 space-y-1">
            <div>1️⃣ <strong>Scan QR</strong> → Validate you're at the right checkpoint</div>
            <div>2️⃣ <strong>Answer MCQ</strong> → Earn points based on correctness + speed</div>
            <div>3️⃣ <strong>Get Puzzle</strong> → Receive clues to find your NEXT checkpoint</div>
            <div>4️⃣ <strong>Find Location</strong> → Use puzzle clues to locate the next QR code</div>
          </div>
          <Text className="text-xs text-blue-600 block mt-2">
            💡 <strong>Pro Tip:</strong> The puzzle you get after answering an MCQ always leads to your next checkpoint location. Each team has a different route!
          </Text>
        </div>
      </Card>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={(decodedText) => {
            setShowScanner(false);
            setLastScannedData(decodedText);
            handleQRScanned(decodedText);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Show scanned QR code data to user after scan */}
      {lastScannedData && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            maxWidth: 320,
            background: 'white',
            border: '2px solid #22c55e',
            borderRadius: 8,
            boxShadow: '0 4px 24px 0 rgba(34,197,94,0.15)',
            animation: 'fade-in 0.3s',
            padding: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: '#15803d' }}>Scanned QR Code</span>
            <button
              onClick={() => setLastScannedData(null)}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
              aria-label="Close"
            >✖</button>
          </div>
          <div style={{ wordBreak: 'break-all', color: '#1e293b', fontSize: 14, padding: 4 }}>
            {lastScannedData}
          </div>
        </div>
      )}
    </div>
  )
}

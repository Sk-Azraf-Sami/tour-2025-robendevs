import { useState, useEffect } from 'react'
import { Card, Button, Progress, Typography, Badge} from 'antd'
import { QrcodeOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons'
import QRScanner from './QRScanner'
import MCQQuestion from './MCQQuestion'
import PuzzleView from './PuzzleView'
import { useAuth } from '../../contexts/auth'

const { Title, Text } = Typography

interface TeamProgress {
  currentCheckpoint: number
  totalCheckpoints: number
  totalPoints: number
  elapsedTime: number
  isGameActive: boolean
  currentStage: 'scan' | 'mcq' | 'puzzle' | 'complete'
  currentMCQ?: any
  currentPuzzle?: any
}

export default function TeamDashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<TeamProgress>({
    currentCheckpoint: 1,
    totalCheckpoints: 5,
    totalPoints: 0,
    elapsedTime: 0,
    isGameActive: true,
    currentStage: 'scan'
  })
  const [showScanner, setShowScanner] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!progress.isGameActive) return
    
    const interval = setInterval(() => {
      setProgress(prev => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [progress.isGameActive])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQRScanned = (qrData: string) => {
    // Handle QR scan logic here
    console.log('QR Scanned:', qrData)
    setShowScanner(false)
    setProgress(prev => ({ ...prev, currentStage: 'mcq' }))
  }

  const handleMCQSubmit = (answer: any) => {
    // Handle MCQ submission
    console.log('MCQ Answer:', answer)
    setProgress(prev => ({ 
      ...prev, 
      currentStage: 'puzzle',
      totalPoints: prev.totalPoints + (answer.points || 0)
    }))
  }

  const handlePuzzleComplete = () => {
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
            <MCQQuestion 
              question={progress.currentMCQ}
              onSubmit={handleMCQSubmit}
            />
          )}

          {progress.currentStage === 'puzzle' && (
            <PuzzleView 
              puzzle={progress.currentPuzzle}
              onComplete={handlePuzzleComplete}
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
        <QRScanner 
          onScan={handleQRScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
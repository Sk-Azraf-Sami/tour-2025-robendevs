import { Card, Typography, Badge, Progress, Tooltip } from 'antd'
import { 
  CheckCircleOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface CheckpointStatus {
  id: string
  name: string
  status: 'completed' | 'current' | 'upcoming'
  points?: number
  timeSpent?: number // in minutes
  mcqCorrect?: boolean
}

interface TeamRoadmapStatusProps {
  roadmap: CheckpointStatus[]
  currentIndex: number
  totalPoints: number
  totalTimeElapsed: number // in seconds
}

export default function TeamRoadmapStatus({ 
  roadmap, 
  currentIndex, 
  totalPoints, 
  totalTimeElapsed 
}: TeamRoadmapStatusProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return roadmap.length > 0 ? (currentIndex / roadmap.length) * 100 : 0
  }

  const completedCheckpoints = roadmap.filter(cp => cp.status === 'completed').length

  return (
    <div className="space-y-4">
      {/* Overall Progress Summary */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="text-center mb-4">
          <Title level={4} className="!mb-2">Your Unique Roadmap</Title>
          <Text type="secondary" className="text-sm">
            Each team follows a different route through the same checkpoints
          </Text>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text strong>Progress</Text>
            <Text type="secondary">
              {completedCheckpoints} of {roadmap.length} completed
            </Text>
          </div>
          <Progress 
            percent={getProgressPercentage()} 
            strokeColor="#4f46e5"
            format={() => `${Math.round(getProgressPercentage())}%`}
          />
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ClockCircleOutlined className="text-blue-500 mr-1" />
                <Text strong className="text-sm">Total Time</Text>
              </div>
              <Text className="font-mono">{formatTime(totalTimeElapsed)}</Text>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrophyOutlined className="text-yellow-500 mr-1" />
                <Text strong className="text-sm">Points</Text>
              </div>
              <Text className="font-bold text-green-600">{totalPoints}</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Roadmap Visualization */}
      <Card title="Your Checkpoint Roadmap">
        <div className="space-y-3">
          <Text type="secondary" className="text-sm">
            ✨ This is your team's unique route. Other teams will visit the same checkpoints in different orders.
          </Text>
          
          <div className="space-y-2">
            {roadmap.map((checkpoint, index) => (
              <div
                key={checkpoint.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  checkpoint.status === 'completed' 
                    ? 'bg-green-50 border-green-200'
                    : checkpoint.status === 'current'
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkpoint Number */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${checkpoint.status === 'completed' 
                      ? 'bg-green-500 text-white'
                      : checkpoint.status === 'current'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {index + 1}
                  </div>
                  
                  {/* Checkpoint Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Text strong className="text-sm">
                        Checkpoint {checkpoint.name || checkpoint.id}
                      </Text>
                      {checkpoint.status === 'completed' && (
                        <CheckCircleOutlined className="text-green-500" />
                      )}
                      {checkpoint.status === 'current' && (
                        <EnvironmentOutlined className="text-blue-500" />
                      )}
                    </div>
                    
                    {checkpoint.status === 'completed' && (
                      <div className="flex items-center gap-3 mt-1">
                        {checkpoint.points && (
                          <Tooltip title="Points earned at this checkpoint">
                            <div className="flex items-center gap-1">
                              <StarOutlined className="text-yellow-500 text-xs" />
                              <Text className="text-xs text-gray-600">
                                {checkpoint.points} pts
                              </Text>
                            </div>
                          </Tooltip>
                        )}
                        {checkpoint.timeSpent && (
                          <Tooltip title="Time spent at this checkpoint">
                            <div className="flex items-center gap-1">
                              <ClockCircleOutlined className="text-blue-500 text-xs" />
                              <Text className="text-xs text-gray-600">
                                {checkpoint.timeSpent}min
                              </Text>
                            </div>
                          </Tooltip>
                        )}
                        {checkpoint.mcqCorrect !== undefined && (
                          <Badge 
                            status={checkpoint.mcqCorrect ? "success" : "warning"} 
                            text={
                              <Text className="text-xs">
                                MCQ {checkpoint.mcqCorrect ? "Correct" : "Incorrect"}
                              </Text>
                            }
                          />
                        )}
                      </div>
                    )}
                    
                    {checkpoint.status === 'current' && (
                      <Text className="text-xs text-blue-600 font-medium">
                        📍 Current checkpoint - Find the QR code!
                      </Text>
                    )}
                    
                    {checkpoint.status === 'upcoming' && (
                      <Text className="text-xs text-gray-500">
                        🔒 Complete previous checkpoints to unlock
                      </Text>
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div>
                  {checkpoint.status === 'completed' && (
                    <Badge status="success" text="Done" />
                  )}
                  {checkpoint.status === 'current' && (
                    <Badge status="processing" text="Active" />
                  )}
                  {checkpoint.status === 'upcoming' && (
                    <Badge status="default" text="Upcoming" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

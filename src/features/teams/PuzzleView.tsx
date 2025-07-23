import { useState } from 'react'
import { Card, Button, Typography, Image, Alert, message } from 'antd'
import { BulbOutlined, ArrowRightOutlined, EyeOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface PuzzleData {
  id: string
  text: string
  imageURL?: string
  code: string
  nextLocation: string
  hint: string
}

interface PuzzleViewProps {
  puzzle: PuzzleData
  onComplete: () => void
}

export default function PuzzleView({ puzzle, onComplete }: PuzzleViewProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Hardcoded puzzleData for simulation/demo purposes
  const puzzleData: PuzzleData = {
    id: '1',
    text: 'Find the statue of the famous explorer who discovered this land. Look for the bronze plaque at its base. Count the number of words on the plaque and multiply by the number of stars on the explorer\'s hat.',
    imageURL: 'https://via.placeholder.com/400x300?text=Explorer+Statue',
    code: 'EXPLORER_STATUE_001',
    nextLocation: 'Central Library - Reference Section',
    hint: 'The explorer is facing east, towards the rising sun.',
  }

  // Use the prop if provided, otherwise fall back to the hardcoded puzzleData
  const data = puzzle ?? puzzleData

  const handleMarkComplete = () => {
    setIsCompleted(true)
    message.success('Puzzle Completed! Great work! You can now proceed to the next checkpoint.')
    if (onComplete) onComplete()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Puzzle Challenge</Title>
        <Text type="secondary" className="text-sm sm:text-base">Solve the puzzle to get your next checkpoint location</Text>
      </div>

      {/* Puzzle Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <BulbOutlined className="text-purple-600 text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Puzzle #{data.id}</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Read carefully and explore your surroundings</Text>
        
        <div className="space-y-3 sm:space-y-4">
          {data.imageURL && (
            <div className="flex justify-center">
              <Image
                src={data.imageURL}
                alt="Puzzle clue image"
                width="100%"
                height="auto"
                style={{ maxWidth: '400px', maxHeight: '300px' }}
                className="rounded-lg border shadow-sm"
                preview={{
                  mask: (
                    <div className="text-white text-sm sm:text-base">
                      <EyeOutlined /> View Image
                    </div>
                  )
                }}
              />
            </div>
          )}

          <Card size="small" className="bg-white border">
            <Paragraph className="text-sm sm:text-base leading-relaxed mb-0">
              {data.text}
            </Paragraph>
          </Card>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Text strong className="text-sm sm:text-base">Code:</Text>
            <Text code className="text-xs sm:text-sm break-all">{data.code}</Text>
          </div>
        </div>
      </Card>

      {/* Hint Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">💡 Hint</Title>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Need a little help? Here's a clue to get you started</Text>
        
        {!showHint ? (
          <Button
            type="dashed"
            icon={<BulbOutlined />}
            onClick={() => setShowHint(true)}
            className="w-full h-12 sm:h-auto text-sm sm:text-base"
            size="large"
          >
            Show Hint
          </Button>
        ) : (
          <Alert
            message="Hint"
            description={data.hint}
            type="warning"
            showIcon
            icon={<BulbOutlined />}
            className="text-sm sm:text-base"
          />
        )}
      </Card>

      {/* Action Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">Complete the Puzzle</Title>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Once you've solved the puzzle and found the answer, mark it as complete</Text>
        
        <div className="space-y-3 sm:space-y-4">
          {!isCompleted ? (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleMarkComplete} 
              className="w-full h-12 sm:h-auto text-sm sm:text-base"
              icon={<CheckCircleOutlined />}
            >
              Mark as Completed
            </Button>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <Alert
                message="Puzzle Completed!"
                description="Well done! Here's your next destination:"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                className="text-sm sm:text-base"
              />

              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <div className="flex items-start sm:items-center gap-3">
                  <EnvironmentOutlined className="text-indigo-600 text-lg sm:text-xl flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <Text strong className="text-indigo-900 text-sm sm:text-base block">Next Checkpoint</Text>
                    <Text className="text-indigo-700 text-sm sm:text-base break-words">{data.nextLocation}</Text>
                  </div>
                </div>
              </Card>

              <Button 
                type="primary" 
                size="large" 
                onClick={onComplete} 
                className="w-full h-12 sm:h-auto text-sm sm:text-base"
                icon={<ArrowRightOutlined />}
              >
                Continue to Next Checkpoint
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Instructions Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">How to Solve</Title>
        <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-gray-600 mt-3 sm:mt-4 pl-4">
          <li>• Read the puzzle description carefully</li>
          <li>• Use the image as a visual clue</li>
          <li>• Explore the area mentioned in the puzzle</li>
          <li>• Look for physical objects, signs, or landmarks</li>
          <li>• The hint can help if you're stuck</li>
          <li>• Mark complete only when you're confident in your solution</li>
        </ul>
      </Card>
    </div>
  )
}
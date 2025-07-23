import { useState } from 'react'
import { Card, Button, Typography, Image, Alert, message } from 'antd'
import { BulbOutlined, ArrowRightOutlined, EyeOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography

interface PuzzleData {
  id: string
  text: string
  imageURL?: string
  code: string
  nextLocation: string
  hint: string
}

export default function PuzzlePage() {
  const navigate = useNavigate()
  const [isCompleted, setIsCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const puzzleData: PuzzleData = {
    id: '1',
    text: 'Find the statue of the famous explorer who discovered this land. Look for the bronze plaque at its base. Count the number of words on the plaque and multiply by the number of stars on the explorer\'s hat.',
    imageURL: 'https://via.placeholder.com/400x300?text=Explorer+Statue',
    code: 'EXPLORER_STATUE_001',
    nextLocation: 'Central Library - Reference Section',
    hint: 'The explorer is facing east, towards the rising sun.',
  }

  const handleMarkComplete = () => {
    setIsCompleted(true)
    message.success('Puzzle Completed! Great work! You can now proceed to the next checkpoint.')
  }

  const handleNextCheckpoint = () => {
    navigate('/team/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2}>Puzzle Challenge</Title>
        <Text type="secondary">Solve the puzzle to get your next checkpoint location</Text>
      </div>

      {/* Puzzle Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2 mb-4">
          <BulbOutlined className="text-purple-600" />
          <Title level={4} className="!mb-0">Puzzle #{puzzleData.id}</Title>
        </div>
        <Text type="secondary" className="block mb-4">Read carefully and explore your surroundings</Text>
        
        <div className="space-y-4">
          {puzzleData.imageURL && (
            <div className="flex justify-center">
              <Image
                src={puzzleData.imageURL}
                alt="Puzzle clue image"
                width={400}
                height={300}
                className="rounded-lg border shadow-sm"
                preview={{
                  mask: (
                    <div className="text-white">
                      <EyeOutlined /> View Image
                    </div>
                  )
                }}
              />
            </div>
          )}

          <Card size="small" className="bg-white border">
            <Paragraph className="text-base leading-relaxed mb-0">
              {puzzleData.text}
            </Paragraph>
          </Card>

          <div className="flex items-center gap-2">
            <Text strong>Code:</Text>
            <Text code className="text-sm">{puzzleData.code}</Text>
          </div>
        </div>
      </Card>

      {/* Hint Card */}
      <Card>
        <Title level={4}>💡 Hint</Title>
        <Text type="secondary" className="block mb-4">Need a little help? Here's a clue to get you started</Text>
        
        {!showHint ? (
          <Button
            type="dashed"
            icon={<BulbOutlined />}
            onClick={() => setShowHint(true)}
            className="w-full"
          >
            Show Hint
          </Button>
        ) : (
          <Alert
            message="Hint"
            description={puzzleData.hint}
            type="warning"
            showIcon
            icon={<BulbOutlined />}
          />
        )}
      </Card>

      {/* Action Card */}
      <Card>
        <Title level={4}>Complete the Puzzle</Title>
        <Text type="secondary" className="block mb-4">Once you've solved the puzzle and found the answer, mark it as complete</Text>
        
        <div className="space-y-4">
          {!isCompleted ? (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleMarkComplete} 
              className="w-full"
              icon={<CheckCircleOutlined />}
            >
              Mark as Completed
            </Button>
          ) : (
            <div className="space-y-4">
              <Alert
                message="Puzzle Completed!"
                description="Well done! Here's your next destination:"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />

              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-indigo-600 text-xl" />
                  <div>
                    <Text strong className="text-indigo-900">Next Checkpoint</Text>
                    <br />
                    <Text className="text-indigo-700">{puzzleData.nextLocation}</Text>
                  </div>
                </div>
              </Card>

              <Button 
                type="primary" 
                size="large" 
                onClick={handleNextCheckpoint} 
                className="w-full"
                icon={<ArrowRightOutlined />}
              >
                Continue to Next Checkpoint
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Instructions Card */}
      <Card>
        <Title level={4}>How to Solve</Title>
        <ul className="text-sm space-y-2 text-gray-600 mt-4">
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
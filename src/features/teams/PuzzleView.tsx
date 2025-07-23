import { useState } from 'react'
import { Card, Button, Typography, Image, Alert } from 'antd'
import { BulbOutlined, ArrowRightOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface PuzzleViewProps {
  puzzle?: {
    id: string
    text: string
    imageURL?: string
    code: string
  }
  onComplete: () => void
}

export default function PuzzleView({ puzzle, onComplete }: PuzzleViewProps) {
  const [showHint, setShowHint] = useState(false)

  // Mock puzzle data
  const mockPuzzle = {
    id: '1',
    text: 'I stand tall with hands that turn, marking moments as time burns. Near the square where people meet, find the code beneath my feet.',
    imageURL: 'https://via.placeholder.com/300x200?text=Clock+Tower',
    code: 'TOWER-CLOCK-2025'
  }

  const currentPuzzle = puzzle || mockPuzzle

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BulbOutlined className="text-4xl text-yellow-500 mb-2" />
        <Title level={4}>Solve the Puzzle</Title>
        <Text className="text-gray-600">
          Find your next checkpoint using this clue
        </Text>
      </div>

      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <div className="space-y-4">
          {currentPuzzle.imageURL && (
            <div className="text-center">
              <Image
                src={currentPuzzle.imageURL}
                alt="Puzzle hint"
                className="rounded-lg"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
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
          
          <Card size="small" className="bg-white">
            <Paragraph className="text-center text-lg font-medium mb-0 italic">
              "{currentPuzzle.text}"
            </Paragraph>
          </Card>
        </div>
      </Card>

      {!showHint ? (
        <Button
          type="dashed"
          icon={<BulbOutlined />}
          onClick={() => setShowHint(true)}
          className="w-full"
        >
          Need a Hint?
        </Button>
      ) : (
        <Alert
          message="Hint"
          description="Look for landmarks mentioned in the riddle. The answer often relates to the physical features described."
          type="warning"
          showIcon
          icon={<BulbOutlined />}
        />
      )}

      <div className="space-y-3">
        <Alert
          message="Instructions"
          description="Use this clue to find your next checkpoint. Look for the QR code at the location described in the puzzle."
          type="info"
          showIcon
        />

        <Button 
          type="primary" 
          size="large"
          onClick={onComplete}
          className="w-full"
          icon={<ArrowRightOutlined />}
        >
          I Found the Location
        </Button>
      </div>

      <div className="text-center">
        <Text className="text-sm text-gray-500">
          💡 Remember: Each puzzle leads to a specific location where you'll find the next QR code
        </Text>
      </div>
    </div>
  )
}
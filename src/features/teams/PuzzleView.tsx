import { useState } from 'react'
import { Card, Button, Typography, Image, Alert, message } from 'antd'
import { BulbOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface PuzzleData {
  id: string
  text: string
  imageURL?: string
  // Note: removed 'code' and 'nextLocation' as these will be handled by backend
  hint?: string
}

interface PuzzleViewProps {
  puzzle?: PuzzleData
  onProceedToScan: () => void
}

export default function PuzzleView({ puzzle, onProceedToScan }: PuzzleViewProps) {
  const [showHint, setShowHint] = useState(false)

  // DUMMY DATA: This simulates puzzle data from backend
  // TODO: Replace with actual puzzle fetched from GameService.getNextPuzzle()
  const dummyPuzzleData: PuzzleData = {
    id: '1',
    text: 'Find the statue of the famous explorer who discovered this land. Look for the bronze plaque at its base. The next QR code awaits where history meets the present.',
    imageURL: 'https://via.placeholder.com/400x300?text=Explorer+Statue',
    hint: 'The explorer is facing east, towards the rising sun. Look for bronze markers nearby.',
  }

  // Use the prop if provided, otherwise fall back to dummy data
  const data = puzzle ?? dummyPuzzleData

  const handleProceedToScan = () => {
    // TODO: In real implementation, this should not auto-complete the puzzle
    // The puzzle is only "completed" when the user scans the correct QR code at the location
    message.info('Use this clue to find your next checkpoint location. Look for the QR code there!')
    onProceedToScan()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Puzzle Challenge</Title>
        <Text type="secondary" className="text-sm sm:text-base">Solve the puzzle to find your next checkpoint location</Text>
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
            description={data.hint || "Look carefully at the surroundings and landmarks mentioned in the puzzle."}
            type="warning"
            showIcon
            icon={<BulbOutlined />}
            className="text-sm sm:text-base"
          />
        )}
      </Card>

      {/* Action Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">Find the Location</Title>
          <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">
            Use the puzzle clue to find the next checkpoint location, then scan the QR code or enter the text code
          </Text>        <div className="space-y-3 sm:space-y-4">
          <Alert
            message="How it works"
            description="The puzzle gives you clues to find a real-world location. Once you find it, look for a QR code or text code to scan/enter. Only the correct code for your current checkpoint will work."
            type="info"
            showIcon
            className="text-sm sm:text-base"
          />

          <Button 
            type="primary" 
            size="large" 
            onClick={handleProceedToScan} 
            className="w-full h-12 sm:h-auto text-sm sm:text-base"
            icon={<EnvironmentOutlined />}
          >
            I'm Ready to Find the Location
          </Button>
        </div>
      </Card>

      {/* Instructions Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">How to Solve</Title>
        <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-gray-600 mt-3 sm:mt-4 pl-4">
          <li>• Read the puzzle description carefully</li>
          <li>• Use the image as a visual clue if provided</li>
          <li>• Look for keywords that describe locations or landmarks</li>
          <li>• Navigate to the physical location in the real world</li>
          <li>• Find and scan the QR code at that location, or enter the text code manually</li>
          <li>• Only the correct code for your checkpoint will advance the game</li>
        </ul>
      </Card>
    </div>
  )
}
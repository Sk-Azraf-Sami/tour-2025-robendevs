import { useState } from 'react'
import { Modal, Button, Alert, Spin, Input, Radio, Typography, Divider } from 'antd'
import { CloseOutlined, CameraOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'

const { Text } = Typography

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera')
  const [isScanning, setIsScanning] = useState(true)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  // DUMMY QR SCANNER - Replace with actual QR scanner library integration
  // TODO: Integrate with react-qr-reader or similar library for real QR scanning
  const handleMockScan = (code: string) => {
    setTimeout(() => {
      onScan(code)
    }, 1000)
  }

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setError('Please enter a valid checkpoint code')
      return
    }

    setIsValidating(true)
    setError('')
    
    try {
      // Simulate validation delay and pass the code to the parent
      setTimeout(() => {
        onScan(manualCode.trim())
        setIsValidating(false)
      }, 500)
    } catch {
      setError('Failed to validate code')
      setIsValidating(false)
    }
  }

  // Mock QR codes for different checkpoint scenarios (for development testing)
  // These should match the actual codes stored in the database puzzles
  const mockQRCodes = [
    { label: '🟢 Valid: Starting Checkpoint (cp_0)', code: 'PUZZLE_717316' },
    { label: '🟡 Valid: Checkpoint 2 (cp_2)', code: 'EXPLORER_STATUE_001' },
    { label: '� Valid: Checkpoint 3 (cp_3)', code: 'RED_DOOR_PUZZLE_002' },
    { label: '� Invalid: Wrong Checkpoint Code', code: 'INVALID_CODE_456' },
  ]

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      title="Scan or Enter Checkpoint Code"
      width="100%"
      style={{ maxWidth: '500px', top: 20 }}
      className="qr-scanner-modal"
    >
      <div className="space-y-4">
        {error && (
          <Alert 
            message="Error" 
            description={error}
            type="error" 
            closable 
            onClose={() => setError('')}
          />
        )}

        {/* Method Selection */}
        <div className="text-center">
          <Text className="block mb-3 text-gray-600">Choose your preferred method:</Text>
          <Radio.Group 
            value={scanMethod} 
            onChange={(e) => setScanMethod(e.target.value)}
            buttonStyle="solid"
            size="large"
            className="w-full"
          >
            <Radio.Button value="camera" className="flex-1 text-center">
              <CameraOutlined className="mr-2" />
              Camera Scan
            </Radio.Button>
            <Radio.Button value="manual" className="flex-1 text-center">
              <EditOutlined className="mr-2" />
              Manual Entry
            </Radio.Button>
          </Radio.Group>
        </div>

        <Divider />

        {/* Camera Scanning Section */}
        {scanMethod === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {isScanning ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white space-y-4">
                    <CameraOutlined className="text-6xl" />
                    <div>
                      <Spin size="large" />
                      <p className="mt-2">Scanning for QR code...</p>
                    </div>
                  </div>
                  
                  {/* Scanner overlay */}
                  <div className="absolute inset-8 border-2 border-white rounded-lg opacity-50">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <p>Camera not available</p>
                    <Button onClick={() => setIsScanning(true)} className="mt-2">
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <Text className="text-gray-600 text-sm block">
                Position the QR code within the frame to scan
              </Text>
              
              {/* Mock scan buttons for development */}
              <div className="space-y-2">
                <Text className="text-xs text-gray-500 block">Development Testing Buttons:</Text>
                {mockQRCodes.map((mock, index) => (
                  <Button 
                    key={index}
                    type="dashed" 
                    onClick={() => handleMockScan(mock.code)}
                    className="w-full text-xs"
                    size="small"
                  >
                    {mock.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Section */}
        {scanMethod === 'manual' && (
          <div className="space-y-4">
            <div className="text-center">
              <EditOutlined className="text-4xl text-blue-500 mb-3" />
              <Text className="block text-gray-600">
                Enter the checkpoint code found at your location
              </Text>
            </div>
            
            <div className="space-y-3">
              <div>
                <Text strong className="block mb-2">Checkpoint Code:</Text>
                <Input
                  placeholder="Enter code (e.g., PUZZLE_717316, EXPLORER_STATUE_001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="font-mono"
                  size="large"
                  onPressEnter={handleManualSubmit}
                />
                <Text className="text-xs text-gray-500 mt-1 block">
                  Enter the exact code shown at your checkpoint location
                </Text>
              </div>
              
              <Button 
                type="primary" 
                size="large" 
                onClick={handleManualSubmit} 
                className="w-full"
                icon={<CheckOutlined />}
                loading={isValidating}
                disabled={!manualCode.trim()}
              >
                {isValidating ? 'Validating Code...' : 'Verify Code'}
              </Button>
            </div>

            <Alert
              message="💡 Finding the Code"
              description="At each checkpoint location, you'll find both a QR code AND a text code displayed nearby. If you can't scan the QR code, you can manually enter the text code instead. Both will work the same way!"
              type="info"
              showIcon
              className="text-sm"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            type="default" 
            icon={<CloseOutlined />}
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
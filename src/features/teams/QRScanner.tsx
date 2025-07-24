import { useState, useRef, useEffect } from 'react'
import { Modal, Button, Alert, Input, Radio, Typography, Divider } from 'antd'
import { CloseOutlined, CameraOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { Html5QrcodeScanner } from "html5-qrcode"

const { Text } = Typography

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [scannedRawCode, setScannedRawCode] = useState('')
  const [showScannedResult, setShowScannedResult] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: unknown) => {
          console.error("Failed to clear scanner:", error)
        })
      }
    }
  }, [])

  // Function to extract valid code using regex
  const extractValidCode = (scannedText: string): string => {
    // Remove any whitespace and convert to uppercase
    const cleanText = scannedText.trim().toUpperCase()
    
    // Try to match various patterns that might be in QR codes
    // Pattern 1: PUZZLE_XXXXXX format
    const puzzleMatch = cleanText.match(/PUZZLE_\d{6}/)
    if (puzzleMatch) return puzzleMatch[0]
    
    // Pattern 2: CHECKPOINT_XXX format  
    const checkpointMatch = cleanText.match(/CHECKPOINT_\w+/)
    if (checkpointMatch) return checkpointMatch[0]
    
    // Pattern 3: Any alphanumeric code with underscores (common checkpoint format)
    const codeMatch = cleanText.match(/[A-Z0-9_]{6,20}/)
    if (codeMatch) return codeMatch[0]
    
    // If no pattern matches, return the cleaned text as is
    return cleanText
  }

  const startScan = () => {
    if (!isScanning && document.getElementById("qr-reader")) {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          false
        )
        
        scannerRef.current.render(
          (decodedText: string) => {
            // Extract valid code from scanned text
            const validCode = extractValidCode(decodedText)
            console.log("QR Code scanned:", decodedText, "-> Extracted:", validCode)
            
            // Stop scanning
            stopScan()
            
            // Switch to manual entry mode and populate with extracted code
            setScannedRawCode(decodedText)
            setManualCode(validCode)
            setScanMethod('manual')
            setShowScannedResult(true)
            setError('')
          },
          (error: string) => {
            // Only log errors, don't show them to user (too noisy)
            console.debug("QR scan error:", error)
          }
        )
        setIsScanning(true)
        setError('')
      } catch (err) {
        console.error("Failed to start QR scanner:", err)
        setError("Failed to start camera. Please check camera permissions.")
        setIsScanning(false)
      }
    }
  }

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error: unknown) => {
        console.error("Failed to clear scanner:", error)
      })
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  // MOCK QR SCANNER - For development testing
  const handleMockScan = (code: string) => {
    // Simulate the same behavior as real QR scanning
    const validCode = extractValidCode(code)
    console.log("Mock QR Code scanned:", code, "-> Extracted:", validCode)
    
    // Stop any ongoing scanning
    stopScan()
    
    // Switch to manual entry mode and populate with extracted code
    setScannedRawCode(code)
    setManualCode(validCode)
    setScanMethod('manual')
    setShowScannedResult(true)
    setError('')
  }

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setError('Please enter a valid checkpoint code')
      return
    }

    setIsValidating(true)
    setError('')
    
    try {
      // Extract valid code from manual input
      const validCode = extractValidCode(manualCode)
      console.log("Manual code entered:", manualCode, "-> Extracted:", validCode)
      
      // Simulate validation delay and pass the code to the parent
      setTimeout(() => {
        onScan(validCode)
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

  const handleClose = () => {
    stopScan()
    onClose()
  }

  return (
    <Modal
      open={true}
      onCancel={handleClose}
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
            {/* QR Reader Container */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <div 
                id="qr-reader" 
                style={{ 
                  width: "100%", 
                  minHeight: "320px", 
                  borderRadius: 12, 
                  overflow: 'hidden' 
                }}
              />
              
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
                  <div className="text-white text-center space-y-4">
                    <CameraOutlined className="text-6xl" />
                    <div>
                      <p className="text-lg font-medium">Ready to Scan</p>
                      <p className="text-sm opacity-75">Tap "Start Camera" to begin scanning</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Controls */}
            <div className="flex gap-2">
              {!isScanning ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={startScan}
                  className="flex-1"
                  icon={<CameraOutlined />}
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  type="default"
                  size="large"
                  onClick={stopScan}
                  className="flex-1"
                  danger
                >
                  Stop Scanning
                </Button>
              )}
            </div>

            <div className="text-center space-y-2">
              <Text className="text-gray-600 text-sm block">
                {isScanning 
                  ? "Position the QR code within the camera frame to scan automatically" 
                  : "Make sure to allow camera permissions when prompted"
                }
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
                {showScannedResult ? "QR Code Scanned Successfully!" : "Enter the checkpoint code found at your location"}
              </Text>
            </div>

            {/* Show scanned result info */}
            {showScannedResult && (
              <Alert
                message="✅ QR Code Detected"
                description={
                  <div className="space-y-2">
                    <div>
                      <Text strong className="text-sm">Raw QR Data:</Text>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                        {scannedRawCode}
                      </div>
                    </div>
                    <div>
                      <Text strong className="text-sm">Extracted Code:</Text>
                      <div className="font-mono text-sm bg-green-100 p-2 rounded mt-1 text-green-800">
                        {manualCode}
                      </div>
                    </div>
                    <Text className="text-xs text-gray-600">
                      ℹ️ The code above was automatically extracted from your QR scan. You can verify it's correct and submit, or edit it if needed.
                    </Text>
                  </div>
                }
                type="success"
                showIcon
                className="text-sm"
              />
            )}
            
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
                  {showScannedResult 
                    ? "Code automatically filled from QR scan. You can edit if needed."
                    : "Enter the exact code shown at your checkpoint location"
                  }
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
                {isValidating ? 'Validating Code...' : (showScannedResult ? 'Submit Scanned Code' : 'Verify Code')}
              </Button>

              {/* Option to scan again */}
              {showScannedResult && (
                <Button 
                  type="default" 
                  size="large" 
                  onClick={() => {
                    setScanMethod('camera')
                    setShowScannedResult(false)
                    setScannedRawCode('')
                    setManualCode('')
                  }} 
                  className="w-full"
                  icon={<CameraOutlined />}
                >
                  Scan Another QR Code
                </Button>
              )}
            </div>

            {!showScannedResult && (
              <Alert
                message="💡 Finding the Code"
                description="At each checkpoint location, you'll find both a QR code AND a text code displayed nearby. If you can't scan the QR code, you can manually enter the text code instead. Both will work the same way!"
                type="info"
                showIcon
                className="text-sm"
              />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            type="default" 
            icon={<CloseOutlined />}
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
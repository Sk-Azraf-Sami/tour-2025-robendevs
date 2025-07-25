import { useState, useRef, useEffect } from 'react'
import { Modal, Button, Alert, Input, Radio, Typography, Divider } from 'antd'
import { CloseOutlined, CameraOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { Html5QrcodeScanner } from "html5-qrcode"
import './mobile.css'

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
        // Responsive QR box sizing based on screen width
        const screenWidth = window.innerWidth
        const qrBoxSize = screenWidth <= 480 ? 200 : screenWidth <= 768 ? 220 : 250
        
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: qrBoxSize, height: qrBoxSize },
            aspectRatio: 1.0,
            disableFlip: false,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            // Mobile optimizations
            supportedScanTypes: [0, 1] // QR Code and Data Matrix
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
      style={{ 
        maxWidth: '500px', 
        top: window.innerWidth <= 768 ? 10 : 20,
        margin: window.innerWidth <= 768 ? '10px' : 'auto'
      }}
      className="qr-scanner-modal"
    >
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-0">
        {error && (
          <Alert 
            message="Error" 
            description={error}
            type="error" 
            closable 
            onClose={() => setError('')}
            className="text-sm"
          />
        )}

        {/* Method Selection */}
        <div className="text-center">
          <Text className="block mb-3 text-gray-600 text-sm sm:text-base">Choose your preferred method:</Text>
          <Radio.Group 
            value={scanMethod} 
            onChange={(e) => setScanMethod(e.target.value)}
            buttonStyle="solid"
            size="large"
            className="w-full grid grid-cols-2 gap-2"
          >
            <Radio.Button value="camera" className="flex-1 text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base">
              <CameraOutlined className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Camera Scan</span>
              <span className="sm:hidden">Scan</span>
            </Radio.Button>
            <Radio.Button value="manual" className="flex-1 text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base">
              <EditOutlined className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </Radio.Button>
          </Radio.Group>
        </div>

        <Divider />

        {/* Camera Scanning Section */}
        {scanMethod === 'camera' && (
          <div className="space-y-3 sm:space-y-4">
            {/* QR Reader Container */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <div 
                id="qr-reader" 
                style={{ 
                  width: "100%", 
                  minHeight: window.innerWidth <= 480 ? "280px" : "320px", 
                  borderRadius: 12, 
                  overflow: 'hidden' 
                }}
              />
              
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
                  <div className="text-white text-center space-y-3 sm:space-y-4 p-4">
                    <CameraOutlined className="text-4xl sm:text-6xl" />
                    <div>
                      <p className="text-base sm:text-lg font-medium">Ready to Scan</p>
                      <p className="text-xs sm:text-sm opacity-75 px-2">Tap "Start Camera" to begin scanning</p>
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
                  className="flex-1 min-h-[48px] text-sm sm:text-base"
                  icon={<CameraOutlined />}
                >
                  <span className="hidden sm:inline">Start Camera</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              ) : (
                <Button
                  type="default"
                  size="large"
                  onClick={stopScan}
                  className="flex-1 min-h-[48px] text-sm sm:text-base"
                  danger
                >
                  <span className="hidden sm:inline">Stop Scanning</span>
                  <span className="sm:hidden">Stop</span>
                </Button>
              )}
            </div>

            <div className="text-center space-y-2">
              <Text className="text-gray-600 text-xs sm:text-sm block px-2">
                {isScanning 
                  ? "Position the QR code within the camera frame to scan automatically" 
                  : "Make sure to allow camera permissions when prompted"
                }
              </Text>
            </div>
          </div>
        )}

        {/* Manual Entry Section */}
        {scanMethod === 'manual' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <EditOutlined className="text-3xl sm:text-4xl text-blue-500 mb-2 sm:mb-3" />
              <Text className="block text-gray-600 text-sm sm:text-base px-2">
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
                      <Text strong className="text-xs sm:text-sm">Raw QR Data:</Text>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                        {scannedRawCode}
                      </div>
                    </div>
                    <div>
                      <Text strong className="text-xs sm:text-sm">Extracted Code:</Text>
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
                className="text-xs sm:text-sm"
              />
            )}
            
            <div className="space-y-3">
              <div>
                <Text strong className="block mb-2 text-sm sm:text-base">Checkpoint Code:</Text>
                <Input
                  placeholder="Enter checkpoint code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="font-mono text-sm sm:text-base"
                  size="large"
                  onPressEnter={handleManualSubmit}
                  style={{ minHeight: '48px' }}
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
                className="w-full min-h-[48px] text-sm sm:text-base"
                icon={<CheckOutlined />}
                loading={isValidating}
                disabled={!manualCode.trim()}
              >
                {isValidating ? 'Validating...' : (showScannedResult ? 'Submit Scanned Code' : 'Verify Code')}
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
                  className="w-full min-h-[48px] text-sm sm:text-base"
                  icon={<CameraOutlined />}
                >
                  <span className="hidden sm:inline">Scan Another QR Code</span>
                  <span className="sm:hidden">Scan Again</span>
                </Button>
              )}
            </div>

            {!showScannedResult && (
              <Alert
                message="💡 Finding the Code"
                description="At each checkpoint location, you'll find both a QR code AND a text code displayed nearby. If you can't scan the QR code, you can manually enter the text code instead. Both will work the same way!"
                type="info"
                showIcon
                className="text-xs sm:text-sm"
              />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 sm:pt-4">
          <Button 
            type="default" 
            icon={<CloseOutlined />}
            onClick={handleClose}
            className="flex-1 min-h-[48px] text-sm sm:text-base"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
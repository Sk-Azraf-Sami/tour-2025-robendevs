import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup scanner on unmount and when switching methods
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }
      // Clean up scanner
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: unknown) => {
          console.error("Failed to clear scanner:", error)
        })
      }
    }
  }, [])

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Check if navigator.mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera not supported on this device")
          setPermissionGranted(false)
          return
        }

        // Check current permission state
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
            setPermissionGranted(permission.state === 'granted')
            
            // Listen for permission changes
            permission.onchange = () => {
              const newState = permission.state === 'granted'
              console.log("Camera permission changed:", permission.state)
              setPermissionGranted(newState)
            }
          } catch (error) {
            console.debug("Permission query not supported:", error)
            // Fall back to trying to access camera directly
          }
        }
      } catch (error) {
        console.error("Error checking camera permissions:", error)
      }
    }

    checkCameraPermissions()
  }, [])

  // Auto-retry scanner initialization when permissions are granted and camera method is selected
  useEffect(() => {
    if (permissionGranted === true && scanMethod === 'camera' && !isScanning && isInitialized) {
      console.log("Camera permission granted and scanner ready - enabling start button")
      // Permission is granted, scanner is initialized, but not scanning
      // User can now click the start button
    }
  }, [permissionGranted, scanMethod, isScanning, isInitialized])

  // Initialize scanner when switching to camera method and DOM is ready
  useEffect(() => {
    if (scanMethod === 'camera' && !isScanning) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        // Check if the QR reader element exists before setting initialized
        const qrReaderElement = document.getElementById("qr-reader")
        if (qrReaderElement) {
          setIsInitialized(true)
        } else {
          console.warn("QR reader element not found during initialization")
          // Retry after a bit more time
          setTimeout(() => {
            const retryElement = document.getElementById("qr-reader")
            if (retryElement) {
              setIsInitialized(true)
            }
          }, 300)
        }
      }, 200) // Increased timeout for better DOM readiness
      
      cleanupTimeoutRef.current = timeout
      
      return () => {
        if (timeout) clearTimeout(timeout)
      }
    } else {
      setIsInitialized(false)
    }
  }, [scanMethod, isScanning])

  // Function to extract valid code using regex
  const extractValidCode = useCallback((scannedText: string): string => {
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
  }, [])

  const stopScan = useCallback(async () => {
    console.log("Stopping QR scanner...")
    
    if (scannerRef.current) {
      try {
        // Get state before clearing
        const state = scannerRef.current.getState?.() || null
        console.log("Scanner state before clearing:", state)
        
        await scannerRef.current.clear()
        console.log("Scanner cleared successfully")
      } catch (error: unknown) {
        console.warn("Failed to clear scanner (this might be normal):", error)
      } finally {
        scannerRef.current = null
      }
    }
    
    setIsScanning(false)
    console.log("QR scanner stopped")
    
    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100))
  }, [])

  const startScan = useCallback(async () => {
    // Clear any previous errors
    setError('')
    
    // First check if we can access camera
    try {
      console.log("Requesting camera permission...")
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Try to use back camera first
        } 
      })
      
      console.log("Camera permission granted!")
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop())
      setPermissionGranted(true)
      
    } catch (permissionError) {
      console.error("Camera permission denied:", permissionError)
      
      // Check for specific error types
      if (permissionError instanceof DOMException) {
        switch (permissionError.name) {
          case 'NotAllowedError':
            setError("Camera access denied. Please allow camera permission in your browser settings and try again.")
            break
          case 'NotFoundError':
            setError("No camera found on this device.")
            break
          case 'NotSupportedError':
            setError("Camera is not supported on this device.")
            break
          case 'NotReadableError':
            setError("Camera is already in use by another application.")
            break
          default:
            setError("Failed to access camera. Please check your browser settings and try again.")
        }
      } else {
        setError("Camera permission denied. Please allow camera access and try again.")
      }
      
      setPermissionGranted(false)
      return
    }

    // Now start the actual QR scanner
    if (!isScanning) {
      const qrReaderElement = document.getElementById("qr-reader")
      if (!qrReaderElement) {
        console.error("QR reader element not found")
        setError("QR reader element not found. Please try again.")
        return
      }

      try {
        console.log("Starting QR scanner...")
        
        // Clear any existing scanner first
        if (scannerRef.current) {
          console.log("Clearing existing scanner...")
          try {
            await scannerRef.current.clear()
          } catch (clearError) {
            console.warn("Error clearing existing scanner (this might be normal):", clearError)
          } finally {
            scannerRef.current = null
          }
        }

        // Longer delay to ensure DOM cleanup is complete and camera is released
        await new Promise(resolve => setTimeout(resolve, 500))

        // Responsive QR box sizing based on screen width
        const screenWidth = window.innerWidth
        const qrBoxSize = screenWidth <= 480 ? 200 : screenWidth <= 768 ? 220 : 250
        
        console.log("Creating new scanner instance...")
        
        // Enhanced configuration for better camera initialization
        const config = {
          fps: 10, 
          qrbox: { width: qrBoxSize, height: qrBoxSize },
          aspectRatio: 1.0,
          disableFlip: false,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          // Mobile optimizations
          supportedScanTypes: [0, 1], // QR Code and Data Matrix
          // Camera constraints with fallback options
          videoConstraints: {
            facingMode: "environment", // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          // Additional configuration for better compatibility
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        }
        
        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false)
        
        console.log("Rendering scanner...")
        
        // Start the scanner with success and error callbacks
        await scannerRef.current.render(
          (decodedText: string) => {
            console.log("QR Code successfully scanned:", decodedText)
            
            // Extract valid code from scanned text
            const validCode = extractValidCode(decodedText)
            console.log("Raw QR data:", decodedText, "-> Extracted code:", validCode)
            
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
            // Only log scanning errors, don't show them to user (too noisy)
            // These are mostly just "no QR code found" messages
            console.debug("QR scan error (this is normal):", error)
          }
        )
        
        setIsScanning(true)
        console.log("QR scanner started successfully!")
        
      } catch (err) {
        console.error("Failed to start QR scanner:", err)
        setError("Failed to start camera. Please check camera permissions and try again.")
        setIsScanning(false)
        setPermissionGranted(false)
        
        // Clean up scanner reference if it was created but failed to start
        if (scannerRef.current) {
          try {
            await scannerRef.current.clear()
          } catch (cleanupError) {
            console.warn("Error during cleanup after start failure:", cleanupError)
          } finally {
            scannerRef.current = null
          }
        }
      }
    }
  }, [isScanning, extractValidCode, stopScan])

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

  const handleClose = async () => {
    await stopScan()
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
            {/* Permission check alert */}
            {permissionGranted === false && (
              <Alert
                message="Camera Permission Required"
                description="Please allow camera access to scan QR codes. You can also use manual entry instead."
                type="warning"
                showIcon
                className="text-sm"
              />
            )}

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
                      <p className="text-base sm:text-lg font-medium">
                        {!isInitialized ? 'Setting Up Scanner...' : permissionGranted === false ? 'Camera Access Needed' : 'Ready to Scan'}
                      </p>
                      <p className="text-xs sm:text-sm opacity-75 px-2">
                        {!isInitialized 
                          ? 'Please wait while we set up the camera scanner'
                          : permissionGranted === false 
                          ? 'Please allow camera permission to continue'
                          : 'Tap "Start Camera" to begin scanning'
                        }
                      </p>
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
                  disabled={!isInitialized}
                  loading={!isInitialized && scanMethod === 'camera'}
                >
                  <span className="hidden sm:inline">
                    {!isInitialized ? 'Initializing...' : permissionGranted === false ? 'Request Camera Access' : 'Start Camera'}
                  </span>
                  <span className="sm:hidden">
                    {!isInitialized ? 'Init...' : permissionGranted === false ? 'Allow Camera' : 'Start'}
                  </span>
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
                  : !isInitialized
                  ? "Setting up camera scanner..."
                  : permissionGranted === false
                  ? "Camera permission is required to scan QR codes. You can use manual entry as an alternative."
                  : "Make sure to allow camera permissions when prompted. If you're having trouble, try refreshing the page or use manual entry."
                }
              </Text>
              
              {/* Additional troubleshooting info */}
              {permissionGranted === true && !isScanning && isInitialized && (
                <Text className="text-green-600 text-xs block px-2">
                  ✅ Camera ready! Click "Start Camera" to begin scanning.
                </Text>
              )}
              
              {permissionGranted === false && (
                <Text className="text-orange-600 text-xs block px-2">
                  💡 If camera doesn't work, you can always use "Manual Entry" to type the code instead.
                </Text>
              )}
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
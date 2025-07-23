import { useState } from 'react'
import { Card, Button, Input, Typography, Alert, Radio, message } from 'antd'
import { QrcodeOutlined, CameraOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function QRScanPage() {
  const navigate = useNavigate()
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null)

  // Simulate QR code scanning
  const handleCameraScan = () => {
    setIsScanning(true)
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false)
      // Simulate successful scan
      const success = Math.random() > 0.3 // 70% success rate
      if (success) {
        setScanResult('success')
        message.success('QR Code Scanned! Checkpoint verified. Proceeding to MCQ.')
        setTimeout(() => {
          navigate('/team/mcq')
        }, 1500)
      } else {
        setScanResult('error')
        message.error('Invalid QR Code - This QR code is not for your current checkpoint.')
      }
    }, 2000)
  }

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return

    // Simulate code validation
    const validCodes = ['EXPLORER_STATUE_001', 'RED_DOOR_PUZZLE_002', 'LIBRARY_ENTRANCE_003']
    const isValid = validCodes.includes(manualCode.toUpperCase())

    if (isValid) {
      setScanResult('success')
      message.success('Code Verified! Checkpoint confirmed. Proceeding to MCQ.')
      setTimeout(() => {
        navigate('/team/mcq')
      }, 1500)
    } else {
      setScanResult('error')
      message.error('Invalid Code - Please check the code and try again.')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Scan Checkpoint</Title>
        <Text type="secondary" className="text-sm sm:text-base">Scan the QR code or enter the checkpoint code manually</Text>
      </div>

      <div className="flex justify-center px-2">
        <div className="flex justify-center w-auto">
          <Radio.Group 
            value={scanMethod} 
            onChange={(e) => setScanMethod(e.target.value)}
            buttonStyle="solid"
            size="large"
            className="inline-flex"
          >
            <Radio.Button 
              value="camera" 
              className="w-28 sm:w-32 text-center h-12 flex items-center justify-center text-sm sm:text-base font-medium"
            >
              <CameraOutlined className="mr-1 sm:mr-2" /> 
              Scan
            </Radio.Button>
            <Radio.Button 
              value="manual" 
              className="w-28 sm:w-32 text-center h-12 flex items-center justify-center text-sm sm:text-base font-medium"
            >
              <EditOutlined className="mr-1 sm:mr-2" /> 
              Entry
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>

      {scanMethod === 'camera' && (
        <Card className="mx-2 sm:mx-0">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CameraOutlined className="text-base sm:text-lg" />
            <Title level={4} className="!mb-0 text-base sm:text-lg">Camera Scanner</Title>
          </div>
          <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Point your camera at the QR code to scan</Text>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="aspect-square max-w-xs sm:max-w-sm mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-4">
              {isScanning ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-2 sm:mb-4"></div>
                  <Text type="secondary" className="text-xs sm:text-sm">Scanning...</Text>
                </div>
              ) : scanResult === 'success' ? (
                <div className="text-center text-green-600">
                  <CheckCircleOutlined className="text-3xl sm:text-5xl mb-1 sm:mb-2" />
                  <Text className="text-xs sm:text-sm font-medium">Scan Successful!</Text>
                </div>
              ) : scanResult === 'error' ? (
                <div className="text-center text-red-600">
                  <ExclamationCircleOutlined className="text-3xl sm:text-5xl mb-1 sm:mb-2" />
                  <Text className="text-xs sm:text-sm font-medium">Invalid QR Code</Text>
                </div>
              ) : (
                <div className="text-center">
                  <QrcodeOutlined className="text-3xl sm:text-5xl text-gray-400 mb-1 sm:mb-2" />
                  <Text type="secondary" className="text-xs sm:text-sm">Camera viewfinder</Text>
                </div>
              )}
            </div>

            <Button
              type="primary"
              size="large"
              onClick={handleCameraScan}
              disabled={isScanning || scanResult === 'success'}
              className="w-full h-12 sm:h-auto text-sm sm:text-base"
              icon={<CameraOutlined />}
            >
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </Card>
      )}

      {scanMethod === 'manual' && (
        <Card className="mx-2 sm:mx-0">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <EditOutlined className="text-base sm:text-lg" />
            <Title level={4} className="!mb-0 text-base sm:text-lg">Manual Code Entry</Title>
          </div>
          <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Enter the checkpoint code found at your location</Text>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Text strong className="block mb-2 text-sm sm:text-base">Checkpoint Code</Text>
              <Input
                placeholder="Enter code (e.g., EXPLORER_STATUE_001)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="font-mono text-sm sm:text-base"
                size="large"
              />
            </div>

            <Button 
              type="primary" 
              size="large" 
              onClick={handleManualSubmit} 
              className="w-full h-12 sm:h-auto text-sm sm:text-base"
              icon={<CheckCircleOutlined />}
            >
              Verify Code
            </Button>

            {scanResult === 'success' && (
              <Alert
                message="Code verified successfully! Redirecting to MCQ..."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                className="text-sm sm:text-base"
              />
            )}

            {scanResult === 'error' && (
              <Alert
                message="Invalid checkpoint code. Please check and try again."
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                className="text-sm sm:text-base"
              />
            )}
          </div>
        </Card>
      )}

      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">Tips for Scanning</Title>
        <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-gray-600 mt-3 sm:mt-4 pl-4">
          <li>• Make sure you're at the correct checkpoint location</li>
          <li>• Hold your device steady when scanning</li>
          <li>• Ensure good lighting for camera scanning</li>
          <li>• If camera fails, use manual entry with the code displayed near the QR code</li>
        </ul>
      </Card>
    </div>
  )
}
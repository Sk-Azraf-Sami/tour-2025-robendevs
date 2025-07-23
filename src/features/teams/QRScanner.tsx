import { useState } from 'react'
import { Modal, Button, Alert, Spin } from 'antd'
import { CloseOutlined, CameraOutlined } from '@ant-design/icons'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true)
  const [error, setError] = useState('')

  // Mock QR scanner - replace with actual QR scanner library
  const handleMockScan = () => {
    setTimeout(() => {
      onScan('checkpoint-1-code')
    }, 1000)
  }

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      title="Scan QR Code"
      width="100%"
      style={{ maxWidth: '400px', top: 20 }}
      className="qr-scanner-modal"
    >
      <div className="text-center space-y-4">
        {error && (
          <Alert 
            message="Scanner Error" 
            description={error}
            type="error" 
            closable 
            onClose={() => setError('')}
          />
        )}
        
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

        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            Position the QR code within the frame to scan
          </p>
          
          {/* Mock scan button for development */}
          <Button 
            type="dashed" 
            onClick={handleMockScan}
            className="w-full"
          >
            Mock Scan (Development)
          </Button>
        </div>

        <div className="flex gap-2">
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
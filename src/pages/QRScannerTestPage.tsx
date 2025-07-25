import { useState } from "react";
import { Card, Typography, Button, Alert } from "antd";
import { QrcodeOutlined, CheckCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import QRScanner from "../features/teams/QRScanner";

const { Title, Text } = Typography;

export default function QRScannerTestPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        <div className="text-center mb-4">
          <QrcodeOutlined className="text-4xl text-indigo-500 mb-2" />
          <Title level={3}>QR Scanner Test</Title>
          <Text type="secondary">
            Test if your device camera and QR code scanning works before logging in.
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          block
          onClick={() => setShowScanner(true)}
        >
          Start QR Scanner
        </Button>
        {scanResult && (
          <Alert
            className="mt-4"
            message="QR Code Detected!"
            description={
              <div>
                <Text strong>Result:</Text>
                <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                  {scanResult}
                </div>
              </div>
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}
        <div className="mt-6 text-center">
          <Link to="/login">
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              className="text-indigo-600"
            >
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
      {showScanner && (
        <QRScanner
          onScan={(data) => {
            setScanResult(data);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
         )}
    </div>
  );
}
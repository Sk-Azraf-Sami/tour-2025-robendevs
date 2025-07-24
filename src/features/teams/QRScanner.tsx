import React, { useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}


const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScan = () => {
    if (!isScanning && document.getElementById("qr-reader")) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText: string) => {
          onScanSuccess(decodedText);
          stopScan();
        },
        () => {
          // Only log errors, don't spam UI
        }
      );
      setIsScanning(true);
    }
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error: unknown) => {
        console.error("Failed to clear scanner:", error);
      });
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-200">
      <div
        className="relative rounded-xl shadow-2xl min-w-[360px] min-h-[400px] flex flex-col items-center justify-center border-4 border-green-400 bg-white"
        style={{ boxShadow: '0 8px 32px 0 rgba(34,197,94,0.18)' }}
      >
        <button
          onClick={() => {
            stopScan();
            if (onClose) onClose();
          }}
          className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-full w-9 h-9 flex items-center justify-center text-xl shadow"
          aria-label="Close"
        >
          ✖
        </button>
        <div className="flex flex-col items-center mt-2 mb-4">
          <div className="text-2xl font-bold text-green-700 mb-1">QR Code Scanner</div>
          <div className="text-sm text-gray-500 mb-2">Scan the QR code at your checkpoint</div>
        </div>
        <div id="qr-reader" style={{ width: "320px", minHeight: "320px", borderRadius: 12, overflow: 'hidden', background: '#f3f4f6', boxShadow: '0 2px 8px 0 rgba(16,185,129,0.08)' }} />
        <div className="flex gap-4 mt-6 w-full justify-center">
          {!isScanning ? (
            <button
              onClick={startScan}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg shadow font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-150"
            >
              <span role="img" aria-label="qr">📷</span> Start Scan
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg shadow font-bold text-lg hover:from-red-600 hover:to-pink-600 transition-all duration-150"
            >
              <span role="img" aria-label="stop">🛑</span> Stop Scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

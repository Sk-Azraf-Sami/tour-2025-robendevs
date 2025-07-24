import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    // Wait for the DOM to be ready before initializing the scanner
    const timeout = setTimeout(() => {
      if (document.getElementById("qr-reader")) {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scanner.render(
          (decodedText: string) => {
            onScanSuccess(decodedText);
            if (onClose) onClose();
          },
          () => {
            // Only log errors, don't spam UI
          }
        );
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (scanner) {
        scanner.clear().catch((error: unknown) => {
          console.error("Failed to clear scanner:", error);
        });
      }
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative bg-white p-4 rounded shadow-lg">
        <div id="qr-reader" style={{ width: "300px" }} />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default QRScanner;

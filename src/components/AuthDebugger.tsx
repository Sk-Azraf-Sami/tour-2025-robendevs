import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  message,
  Tabs,
  Space,
  Typography,
  Collapse,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Switch,
  Badge,
} from "antd";
import { Html5QrcodeScanner } from "html5-qrcode";
import { GameService } from "../services/GameService";
import { FirestoreService } from "../services/FireStoreService";
import type { Team, Puzzle, MCQ, TeamLeg } from "../types";
import "./AuthDebugger.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

interface DebugLog {
  timestamp: string;
  action: string;
  data: unknown;
  success: boolean;
}

interface QRScannerLog {
  timestamp: string;
  event: string;
  details: unknown;
  success: boolean;
}

export default function AuthDebugger() {
  // State variables
  const [teams, setTeams] = useState<Team[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [selectedMCQOptionId, setSelectedMCQOptionId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  // QR Scanner testing state
  const [qrScannerLogs, setQRScannerLogs] = useState<QRScannerLog[]>([]);
  const [cameraPermission, setCameraPermission] = useState<string>("unknown");
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  const [extractedCode, setExtractedCode] = useState<string>("");
  const [scannerInitialized, setScannerInitialized] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  const isComponentMountedRef = useRef<boolean>(true);

  const addDebugLog = useCallback(
    (action: string, data: unknown, success: boolean) => {
      const log: DebugLog = {
        timestamp: new Date().toLocaleTimeString(),
        action,
        data,
        success,
      };
      setDebugLogs((prev) => [log, ...prev.slice(0, 49)]); // Keep only last 50 logs
    },
    []
  );

  const addQRScannerLog = useCallback(
    (event: string, details: unknown, success: boolean) => {
      const log: QRScannerLog = {
        timestamp: new Date().toLocaleTimeString(),
        event,
        details,
        success,
      };
      setQRScannerLogs((prev) => [log, ...prev.slice(0, 49)]); // Keep only last 50 logs
      console.log(`[QR Scanner Debug] ${event}:`, details);
    },
    []
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsData, puzzlesData, mcqsData] = await Promise.all([
        FirestoreService.getAllTeams(),
        FirestoreService.getAllPuzzles(),
        FirestoreService.getAllMCQs(),
      ]);

      setTeams(teamsData);
      setPuzzles(puzzlesData);
      setMCQs(mcqsData);

      addDebugLog(
        "loadInitialData",
        {
          teamsCount: teamsData.length,
          puzzlesCount: puzzlesData.length,
          mcqsCount: mcqsData.length,
        },
        true
      );
    } catch (error) {
      addDebugLog("loadInitialData", { error }, false);
      message.error("Failed to load initial data");
    }
    setLoading(false);
  }, [addDebugLog]);

  const loadTeamDetails = useCallback(
    async (teamId: string) => {
      try {
        const team = await FirestoreService.getTeam(teamId);
        setSelectedTeam(team);
        addDebugLog("loadTeamDetails", team, true);
      } catch (error) {
        addDebugLog("loadTeamDetails", { error }, false);
        message.error("Failed to load team details");
      }
    },
    [addDebugLog]
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load team details when team is selected
  useEffect(() => {
    if (selectedTeamId) {
      loadTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId, loadTeamDetails]);

  // Cleanup QR scanner on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;

    return () => {
      isComponentMountedRef.current = false;

      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      // Properly cleanup scanner
      if (scannerRef.current) {
        try {
          // Use proper async cleanup
          scannerRef.current
            .clear()
            .then(() => {
              scannerRef.current = null;
            })
            .catch((error: unknown) => {
              console.error("Failed to clear QR scanner:", error);
              scannerRef.current = null;
            });
        } catch (error) {
          console.error("Scanner cleanup error:", error);
          scannerRef.current = null;
        }
      }
    };
  }, []);

  // Debug Functions
  const debugValidateQR = async () => {
    if (!selectedTeamId || !qrCode) {
      message.error("Please select a team and enter a QR code");
      return;
    }

    setLoading(true);
    try {
      const result = await GameService.validateQRCode(selectedTeamId, qrCode);
      addDebugLog(
        "validateQRCode",
        { teamId: selectedTeamId, qrCode, result },
        result.success
      );

      if (result.success) {
        message.success(`QR Validation: ${result.message}`);
        // Reload team details to see updated legs
        await loadTeamDetails(selectedTeamId);
      } else {
        message.error(`QR Validation Failed: ${result.message}`);
      }
    } catch (error) {
      addDebugLog(
        "validateQRCode",
        { teamId: selectedTeamId, qrCode, error },
        false
      );
      message.error("Error validating QR code");
    }
    setLoading(false);
  };

  const debugSubmitMCQ = async () => {
    if (!selectedTeamId || !qrCode || !selectedMCQOptionId) {
      message.error(
        "Please select a team, enter QR code, and select MCQ option"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await GameService.submitMCQAnswer(
        selectedTeamId,
        qrCode,
        selectedMCQOptionId
      );
      addDebugLog(
        "submitMCQAnswer",
        {
          teamId: selectedTeamId,
          qrCode,
          optionId: selectedMCQOptionId,
          result,
        },
        result.success
      );

      if (result.success) {
        message.success(`MCQ Submitted: ${result.message}`);
        // Reload team details to see updated legs and progress
        await loadTeamDetails(selectedTeamId);
      } else {
        message.error(`MCQ Submission Failed: ${result.message}`);
      }
    } catch (error) {
      addDebugLog(
        "submitMCQAnswer",
        {
          teamId: selectedTeamId,
          qrCode,
          optionId: selectedMCQOptionId,
          error,
        },
        false
      );
      message.error("Error submitting MCQ answer");
    }
    setLoading(false);
  };

  const debugStartGame = async () => {
    setLoading(true);
    try {
      await GameService.startGame();
      addDebugLog("startGame", { success: true }, true);
      message.success("Game started successfully");
      // Reload all data
      await loadInitialData();
    } catch (error) {
      addDebugLog("startGame", { error }, false);
      message.error("Failed to start game");
    }
    setLoading(false);
  };

  const debugGetTeamProgress = async () => {
    if (!selectedTeamId) {
      message.error("Please select a team");
      return;
    }

    setLoading(true);
    try {
      const progress = await GameService.getTeamProgress(selectedTeamId);
      addDebugLog(
        "getTeamProgress",
        { teamId: selectedTeamId, progress },
        true
      );
      message.success("Team progress loaded");
    } catch (error) {
      addDebugLog("getTeamProgress", { teamId: selectedTeamId, error }, false);
      message.error("Failed to get team progress");
    }
    setLoading(false);
  };

  // QR Scanner Testing Functions
  const checkCameraPermissions = async () => {
    addQRScannerLog(
      "Permission Check Started",
      { userAgent: navigator.userAgent },
      true
    );

    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = "Camera not supported on this device";
        setCameraPermission("not-supported");
        addQRScannerLog("Permission Check Failed", { error }, false);
        return;
      }

      // Get available camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        addQRScannerLog(
          "Camera Devices Enumerated",
          {
            totalDevices: devices.length,
            videoDevices: videoDevices.length,
            deviceLabels: videoDevices.map(
              (d) => d.label || "Unlabeled Device"
            ),
            deviceIds: videoDevices.map((d) => d.deviceId.slice(0, 10) + "..."),
          },
          true
        );
      } catch (deviceError) {
        addQRScannerLog(
          "Device Enumeration Failed",
          { error: deviceError },
          false
        );
      }

      // Check current permission state
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          setCameraPermission(permission.state);
          addQRScannerLog(
            "Permission State Checked",
            { state: permission.state },
            true
          );

          // Listen for permission changes
          permission.onchange = () => {
            setCameraPermission(permission.state);
            addQRScannerLog(
              "Permission State Changed",
              { newState: permission.state },
              true
            );
          };
        } catch (error) {
          addQRScannerLog("Permission Query Failed", { error }, false);
        }
      }

      // Try to request camera access
      try {
        const constraints = {
          video: {
            facingMode: "environment", // Try back camera first
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraPermission("granted");

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        addQRScannerLog(
          "Camera Access Granted",
          {
            streamActive: stream.active,
            tracks: stream.getVideoTracks().length,
            cameraSettings: {
              deviceId: settings.deviceId?.slice(0, 10) + "...",
              facingMode: settings.facingMode,
              width: settings.width,
              height: settings.height,
              frameRate: settings.frameRate,
            },
          },
          true
        );

        // Stop the stream immediately as we just wanted to test permission
        stream.getTracks().forEach((track) => track.stop());
        addQRScannerLog("Test Stream Stopped", {}, true);
      } catch (error) {
        setCameraPermission("denied");
        addQRScannerLog(
          "Camera Access Denied",
          {
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    constraint: (error as { constraint?: string }).constraint,
                  }
                : error,
          },
          false
        );
      }
    } catch (error) {
      setCameraPermission("error");
      addQRScannerLog("Permission Check Error", { error }, false);
    }
  };

  // Debug function to validate extracted code (mimics team flow)
  const debugValidateExtractedCode = async (extractedCode: string) => {
    if (!selectedTeamId) {
      addQRScannerLog(
        "Validation Skipped - No Team Selected",
        {
          extractedCode: extractedCode,
        },
        false
      );
      return;
    }

    addQRScannerLog(
      "Starting Code Validation",
      {
        teamId: selectedTeamId,
        code: extractedCode,
        codeLength: extractedCode.length,
      },
      true
    );

    try {
      const result = await GameService.validateQRCode(
        selectedTeamId,
        extractedCode
      );
      addQRScannerLog(
        "QR Code Validation Result",
        {
          teamId: selectedTeamId,
          code: extractedCode,
          result: result,
          success: result.success,
          message: result.message,
        },
        result.success
      );

      if (result.success) {
        addQRScannerLog(
          "QR Validation Success - Team Flow Complete",
          {
            nextStep: "MCQ Answer Required",
            teamProgress: "Updated",
          },
          true
        );

        // Reload team details to see updated legs
        await loadTeamDetails(selectedTeamId);
      } else {
        addQRScannerLog(
          "QR Validation Failed",
          {
            reason: result.message,
            suggestion: "Check if team is at correct checkpoint",
          },
          false
        );
      }
    } catch (error) {
      addQRScannerLog(
        "QR Validation Error",
        {
          teamId: selectedTeamId,
          code: extractedCode,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        },
        false
      );
    }
  };

  // Enhanced camera diagnostics function
  const runCameraDiagnostics = async () => {
    addQRScannerLog(
      "🔍 Starting Camera Diagnostics",
      {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      },
      true
    );

    try {
      // Check browser support
      const browserSupport = {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        enumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
        permissions: 'permissions' in navigator,
        serviceWorker: 'serviceWorker' in navigator,
        isSecureContext: window.isSecureContext,
      };

      addQRScannerLog(
        "🌐 Browser Support Check",
        browserSupport,
        browserSupport.mediaDevices && browserSupport.getUserMedia
      );

      if (!browserSupport.mediaDevices || !browserSupport.getUserMedia) {
        addQRScannerLog(
          "❌ Browser Not Supported",
          { reason: "MediaDevices API not available" },
          false
        );
        return;
      }

      // Check for HTTPS requirement
      if (!window.isSecureContext) {
        addQRScannerLog(
          "⚠️ Insecure Context",
          { 
            protocol: window.location.protocol,
            host: window.location.host,
            warning: "Camera access requires HTTPS in production"
          },
          false
        );
      }

      // Enumerate devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        addQRScannerLog(
          "📹 Available Devices",
          {
            totalDevices: devices.length,
            videoInputs: videoDevices.length,
            audioInputs: devices.filter(d => d.kind === 'audioinput').length,
            audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
            deviceDetails: videoDevices.map(d => ({
              deviceId: d.deviceId.slice(0, 10) + '...',
              label: d.label || 'Unlabeled Camera',
              groupId: d.groupId?.slice(0, 10) + '...',
            })),
          },
          videoDevices.length > 0
        );
      } catch (enumError) {
        addQRScannerLog(
          "❌ Device Enumeration Failed",
          {
            error: enumError instanceof Error ? {
              name: enumError.name,
              message: enumError.message,
            } : enumError,
          },
          false
        );
      }

      // Check permissions
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          addQRScannerLog(
            "🔐 Permission Status",
            {
              state: permission.state,
              name: permission.name,
            },
            permission.state === 'granted'
          );
        } catch (permError) {
          addQRScannerLog(
            "❌ Permission Query Failed",
            {
              error: permError instanceof Error ? permError.message : permError,
            },
            false
          );
        }
      }

      // Test basic camera access
      try {
        addQRScannerLog("🎥 Testing Camera Access", {}, true);
        
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const capabilities = videoTrack.getCapabilities?.() || {};
        
        addQRScannerLog(
          "✅ Camera Access Successful",
          {
            streamActive: stream.active,
            trackCount: stream.getVideoTracks().length,
            settings: {
              deviceId: settings.deviceId?.slice(0, 10) + '...',
              facingMode: settings.facingMode,
              width: settings.width,
              height: settings.height,
              frameRate: settings.frameRate,
            },
            capabilities: {
              facingMode: capabilities.facingMode,
              width: capabilities.width,
              height: capabilities.height,
              frameRate: capabilities.frameRate,
            },
          },
          true
        );

        // Test different facing modes
        for (const facingMode of ['user', 'environment']) {
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode }
            });
            
            const track = testStream.getVideoTracks()[0];
            const testSettings = track.getSettings();
            
            addQRScannerLog(
              `📱 ${facingMode} Camera Test`,
              {
                facingMode: testSettings.facingMode,
                width: testSettings.width,
                height: testSettings.height,
                deviceId: testSettings.deviceId?.slice(0, 10) + '...',
              },
              true
            );
            
            testStream.getTracks().forEach(track => track.stop());
          } catch (facingError) {
            addQRScannerLog(
              `❌ ${facingMode} Camera Failed`,
              {
                error: facingError instanceof Error ? facingError.message : facingError,
              },
              false
            );
          }
        }

        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        addQRScannerLog(
          "🛑 Test Stream Stopped",
          { 
            tracksStoppedCount: stream.getVideoTracks().length,
          },
          true
        );

      } catch (accessError) {
        addQRScannerLog(
          "❌ Camera Access Failed",
          {
            error: accessError instanceof Error ? {
              name: accessError.name,
              message: accessError.message,
            } : accessError,
            errorType: accessError instanceof Error && accessError.name === 'NotAllowedError' 
              ? 'PERMISSION_DENIED'
              : accessError instanceof Error && accessError.name === 'NotFoundError'
              ? 'NO_CAMERA_FOUND'
              : accessError instanceof Error && accessError.name === 'NotReadableError'
              ? 'CAMERA_IN_USE'
              : 'OTHER',
          },
          false
        );
      }

      // Test Html5QrcodeScanner availability
      try {
        addQRScannerLog(
          "📚 Html5QrcodeScanner Check",
          {
            available: typeof Html5QrcodeScanner !== 'undefined',
            constructor: !!Html5QrcodeScanner,
            version: 'unknown',
          },
          typeof Html5QrcodeScanner !== 'undefined'
        );
      } catch (libraryError) {
        addQRScannerLog(
          "❌ Html5QrcodeScanner Check Failed",
          {
            error: libraryError instanceof Error ? libraryError.message : libraryError,
          },
          false
        );
      }

      addQRScannerLog(
        "🎯 Camera Diagnostics Complete",
        {
          timestamp: Date.now(),
          overallStatus: "DIAGNOSTICS_COMPLETED",
        },
        true
      );

    } catch (diagnosticsError) {
      addQRScannerLog(
        "💥 Diagnostics Error",
        {
          error: diagnosticsError instanceof Error ? {
            name: diagnosticsError.name,
            message: diagnosticsError.message,
            stack: diagnosticsError.stack?.slice(0, 500),
          } : diagnosticsError,
        },
        false
      );
    }
  };

  const initializeScanner = async () => {
    try {
      // Enhanced error catching wrapper
      addQRScannerLog(
        "🚀 Initialize Scanner Called",
        {
          timestamp: Date.now(),
          scannerExists: !!scannerRef.current,
          scannerInitialized,
          scannerActive,
          componentMounted: isComponentMountedRef.current,
        },
        true
      );

      if (scannerRef.current) {
        addQRScannerLog(
          "⚠️ Scanner Already Initialized",
          {
            scannerExists: !!scannerRef.current,
            scannerState: scannerActive ? "ACTIVE" : "INACTIVE",
            scannerInitialized: scannerInitialized,
          },
          false
        );
        return;
      }

      if (!isComponentMountedRef.current) {
        addQRScannerLog(
          "🚫 Component Unmounted - Skipping Initialization",
          {
            componentMounted: isComponentMountedRef.current,
          },
          false
        );
        return;
      }

      // Pre-flight checks
      addQRScannerLog(
        "🔍 Pre-flight Environment Check",
        {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          windowSize: { width: window.innerWidth, height: window.innerHeight },
          permissionState: cameraPermission,
          documentReadyState: document.readyState,
          locationHref: window.location.href,
          mediaDevicesSupported: !!navigator.mediaDevices,
          html5QrcodeAvailable: typeof Html5QrcodeScanner !== 'undefined',
          containerRefExists: !!scannerElementRef.current,
          // Try to get library version if available
          html5QrcodeVersion: (window as unknown as Record<string, unknown>).__HTML5_QRCODE_VERSION__ || 'unknown',
          html5QrcodeConstructor: Html5QrcodeScanner?.name || 'unknown',
        },
        true
      );

      // Check camera permissions first
      try {
        addQRScannerLog("🔐 Checking Camera Permissions", {}, true);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("MediaDevices not supported on this browser");
        }

        // Check if camera permission is available
        if ("permissions" in navigator) {
          try {
            const permission = await navigator.permissions.query({
              name: "camera" as PermissionName,
            });
            addQRScannerLog(
              "🔐 Camera Permission Status",
              { 
                state: permission.state,
                name: permission.name 
              },
              true
            );
          } catch (permError) {
            addQRScannerLog(
              "⚠️ Permission Query Failed",
              { 
                error: permError instanceof Error ? permError.message : permError 
              },
              false
            );
          }
        }
      } catch (permissionError) {
        addQRScannerLog(
          "❌ Camera Permission Check Failed",
          {
            error: permissionError instanceof Error ? {
              name: permissionError.name,
              message: permissionError.message,
            } : permissionError,
          },
          false
        );
        throw permissionError;
      }

    // Use a unique ID for this scanner instance to avoid conflicts
    const scannerId = `qr-scanner-debug-${Date.now()}`;

    addQRScannerLog(
      "⏳ Setting DOM Preparation Timeout",
      {
        scannerId,
        delay: "100ms",
      },
      true
    );

    // Add a small delay to ensure DOM is ready
    const timeout = setTimeout(async () => {
      try {
        addQRScannerLog(
          "🔄 DOM Timeout Handler Started",
          {
            componentMounted: isComponentMountedRef.current,
            scannerId,
          },
          true
        );

        if (!isComponentMountedRef.current) {
          addQRScannerLog(
            "🚫 Component Unmounted During Init - Aborting",
            {},
            false
          );
          return;
        }

        // Get the scanner container element
        const containerElement = scannerElementRef.current;
        if (!containerElement) {
          addQRScannerLog(
            "❌ Scanner Container Not Found",
            {
              refExists: !!scannerElementRef.current,
              scannerId,
            },
            false
          );
          return;
        }

        addQRScannerLog(
          "✅ Scanner Container Found",
          {
            elementExists: true,
            elementChildren: containerElement.children.length,
            containerTagName: containerElement.tagName,
            containerClasses: containerElement.className,
            containerId: containerElement.id,
          },
          true
        );

        // Enhanced DOM manipulation with error catching
        try {
          addQRScannerLog("🧹 Clearing Container", {}, true);
          
          // Check for existing scanner elements
          const existingScanner = containerElement.querySelector('[id*="qr-scanner"]');
          if (existingScanner) {
            addQRScannerLog(
              "⚠️ Found Existing Scanner Element",
              {
                existingId: existingScanner.id,
                existingClasses: existingScanner.className,
              },
              true
            );
          }

          // Safely clear container
          while (containerElement.firstChild) {
            try {
              containerElement.removeChild(containerElement.firstChild);
            } catch (removeError) {
              addQRScannerLog(
                "⚠️ Failed to Remove Child Element",
                {
                  error: removeError instanceof Error ? removeError.message : removeError,
                  childNodeType: containerElement.firstChild?.nodeType,
                  childNodeName: containerElement.firstChild?.nodeName,
                },
                false
              );
              break;
            }
          }

          addQRScannerLog("✅ Container Cleared Successfully", {}, true);

          const scannerDiv = document.createElement("div");
          scannerDiv.id = scannerId;
          scannerDiv.style.width = "100%";
          scannerDiv.style.minHeight = "300px";
          scannerDiv.style.position = "relative";
          scannerDiv.style.overflow = "hidden";
          
          containerElement.appendChild(scannerDiv);

          addQRScannerLog(
            "✅ Scanner Element Created",
            {
              scannerId: scannerId,
              elementCreated: true,
              parentElement: containerElement.tagName,
              elementInDOM: !!document.getElementById(scannerId),
            },
            true
          );

          // Wait a moment for DOM to settle
          await new Promise(resolve => setTimeout(resolve, 50));

          // Final verification before scanner creation
          const finalElementCheck = document.getElementById(scannerId);
          if (!finalElementCheck) {
            throw new Error(`Critical: Element ${scannerId} disappeared from DOM before scanner creation`);
          }
          
          addQRScannerLog(
            "🔍 Final Pre-Scanner Element Check", 
            {
              elementId: scannerId,
              elementExists: !!finalElementCheck,
              elementParentExists: !!finalElementCheck.parentElement,
              elementDimensions: {
                width: finalElementCheck.offsetWidth,
                height: finalElementCheck.offsetHeight,
              },
              elementStyles: {
                display: getComputedStyle(finalElementCheck).display,
                visibility: getComputedStyle(finalElementCheck).visibility,
                position: getComputedStyle(finalElementCheck).position,
              },
            }, 
            true
          );

        } catch (domError) {
          addQRScannerLog(
            "❌ DOM Manipulation Failed", 
            { 
              error: domError instanceof Error ? {
                name: domError.name,
                message: domError.message,
                stack: domError.stack?.slice(0, 300),
              } : domError 
            }, 
            false
          );
          throw domError;
        }

        try {
          // Enhanced configuration with error handling
          addQRScannerLog(
            "🔧 Configuring Scanner",
            {
              timestamp: Date.now(),
              scannerId,
            },
            true
          );

          // Mirror the actual QRScanner configuration
          const screenWidth = window.innerWidth;
          const qrBoxSize =
            screenWidth <= 480 ? 180 : screenWidth <= 768 ? 200 : 220;

          const config = {
            fps: 10,
            qrbox: { width: qrBoxSize, height: qrBoxSize },
            aspectRatio: 1.0,
            disableFlip: false,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            supportedScanTypes: [0, 1], // QR_CODE and DATA_MATRIX
          };

          addQRScannerLog(
            "📋 Scanner Configuration",
            {
              scannerId: scannerId,
              config: config,
              screenWidth: screenWidth,
              qrBoxSize: qrBoxSize,
              elementFound: !!document.getElementById(scannerId),
              html5QrcodeAvailable: !!Html5QrcodeScanner,
            },
            true
          );

          let scanner;
          try {
            addQRScannerLog("🏗️ Creating Scanner Instance", {}, true);
            
            // Check that the element exists and is ready
            const targetElement = document.getElementById(scannerId);
            if (!targetElement) {
              throw new Error(`Target element with ID ${scannerId} not found in DOM`);
            }
            
            addQRScannerLog(
              "✅ Target Element Verified",
              {
                elementId: scannerId,
                elementExists: true,
                elementParent: targetElement.parentElement?.tagName,
                elementRect: {
                  width: targetElement.offsetWidth,
                  height: targetElement.offsetHeight,
                },
              },
              true
            );
            
            // Verify Html5QrcodeScanner is available
            if (typeof Html5QrcodeScanner === 'undefined') {
              throw new Error("Html5QrcodeScanner is not available - check if html5-qrcode library is loaded");
            }
            
            addQRScannerLog(
              "✅ Html5QrcodeScanner Available",
              {
                constructorType: typeof Html5QrcodeScanner,
                prototype: Object.getOwnPropertyNames(Html5QrcodeScanner.prototype).slice(0, 5),
                version: "2.3.8", // Known from package.json
                constructorLength: Html5QrcodeScanner.length, // Number of required parameters
              },
              true
            );
            
            // Try creating scanner with more detailed error info
            try {
              scanner = new Html5QrcodeScanner(
                scannerId,
                config,
                false // verbose logging disabled for cleaner output
              );
            } catch (constructorError) {
              // Log constructor-specific error details
              addQRScannerLog(
                "❌ Constructor Error Details",
                {
                  constructorError: constructorError instanceof Error ? {
                    name: constructorError.name,
                    message: constructorError.message,
                    stack: constructorError.stack?.slice(0, 300),
                  } : constructorError,
                  scannerId,
                  config,
                  targetElementInDOM: !!document.getElementById(scannerId),
                  Html5QrcodeScannerAvailable: typeof Html5QrcodeScanner !== 'undefined',
                },
                false
              );
              
              // Try with minimal configuration as fallback
              addQRScannerLog("🔄 Attempting Fallback Configuration", {}, true);
              
              try {
                const fallbackConfig = {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                };
                
                scanner = new Html5QrcodeScanner(
                  scannerId,
                  fallbackConfig,
                  false
                );
                
                addQRScannerLog(
                  "✅ Fallback Scanner Created",
                  {
                    fallbackConfig,
                    scannerCreated: !!scanner,
                  },
                  true
                );
                
              } catch (fallbackError) {
                addQRScannerLog(
                  "❌ Fallback Scanner Creation Failed",
                  {
                    fallbackError: fallbackError instanceof Error ? {
                      name: fallbackError.name,
                      message: fallbackError.message,
                    } : fallbackError,
                  },
                  false
                );
                throw constructorError; // Throw original error
              }
            }
            
            addQRScannerLog(
              "✅ Scanner Instance Created",
              {
                scannerType: "Html5QrcodeScanner",
                hasScanner: !!scanner,
                scannerMethods: scanner ? Object.getOwnPropertyNames(Object.getPrototypeOf(scanner)).slice(0, 10) : [],
                scannerState: scanner?.getState?.() || "unknown",
              },
              true
            );
          } catch (scannerCreateError) {
            addQRScannerLog(
              "❌ Failed to Create Scanner Instance",
              {
                error: scannerCreateError instanceof Error ? {
                  name: scannerCreateError.name,
                  message: scannerCreateError.message,
                  stack: scannerCreateError.stack?.slice(0, 500),
                } : scannerCreateError,
                scannerId: scannerId,
                configUsed: config,
                html5QrcodeAvailable: typeof Html5QrcodeScanner !== 'undefined',
                elementExists: !!document.getElementById(scannerId),
              },
              false
            );
            throw scannerCreateError;
          }

          // Define success callback (mimics team flow)
          const onScanSuccess = (decodedText: string, decodedResult: unknown) => {
            try {
              addQRScannerLog(
                "📱 QR Scan Success Callback",
                {
                  componentMounted: isComponentMountedRef.current,
                  textLength: decodedText.length,
                  timestamp: Date.now(),
                },
                true
              );

              if (!isComponentMountedRef.current) {
                addQRScannerLog(
                  "⚠️ Scan Success but Component Unmounted",
                  { text: decodedText },
                  false
                );
                return;
              }

              addQRScannerLog(
                "🎯 QR Code Scan Success",
                {
                  rawText: decodedText,
                  textLength: decodedText.length,
                  textPreview: decodedText.slice(0, 50) + (decodedText.length > 50 ? '...' : ''),
                  decodedResult: {
                    format: (decodedResult as { result?: { format?: string } })
                      ?.result?.format,
                    timestamp: Date.now(),
                  },
                },
                true
              );

              setScannedCode(decodedText);

              // Extract valid code using regex (mimic actual flow)
              addQRScannerLog("🔍 Starting Code Extraction", {}, true);
              
              const extracted = extractValidCode(decodedText);
              setExtractedCode(extracted);

              addQRScannerLog(
                "✅ Code Extraction Complete",
                {
                  original: decodedText.slice(0, 100) + (decodedText.length > 100 ? '...' : ''),
                  extracted: extracted,
                  wasExtracted: extracted !== decodedText,
                  extractionSuccess: extracted.length > 0,
                },
                true
              );

              // Auto-fill manual code field (mimic actual flow)
              setManualCode(extracted);
              addQRScannerLog(
                "📝 Manual Field Auto-filled",
                {
                  code: extracted,
                  fieldUpdated: true,
                },
                true
              );

              // Simulate the team flow - validate the extracted code
              debugValidateExtractedCode(extracted);
            } catch (callbackError) {
              addQRScannerLog(
                "❌ Error in Scan Success Callback",
                {
                  error: callbackError instanceof Error ? {
                    name: callbackError.name,
                    message: callbackError.message,
                  } : callbackError,
                },
                false
              );
            }
          };

          // Define error callback with enhanced error categorization
          const onScanFailure = (error: string) => {
            try {
              // Categorize common scanner errors
              const isNormalScanError = error.includes("NotFoundException") ||
                                      error.includes("No MultiFormat Readers") ||
                                      error.includes("QR code parse error") ||
                                      error.includes("No QR code found");

              const isPermissionError = error.includes("Permission") ||
                                      error.includes("NotAllowed") ||
                                      error.includes("getUserMedia");

              const isDOMError = error.includes("removeChild") ||
                               error.includes("appendChild") ||
                               error.includes("getElementById");

              if (!isNormalScanError) {
                addQRScannerLog(
                  `⚠️ Scan Error ${isPermissionError ? '(PERMISSION)' : isDOMError ? '(DOM)' : '(OTHER)'}`,
                  {
                    error: error,
                    errorType: isPermissionError ? "PERMISSION" : isDOMError ? "DOM_MANIPULATION" : "OTHER",
                    isNormalScanError,
                    timestamp: Date.now(),
                  },
                  false
                );
              }
            } catch (errorCallbackError) {
              console.error("Error in scan failure callback:", errorCallbackError);
            }
          };

          addQRScannerLog(
            "🎬 Preparing Scanner Render",
            {
              hasSuccessCallback: !!onScanSuccess,
              hasErrorCallback: !!onScanFailure,
              scannerReady: !!scanner,
              elementExists: !!document.getElementById(scannerId),
              permissions: cameraPermission,
            },
            true
          );

          // Render the scanner with enhanced error handling
          try {
            addQRScannerLog("🎭 Rendering Scanner UI", {
              renderMethod: 'scanner.render',
              callbacksReady: typeof onScanSuccess === 'function' && typeof onScanFailure === 'function',
              preRenderState: scanner?.getState?.() || "unknown",
            }, true);
            
            // Check scanner state before rendering
            const currentState = scanner?.getState?.();
            if (currentState && String(currentState) !== '0') { // Convert to string for comparison
              addQRScannerLog(
                "⚠️ Scanner Not in Initial State",
                {
                  currentState,
                  expectedState: 'NOT_STARTED',
                  stateValue: String(currentState),
                },
                false
              );
            }
            
            // Wrap render call in try-catch to catch initialization errors
            const renderPromise = new Promise<void>((resolve, reject) => {
              let resolved = false;
              
              const resolveOnce = () => {
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              };
              
              const rejectOnce = (error: unknown) => {
                if (!resolved) {
                  resolved = true;
                  reject(error);
                }
              };
              
              try {
                scanner.render(
                  (decodedText: string, decodedResult: unknown) => {
                    onScanSuccess(decodedText, decodedResult);
                    // Don't resolve here as this is an ongoing scan callback
                  },
                  (error: string) => {
                    onScanFailure(error);
                    // Don't reject here as scan failures are normal
                  }
                );
                
                // Resolve immediately if render call succeeds
                resolveOnce();
                
              } catch (renderException) {
                rejectOnce(renderException);
              }
            });
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<void>((_, reject) => {
              setTimeout(() => reject(new Error("Scanner render timeout")), 5000);
            });
            
            await Promise.race([renderPromise, timeoutPromise]);
            
            addQRScannerLog(
              "🎉 Scanner Rendered Successfully",
              {
                scannerState: scanner?.getState?.() || "unknown",
                scannerId: scannerId,
                renderTimestamp: Date.now(),
                elementAfterRender: !!document.getElementById(scannerId),
                scannerContainerChildren: document.getElementById(scannerId)?.children.length || 0,
              },
              true
            );

            // Set the scanner reference and state
            scannerRef.current = scanner;
            setScannerInitialized(true);
            setScannerActive(true);

            addQRScannerLog(
              "🚀 Scanner Fully Initialized",
              {
                scannerInitialized: true,
                scannerActive: true,
                finalState: scanner?.getState?.() || "unknown",
                timestamp: Date.now(),
              },
              true
            );

          } catch (renderError) {
            addQRScannerLog(
              "❌ Scanner Render Failed",
              {
                error: renderError instanceof Error ? {
                  name: renderError.name,
                  message: renderError.message,
                  stack: renderError.stack?.slice(0, 500),
                } : renderError,
                scannerId: scannerId,
                elementExists: !!document.getElementById(scannerId),
                permissionState: cameraPermission,
                scannerState: scanner?.getState?.() || "unknown",
                isDOMConflict: renderError instanceof Error && 
                              (renderError.message.includes('removeChild') || 
                               renderError.message.includes('NotFoundError') ||
                               renderError.message.includes('React Router')),
                isPermissionError: renderError instanceof Error &&
                                 (renderError.message.includes('Permission') ||
                                  renderError.message.includes('NotAllowed') ||
                                  renderError.message.includes('getUserMedia')),
              },
              false
            );
            setScannerInitialized(false);
            setScannerActive(false);
            throw renderError;
          }

        } catch (scannerConfigError) {
          addQRScannerLog(
            "❌ Scanner Configuration/Setup Failed",
            {
              error: scannerConfigError instanceof Error ? {
                name: scannerConfigError.name,
                message: scannerConfigError.message,
                stack: scannerConfigError.stack?.slice(0, 500),
              } : scannerConfigError,
              timestamp: Date.now(),
              scannerId,
            },
            false
          );
          setScannerInitialized(false);
          setScannerActive(false);
          throw scannerConfigError;
        }

      } catch (timeoutError) {
        addQRScannerLog(
          "❌ Timeout Handler Error",
          {
            error: timeoutError instanceof Error ? {
              name: timeoutError.name,
              message: timeoutError.message,
              stack: timeoutError.stack?.slice(0, 500),
            } : timeoutError,
            timestamp: Date.now(),
          },
          false
        );
        setScannerInitialized(false);
        setScannerActive(false);
      }
    }, 100); // 100ms delay to ensure DOM is ready

    cleanupTimeoutRef.current = timeout;

    } catch (initError) {
      addQRScannerLog(
        "💥 Critical Initialization Error",
        {
          error: initError instanceof Error ? {
            name: initError.name,
            message: initError.message,
            stack: initError.stack?.slice(0, 500),
          } : initError,
          timestamp: Date.now(),
          location: "initializeScanner main function",
          cameraPermission,
          scannerRef: !!scannerRef.current,
          componentMounted: isComponentMountedRef.current,
        },
        false
      );
      setScannerInitialized(false);
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    addQRScannerLog(
      "🛑 Stop Scanner Called",
      { 
        hasScannerRef: !!scannerRef.current,
        scannerInitialized,
        scannerActive,
        timestamp: Date.now(),
      },
      true
    );

    if (!scannerRef.current) {
      addQRScannerLog("⚠️ No Scanner to Stop", {}, false);
      return;
    }

    addQRScannerLog(
      "🔄 Stopping Scanner Process",
      { 
        hasScanner: !!scannerRef.current,
        scannerState: scannerRef.current?.getState?.() || "unknown",
      },
      true
    );

    try {
      // Enhanced scanner clearing with timeout
      addQRScannerLog("🧹 Clearing Scanner Instance", {}, true);
      
      const clearPromise = scannerRef.current.clear();
      
      // Add timeout to clear operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Scanner clear timeout")), 5000)
      );
      
      await Promise.race([clearPromise, timeoutPromise]);
      
      addQRScannerLog(
        "✅ Scanner Cleared Successfully",
        { 
          clearDuration: Date.now(),
        },
        true
      );
    } catch (error) {
      addQRScannerLog(
        "❌ Scanner Clear Error",
        {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            isTimeout: error.message.includes("timeout"),
          } : error,
        },
        false
      );
    }

    // Clean up the scanner element safely with enhanced error handling
    try {
      if (scannerElementRef.current) {
        addQRScannerLog("🧹 Starting Container Cleanup", {}, true);
        
        // Check for any remaining scanner elements
        const scannerElements = scannerElementRef.current.querySelectorAll('[id*="qr-scanner"]');
        addQRScannerLog(
          "🔍 Found Scanner Elements",
          {
            elementCount: scannerElements.length,
            elementIds: Array.from(scannerElements).map(el => el.id),
          },
          true
        );

        // Safely clear the container content
        try {
          while (scannerElementRef.current.firstChild) {
            try {
              scannerElementRef.current.removeChild(scannerElementRef.current.firstChild);
            } catch (removeError) {
              addQRScannerLog(
                "⚠️ Failed to Remove Child During Cleanup",
                {
                  error: removeError instanceof Error ? removeError.message : removeError,
                  childType: scannerElementRef.current.firstChild?.nodeType,
                },
                false
              );
              break;
            }
          }
          
          addQRScannerLog(
            "✅ Scanner Container Cleared",
            {
              containerFound: true,
              childrenRemoved: true,
            },
            true
          );
        } catch (cleanupError) {
          addQRScannerLog(
            "❌ Container Cleanup Error",
            {
              error: cleanupError instanceof Error ? cleanupError.message : cleanupError,
            },
            false
          );
        }
      } else {
        addQRScannerLog("⚠️ Scanner Container Not Found for Cleanup", {}, false);
      }
    } catch (error) {
      addQRScannerLog(
        "❌ Container Cleanup Error",
        {
          error: error instanceof Error ? error.message : error,
        },
        false
      );
    }

    // Reset state with logging
    try {
      scannerRef.current = null;
      setScannerActive(false);
      setScannerInitialized(false);
      
      addQRScannerLog(
        "🔄 Scanner State Reset",
        {
          scannerActive: false,
          scannerInitialized: false,
          scannerRef: null,
          timestamp: Date.now(),
        },
        true
      );
    } catch (stateError) {
      addQRScannerLog(
        "❌ State Reset Error",
        {
          error: stateError instanceof Error ? stateError.message : stateError,
        },
        false
      );
    }
  };

  const extractValidCode = (scannedText: string): string => {
    addQRScannerLog(
      "Starting Code Extraction",
      {
        input: scannedText,
        inputLength: scannedText.length,
        inputType: typeof scannedText,
      },
      true
    );

    // Remove any whitespace and convert to uppercase
    const cleanText = scannedText.trim().toUpperCase();
    addQRScannerLog(
      "Text Cleaned",
      {
        original: scannedText,
        cleaned: cleanText,
        trimmed: scannedText.length !== cleanText.length,
      },
      true
    );

    // Pattern matching with priority order
    const patterns = [
      {
        name: "PUZZLE_XXXXXX",
        regex: /PUZZLE_\d{6}/,
        description: "Standard puzzle format with 6 digits",
      },
      {
        name: "CHECKPOINT_XXX",
        regex: /CHECKPOINT_[A-Z0-9_]+/,
        description: "Checkpoint format with alphanumeric code",
      },
      {
        name: "CP_XXX",
        regex: /CP_[A-Z0-9_]+/,
        description: "Short checkpoint format",
      },
      {
        name: "QR-HUNT-PATTERN",
        regex: /QR-HUNT-\d{4}-([A-Z0-9_]+)-/,
        description: "QR Hunt specific pattern with embedded code",
        extractGroup: 1,
      },
      {
        name: "URL_WITH_CODE",
        regex: /https?:\/\/[^\s]+\/([A-Z0-9_]+)$/i,
        description: "URL ending with code",
        extractGroup: 1,
      },
      {
        name: "GENERIC_CODE",
        regex: /([A-Z0-9_]{3,})/,
        description: "Generic alphanumeric code (3+ chars)",
        extractGroup: 1,
      },
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern.regex);
      if (match) {
        const extractedCode = pattern.extractGroup
          ? match[pattern.extractGroup]
          : match[0];
        addQRScannerLog(
          `Pattern Matched: ${pattern.name}`,
          {
            pattern: pattern.description,
            regex: pattern.regex.toString(),
            fullMatch: match[0],
            extractedCode: extractedCode,
            extractGroup: pattern.extractGroup || 0,
          },
          true
        );
        return extractedCode.toUpperCase();
      }
    }

    addQRScannerLog(
      "No Pattern Matched",
      {
        text: cleanText,
        patternsChecked: patterns.length,
        returning: cleanText,
      },
      false
    );

    return cleanText;
  };

  const testManualCodeExtraction = () => {
    if (!manualCode) {
      addQRScannerLog(
        "Manual Test Failed",
        { error: "No code entered" },
        false
      );
      return;
    }

    const extracted = extractValidCode(manualCode);
    setExtractedCode(extracted);
    addQRScannerLog(
      "Manual Code Tested",
      {
        input: manualCode,
        output: extracted,
        changed: extracted !== manualCode,
      },
      true
    );
  };

  const clearQRScannerLogs = () => {
    setQRScannerLogs([]);
    addQRScannerLog("Logs Cleared", {}, true);
  };

  const copyAllQRScannerLogs = async () => {
    try {
      if (qrScannerLogs.length === 0) {
        message.warning("No logs to copy");
        return;
      }

      // Format logs for copying
      const formattedLogs = qrScannerLogs.map((log) => {
        const status = log.success ? "SUCCESS" : "ERROR";
        const details = JSON.stringify(log.details, null, 2);
        return `[${log.timestamp}] ${log.event} - ${status}\n${details}\n${'='.repeat(80)}`;
      }).join('\n\n');

      const logHeader = `QR Scanner Debug Logs Export
Generated: ${new Date().toLocaleString()}
Total Logs: ${qrScannerLogs.length}
${'='.repeat(80)}\n\n`;

      const fullLogText = logHeader + formattedLogs;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullLogText);
      
      message.success(`Copied ${qrScannerLogs.length} logs to clipboard`);
      
      addQRScannerLog(
        "📋 Logs Copied to Clipboard",
        {
          totalLogs: qrScannerLogs.length,
          exportSize: fullLogText.length,
          timestamp: Date.now(),
        },
        true
      );
    } catch (error) {
      message.error("Failed to copy logs to clipboard");
      addQRScannerLog(
        "❌ Copy Logs Failed",
        {
          error: error instanceof Error ? error.message : error,
        },
        false
      );
    }
  };

  // Enhanced test for different QR patterns
  const testQRPatterns = () => {
    const testPatterns = [
      { input: "PUZZLE_123456", expected: "PUZZLE_123456" },
      { input: "CHECKPOINT_A1", expected: "CHECKPOINT_A1" },
      { input: "CP_001", expected: "CP_001" },
      {
        input: "https://treasure-hunt.com/PUZZLE_789012",
        expected: "PUZZLE_789012",
      },
      { input: "QR-HUNT-2025-CP_002-CHECKPOINT", expected: "CP_002" },
      { input: "Random text with CP_003 embedded", expected: "CP_003" },
      { input: "   CHECKPOINT_B5   ", expected: "CHECKPOINT_B5" }, // with whitespace
      { input: "checkpoint_c7", expected: "CHECKPOINT_C7" }, // lowercase
      { input: "Some random text", expected: "SOME" }, // fallback to first word
      { input: "INVALID", expected: "INVALID" },
      { input: "", expected: "" }, // empty string test
    ];

    addQRScannerLog(
      "🧪 Starting QR Pattern Tests",
      {
        totalPatterns: testPatterns.length,
      },
      true
    );

    let passedTests = 0;
    let failedTests = 0;

    testPatterns.forEach((test, index) => {
      const extracted = extractValidCode(test.input);
      const passed = extracted === test.expected;

      if (passed) passedTests++;
      else failedTests++;

      addQRScannerLog(
        `Test ${index + 1}: ${passed ? "✅ PASS" : "❌ FAIL"}`,
        {
          input: test.input,
          expected: test.expected,
          actual: extracted,
          passed: passed,
        },
        passed
      );
    });

    addQRScannerLog(
      "QR Pattern Tests Complete",
      {
        totalTests: testPatterns.length,
        passed: passedTests,
        failed: failedTests,
        successRate: `${((passedTests / testPatterns.length) * 100).toFixed(
          1
        )}%`,
      },
      failedTests === 0
    );
  };

  // Helper functions for rendering
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "Not started";
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCheckpointStatus = (leg: TeamLeg) => {
    if (leg.endTime && leg.endTime > 0) return "completed";
    if (leg.startTime && leg.startTime > 0) return "in_progress";
    return "not_started";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "in_progress":
        return "blue";
      case "not_started":
        return "gray";
      default:
        return "gray";
    }
  };

  // Table columns for legs display
  const legsColumns = [
    {
      title: "Checkpoint",
      dataIndex: "checkpoint",
      key: "checkpoint",
      render: (checkpoint: string, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text strong>{checkpoint}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {leg.puzzleId}
          </Text>
          <Tag color={getStatusColor(getCheckpointStatus(leg))}>
            {getCheckpointStatus(leg)}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Timing",
      key: "timing",
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>Start: {formatTimestamp(leg.startTime)}</Text>
          <Text>End: {formatTimestamp(leg.endTime || 0)}</Text>
          <Text strong>Duration: {formatDuration(leg.timeTaken)}</Text>
        </Space>
      ),
    },
    {
      title: "Points Breakdown",
      key: "points",
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>
            MCQ: <span style={{ color: "#1890ff" }}>{leg.mcqPoints}</span>
          </Text>
          <Text>
            Puzzle: <span style={{ color: "#52c41a" }}>{leg.puzzlePoints}</span>
          </Text>
          <Text>
            Time Bonus:{" "}
            <span style={{ color: leg.timeBonus >= 0 ? "#52c41a" : "#ff4d4f" }}>
              {leg.timeBonus >= 0 ? "+" : ""}
              {leg.timeBonus}
            </span>
          </Text>
          <Text strong>
            Total: {leg.mcqPoints + leg.puzzlePoints + leg.timeBonus}
          </Text>
        </Space>
      ),
    },
    {
      title: "MCQ Answer",
      key: "mcq",
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>{leg.mcqAnswerOptionId || "Not answered"}</Text>
          <Tag color={leg.isFirstCheckpoint ? "orange" : "default"}>
            {leg.isFirstCheckpoint ? "First Checkpoint" : "Regular"}
          </Tag>
        </Space>
      ),
    },
  ];

  // Debug logs table columns
  const logsColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 100,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 150,
    },
    {
      title: "Status",
      key: "success",
      width: 80,
      render: (_: unknown, log: DebugLog) => (
        <Tag color={log.success ? "green" : "red"}>
          {log.success ? "SUCCESS" : "ERROR"}
        </Tag>
      ),
    },
    {
      title: "Data",
      key: "data",
      render: (_: unknown, log: DebugLog) => (
        <pre style={{ fontSize: "11px", maxWidth: "400px", overflow: "auto" }}>
          {JSON.stringify(log.data, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <div className="auth-debugger" style={{ padding: "20px" }}>
      <Title level={2}>🔧 Treasure Hunt Game Debugger</Title>
      <Paragraph>
        Comprehensive debugging tool for testing game flow, checkpoint tracking,
        and leg data.
      </Paragraph>

      <Tabs
        defaultActiveKey="1"
        onChange={(activeKey) => {
          // Stop scanner when switching away from QR scanner tab
          if (activeKey !== "5" && scannerRef.current) {
            stopScanner();
          }
        }}
      >
        <TabPane tab="Game Testing" key="1">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Control Panel */}
            <Card title="🎮 Game Controls" size="small">
              <Space wrap>
                <Button
                  type="primary"
                  onClick={debugStartGame}
                  loading={loading}
                >
                  Start Game
                </Button>
                <Button onClick={loadInitialData} loading={loading}>
                  Reload Data
                </Button>
              </Space>
            </Card>

            {/* Team Selection */}
            <Card title="👥 Team Selection" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Select
                    placeholder="Select a team"
                    style={{ width: "100%" }}
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toString()
                        .toLowerCase()
                        .includes(input.toLowerCase()) ?? false
                    }
                  >
                    {teams.map((team) => (
                      <Option key={team.id} value={team.id}>
                        {team.username || team.id} (Members: {team.members})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Button
                    onClick={debugGetTeamProgress}
                    disabled={!selectedTeamId}
                    loading={loading}
                  >
                    Get Team Progress
                  </Button>
                </Col>
              </Row>

              {selectedTeam && (
                <div style={{ marginTop: "16px" }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Current Index"
                        value={selectedTeam.currentIndex}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total Points"
                        value={selectedTeam.totalPoints}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total Time"
                        value={formatDuration(selectedTeam.totalTime)}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Status"
                        value={selectedTeam.isActive ? "Active" : "Inactive"}
                        valueStyle={{
                          color: selectedTeam.isActive ? "#3f8600" : "#cf1322",
                        }}
                      />
                    </Col>
                  </Row>

                  {selectedTeam.roadmap && (
                    <div style={{ marginTop: "16px" }}>
                      <Text strong>Roadmap: </Text>
                      <Space wrap>
                        {selectedTeam.roadmap.map((checkpoint, index) => (
                          <Tag
                            key={index}
                            color={
                              index === selectedTeam.currentIndex
                                ? "blue"
                                : index < selectedTeam.currentIndex
                                ? "green"
                                : "default"
                            }
                          >
                            {index + 1}. {checkpoint}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* QR Code Testing */}
            <Card title="📱 QR Code Testing" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Input
                      placeholder="Enter QR code to test"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      addonBefore="QR Code"
                    />
                  </Col>
                  <Col span={12}>
                    <Button
                      type="primary"
                      onClick={debugValidateQR}
                      disabled={!selectedTeamId || !qrCode}
                      loading={loading}
                    >
                      Validate QR Code
                    </Button>
                  </Col>
                </Row>

                <Collapse size="small">
                  <Panel header="🗝️ Available Puzzle Codes" key="1">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {puzzles.map((puzzle) => (
                        <Row key={puzzle.id} align="middle" gutter={8}>
                          <Col span={8}>
                            <Text strong>{puzzle.checkpoint}</Text>
                          </Col>
                          <Col span={8}>
                            <Text code>{puzzle.code}</Text>
                          </Col>
                          <Col span={8}>
                            <Button
                              size="small"
                              onClick={() => setQrCode(puzzle.code)}
                            >
                              Use This Code
                            </Button>
                          </Col>
                        </Row>
                      ))}
                    </Space>
                  </Panel>
                </Collapse>
              </Space>
            </Card>

            {/* MCQ Testing */}
            <Card title="❓ MCQ Answer Testing" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Select
                      placeholder="Select MCQ option"
                      style={{ width: "100%" }}
                      value={selectedMCQOptionId}
                      onChange={setSelectedMCQOptionId}
                    >
                      {mcqs.flatMap((mcq) =>
                        mcq.options.map((option, index) => (
                          <Option
                            key={`${mcq.id}_option_${index}`}
                            value={option.id || `option_${index}`}
                          >
                            {option.text} (Points: {option.value})
                          </Option>
                        ))
                      )}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Button
                      type="primary"
                      onClick={debugSubmitMCQ}
                      disabled={
                        !selectedTeamId || !qrCode || !selectedMCQOptionId
                      }
                      loading={loading}
                    >
                      Submit MCQ Answer
                    </Button>
                  </Col>
                </Row>

                <Collapse size="small">
                  <Panel header="❓ All MCQ Options" key="1">
                    {mcqs.map((mcq) => (
                      <Card
                        key={mcq.id}
                        size="small"
                        style={{ marginBottom: "8px" }}
                      >
                        <Text strong>{mcq.text}</Text>
                        <div style={{ marginTop: "8px" }}>
                          {mcq.options.map((option, index) => (
                            <Tag
                              key={index}
                              color="blue"
                              style={{ cursor: "pointer", marginBottom: "4px" }}
                              onClick={() =>
                                setSelectedMCQOptionId(
                                  option.id || `option_${index}`
                                )
                              }
                            >
                              {option.text} ({option.value} pts)
                            </Tag>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </Panel>
                </Collapse>
              </Space>
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="Team Legs Data" key="2">
          {selectedTeam && selectedTeam.legs ? (
            <Card
              title={`🏃‍♂️ Legs Data for Team: ${
                selectedTeam.username || selectedTeam.id
              }`}
            >
              <Table
                columns={legsColumns}
                dataSource={selectedTeam.legs.map((leg, index) => ({
                  ...leg,
                  key: index,
                }))}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />

              <div style={{ marginTop: "16px" }}>
                <Text strong>Raw Legs Data:</Text>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(selectedTeam.legs, null, 2)}
                </pre>
              </div>
            </Card>
          ) : (
            <Card>
              <Text type="secondary">Select a team to view its legs data</Text>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Debug Logs" key="3">
          <Card title="📝 Debug Activity Logs">
            <Table
              columns={logsColumns}
              dataSource={debugLogs}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Data Overview" key="4">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="Total Teams" value={teams.length} />
              </Col>
              <Col span={6}>
                <Statistic title="Total Puzzles" value={puzzles.length} />
              </Col>
              <Col span={6}>
                <Statistic title="Total MCQs" value={mcqs.length} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Active Teams"
                  value={teams.filter((t) => t.isActive).length}
                />
              </Col>
            </Row>

            <Card title="🧩 All Puzzles" size="small">
              <Table
                dataSource={puzzles.map((p) => ({ ...p, key: p.id }))}
                columns={[
                  { title: "ID", dataIndex: "id", key: "id" },
                  {
                    title: "Checkpoint",
                    dataIndex: "checkpoint",
                    key: "checkpoint",
                  },
                  {
                    title: "Code",
                    dataIndex: "code",
                    key: "code",
                    render: (code) => <Text code>{code}</Text>,
                  },
                  {
                    title: "Starting",
                    dataIndex: "isStarting",
                    key: "isStarting",
                    render: (val) => (val ? "✅" : "❌"),
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>

            <Card title="❓ All MCQs" size="small">
              {mcqs.map((mcq) => (
                <Card key={mcq.id} size="small" style={{ marginBottom: "8px" }}>
                  <Text strong>{mcq.text}</Text>
                  <div style={{ marginTop: "8px" }}>
                    {mcq.options.map((option, index) => (
                      <Tag key={index} color="blue">
                        {option.text} ({option.value} pts)
                      </Tag>
                    ))}
                  </div>
                </Card>
              ))}
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="📱 QR Scanner Testing" key="5">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Enhanced Debugging Guide */}
            <Card title="🔧 QR Scanner Debugging Guide" size="small">
              <Alert
                message="Enhanced Debugging Available"
                description={
                  <div>
                    <p><strong>Step-by-step debugging process:</strong></p>
                    <ol style={{ marginLeft: "16px", marginBottom: "8px" }}>
                      <li><strong>Run Diagnostics</strong> - Check browser support, camera availability, and permissions</li>
                      <li><strong>Check Permissions</strong> - Verify camera access is granted</li>
                      <li><strong>Initialize Scanner</strong> - Start the QR scanner with enhanced error logging</li>
                      <li><strong>Monitor Logs</strong> - Watch the real-time logs below for detailed error information</li>
                    </ol>
                    <p><strong>Common Issues & Solutions:</strong></p>
                    <ul style={{ marginLeft: "16px" }}>
                      <li><strong>DOM conflicts:</strong> Look for "removeChild" errors - indicates React Router conflicts</li>
                      <li><strong>Permission denied:</strong> Click "Check Permissions" to request camera access</li>
                      <li><strong>Camera in use:</strong> Close other applications using the camera</li>
                      <li><strong>No camera found:</strong> Ensure camera is connected and drivers are installed</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            </Card>
            {/* Camera Permission Testing */}
            <Card title="📹 Camera Permission Testing" size="small">
              <Row gutter={16} align="middle" style={{ marginBottom: "16px" }}>
                <Col span={6}>
                  <Space direction="vertical">
                    <Text strong>Permission Status:</Text>
                    <Badge
                      status={
                        cameraPermission === "granted"
                          ? "success"
                          : cameraPermission === "denied"
                          ? "error"
                          : cameraPermission === "not-supported"
                          ? "warning"
                          : "default"
                      }
                      text={cameraPermission.toUpperCase()}
                    />
                  </Space>
                </Col>
                <Col span={6}>
                  <Button
                    type="primary"
                    onClick={checkCameraPermissions}
                    loading={loading}
                  >
                    Check Permissions
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    type="default"
                    onClick={runCameraDiagnostics}
                    loading={loading}
                  >
                    🔍 Run Diagnostics
                  </Button>
                </Col>
                <Col span={6}>
                  <Alert
                    message="Camera Info"
                    description={`${
                      navigator.userAgent.includes("Mobile")
                        ? "Mobile"
                        : "Desktop"
                    } | MediaDevices: ${
                      navigator.mediaDevices ? "✓" : "✗"
                    }`}
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
            </Card>

            {/* Scanner Controls */}
            <Card title="🔧 Scanner Controls" size="small">
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Space direction="vertical">
                    <Text strong>Scanner Status:</Text>
                    <Badge
                      status={
                        scannerActive
                          ? "processing"
                          : scannerInitialized
                          ? "success"
                          : "default"
                      }
                      text={
                        scannerActive
                          ? "ACTIVE"
                          : scannerInitialized
                          ? "INITIALIZED"
                          : "NOT INITIALIZED"
                      }
                    />
                  </Space>
                </Col>
                <Col span={6}>
                  <Button
                    type="primary"
                    onClick={initializeScanner}
                    disabled={scannerInitialized}
                  >
                    Initialize Scanner
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    danger
                    onClick={stopScanner}
                    disabled={!scannerInitialized}
                  >
                    Stop Scanner
                  </Button>
                </Col>
                <Col span={6}>
                  <Switch
                    checked={scannerActive}
                    disabled={!scannerInitialized}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </Col>
              </Row>
            </Card>

            {/* QR Pattern Testing */}
            <Card title="🧪 QR Pattern Testing" size="small">
              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Space direction="vertical">
                    <Text strong>Code Pattern Testing:</Text>
                    <Text type="secondary">
                      Test various QR code formats and extraction patterns
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Button onClick={testQRPatterns}>Test QR Patterns</Button>
                </Col>
              </Row>
            </Card>

            {/* QR Scanner Element */}
            <Card title="📷 Live QR Scanner" size="small">
              <div
                ref={scannerElementRef}
                style={{
                  minHeight: "300px",
                  border: "2px dashed #d9d9d9",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fafafa",
                }}
              >
                {!scannerInitialized && (
                  <Text type="secondary">
                    Click "Initialize Scanner" to start camera
                  </Text>
                )}
              </div>
            </Card>

            {/* Code Extraction Testing */}
            <Card title="🔍 Code Extraction Testing" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>Manual Code Testing:</Text>
                    <Input.TextArea
                      placeholder="Enter raw QR code text to test extraction..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={testManualCodeExtraction} type="dashed">
                      Test Code Extraction
                    </Button>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>Extraction Results:</Text>
                    <Alert
                      message="Last Scanned Code"
                      description={scannedCode || "No code scanned yet"}
                      type="info"
                      showIcon
                    />
                    <Alert
                      message="Extracted Code"
                      description={extractedCode || "No code extracted yet"}
                      type={extractedCode ? "success" : "warning"}
                      showIcon
                    />
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* QR Scanner Logs */}
            <Card title="📝 QR Scanner Debug Logs" size="small">
              <Row gutter={16} style={{ marginBottom: "16px" }}>
                <Col span={12}>
                  <Text strong>Real-time Scanner Events (Last 50)</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Space>
                    <Button onClick={copyAllQRScannerLogs} size="small" type="default">
                      📋 Copy All Logs
                    </Button>
                    <Button onClick={clearQRScannerLogs} size="small">
                      Clear Logs
                    </Button>
                  </Space>
                </Col>
              </Row>

              <Table
                dataSource={qrScannerLogs.map((log, index) => ({
                  ...log,
                  key: index,
                }))}
                columns={[
                  {
                    title: "Time",
                    dataIndex: "timestamp",
                    key: "timestamp",
                    width: 100,
                  },
                  {
                    title: "Event",
                    dataIndex: "event",
                    key: "event",
                    width: 200,
                  },
                  {
                    title: "Status",
                    key: "success",
                    width: 80,
                    render: (_: unknown, log: QRScannerLog) => (
                      <Tag color={log.success ? "green" : "red"}>
                        {log.success ? "SUCCESS" : "ERROR"}
                      </Tag>
                    ),
                  },
                  {
                    title: "Details",
                    key: "details",
                    render: (_: unknown, log: QRScannerLog) => (
                      <pre
                        style={{
                          fontSize: "11px",
                          maxWidth: "400px",
                          overflow: "auto",
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ),
                  },
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: true }}
              />
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </div>
  );
}

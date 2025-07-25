import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Input, Select, Card, Table, message, Tabs, Space, Typography, Collapse, Tag, Row, Col, Statistic, Alert, Switch, Badge } from 'antd';
import { Html5QrcodeScanner } from "html5-qrcode";
import { GameService } from '../services/GameService';
import { FirestoreService } from '../services/FireStoreService';
import type { Team, Puzzle, MCQ, TeamLeg } from '../types';
import './AuthDebugger.css';

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
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [selectedMCQOptionId, setSelectedMCQOptionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  // QR Scanner testing state
  const [qrScannerLogs, setQRScannerLogs] = useState<QRScannerLog[]>([]);
  const [cameraPermission, setCameraPermission] = useState<string>('unknown');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [extractedCode, setExtractedCode] = useState<string>('');
  const [scannerInitialized, setScannerInitialized] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  const isComponentMountedRef = useRef<boolean>(true);

  const addDebugLog = useCallback((action: string, data: unknown, success: boolean) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      data,
      success
    };
    setDebugLogs(prev => [log, ...prev.slice(0, 49)]); // Keep only last 50 logs
  }, []);

  const addQRScannerLog = useCallback((event: string, details: unknown, success: boolean) => {
    const log: QRScannerLog = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      details,
      success
    };
    setQRScannerLogs(prev => [log, ...prev.slice(0, 49)]); // Keep only last 50 logs
    console.log(`[QR Scanner Debug] ${event}:`, details);
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsData, puzzlesData, mcqsData] = await Promise.all([
        FirestoreService.getAllTeams(),
        FirestoreService.getAllPuzzles(),
        FirestoreService.getAllMCQs()
      ]);
      
      setTeams(teamsData);
      setPuzzles(puzzlesData);
      setMCQs(mcqsData);
      
      addDebugLog('loadInitialData', {
        teamsCount: teamsData.length,
        puzzlesCount: puzzlesData.length,
        mcqsCount: mcqsData.length
      }, true);
    } catch (error) {
      addDebugLog('loadInitialData', { error }, false);
      message.error('Failed to load initial data');
    }
    setLoading(false);
  }, [addDebugLog]);

  const loadTeamDetails = useCallback(async (teamId: string) => {
    try {
      const team = await FirestoreService.getTeam(teamId);
      setSelectedTeam(team);
      addDebugLog('loadTeamDetails', team, true);
    } catch (error) {
      addDebugLog('loadTeamDetails', { error }, false);
      message.error('Failed to load team details');
    }
  }, [addDebugLog]);

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
          scannerRef.current.clear().then(() => {
            scannerRef.current = null;
          }).catch((error: unknown) => {
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
      message.error('Please select a team and enter a QR code');
      return;
    }

    setLoading(true);
    try {
      const result = await GameService.validateQRCode(selectedTeamId, qrCode);
      addDebugLog('validateQRCode', { teamId: selectedTeamId, qrCode, result }, result.success);
      
      if (result.success) {
        message.success(`QR Validation: ${result.message}`);
        // Reload team details to see updated legs
        await loadTeamDetails(selectedTeamId);
      } else {
        message.error(`QR Validation Failed: ${result.message}`);
      }
    } catch (error) {
      addDebugLog('validateQRCode', { teamId: selectedTeamId, qrCode, error }, false);
      message.error('Error validating QR code');
    }
    setLoading(false);
  };

  const debugSubmitMCQ = async () => {
    if (!selectedTeamId || !qrCode || !selectedMCQOptionId) {
      message.error('Please select a team, enter QR code, and select MCQ option');
      return;
    }

    setLoading(true);
    try {
      const result = await GameService.submitMCQAnswer(selectedTeamId, qrCode, selectedMCQOptionId);
      addDebugLog('submitMCQAnswer', { 
        teamId: selectedTeamId, 
        qrCode, 
        optionId: selectedMCQOptionId, 
        result 
      }, result.success);
      
      if (result.success) {
        message.success(`MCQ Submitted: ${result.message}`);
        // Reload team details to see updated legs and progress
        await loadTeamDetails(selectedTeamId);
      } else {
        message.error(`MCQ Submission Failed: ${result.message}`);
      }
    } catch (error) {
      addDebugLog('submitMCQAnswer', { 
        teamId: selectedTeamId, 
        qrCode, 
        optionId: selectedMCQOptionId, 
        error 
      }, false);
      message.error('Error submitting MCQ answer');
    }
    setLoading(false);
  };

  const debugStartGame = async () => {
    setLoading(true);
    try {
      await GameService.startGame();
      addDebugLog('startGame', { success: true }, true);
      message.success('Game started successfully');
      // Reload all data
      await loadInitialData();
    } catch (error) {
      addDebugLog('startGame', { error }, false);
      message.error('Failed to start game');
    }
    setLoading(false);
  };

  const debugGetTeamProgress = async () => {
    if (!selectedTeamId) {
      message.error('Please select a team');
      return;
    }

    setLoading(true);
    try {
      const progress = await GameService.getTeamProgress(selectedTeamId);
      addDebugLog('getTeamProgress', { teamId: selectedTeamId, progress }, true);
      message.success('Team progress loaded');
    } catch (error) {
      addDebugLog('getTeamProgress', { teamId: selectedTeamId, error }, false);
      message.error('Failed to get team progress');
    }
    setLoading(false);
  };

  // QR Scanner Testing Functions
  const checkCameraPermissions = async () => {
    addQRScannerLog('Permission Check Started', { userAgent: navigator.userAgent }, true);
    
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = "Camera not supported on this device";
        setCameraPermission('not-supported');
        addQRScannerLog('Permission Check Failed', { error }, false);
        return;
      }

      // Get available camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        addQRScannerLog('Camera Devices Enumerated', { 
          totalDevices: devices.length,
          videoDevices: videoDevices.length,
          deviceLabels: videoDevices.map(d => d.label || 'Unlabeled Device'),
          deviceIds: videoDevices.map(d => d.deviceId.slice(0, 10) + '...')
        }, true);
      } catch (deviceError) {
        addQRScannerLog('Device Enumeration Failed', { error: deviceError }, false);
      }

      // Check current permission state
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(permission.state);
          addQRScannerLog('Permission State Checked', { state: permission.state }, true);
          
          // Listen for permission changes
          permission.onchange = () => {
            setCameraPermission(permission.state);
            addQRScannerLog('Permission State Changed', { newState: permission.state }, true);
          };
        } catch (error) {
          addQRScannerLog('Permission Query Failed', { error }, false);
        }
      }

      // Try to request camera access
      try {
        const constraints = {
          video: {
            facingMode: 'environment', // Try back camera first
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraPermission('granted');
        
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        
        addQRScannerLog('Camera Access Granted', { 
          streamActive: stream.active,
          tracks: stream.getVideoTracks().length,
          cameraSettings: {
            deviceId: settings.deviceId?.slice(0, 10) + '...',
            facingMode: settings.facingMode,
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate
          }
        }, true);
        
        // Stop the stream immediately as we just wanted to test permission
        stream.getTracks().forEach(track => track.stop());
        addQRScannerLog('Test Stream Stopped', {}, true);
      } catch (error) {
        setCameraPermission('denied');
        addQRScannerLog('Camera Access Denied', { 
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            constraint: (error as { constraint?: string }).constraint
          } : error
        }, false);
      }
    } catch (error) {
      setCameraPermission('error');
      addQRScannerLog('Permission Check Error', { error }, false);
    }
  };

  // Debug function to validate extracted code (mimics team flow)
  const debugValidateExtractedCode = async (extractedCode: string) => {
    if (!selectedTeamId) {
      addQRScannerLog('Validation Skipped - No Team Selected', { 
        extractedCode: extractedCode 
      }, false);
      return;
    }

    addQRScannerLog('Starting Code Validation', { 
      teamId: selectedTeamId,
      code: extractedCode,
      codeLength: extractedCode.length
    }, true);

    try {
      const result = await GameService.validateQRCode(selectedTeamId, extractedCode);
      addQRScannerLog('QR Code Validation Result', { 
        teamId: selectedTeamId,
        code: extractedCode,
        result: result,
        success: result.success,
        message: result.message
      }, result.success);

      if (result.success) {
        addQRScannerLog('QR Validation Success - Team Flow Complete', { 
          nextStep: 'MCQ Answer Required',
          teamProgress: 'Updated'
        }, true);
        
        // Reload team details to see updated legs
        await loadTeamDetails(selectedTeamId);
      } else {
        addQRScannerLog('QR Validation Failed', { 
          reason: result.message,
          suggestion: 'Check if team is at correct checkpoint'
        }, false);
      }
    } catch (error) {
      addQRScannerLog('QR Validation Error', { 
        teamId: selectedTeamId,
        code: extractedCode,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      }, false);
    }
  };

  const initializeScanner = () => {
    if (scannerRef.current) {
      addQRScannerLog('Scanner Already Initialized', { 
        scannerExists: !!scannerRef.current
      }, false);
      return;
    }

    if (!isComponentMountedRef.current) {
      addQRScannerLog('Component Unmounted - Skipping Initialization', {}, false);
      return;
    }

    addQRScannerLog('Starting Scanner Initialization', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    }, true);

    // Use a unique ID for this scanner instance to avoid conflicts
    const scannerId = `qr-scanner-debug-${Date.now()}`;
    
    // Add a small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      if (!isComponentMountedRef.current) {
        addQRScannerLog('Component Unmounted During Init - Aborting', {}, false);
        return;
      }

      // Get the scanner container element
      const containerElement = scannerElementRef.current;
      if (!containerElement) {
        addQRScannerLog('Scanner Container Not Found', { 
          refExists: !!scannerElementRef.current
        }, false);
        return;
      }

      addQRScannerLog('Scanner Container Found', { 
        elementExists: true,
        elementChildren: containerElement.children.length
      }, true);

      // Clear container and create a new div for the scanner
      try {
        containerElement.innerHTML = '';
        const scannerDiv = document.createElement('div');
        scannerDiv.id = scannerId;
        scannerDiv.style.width = '100%';
        scannerDiv.style.minHeight = '300px';
        containerElement.appendChild(scannerDiv);
        
        addQRScannerLog('Scanner Element Created', { 
          scannerId: scannerId,
          elementCreated: true
        }, true);
      } catch (error) {
        addQRScannerLog('Failed to Create Scanner Element', { error }, false);
        return;
      }

      try {
        // Mirror the actual QRScanner configuration
        const screenWidth = window.innerWidth;
        const qrBoxSize = screenWidth <= 480 ? 180 : screenWidth <= 768 ? 200 : 220;
        
        const config = {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize },
          aspectRatio: 1.0,
          disableFlip: false,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        };

        addQRScannerLog('Creating Scanner Instance', { 
          scannerId: scannerId,
          config: config,
          screenWidth: screenWidth,
          qrBoxSize: qrBoxSize
        }, true);

        const scanner = new Html5QrcodeScanner(
          scannerId,
          config,
          false // verbose logging disabled for cleaner output
        );

        addQRScannerLog('Scanner Instance Created', { 
          scannerType: 'Html5QrcodeScanner',
          hasScanner: !!scanner
        }, true);

        // Define success callback (mimics team flow)
        const onScanSuccess = (decodedText: string, decodedResult: unknown) => {
          if (!isComponentMountedRef.current) {
            addQRScannerLog('Scan Success but Component Unmounted', { text: decodedText }, false);
            return;
          }

          addQRScannerLog('QR Code Scan Success', { 
            rawText: decodedText,
            textLength: decodedText.length,
            decodedResult: {
              format: (decodedResult as { result?: { format?: string } })?.result?.format,
              timestamp: Date.now()
            }
          }, true);
          
          setScannedCode(decodedText);
          
          // Extract valid code using regex (mimic actual flow)
          const extracted = extractValidCode(decodedText);
          setExtractedCode(extracted);
          
          addQRScannerLog('Code Extraction Complete', { 
            original: decodedText,
            extracted: extracted,
            wasExtracted: extracted !== decodedText,
            extractionSuccess: extracted.length > 0
          }, true);

          // Auto-fill manual code field (mimic actual flow)
          setManualCode(extracted);
          addQRScannerLog('Manual Field Auto-filled', { 
            code: extracted,
            fieldUpdated: true
          }, true);

          // Simulate the team flow - validate the extracted code
          debugValidateExtractedCode(extracted);
        };

        // Define error callback
        const onScanFailure = (error: string) => {
          // Don't log every scan attempt failure as it's normal
          if (!error.includes('NotFoundException') && 
              !error.includes('No MultiFormat Readers') &&
              !error.includes('QR code parse error')) {
            addQRScannerLog('Scan Error', { 
              error: error,
              errorType: error.includes('Permission') ? 'PERMISSION' : 
                        error.includes('NotFound') ? 'NOT_FOUND' : 
                        error.includes('NotAllowed') ? 'NOT_ALLOWED' : 'OTHER'
            }, false);
          }
        };

        addQRScannerLog('Rendering Scanner UI', { 
          hasSuccessCallback: !!onScanSuccess,
          hasErrorCallback: !!onScanFailure
        }, true);

        // Render the scanner
        scanner.render(onScanSuccess, onScanFailure);
        
        // Set the scanner reference and state
        scannerRef.current = scanner;
        setScannerInitialized(true);
        setScannerActive(true);
        
        addQRScannerLog('Scanner Rendered Successfully', { 
          scannerState: 'ACTIVE',
          scannerId: scannerId
        }, true);

      } catch (error) {
        addQRScannerLog('Scanner Initialization Failed', { 
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.slice(0, 500)
          } : error,
          timestamp: Date.now()
        }, false);
        setScannerInitialized(false);
        setScannerActive(false);
      }
    }, 100); // 100ms delay to ensure DOM is ready

    cleanupTimeoutRef.current = timeout;
  };

  const stopScanner = async () => {
    if (!scannerRef.current) {
      addQRScannerLog('No Scanner to Stop', {}, false);
      return;
    }

    addQRScannerLog('Stopping Scanner', { hasScanner: !!scannerRef.current }, true);

    try {
      // Clear the scanner
      await scannerRef.current.clear();
      addQRScannerLog('Scanner Cleared Successfully', {}, true);
    } catch (error) {
      addQRScannerLog('Scanner Clear Error', { 
        error: error instanceof Error ? error.message : error 
      }, false);
    }

    // Clean up the scanner element safely
    try {
      if (scannerElementRef.current) {
        // Clear the container content safely
        scannerElementRef.current.innerHTML = '';
        addQRScannerLog('Scanner Container Cleared', { 
          containerFound: true 
        }, true);
      } else {
        addQRScannerLog('Scanner Container Not Found for Cleanup', {}, false);
      }
    } catch (error) {
      addQRScannerLog('Container Cleanup Error', { 
        error: error instanceof Error ? error.message : error 
      }, false);
    }

    // Reset state
    scannerRef.current = null;
    setScannerActive(false);
    setScannerInitialized(false);
    addQRScannerLog('Scanner State Reset', { 
      scannerActive: false,
      scannerInitialized: false
    }, true);
  };

  const extractValidCode = (scannedText: string): string => {
    addQRScannerLog('Starting Code Extraction', { 
      input: scannedText,
      inputLength: scannedText.length,
      inputType: typeof scannedText
    }, true);
    
    // Remove any whitespace and convert to uppercase
    const cleanText = scannedText.trim().toUpperCase();
    addQRScannerLog('Text Cleaned', { 
      original: scannedText, 
      cleaned: cleanText,
      trimmed: scannedText.length !== cleanText.length
    }, true);
    
    // Pattern matching with priority order
    const patterns = [
      {
        name: 'PUZZLE_XXXXXX',
        regex: /PUZZLE_\d{6}/,
        description: 'Standard puzzle format with 6 digits'
      },
      {
        name: 'CHECKPOINT_XXX',
        regex: /CHECKPOINT_[A-Z0-9_]+/,
        description: 'Checkpoint format with alphanumeric code'
      },
      {
        name: 'CP_XXX',
        regex: /CP_[A-Z0-9_]+/,
        description: 'Short checkpoint format'
      },
      {
        name: 'QR-HUNT-PATTERN',
        regex: /QR-HUNT-\d{4}-([A-Z0-9_]+)-/,
        description: 'QR Hunt specific pattern with embedded code',
        extractGroup: 1
      },
      {
        name: 'URL_WITH_CODE',
        regex: /https?:\/\/[^\s]+\/([A-Z0-9_]+)$/i,
        description: 'URL ending with code',
        extractGroup: 1
      },
      {
        name: 'GENERIC_CODE',
        regex: /([A-Z0-9_]{3,})/,
        description: 'Generic alphanumeric code (3+ chars)',
        extractGroup: 1
      }
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern.regex);
      if (match) {
        const extractedCode = pattern.extractGroup ? match[pattern.extractGroup] : match[0];
        addQRScannerLog(`Pattern Matched: ${pattern.name}`, { 
          pattern: pattern.description,
          regex: pattern.regex.toString(),
          fullMatch: match[0],
          extractedCode: extractedCode,
          extractGroup: pattern.extractGroup || 0
        }, true);
        return extractedCode.toUpperCase();
      }
    }

    addQRScannerLog('No Pattern Matched', { 
      text: cleanText,
      patternsChecked: patterns.length,
      returning: cleanText
    }, false);
    
    return cleanText;
  };

  const testManualCodeExtraction = () => {
    if (!manualCode) {
      addQRScannerLog('Manual Test Failed', { error: 'No code entered' }, false);
      return;
    }

    const extracted = extractValidCode(manualCode);
    setExtractedCode(extracted);
    addQRScannerLog('Manual Code Tested', { 
      input: manualCode,
      output: extracted,
      changed: extracted !== manualCode
    }, true);
  };

  const clearQRScannerLogs = () => {
    setQRScannerLogs([]);
    addQRScannerLog('Logs Cleared', {}, true);
  };

  // New function to simulate complete team flow
  const simulateTeamQRFlow = async () => {
    if (!selectedTeamId) {
      addQRScannerLog('Team Flow Simulation Failed', { 
        error: 'No team selected' 
      }, false);
      message.error('Please select a team first');
      return;
    }

    addQRScannerLog('🎯 Starting Team QR Flow Simulation', { 
      teamId: selectedTeamId,
      timestamp: Date.now()
    }, true);

    try {
      // Step 1: Get team details
      const team = await FirestoreService.getTeam(selectedTeamId);
      if (!team) {
        addQRScannerLog('Step 1: Team Not Found', { 
          teamId: selectedTeamId
        }, false);
        return;
      }
      
      addQRScannerLog('Step 1: Team Data Retrieved', { 
        teamId: team.id,
        currentIndex: team.currentIndex,
        isActive: team.isActive,
        roadmapLength: team.roadmap.length
      }, true);

      // Step 2: Check if team has next checkpoint
      if (team.currentIndex >= team.roadmap.length) {
        addQRScannerLog('Team Flow Complete', { 
          message: 'Team has completed all checkpoints'
        }, true);
        return;
      }

      const currentCheckpointId = team.roadmap[team.currentIndex];
      addQRScannerLog('Step 2: Current Checkpoint Identified', { 
        checkpointId: currentCheckpointId,
        index: team.currentIndex
      }, true);

      // Step 3: Get puzzle details for current checkpoint
      const puzzle = await FirestoreService.getPuzzle(currentCheckpointId);
      if (!puzzle) {
        addQRScannerLog('Step 3: Puzzle Not Found', { 
          checkpointId: currentCheckpointId
        }, false);
        return;
      }

      addQRScannerLog('Step 3: Puzzle Retrieved', { 
        puzzleId: puzzle.id,
        checkpoint: puzzle.checkpoint,
        code: puzzle.code,
        isStarting: puzzle.isStarting
      }, true);

      // Step 4: Simulate QR code scan with the correct code
      const simulatedQRText = `QR-HUNT-2025-${puzzle.code}-CHECKPOINT`;
      addQRScannerLog('Step 4: QR Code Scanned (Simulated)', { 
        rawQRText: simulatedQRText,
        expectedCode: puzzle.code
      }, true);

      // Step 5: Extract code (same as real flow)
      const extractedCode = extractValidCode(simulatedQRText);
      addQRScannerLog('Step 5: Code Extraction', { 
        originalText: simulatedQRText,
        extractedCode: extractedCode,
        matches: extractedCode === puzzle.code
      }, extractedCode === puzzle.code);

      // Step 6: Validate QR code (actual API call)
      addQRScannerLog('Step 6: Starting QR Validation', { 
        teamId: selectedTeamId,
        code: extractedCode
      }, true);

      const validationResult = await GameService.validateQRCode(selectedTeamId, extractedCode);
      addQRScannerLog('Step 6: QR Validation Result', { 
        success: validationResult.success,
        message: validationResult.message,
        result: validationResult
      }, validationResult.success);

      if (validationResult.success) {
        addQRScannerLog('✅ Team QR Flow Successful', { 
          nextStep: 'Team should proceed to MCQ',
          checkpointCompleted: currentCheckpointId
        }, true);
        
        // Reload team to see updated state
        await loadTeamDetails(selectedTeamId);
        message.success('QR Flow simulation completed successfully!');
      } else {
        addQRScannerLog('❌ Team QR Flow Failed', { 
          reason: validationResult.message
        }, false);
        message.error(`QR Flow failed: ${validationResult.message}`);
      }

    } catch (error) {
      addQRScannerLog('Team QR Flow Error', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      }, false);
      message.error('Error during team flow simulation');
    }
  };

  // Enhanced test for different QR patterns
  const testQRPatterns = () => {
    const testPatterns = [
      { input: 'PUZZLE_123456', expected: 'PUZZLE_123456' },
      { input: 'CHECKPOINT_A1', expected: 'CHECKPOINT_A1' },
      { input: 'CP_001', expected: 'CP_001' },
      { input: 'https://treasure-hunt.com/PUZZLE_789012', expected: 'PUZZLE_789012' },
      { input: 'QR-HUNT-2025-CP_002-CHECKPOINT', expected: 'CP_002' },
      { input: 'Random text with CP_003 embedded', expected: 'CP_003' },
      { input: '   CHECKPOINT_B5   ', expected: 'CHECKPOINT_B5' }, // with whitespace
      { input: 'checkpoint_c7', expected: 'CHECKPOINT_C7' }, // lowercase
      { input: 'Some random text', expected: 'SOME' }, // fallback to first word
      { input: 'INVALID', expected: 'INVALID' },
      { input: '', expected: '' }, // empty string test
    ];

    addQRScannerLog('🧪 Starting QR Pattern Tests', { 
      totalPatterns: testPatterns.length 
    }, true);

    let passedTests = 0;
    let failedTests = 0;

    testPatterns.forEach((test, index) => {
      const extracted = extractValidCode(test.input);
      const passed = extracted === test.expected;
      
      if (passed) passedTests++;
      else failedTests++;
      
      addQRScannerLog(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`, { 
        input: test.input,
        expected: test.expected,
        actual: extracted,
        passed: passed
      }, passed);
    });

    addQRScannerLog('QR Pattern Tests Complete', {
      totalTests: testPatterns.length,
      passed: passedTests,
      failed: failedTests,
      successRate: `${((passedTests / testPatterns.length) * 100).toFixed(1)}%`
    }, failedTests === 0);
  };

  // Helper functions for rendering
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return 'Not started';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCheckpointStatus = (leg: TeamLeg) => {
    if (leg.endTime && leg.endTime > 0) return 'completed';
    if (leg.startTime && leg.startTime > 0) return 'in_progress';
    return 'not_started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'not_started': return 'gray';
      default: return 'gray';
    }
  };

  // Table columns for legs display
  const legsColumns = [
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint',
      key: 'checkpoint',
      render: (checkpoint: string, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text strong>{checkpoint}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {leg.puzzleId}
          </Text>
          <Tag color={getStatusColor(getCheckpointStatus(leg))}>
            {getCheckpointStatus(leg)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Timing',
      key: 'timing',
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>Start: {formatTimestamp(leg.startTime)}</Text>
          <Text>End: {formatTimestamp(leg.endTime || 0)}</Text>
          <Text strong>Duration: {formatDuration(leg.timeTaken)}</Text>
        </Space>
      ),
    },
    {
      title: 'Points Breakdown',
      key: 'points',
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>MCQ: <span style={{ color: '#1890ff' }}>{leg.mcqPoints}</span></Text>
          <Text>Puzzle: <span style={{ color: '#52c41a' }}>{leg.puzzlePoints}</span></Text>
          <Text>Time Bonus: <span style={{ color: leg.timeBonus >= 0 ? '#52c41a' : '#ff4d4f' }}>{leg.timeBonus >= 0 ? '+' : ''}{leg.timeBonus}</span></Text>
          <Text strong>Total: {leg.mcqPoints + leg.puzzlePoints + leg.timeBonus}</Text>
        </Space>
      ),
    },
    {
      title: 'MCQ Answer',
      key: 'mcq',
      render: (_: unknown, leg: TeamLeg) => (
        <Space direction="vertical" size="small">
          <Text>{leg.mcqAnswerOptionId || 'Not answered'}</Text>
          <Tag color={leg.isFirstCheckpoint ? 'orange' : 'default'}>
            {leg.isFirstCheckpoint ? 'First Checkpoint' : 'Regular'}
          </Tag>
        </Space>
      ),
    },
  ];

  // Debug logs table columns
  const logsColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 150,
    },
    {
      title: 'Status',
      key: 'success',
      width: 80,
      render: (_: unknown, log: DebugLog) => (
        <Tag color={log.success ? 'green' : 'red'}>
          {log.success ? 'SUCCESS' : 'ERROR'}
        </Tag>
      ),
    },
    {
      title: 'Data',
      key: 'data',
      render: (_: unknown, log: DebugLog) => (
        <pre style={{ fontSize: '11px', maxWidth: '400px', overflow: 'auto' }}>
          {JSON.stringify(log.data, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <div className="auth-debugger" style={{ padding: '20px' }}>
      <Title level={2}>🔧 Treasure Hunt Game Debugger</Title>
      <Paragraph>
        Comprehensive debugging tool for testing game flow, checkpoint tracking, and leg data.
      </Paragraph>

      <Tabs defaultActiveKey="1" onChange={(activeKey) => {
        // Stop scanner when switching away from QR scanner tab
        if (activeKey !== "5" && scannerRef.current) {
          stopScanner();
        }
      }}>
        <TabPane tab="Game Testing" key="1">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Control Panel */}
            <Card title="🎮 Game Controls" size="small">
              <Space wrap>
                <Button type="primary" onClick={debugStartGame} loading={loading}>
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
                    style={{ width: '100%' }}
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                    }
                  >
                    {teams.map(team => (
                      <Option key={team.id} value={team.id}>
                        {team.username || team.id} (Members: {team.members})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Button onClick={debugGetTeamProgress} disabled={!selectedTeamId} loading={loading}>
                    Get Team Progress
                  </Button>
                </Col>
              </Row>

              {selectedTeam && (
                <div style={{ marginTop: '16px' }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic title="Current Index" value={selectedTeam.currentIndex} />
                    </Col>
                    <Col span={6}>
                      <Statistic title="Total Points" value={selectedTeam.totalPoints} />
                    </Col>
                    <Col span={6}>
                      <Statistic title="Total Time" value={formatDuration(selectedTeam.totalTime)} />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="Status" 
                        value={selectedTeam.isActive ? 'Active' : 'Inactive'} 
                        valueStyle={{ color: selectedTeam.isActive ? '#3f8600' : '#cf1322' }}
                      />
                    </Col>
                  </Row>
                  
                  {selectedTeam.roadmap && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>Roadmap: </Text>
                      <Space wrap>
                        {selectedTeam.roadmap.map((checkpoint, index) => (
                          <Tag 
                            key={index} 
                            color={index === selectedTeam.currentIndex ? 'blue' : index < selectedTeam.currentIndex ? 'green' : 'default'}
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
              <Space direction="vertical" style={{ width: '100%' }}>
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
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {puzzles.map(puzzle => (
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
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Select
                      placeholder="Select MCQ option"
                      style={{ width: '100%' }}
                      value={selectedMCQOptionId}
                      onChange={setSelectedMCQOptionId}
                    >
                      {mcqs.flatMap(mcq => 
                        mcq.options.map((option, index) => (
                          <Option key={`${mcq.id}_option_${index}`} value={option.id || `option_${index}`}>
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
                      disabled={!selectedTeamId || !qrCode || !selectedMCQOptionId}
                      loading={loading}
                    >
                      Submit MCQ Answer
                    </Button>
                  </Col>
                </Row>

                <Collapse size="small">
                  <Panel header="❓ All MCQ Options" key="1">
                    {mcqs.map(mcq => (
                      <Card key={mcq.id} size="small" style={{ marginBottom: '8px' }}>
                        <Text strong>{mcq.text}</Text>
                        <div style={{ marginTop: '8px' }}>
                          {mcq.options.map((option, index) => (
                            <Tag 
                              key={index} 
                              color="blue" 
                              style={{ cursor: 'pointer', marginBottom: '4px' }}
                              onClick={() => setSelectedMCQOptionId(option.id || `option_${index}`)}
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
            <Card title={`🏃‍♂️ Legs Data for Team: ${selectedTeam.username || selectedTeam.id}`}>
              <Table
                columns={legsColumns}
                dataSource={selectedTeam.legs.map((leg, index) => ({ ...leg, key: index }))}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
              
              <div style={{ marginTop: '16px' }}>
                <Text strong>Raw Legs Data:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
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
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
                <Statistic title="Active Teams" value={teams.filter(t => t.isActive).length} />
              </Col>
            </Row>

            <Card title="🧩 All Puzzles" size="small">
              <Table
                dataSource={puzzles.map(p => ({ ...p, key: p.id }))}
                columns={[
                  { title: 'ID', dataIndex: 'id', key: 'id' },
                  { title: 'Checkpoint', dataIndex: 'checkpoint', key: 'checkpoint' },
                  { title: 'Code', dataIndex: 'code', key: 'code', render: (code) => <Text code>{code}</Text> },
                  { title: 'Starting', dataIndex: 'isStarting', key: 'isStarting', render: (val) => val ? '✅' : '❌' },
                ]}
                pagination={false}
                size="small"
              />
            </Card>

            <Card title="❓ All MCQs" size="small">
              {mcqs.map(mcq => (
                <Card key={mcq.id} size="small" style={{ marginBottom: '8px' }}>
                  <Text strong>{mcq.text}</Text>
                  <div style={{ marginTop: '8px' }}>
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
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Camera Permission Testing */}
            <Card title="📹 Camera Permission Testing" size="small">
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Space direction="vertical">
                    <Text strong>Permission Status:</Text>
                    <Badge 
                      status={
                        cameraPermission === 'granted' ? 'success' :
                        cameraPermission === 'denied' ? 'error' :
                        cameraPermission === 'not-supported' ? 'warning' : 'default'
                      }
                      text={cameraPermission.toUpperCase()}
                    />
                  </Space>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    onClick={checkCameraPermissions}
                    loading={loading}
                  >
                    Check Camera Permissions
                  </Button>
                </Col>
                <Col span={8}>
                  <Alert
                    message="Camera Info"
                    description={`User Agent: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} | 
                                 MediaDevices: ${navigator.mediaDevices ? 'Supported' : 'Not Supported'}`}
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
                      status={scannerActive ? 'processing' : scannerInitialized ? 'success' : 'default'}
                      text={scannerActive ? 'ACTIVE' : scannerInitialized ? 'INITIALIZED' : 'NOT INITIALIZED'}
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

            {/* Team Flow Simulation */}
            <Card title="🎯 Team Flow Simulation" size="small">
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Space direction="vertical">
                    <Text strong>Selected Team:</Text>
                    <Text type="secondary">{selectedTeamId || 'No team selected'}</Text>
                  </Space>
                </Col>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    onClick={simulateTeamQRFlow}
                    disabled={!selectedTeamId}
                    loading={loading}
                  >
                    Simulate Full QR Flow
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    onClick={testQRPatterns}
                  >
                    Test QR Patterns
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: '8px' }}>
                <Col span={24}>
                  <Alert
                    message="Team Flow Simulation"
                    description="This simulates the complete team QR scanning workflow: team lookup → checkpoint identification → QR scan → code extraction → validation → MCQ readiness"
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
            </Card>

            {/* QR Scanner Element */}
            <Card title="📷 Live QR Scanner" size="small">
              <div 
                ref={scannerElementRef}
                style={{ 
                  minHeight: '300px', 
                  border: '2px dashed #d9d9d9', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa'
                }}
              >
                {!scannerInitialized && (
                  <Text type="secondary">Click "Initialize Scanner" to start camera</Text>
                )}
              </div>
            </Card>

            {/* Code Extraction Testing */}
            <Card title="🔍 Code Extraction Testing" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
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
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Extraction Results:</Text>
                    <Alert
                      message="Last Scanned Code"
                      description={scannedCode || 'No code scanned yet'}
                      type="info"
                      showIcon
                    />
                    <Alert
                      message="Extracted Code"
                      description={extractedCode || 'No code extracted yet'}
                      type={extractedCode ? 'success' : 'warning'}
                      showIcon
                    />
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* QR Scanner Logs */}
            <Card title="📝 QR Scanner Debug Logs" size="small">
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={12}>
                  <Text strong>Real-time Scanner Events (Last 50)</Text>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Button onClick={clearQRScannerLogs} size="small">
                    Clear Logs
                  </Button>
                </Col>
              </Row>
              
              <Table
                dataSource={qrScannerLogs.map((log, index) => ({ ...log, key: index }))}
                columns={[
                  {
                    title: 'Time',
                    dataIndex: 'timestamp',
                    key: 'timestamp',
                    width: 100,
                  },
                  {
                    title: 'Event',
                    dataIndex: 'event',
                    key: 'event',
                    width: 200,
                  },
                  {
                    title: 'Status',
                    key: 'success',
                    width: 80,
                    render: (_: unknown, log: QRScannerLog) => (
                      <Tag color={log.success ? 'green' : 'red'}>
                        {log.success ? 'SUCCESS' : 'ERROR'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Details',
                    key: 'details',
                    render: (_: unknown, log: QRScannerLog) => (
                      <pre style={{ fontSize: '11px', maxWidth: '400px', overflow: 'auto' }}>
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

            {/* QR Scanner Workflow Information */}
            <Card title="📋 QR Scanner Workflow Information" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Complete Team QR Scanning Workflow:</Text>
                  <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    <li><Text>Team opens QR scanner page</Text></li>
                    <li><Text>Camera permission is requested automatically</Text></li>
                    <li><Text>Scanner initializes with device camera</Text></li>
                    <li><Text>Team scans QR code at checkpoint</Text></li>
                    <li><Text>Raw QR text is captured</Text></li>
                    <li><Text>Code extraction using regex patterns</Text></li>
                    <li><Text>Extracted code is validated against team's current checkpoint</Text></li>
                    <li><Text>If valid, team progress is updated and MCQ is unlocked</Text></li>
                  </ol>
                </Col>
                <Col span={12}>
                  <Text strong>Debug Information Logged:</Text>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    <li><Text>Camera permission state and device info</Text></li>
                    <li><Text>Scanner initialization success/failure</Text></li>
                    <li><Text>Raw QR code text captured</Text></li>
                    <li><Text>Pattern matching and code extraction</Text></li>
                    <li><Text>Validation requests and responses</Text></li>
                    <li><Text>Team progress updates</Text></li>
                    <li><Text>Error messages and troubleshooting info</Text></li>
                  </ul>
                </Col>
              </Row>
              <Row style={{ marginTop: '16px' }}>
                <Col span={24}>
                  <Alert
                    message="Debugging Tips"
                    description={
                      <ul style={{ marginBottom: 0 }}>
                        <li>Use 'Simulate Full QR Flow' to test the complete workflow with a selected team</li>
                        <li>Test different QR patterns using the manual code extraction</li>
                        <li>Check camera permissions if scanning doesn't work</li>
                        <li>Monitor the debug logs for detailed error information</li>
                        <li>Ensure the team is at the correct checkpoint for QR validation</li>
                      </ul>
                    }
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
            </Card>

            {/* Test Patterns */}
            <Card title="🧪 Test Pattern Reference" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Supported Patterns:</Text>
                  <ul style={{ marginTop: '8px' }}>
                    <li><Text code>PUZZLE_123456</Text> - Puzzle format</li>
                    <li><Text code>CHECKPOINT_A1</Text> - Checkpoint format</li>
                    <li><Text code>CP_001</Text> - Generic format</li>
                    <li><Text code>https://example.com/CODE123</Text> - URL format</li>
                  </ul>
                </Col>
                <Col span={8}>
                  <Text strong>Quick Test Codes:</Text>
                  <Space direction="vertical" style={{ marginTop: '8px' }}>
                    <Button size="small" onClick={() => setManualCode('PUZZLE_123456')}>
                      Test Puzzle Pattern
                    </Button>
                    <Button size="small" onClick={() => setManualCode('CHECKPOINT_A1')}>
                      Test Checkpoint Pattern
                    </Button>
                    <Button size="small" onClick={() => setManualCode('https://treasure-hunt.com/CP_001')}>
                      Test URL Pattern
                    </Button>
                  </Space>
                </Col>
                <Col span={8}>
                  <Text strong>Available Puzzle Codes:</Text>
                  <Space direction="vertical" style={{ marginTop: '8px' }}>
                    {puzzles.slice(0, 3).map(puzzle => (
                      <Button 
                        key={puzzle.id}
                        size="small" 
                        onClick={() => setManualCode(puzzle.code)}
                      >
                        {puzzle.code}
                      </Button>
                    ))}
                  </Space>
                </Col>
              </Row>
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </div>
  );
}

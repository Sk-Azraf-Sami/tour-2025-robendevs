/**
 * TEAM GAME FLOW - ALIGNED WITH UPDATED PRD REQUIREMENTS
 * =====================================================
 *
 * This component implements the new roadmap-based treasure hunt system where:
 *
 * 1. ROADMAP PROGRESSION:
 *    - Each team gets a unique checkpoint roadmap (different order of same checkpoints)
 *    - roadmap[] = array of checkpoint IDs in unique order for each team
 *    - currentIndex = tracks which checkpoint the team is currently on
 *    - Example: roadmap = [cp0, cp5, cp2, cp7, cp1], currentIndex = 1 means cp5 is current
 *
 * 2. STEP-BY-STEP FLOW:
 *    a) Team scans QR code → System validates if code matches roadmap[currentIndex]
 *    b) If valid → Show MCQ for that checkpoint
 *    c) Team submits answer → Backend calculates points (MCQ points + time bonus/penalty)
 *    d) Save progress → Increment currentIndex → Show puzzle for NEXT checkpoint
 *    e) Puzzle gives clues to find roadmap[currentIndex] location
 *
 * 3. KEY VALIDATION RULES:
 *    - QR codes only work if they match the team's expected checkpoint
 *    - All teams visit ALL checkpoints but in different orders
 *    - Puzzle at checkpoint N hints toward location of checkpoint N+1
 *    - First checkpoint (cp0) is same for all teams
 *
 * 4. BACKEND INTEGRATION POINTS:
 *    - GameService.getTeamProgress(teamId) → get roadmap, currentIndex, points
 *    - GameService.validateQRCode(teamId, qrCode) → check if code matches current checkpoint
 *    - GameService.submitMCQAnswer(teamId, qrCode, answer) → save progress, get next puzzle
 *    - GameService.getNextPuzzle(teamId) → get puzzle for roadmap[currentIndex]
 *
 * 5. DUMMY IMPLEMENTATIONS:
 *    - All GameService calls are currently mocked with dummy data
 *    - Real backend integration should replace these mock implementations
 *    - QR scanner uses mock buttons for development (replace with actual camera)
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Typography,
  Progress,
  Alert,
  message,
  Spin,
  notification,
} from "antd";
import {
  QrcodeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import QRScanner from "./QRScanner";
import MCQQuestion from "./MCQQuestion";
import PuzzleView from "./PuzzleView";
import { GameService } from "../../services/GameService";
import { useAuth } from "../../contexts/auth";

const { Title, Text } = Typography;

// Types for the game state management
interface MCQData {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
    points: number;
  }>;
}

interface PuzzleData {
  id: string;
  text: string;
  imageURL?: string;
  hint?: string;
}

interface TeamGameState {
  currentStage: "loading" | "scan" | "mcq" | "puzzle" | "complete";
  currentCheckpointIndex: number;
  totalCheckpoints: number;
  totalPoints: number;
  elapsedTime: number;
  isGameActive: boolean;
  roadmap: string[]; // Array of checkpoint IDs in order for this team
  currentMCQ?: MCQData;
  currentPuzzle?: PuzzleData;
  scannedCode?: string;
}

export default function TeamGameFlow() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<TeamGameState>({
    currentStage: "loading",
    currentCheckpointIndex: 0,
    totalCheckpoints: 0,
    totalPoints: 0,
    elapsedTime: 0,
    isGameActive: true,
    roadmap: [],
  });
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  // Persist game state to localStorage on every change
  useEffect(() => {
    localStorage.setItem("teamGameFlowState", JSON.stringify(gameState));
  }, [gameState]);

  // Timer effect for elapsed time - only runs if team has started first checkpoint
  useEffect(() => {
    if (!gameState.isGameActive || !user?.id) return;

    const interval = setInterval(async () => {
      try {
        // Get the real elapsed time from backend (first checkpoint start to now)
        const teamProgress = await GameService.getTeamProgress(user.id);
        if (teamProgress) {
          setGameState((prev) => ({
            ...prev,
            elapsedTime: teamProgress.elapsedTime,
            totalPoints: teamProgress.totalPoints,
          }));
        }
      } catch (error) {
        console.error("Failed to update elapsed time:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isGameActive, user?.id]);

  // Initialize game state on mount
  const initializeGameState = useCallback(async () => {
    if (!user?.id) {
      message.error("User not authenticated");
      return;
    }

    try {
      // Get team progress from backend
      const teamProgress = await GameService.getTeamProgress(user.id);

      if (!teamProgress) {
        message.error("Failed to load team progress");
        return;
      }

      setGameState((prev) => ({
        ...prev,
        currentStage: "scan",
        roadmap: teamProgress.roadmap,
        currentCheckpointIndex: teamProgress.currentIndex,
        totalCheckpoints: teamProgress.roadmap.length,
        totalPoints: teamProgress.totalPoints,
        elapsedTime: teamProgress.elapsedTime,
        isGameActive: teamProgress.isGameActive,
      }));
    } catch (error) {
      console.error("Failed to initialize game state:", error);
      message.error("Failed to load game state. Please try again.");
    }
  }, [user?.id]);

  // Restore game state from localStorage on mount, then fetch backend
  useEffect(() => {
    const saved = localStorage.getItem("teamGameFlowState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(parsed);
      } catch {
        // Ignore parse errors
      }
    }
    initializeGameState();
  }, [initializeGameState]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleQRScanned = async (qrCode: string) => {
    if (!user?.id) {
      message.error("User not authenticated");
      return;
    }

    setIsProcessing(true);
    setShowScanner(false);

    try {
      // Validate QR code with backend
      const result = await GameService.validateQRCode(user.id, qrCode);

      if (result.success && result.mcq) {
        // All checkpoints (including first checkpoint cp_0) now require MCQ
        api.success({
          message: "QR Code Verified",
          description: "Proceeding to MCQ.",
          showProgress: true,
        });

        // Convert backend MCQ format to frontend format
        const formattedMCQ: MCQData = {
          id: result.mcq.id,
          text: result.mcq.text,
          options: result.mcq.options.map((opt, index) => ({
            id: opt.id || `option_${index}`,
            text: opt.text,
            points: opt.value || 0,
          })),
        };

        setGameState((prev) => ({
          ...prev,
          currentStage: "mcq",
          currentMCQ: formattedMCQ,
          scannedCode: qrCode,
        }));
      } else {
        api.error({
          message: "Invalid QR Code",
          description:
            result.message || "Please scan the correct checkpoint code.",
          showProgress: true,
        });
      }
    } catch (error) {
      console.error("QR validation failed:", error);
      message.error("Failed to validate QR code. Please try again.");
    }

    setIsProcessing(false);
  };

  const handleMCQSubmit = async (answer: {
    optionId: string;
    points: number;
  }) => {
    if (!user?.id || !gameState.scannedCode) {
      message.error("Missing required data for submission");
      return;
    }

    setIsProcessing(true);

    try {
      // Submit MCQ answer to backend
      const result = await GameService.submitMCQAnswer(
        user.id,
        gameState.scannedCode,
        answer.optionId
      );

      if (result.success) {
        message.success(`Correct! You earned ${result.pointsEarned} points.`);

        // Check if game is complete
        if (result.isGameComplete) {
          setGameState((prev) => ({
            ...prev,
            currentStage: "complete",
            totalPoints: prev.totalPoints + result.pointsEarned,
            isGameActive: false,
          }));
          message.success(
            "Congratulations! You have completed the treasure hunt!"
          );
          return;
        }

        // Convert backend puzzle format to frontend format if available
        let formattedPuzzle: PuzzleData | undefined;
        if (result.puzzle) {
          formattedPuzzle = {
            id: result.puzzle.id,
            text: result.puzzle.text,
            imageURL: result.puzzle.imageURL,
            hint: result.puzzle.hint,
          };
        }

        setGameState((prev) => ({
          ...prev,
          currentStage: "puzzle",
          totalPoints: prev.totalPoints + result.pointsEarned,
          currentPuzzle: formattedPuzzle,
          currentCheckpointIndex: prev.currentCheckpointIndex + 1,
        }));
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("MCQ submission failed:", error);
      message.error("Failed to submit answer. Please try again.");
    }

    setIsProcessing(false);
  };

  const handlePuzzleRead = () => {
    // User has read the puzzle and is ready to find the next location
    // The puzzle contains clues to find roadmap[currentCheckpointIndex]
    // (which was updated in handleMCQSubmit)

    // Check if game is complete
    if (gameState.currentCheckpointIndex >= gameState.totalCheckpoints) {
      setGameState((prev) => ({
        ...prev,
        currentStage: "complete",
        isGameActive: false,
      }));
      message.success("Congratulations! You have completed the treasure hunt!");
      return;
    }

    // Move to scan stage for the NEXT checkpoint
    setGameState((prev) => ({
      ...prev,
      currentStage: "scan",
      currentMCQ: undefined,
      currentPuzzle: undefined,
      scannedCode: undefined,
    }));

    message.info(
      `Now find the location described in the puzzle and scan the QR code for checkpoint ${gameState.currentCheckpointIndex + 1}!`
    );
  };

  const getProgressPercentage = () => {
    return (
      (gameState.currentCheckpointIndex / gameState.totalCheckpoints) * 100
    );
  };

  const getCurrentCheckpointNumber = () => {
    return gameState.currentCheckpointIndex + 1;
  };

  if (gameState.currentStage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <Spin size="large" />
          <Title level={4} className="mt-4">
            Loading Game State...
          </Title>
          <Text type="secondary">Please wait while we load your progress</Text>
        </Card>
      </div>
    );
  }

  if (gameState.currentStage === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto space-y-4">
          {/* Main Celebration Card */}
          <Card className="border-4 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-2xl relative overflow-hidden">
            {/* Decorative background pattern */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23fbbf24" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            />
            
            <div className="relative text-center space-y-4 sm:space-y-6 py-4 sm:py-8">
              {/* Trophy and confetti effect */}
              <div className="relative">
                <div className="text-6xl sm:text-8xl mb-4 relative">🏆</div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl sm:text-4xl animate-bounce">
                  🎉
                </div>
                <div className="absolute top-0 right-1/4 text-xl sm:text-3xl animate-pulse">
                  ✨
                </div>
                <div className="absolute top-2 left-1/4 text-xl sm:text-3xl animate-ping">
                  🎊
                </div>
              </div>

              {/* Celebration Text */}
              <div className="space-y-2 sm:space-y-3">
                <Title 
                  level={1} 
                  className="text-2xl sm:text-3xl md:text-4xl !mb-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  MISSION ACCOMPLISHED!
                </Title>
                <Text className="text-base sm:text-lg md:text-xl text-amber-700 font-medium block">
                  🎯 You've conquered the treasure hunt! 🎯
                </Text>
                <Text className="text-sm sm:text-base text-amber-600">
                  What an adventure! Your team has successfully navigated through all the challenges.
                </Text>
              </div>
            </div>
          </Card>

          {/* Time Achievement Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <ClockCircleOutlined className="text-2xl sm:text-3xl text-blue-600" />
                <Title level={3} className="text-lg sm:text-xl !mb-0 text-blue-700">
                  Your Journey Time
                </Title>
              </div>
              
              <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-100">
                <div className="text-3xl sm:text-5xl font-bold text-indigo-600 mb-2">
                  {formatTime(gameState.elapsedTime)}
                </div>
                <Text className="text-sm sm:text-base text-gray-600">
                  ⏱️ From start to finish
                </Text>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Text className="text-xs sm:text-sm text-blue-600">
                  🚀 All {gameState.totalCheckpoints} checkpoints completed!
                </Text>
              </div>
            </div>
          </Card>

          {/* Fun Completion Message */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
            <div className="text-center space-y-3">
              <div className="text-4xl sm:text-6xl mb-2">🎊🎉🏅</div>
              <Text className="text-sm sm:text-base text-purple-700 font-medium">
                Awesome teamwork! You've proven yourselves as true treasure hunters. 
                Take a moment to celebrate this epic achievement! 🌟
              </Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {contextHolder}
      {/* Header with Progress */}
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
          {getCurrentCheckpointNumber() > gameState.totalCheckpoints
            ? `Your team completed all ${gameState.totalCheckpoints} checkpoints`
            : `Checkpoint ${getCurrentCheckpointNumber()} of ${gameState.totalCheckpoints}`}
        </Title>
        <Text type="secondary" className="text-sm sm:text-base">
          Follow the roadmap to complete your treasure hunt
        </Text>
      </div>

      {/* Progress Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 mx-2 sm:mx-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <Text strong className="text-sm sm:text-base">
              Overall Progress
            </Text>
            <Text type="secondary" className="text-xs sm:text-sm">
              {parseFloat(getProgressPercentage().toFixed(2))}% Complete
            </Text>
          </div>
          <Progress
            percent={parseFloat(getProgressPercentage().toFixed(2))}
            strokeColor="#4f46e5"
          />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-1">
                <ClockCircleOutlined className="text-blue-500 mr-1 text-sm sm:text-base" />
                <Text strong className="text-xs sm:text-sm">
                  Time
                </Text>
              </div>
              <Text className="text-sm sm:text-base font-mono">
                {formatTime(gameState.elapsedTime)}
              </Text>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1">
                <TrophyOutlined className="text-yellow-500 mr-1 text-sm sm:text-base" />
                <Text strong className="text-xs sm:text-sm">
                  Points
                </Text>
              </div>
              <Text className="text-sm sm:text-base font-bold text-green-600">
                {gameState.totalPoints}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Stage-specific Content */}
      {gameState.currentStage === "scan" && (
        <Card className="mx-2 sm:mx-0">
          <div className="text-center space-y-4">
            <QrcodeOutlined className="text-6xl text-blue-500 mb-4" />
            <Title level={3} className="text-base sm:text-lg">
              Scan QR Code
            </Title>
            <Text className="text-gray-600 block mb-4 text-sm sm:text-base">
              Find and scan the QR code at your current checkpoint location
            </Text>

            <Alert
              message="🗺️ Roadmap System - How It Works"
              description={
                <div className="text-left space-y-2">
                  <p>
                    <strong>Your Unique Route:</strong> Your team follows a
                    personalized path through {gameState.totalCheckpoints}{" "}
                    checkpoints. Other teams visit the same locations but in
                    different orders.
                  </p>
                  <p>
                    <strong>Current Target:</strong> You are looking for
                    checkpoint {getCurrentCheckpointNumber()} of{" "}
                    {gameState.totalCheckpoints}. Only the QR code for THIS
                    specific checkpoint will work.
                  </p>
                  <p>
                    <strong>Scanning Options:</strong> You can either scan the
                    QR code OR manually enter the text code displayed at each
                    checkpoint location.
                  </p>
                  <p>
                    <strong>The Flow:</strong> Scan QR → Answer MCQ → Get Puzzle
                    → Find Next Location → Repeat
                  </p>
                  <p>
                    <strong>Scoring:</strong> Earn points from correct answers
                    plus time bonuses for speed!
                  </p>
                </div>
              }
              type="info"
              showIcon
              className="mb-4 text-left text-sm sm:text-base"
            />

            <Button
              type="primary"
              size="large"
              icon={<QrcodeOutlined />}
              onClick={() => setShowScanner(true)}
              className="w-full"
              loading={isProcessing}
              disabled={
                getCurrentCheckpointNumber() > gameState.totalCheckpoints
              }
            >
              {getCurrentCheckpointNumber() > gameState.totalCheckpoints
                ? "You completed all checkpoints"
                : window.innerWidth <= 480
                  ? `Scan or Enter Code CP-(${getCurrentCheckpointNumber()})`
                  : `Scan QR Code or Enter Code for Checkpoint ${getCurrentCheckpointNumber()}`}
            </Button>
          </div>
        </Card>
      )}

      {gameState.currentStage === "mcq" && gameState.currentMCQ && (
        <div className="mx-2 sm:mx-0">
          <MCQQuestion
            question={gameState.currentMCQ}
            onSubmit={handleMCQSubmit}
          />
        </div>
      )}

      {gameState.currentStage === "puzzle" && gameState.currentPuzzle && (
        <div className="mx-2 sm:mx-0">
          <PuzzleView
            puzzle={gameState.currentPuzzle}
            onProceedToScan={handlePuzzleRead}
          />
        </div>
      )}

      {/* Help Card */}
      <Card size="small" className="bg-blue-50 border-blue-200 mx-2 sm:mx-0">
        <div className="space-y-2">
          <Text className="text-sm text-blue-700 font-semibold block">
            🎯 Remember: Each checkpoint follows the same pattern
          </Text>
          <div className="text-xs text-blue-600 space-y-1">
            <div>
              1️⃣ <strong>Scan QR or Enter Code</strong> → Validate you're at the
              right checkpoint
            </div>
            <div>
              2️⃣ <strong>Answer MCQ</strong> → Earn points based on correctness
              + speed
            </div>
            <div>
              3️⃣ <strong>Get Puzzle</strong> → Receive clues to find your NEXT
              checkpoint
            </div>
            <div>
              4️⃣ <strong>Find Location</strong> → Use puzzle clues to locate the
              next checkpoint
            </div>
          </div>
          <Text className="text-xs text-blue-600 block mt-2">
            💡 <strong>Pro Tip:</strong> Each checkpoint has both a QR code and
            a text code. If scanning doesn't work, just enter the code manually!
            The puzzle you get after answering leads to your next checkpoint
            location.
          </Text>
        </div>
      </Card>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

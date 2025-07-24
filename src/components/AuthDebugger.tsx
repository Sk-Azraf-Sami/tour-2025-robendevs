import { useState, useEffect } from 'react';
import { Card, Button, Input, Typography, Space, Alert } from 'antd';
import { useAuth } from '../contexts/auth';
import { GameService } from '../services/GameService';
import { FirestoreService } from '../services/FireStoreService';

const { Title, Text } = Typography;

/**
 * DEBUG COMPONENT FOR AUTHENTICATION AND GAME FLOW TESTING
 * 
 * This component helps debug the authentication flow and game state management.
 */

export default function AuthDebugger() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [qrCode, setQrCode] = useState('PUZZLE_717316'); // Default test QR code
  const [results, setResults] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (user) {
      setDebugInfo(`Authenticated User:
ID: ${user.id}
Email: ${user.email}
Name: ${user.name}
Role: ${user.role}`);
    } else {
      setDebugInfo('No user authenticated');
    }
  }, [user]);

  const testUserAuthentication = async () => {
    if (!user) {
      log('❌ No user authenticated');
      return;
    }

    log(`✅ User authenticated: ${user.id} (${user.role})`);
    
    try {
      // Test if we can fetch team data
      const teamData = await FirestoreService.getTeam(user.id);
      if (teamData) {
        log(`✅ Team data found: ${JSON.stringify({
          id: teamData.id,
          username: teamData.username,
          roadmap: teamData.roadmap,
          currentIndex: teamData.currentIndex,
          isActive: teamData.isActive
        })}`);
      } else {
        log(`❌ No team data found for ID: ${user.id}`);
      }
    } catch (error) {
      log(`❌ Error fetching team data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testGameProgress = async () => {
    if (!user?.id) {
      log('❌ No user ID available');
      return;
    }

    try {
      const progress = await GameService.getTeamProgress(user.id);
      if (progress) {
        log(`✅ Game progress: ${JSON.stringify(progress, null, 2)}`);
      } else {
        log(`❌ No game progress found for team: ${user.id}`);
      }
    } catch (error) {
      log(`❌ Error getting game progress: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

    const testQRValidation = async () => {
    if (!user) {
      log('❌ No user authenticated');
      return;
    }

    log(`🔍 Testing QR Code validation for team: ${user.id}`);
    log(`📱 QR Code to test: "${qrCode}"`);
    
    try {
      // First, let's see what the team's current puzzle should be
      const teamData = await FirestoreService.getTeam(user.id);
      if (teamData) {
        const currentPuzzleId = teamData.roadmap[teamData.currentIndex];
        log(`🎯 Team's current puzzle ID: ${currentPuzzleId} (index ${teamData.currentIndex})`);
        
        // Get the puzzle for this ID to see what the correct code should be
        const currentPuzzle = await FirestoreService.getPuzzle(currentPuzzleId);
        if (currentPuzzle) {
          log(`✅ Expected QR code for current puzzle: "${currentPuzzle.code}"`);
          log(`📝 Puzzle text: "${currentPuzzle.text}"`);
          log(`🏷️ Puzzle checkpoint label: "${currentPuzzle.checkpoint}"`);
        } else {
          log(`❌ No puzzle found for ID: ${currentPuzzleId}`);
        }
      }
      
      const result = await GameService.validateQRCode(user.id, qrCode);
      
      if (result.success) {
        log('✅ QR Code validation successful!');
        log(`📝 MCQ returned: ${JSON.stringify(result.mcq, null, 2)}`);
      } else {
        log(`❌ QR Code validation failed: ${result.message}`);
      }
    } catch (error) {
      log(`💥 Error during QR validation: ${error}`);
    }
  };

  const debugTeamInfo = async () => {
    if (!user?.id) {
      log('❌ No user ID available');
      return;
    }

    try {
      await GameService.debugTeamInfo(user.id);
      log('✅ Debug info logged to console');
    } catch (error) {
      log(`❌ Error debugging team info: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const startGameForAllTeams = async () => {
    try {
      log('🚀 Starting game for all teams...');
      await GameService.startGame();
      log('✅ Game started successfully! All teams are now active.');
    } catch (error) {
      log(`❌ Error starting game: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearLogs = () => setResults([]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <Title level={3}>🔧 Authentication & Game Flow Debugger</Title>
        
        <Alert
          message="Current Authentication Status"
          description={debugInfo}
          type={user ? "success" : "warning"}
          showIcon
          className="mb-4"
        />

        <Space direction="vertical" size="middle" className="w-full">
          <div>
            <Text strong>Authentication Tests:</Text>
            <div className="mt-2 space-x-2">
              <Button onClick={testUserAuthentication}>
                Test User Authentication
              </Button>
              <Button onClick={testGameProgress}>
                Test Game Progress
              </Button>
              <Button onClick={debugTeamInfo}>
                Debug Team Info (Console)
              </Button>
            </div>
          </div>

          <div>
            <Text strong>Game Control:</Text>
            <div className="mt-2">
              <Button onClick={startGameForAllTeams} type="primary" danger>
                🚀 Start Game (Activate All Teams)
              </Button>
              <div className="mt-1">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This will set isActive=true for all teams so they can play
                </Text>
              </div>
            </div>
          </div>

          <div>
            <Text strong>QR Code Testing:</Text>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Enter QR code to test"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <div>
                <Button onClick={testQRValidation} type="primary">
                  Test QR Code Validation
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Button onClick={clearLogs} danger>
              Clear Logs
            </Button>
          </div>
        </Space>
      </Card>

      {results.length > 0 && (
        <Card>
          <Title level={4}>📋 Debug Results</Title>
          <div 
            className="bg-gray-100 p-3 rounded max-h-96 overflow-y-auto font-mono text-sm"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {results.join('\n')}
          </div>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Card, Button, Input, Typography, Space, Alert, Divider } from 'antd';
import { GameService } from '../services/GameService';
import { FirestoreService } from '../services/FireStoreService';
import type { Team } from '../types';

const { Title, Text } = Typography;

/**
 * BACKEND TESTING COMPONENT
 * 
 * This component provides a testing interface for the teams backend implementation.
 * Use this to verify that all GameService methods work correctly with the database.
 */

export default function BackendTester() {
  const [teamId, setTeamId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [optionId, setOptionId] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => setResults([]);

  const testGetTeamProgress = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const progress = await GameService.getTeamProgress(teamId);
      log(`Team Progress: ${JSON.stringify(progress, null, 2)}`);
    } catch (error) {
      log(`Error getting team progress: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testValidateQR = async () => {
    if (!teamId || !qrCode) return;
    setLoading(true);
    try {
      const result = await GameService.validateQRCode(teamId, qrCode);
      log(`QR Validation: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      log(`Error validating QR: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testSubmitMCQ = async () => {
    if (!teamId || !qrCode || !optionId) return;
    setLoading(true);
    try {
      const result = await GameService.submitMCQAnswer(teamId, qrCode, optionId);
      log(`MCQ Submission: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      log(`Error submitting MCQ: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testStartGame = async () => {
    setLoading(true);
    try {
      await GameService.startGame();
      log('Game started successfully for all teams');
    } catch (error) {
      log(`Error starting game: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testGetAllTeams = async () => {
    setLoading(true);
    try {
      const teams = await FirestoreService.getAllTeams();
      log(`All Teams: ${JSON.stringify(teams.map((t: Team) => ({ id: t.id, username: t.username, roadmap: t.roadmap, currentIndex: t.currentIndex })), null, 2)}`);
    } catch (error) {
      log(`Error getting teams: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testGetAllMCQs = async () => {
    setLoading(true);
    try {
      const mcqs = await FirestoreService.getAllMCQs();
      log(`All MCQs: ${JSON.stringify(mcqs, null, 2)}`);
    } catch (error) {
      log(`Error getting MCQs: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testGetAllPuzzles = async () => {
    setLoading(true);
    try {
      const puzzles = await FirestoreService.getAllPuzzles();
      log(`All Puzzles: ${JSON.stringify(puzzles, null, 2)}`);
    } catch (error) {
      log(`Error getting puzzles: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  const testDebugTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      await GameService.debugTeamInfo(teamId);
      log('Debug info logged to console');
    } catch (error) {
      log(`Error debugging team: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Title level={2}>Backend Testing Interface</Title>
      <Alert
        message="Testing Environment"
        description="Use this interface to test all backend methods. Check console and results below for detailed output."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Panel */}
        <Card title="Test Inputs">
          <Space direction="vertical" className="w-full">
            <div>
              <Text strong>Team ID:</Text>
              <Input
                placeholder="Enter team ID"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>
            <div>
              <Text strong>QR Code:</Text>
              <Input
                placeholder="Enter QR code"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
              />
            </div>
            <div>
              <Text strong>Option ID:</Text>
              <Input
                placeholder="Enter MCQ option ID"
                value={optionId}
                onChange={(e) => setOptionId(e.target.value)}
              />
            </div>
          </Space>
        </Card>

        {/* Test Actions */}
        <Card title="Test Actions">
          <Space direction="vertical" className="w-full">
            <Button 
              type="primary" 
              onClick={testGetAllTeams}
              loading={loading}
              block
            >
              Get All Teams
            </Button>
            <Button 
              onClick={testGetAllMCQs}
              loading={loading}
              block
            >
              Get All MCQs
            </Button>
            <Button 
              onClick={testGetAllPuzzles}
              loading={loading}
              block
            >
              Get All Puzzles
            </Button>
            <Divider />
            <Button 
              onClick={testStartGame}
              loading={loading}
              block
              type="dashed"
            >
              Start Game (All Teams)
            </Button>
            <Button 
              onClick={testGetTeamProgress}
              loading={loading}
              block
              disabled={!teamId}
            >
              Get Team Progress
            </Button>
            <Button 
              onClick={testValidateQR}
              loading={loading}
              block
              disabled={!teamId || !qrCode}
            >
              Validate QR Code
            </Button>
            <Button 
              onClick={testSubmitMCQ}
              loading={loading}
              block
              disabled={!teamId || !qrCode || !optionId}
            >
              Submit MCQ Answer
            </Button>
            <Button 
              onClick={testDebugTeam}
              loading={loading}
              block
              disabled={!teamId}
            >
              Debug Team (Console)
            </Button>
          </Space>
        </Card>
      </div>

      {/* Results Panel */}
      <Card title="Test Results" className="mt-4">
        <div className="mb-2">
          <Button onClick={clearLogs} size="small">
            Clear Logs
          </Button>
        </div>
        <div 
          className="bg-gray-50 p-3 rounded border h-64 overflow-y-auto font-mono text-xs"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {results.length === 0 ? 
            'No results yet. Run some tests above.' : 
            results.join('\n\n')
          }
        </div>
      </Card>

      <Alert
        message="Quick Test Guide"
        description={
          <div className="text-left">
            <p><strong>1. Get All Teams</strong> - See available teams and their roadmaps</p>
            <p><strong>2. Copy a team ID</strong> - Use it for team-specific tests</p>
            <p><strong>3. Get All Puzzles</strong> - See checkpoint codes to test QR validation</p>
            <p><strong>4. Start Game</strong> - Activate all teams for testing</p>
            <p><strong>5. Test QR Validation</strong> - Use puzzle codes from step 3</p>
          </div>
        }
        type="warning"
        className="mt-4"
      />
    </div>
  );
}

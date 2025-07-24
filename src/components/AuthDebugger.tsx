import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, Card, Table, message, Tabs, Space, Typography, Collapse, Tag, Row, Col, Statistic } from 'antd';
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

  const addDebugLog = useCallback((action: string, data: unknown, success: boolean) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      data,
      success
    };
    setDebugLogs(prev => [log, ...prev.slice(0, 49)]); // Keep only last 50 logs
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

      <Tabs defaultActiveKey="1">
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
      </Tabs>
    </div>
  );
}

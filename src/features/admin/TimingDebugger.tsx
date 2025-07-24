import { useState } from 'react';
import { Card, Input, Button, Space, Alert, Typography, Descriptions, Table, Tag } from 'antd';
import { GameService } from '../../services/GameService';

const { Title, Text } = Typography;

interface TimingDebugInfo {
  teamId: string;
  currentStatus: string;
  timingIssues: string[];
  legs: Array<{
    index: number;
    checkpoint: string;
    startTime: number;
    endTime: number | undefined;
    timeTaken: number;
    mcqPoints: number;
    puzzlePoints: number;
    timeBonus: number;
    isFirstCheckpoint: boolean;
    status: string;
  }>;
  recommendations: string[];
}

interface TimingStats {
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  stuckTeams: { teamId: string; stuckMinutes: number; checkpoint: string }[];
  averageTimePerCheckpoint: { [checkpoint: string]: number };
}

export default function TimingDebugger() {
  const [teamId, setTeamId] = useState('');
  const [debugInfo, setDebugInfo] = useState<TimingDebugInfo | null>(null);
  const [timingStats, setTimingStats] = useState<TimingStats | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDebugTeam = async () => {
    if (!teamId.trim()) return;
    
    setLoading(true);
    try {
      const info = await GameService.debugTeamTiming(teamId.trim());
      setDebugInfo(info);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStats = async () => {
    setLoading(true);
    try {
      const stats = await GameService.getTimingStatistics();
      setTimingStats(stats);
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Not set';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const legsColumns = [
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
      width: 60,
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint',
      key: 'checkpoint',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'completed' ? 'green' : 
                     status === 'current' ? 'blue' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: formatTimestamp,
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (endTime: number | undefined) => formatTimestamp(endTime || 0),
    },
    {
      title: 'Duration',
      dataIndex: 'timeTaken',
      key: 'timeTaken',
      render: formatDuration,
    },
    {
      title: 'MCQ Points',
      dataIndex: 'mcqPoints',
      key: 'mcqPoints',
    },
    {
      title: 'Puzzle Points',
      dataIndex: 'puzzlePoints',
      key: 'puzzlePoints',
    },
    {
      title: 'Time Bonus',
      dataIndex: 'timeBonus',
      key: 'timeBonus',
      render: (bonus: number) => (
        <span style={{ color: bonus > 0 ? 'green' : bonus < 0 ? 'red' : 'inherit' }}>
          {bonus > 0 ? '+' : ''}{bonus}
        </span>
      ),
    },
    {
      title: 'First CP',
      dataIndex: 'isFirstCheckpoint',
      key: 'isFirstCheckpoint',
      render: (isFirst: boolean) => isFirst ? <Tag color="blue">First</Tag> : null,
    },
  ];

  const stuckTeamsColumns = [
    {
      title: 'Team ID',
      dataIndex: 'teamId',
      key: 'teamId',
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint',
      key: 'checkpoint',
    },
    {
      title: 'Stuck Duration',
      dataIndex: 'stuckMinutes',
      key: 'stuckMinutes',
      render: (minutes: number) => `${minutes} minutes`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Title level={2}>🕒 Timing System Debugger</Title>
      
      {/* Team Debug Section */}
      <Card title="Debug Individual Team" className="mb-6">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Enter team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            onPressEnter={handleDebugTeam}
          />
          <Button type="primary" onClick={handleDebugTeam} loading={loading}>
            Debug Team
          </Button>
        </Space.Compact>

        {debugInfo && (
          <div className="mt-4 space-y-4">
            <Descriptions title="Team Status" column={2}>
              <Descriptions.Item label="Team ID">{debugInfo.teamId}</Descriptions.Item>
              <Descriptions.Item label="Current Status">{debugInfo.currentStatus}</Descriptions.Item>
            </Descriptions>

            {debugInfo.timingIssues.length > 0 && (
              <Alert
                message="Timing Issues Found"
                description={
                  <ul>
                    {debugInfo.timingIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
              />
            )}

            {debugInfo.recommendations.length > 0 && (
              <Alert
                message="Recommendations"
                description={
                  <ul>
                    {debugInfo.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                }
                type="info"
                showIcon
              />
            )}

            <Table
              title={() => 'Checkpoint Progress'}
              columns={legsColumns}
              dataSource={debugInfo.legs}
              rowKey="index"
              size="small"
              pagination={false}
            />
          </div>
        )}
      </Card>

      {/* Overall Statistics Section */}
      <Card title="Overall Timing Statistics">
        <Button type="primary" onClick={handleGetStats} loading={loading}>
          Get Statistics
        </Button>

        {timingStats && (
          <div className="mt-4 space-y-4">
            <Descriptions title="Game Overview" column={3}>
              <Descriptions.Item label="Total Teams">{timingStats.totalTeams}</Descriptions.Item>
              <Descriptions.Item label="Active Teams">{timingStats.activeTeams}</Descriptions.Item>
              <Descriptions.Item label="Completed Teams">{timingStats.completedTeams}</Descriptions.Item>
            </Descriptions>

            {timingStats.stuckTeams.length > 0 && (
              <div>
                <Title level={4}>🚨 Stuck Teams (&gt;15 minutes on checkpoint)</Title>
                <Table
                  columns={stuckTeamsColumns}
                  dataSource={timingStats.stuckTeams}
                  rowKey="teamId"
                  size="small"
                  pagination={false}
                />
              </div>
            )}

            {Object.keys(timingStats.averageTimePerCheckpoint).length > 0 && (
              <div>
                <Title level={4}>📊 Average Time Per Checkpoint</Title>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(timingStats.averageTimePerCheckpoint).map(([checkpoint, avgTime]) => (
                    <Card key={checkpoint} size="small">
                      <Text strong>{checkpoint}</Text>
                      <br />
                      <Text>{formatDuration(avgTime)}</Text>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Reference */}
      <Card title="Quick Reference">
        <div className="space-y-2">
          <Text strong>Expected Timing Behavior:</Text>
          <ul className="list-disc ml-4 space-y-1">
            <li><Text>First checkpoint (cp_0): All timing values should be 0 (instant completion)</Text></li>
            <li><Text>Regular checkpoints: startTime set on QR scan, endTime set on MCQ completion</Text></li>
            <li><Text>Teams with startTime &gt; 0 but endTime = 0 are currently working on that checkpoint</Text></li>
            <li><Text>Teams stuck for &gt;15 minutes may need assistance</Text></li>
            <li><Text>Missing timing data for future checkpoints is normal</Text></li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Table, Badge, Progress, Button, Space, Tag, Drawer, Descriptions, message, Timeline, Statistic} from 'antd'
import { 
  MonitorOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  //WarningOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { GameService } from '../../services/GameService'
import { FirestoreService } from '../../services/FireStoreService'
import type { Team, TeamLeg } from '../../types'
import './Monitor.css'

const { Title, Text } = Typography

interface TeamMonitoringData {
  teamId: string
  username: string
  currentCheckpoint: string
  currentCheckpointName: string
  currentCheckpointStartTime?: string
  timeSinceLastScan?: number
  timeOnCurrentCheckpoint?: string
  completionPercentage: number
  totalPoints: number
  totalTime: number
  totalTimeFormatted: string
  isActive: boolean
  gameStartTime?: number
  gameStartTimeFormatted?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'stuck'
  currentLegDetails?: {
    mcqPoints: number
    puzzlePoints: number
    timeBonus: number
    timeTaken: number
    isCompleted: boolean
  }
  lastCompletedCheckpoint?: {
    checkpoint: string
    completedAt: string
    totalPoints: number
    timeTaken: number
  }
  roadmapProgress: Array<{
    checkpoint: string
    index: number
    status: 'completed' | 'current' | 'upcoming'
    points?: number
    timeTaken?: number
  }>
}

interface GameStatusInfo {
  status: 'waiting' | 'active' | 'paused' | 'stopped' | 'completed'
  activeTeams: number
  pausedTeams: number
  completedTeams: number
  totalTeams: number
  averageProgress: number
  totalPoints: number
}

export default function Monitor() {
  const [gameStatus, setGameStatus] = useState<GameStatusInfo>({
    status: 'waiting',
    activeTeams: 0,
    pausedTeams: 0,
    completedTeams: 0,
    totalTeams: 0,
    averageProgress: 0,
    totalPoints: 0
  })
  const [teams, setTeams] = useState<TeamMonitoringData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<TeamMonitoringData | null>(null)
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<Team | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Real-time data fetching
  const fetchTeamsData = async () => {
    try {
      const [teamsData, gameStatusData] = await Promise.all([
        GameService.getAllTeamsMonitoringData(),
        GameService.getGameStatus()
      ]);
      
      setTeams(teamsData);
      setGameStatus(gameStatusData);
    } catch (error) {
      console.error('Error fetching teams data:', error)
      message.error('Failed to fetch teams data')
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time updates
  useEffect(() => {
    fetchTeamsData()
    
    // Set up real-time listener for teams
    const unsubscribe = FirestoreService.subscribeToTeams(() => {
      // Refresh monitoring data when teams change
      fetchTeamsData()
    })

    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchTeamsData, 10000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleGameControl = async (action: 'start' | 'pause' | 'resume' | 'reset') => {
    // Double confirmation for reset action
    if (action === 'reset') {
      // Modal.confirm({
      //   title: 'Reset Game Progress',
      //   icon: <ExclamationCircleOutlined />,
      //   content: (
      //     <div>
      //       <p><strong>⚠️ WARNING: This action cannot be undone!</strong></p>
      //       <p>This will:</p>
      //       <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
      //         <li>Reset all team progress to 0</li>
      //         <li>Clear all checkpoint completions</li>
      //         <li>Reset all points and times</li>
      //         <li>Stop the current game</li>
      //       </ul>
      //       <p style={{ marginTop: '15px', color: '#ff4d4f' }}>
      //         Are you absolutely sure you want to reset the entire game?
      //       </p>
      //     </div>
      //   ),
      //   okText: 'Yes, Reset Game',
      //   okType: 'danger',
      //   cancelText: 'Cancel',
      //   onOk() {
      //     // Second confirmation with text input
      //     let confirmationInput = '';
          
      //     Modal.confirm({
      //       title: 'Final Confirmation Required',
      //       icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      //       content: (
      //         <div>
      //           <p><strong>🚨 FINAL WARNING</strong></p>
      //           <p>You are about to permanently delete all game progress for <strong>{teams.length} teams</strong>.</p>
      //           <p style={{ marginTop: '15px' }}>To confirm this action, please type <strong>"RESET GAME"</strong> in the field below:</p>
      //           <Input 
      //             placeholder="Type 'RESET GAME' to confirm"
      //             onChange={(e) => { confirmationInput = e.target.value; }}
      //             style={{ marginTop: '10px' }}
      //           />
      //         </div>
      //       ),
      //       okText: 'Confirm Reset',
      //       okType: 'danger',
      //       cancelText: 'Cancel',
      //       onOk() {
      //         if (confirmationInput.toUpperCase() === 'RESET GAME') {
      //           executeGameControl('reset');
      //         } else {
      //           message.error('Confirmation text does not match. Reset cancelled.');
      //           return Promise.reject('Confirmation failed');
      //         }
      //       }
      //     });
      //   }
      // });
      executeGameControl('reset');
      return;
    }

    // For other actions, execute directly
    executeGameControl(action);
  };

  const executeGameControl = async (action: 'start' | 'pause' | 'resume' | 'reset') => {
    setActionLoading(action)
    try {
      let result: { success: boolean; message: string }
      
      switch (action) {
        case 'start':
          result = await GameService.startGameFromAdmin()
          break
        case 'pause':
          result = await GameService.pauseResumeGame(true)
          break
        case 'resume':
          result = await GameService.pauseResumeGame(false)
          break
        case 'reset':
          result = await GameService.resetGame()
          break
        default:
          result = { success: false, message: 'Unknown action' }
      }

      if (result.success) {
        message.success(result.message)
        fetchTeamsData() // Refresh data
      } else {
        message.error(result.message)
      }
    } catch (error) {
      console.error('Game control error:', error)
      message.error(`Failed to ${action} game`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'processing'
      case 'completed': return 'success'
      case 'stuck': return 'warning'
      case 'not_started': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <ClockCircleOutlined />
      case 'completed': return <CheckCircleOutlined />
      case 'stuck': return <ExclamationCircleOutlined />
      default: return null
    }
  }

  const showTeamDetails = async (team: TeamMonitoringData) => {
    setSelectedTeam(team)
    setDrawerVisible(true)
    setDetailsLoading(true)
    
    try {
      // Fetch full team details including legs data
      const fullTeamDetails = await FirestoreService.getTeam(team.teamId)
      setSelectedTeamDetails(fullTeamDetails)
    } catch (error) {
      console.error('Error fetching team details:', error)
      message.error('Failed to load detailed team data')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Helper functions for leg data formatting
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

  const getCheckpointStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'not_started': return 'gray';
      default: return 'gray';
    }
  };

  const columns = [
    {
      title: 'Team',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: TeamMonitoringData) => (
        <div>
          <Text strong>{username}</Text>
          <br />
          <Text className="text-xs text-gray-500">ID: {record.teamId}</Text>
        </div>
      )
    },
    {
      title: 'Current Checkpoint',
      key: 'currentCheckpoint',
      render: (_: unknown, record: TeamMonitoringData) => (
        <div className="w-32">
          <Text strong className="text-sm">{record.currentCheckpointName}</Text>
          <br />
          <Text className="text-xs text-gray-500">
            {record.timeOnCurrentCheckpoint && record.status === 'in_progress' 
              ? `Active for ${record.timeOnCurrentCheckpoint}`
              : record.status === 'completed' ? 'Finished' : 'Not started'
            }
          </Text>
        </div>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: unknown, record: TeamMonitoringData) => (
        <div className="w-36">
          <Progress 
            percent={record.completionPercentage} 
            size="small" 
            status={record.status === 'completed' ? 'success' : 'active'}
            strokeColor={record.status === 'stuck' ? '#faad14' : undefined}
          />
          <Text className="text-xs text-gray-500">
            {record.completionPercentage}% complete
          </Text>
        </div>
      )
    },
    {
      title: 'Points',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      render: (points: number, record: TeamMonitoringData) => (
        <div className="text-center">
          <Text strong className="text-lg flex items-center justify-center gap-1">
            <TrophyOutlined className="text-yellow-500" />
            {points}
          </Text>
          {record.currentLegDetails && record.status === 'in_progress' && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="text-xs">Current checkpoint:</div>
              <div className="flex justify-center gap-1 text-xs">
                <span style={{ color: '#1890ff' }}>MCQ: {record.currentLegDetails.mcqPoints}</span>
                <span style={{ color: '#52c41a' }}>+P: {record.currentLegDetails.puzzlePoints}</span>
                <span style={{ color: record.currentLegDetails.timeBonus >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  +T: {record.currentLegDetails.timeBonus >= 0 ? '+' : ''}{record.currentLegDetails.timeBonus}
                </span>
              </div>
            </div>
          )}
        </div>
      ),
      sorter: (a: TeamMonitoringData, b: TeamMonitoringData) => b.totalPoints - a.totalPoints
    },
    {
      title: 'Total Time',
      dataIndex: 'totalTimeFormatted',
      key: 'totalTime',
      render: (time: string, record: TeamMonitoringData) => (
        <div className="text-center">
          <Text code className="text-sm">{time}</Text>
          {record.gameStartTimeFormatted && (
            <Text className="text-xs text-gray-500 block">
              Started: {new Date(record.gameStartTimeFormatted).toLocaleTimeString()}
            </Text>
          )}
        </div>
      ),
      sorter: (a: TeamMonitoringData, b: TeamMonitoringData) => a.totalTime - b.totalTime
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: TeamMonitoringData) => (
        <div className="text-center">
          <Badge 
            status={getStatusColor(status) as "success" | "processing" | "warning" | "error" | "default"} 
            text={status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          />
          {getStatusIcon(status)}
          {record.timeSinceLastScan && record.timeSinceLastScan > 600 && record.status === 'in_progress' && (
            <Text className="text-xs text-orange-500 block">Slow progress</Text>
          )}
        </div>
      ),
      filters: [
        { text: 'Not Started', value: 'not_started' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Stuck', value: 'stuck' }
      ],
      onFilter: (value: unknown, record: TeamMonitoringData) => record.status === value
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TeamMonitoringData) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => showTeamDetails(record)}
          size="small"
        >
          Details
        </Button>
      )
    }
  ]

  const stats = [
    {
      title: 'Active Teams',
      value: gameStatus.activeTeams,
      total: gameStatus.totalTeams,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <ClockCircleOutlined className="text-blue-600" />
    },
    {
      title: 'Paused Teams',
      value: gameStatus.pausedTeams,
      total: gameStatus.totalTeams,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <PauseCircleOutlined className="text-orange-600" />
    },
    {
      title: 'Completed',
      value: gameStatus.completedTeams,
      total: gameStatus.totalTeams,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircleOutlined className="text-green-600" />
    },
    {
      title: 'Total Points',
      value: gameStatus.totalPoints,
      total: '',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: <TrophyOutlined className="text-purple-600" />
    }
  ]

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <MonitorOutlined />
            Live Monitor
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">Real-time monitoring of team progress and game status</Text>
        </div>
        <Space direction="horizontal" className="flex flex-wrap">
          <Button icon={<ReloadOutlined />} onClick={fetchTeamsData} loading={loading} size="small" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button icon={<ExportOutlined />} type="default" size="small" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </Space>
      </div>

      {/* Game Status Card */}
      <Card 
        title={<span className="text-sm sm:text-base">Game Status</span>}
        extra={
          <Tag color={
            gameStatus.status === 'active' ? 'green' : 
            gameStatus.status === 'paused' ? 'orange' : 
            gameStatus.status === 'stopped' ? 'red' :
            gameStatus.status === 'completed' ? 'purple' : 'blue'
          }>
            {gameStatus.status.toUpperCase()}
          </Tag>
        }
      >
        <Row gutter={[12, 16]} align="middle">
          <Col xs={24} sm={12}>
            <div className="text-center">
              <Text className="block text-xs sm:text-sm text-gray-500">Current Status</Text>
              <Text className="text-lg sm:text-2xl font-bold">
                {gameStatus.status === 'waiting' ? 'Waiting to Start' :
                 gameStatus.status === 'active' ? 'Game Active' :
                 gameStatus.status === 'paused' ? 'Game Paused' : 
                 gameStatus.status === 'stopped' ? 'Game Stopped' :
                 'Game Completed'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="horizontal" className="flex flex-wrap justify-center sm:justify-start">
              {gameStatus.status === 'waiting' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleGameControl('start')}
                    size="small"
                    loading={actionLoading === 'start'}
                    className="text-xs sm:text-sm"
                  >
                    Start Game
                  </Button>
                  {gameStatus.totalTeams > 0 && (
                    <Button 
                      danger 
                      icon={<RedoOutlined />}
                      onClick={() => handleGameControl('reset')}
                      size="small"
                      loading={actionLoading === 'reset'}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                  )}
                </>
              )}
              {gameStatus.status === 'active' && (
                <>
                  <Button 
                    icon={<PauseCircleOutlined />}
                    onClick={() => handleGameControl('pause')}
                    size="small"
                    loading={actionLoading === 'pause'}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Pause</span>
                  </Button>
                  <Button 
                    danger 
                    type="text"
                    icon={<RedoOutlined />}
                    onClick={() => handleGameControl('reset')}
                    size="small"
                    loading={actionLoading === 'reset'}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </>
              )}
              {gameStatus.status === 'paused' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleGameControl('resume')}
                    size="small"
                    loading={actionLoading === 'resume'}
                    className="text-xs sm:text-sm"
                  >
                    Resume
                  </Button>
                  <Button 
                    danger 
                    type="text"
                    icon={<RedoOutlined />}
                    onClick={() => handleGameControl('reset')}
                    size="small"
                    loading={actionLoading === 'reset'}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </>
              )}
              {(gameStatus.status === 'stopped' || gameStatus.status === 'completed') && (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleGameControl('start')}
                    size="small"
                    loading={actionLoading === 'start'}
                    className="text-xs sm:text-sm"
                  >
                    Start New Game
                  </Button>
                  <Button 
                    danger 
                    icon={<RedoOutlined />}
                    onClick={() => handleGameControl('reset')}
                    size="small"
                    loading={actionLoading === 'reset'}
                    className="text-xs sm:text-sm"
                  >
                    Reset Game
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[12, 12]} className="sm:gutter-16">
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card className={`${stat.bgColor} border ${stat.borderColor}`}>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <Text className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                  {stat.value}{stat.total && `/${stat.total}`}
                </Text>
                <br />
                <Text className={`text-xs sm:text-sm ${stat.color} truncate`}>{stat.title}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Teams Table */}
      <Card 
        title={<span className="text-sm sm:text-base">Team Progress</span>}
        extra={
          <Text className="text-xs sm:text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={teams}
          rowKey="teamId"
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
          className="teams-monitor-table"
          loading={loading}
        />
      </Card>

      {/* Team Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <MonitorOutlined />
            <span className="text-sm sm:text-base">Team Details: {selectedTeam?.username}</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={window.innerWidth >= 1024 ? 720 : '100%'}
        styles={{
          body: { padding: '16px' }
        }}
        className="team-details-drawer"
      >
        {selectedTeam && (
          <div className="space-y-6">
            {/* Team Overview */}
            <Card size="small" title="Team Overview">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Team ID">{selectedTeam.teamId}</Descriptions.Item>
                <Descriptions.Item label="Username">{selectedTeam.username}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge 
                    status={getStatusColor(selectedTeam.status) as "success" | "processing" | "warning" | "error" | "default"} 
                    text={selectedTeam.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Game Started">
                  {selectedTeam.gameStartTimeFormatted ? 
                    new Date(selectedTeam.gameStartTimeFormatted).toLocaleString() : 
                    'Not started'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Total Time">
                  <Text code className="text-lg">{selectedTeam.totalTimeFormatted}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Points">
                  <Text strong className="text-lg text-green-600">
                    <TrophyOutlined className="mr-1" />
                    {selectedTeam.totalPoints}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Progress">
                  <div className="w-full">
                    <Progress 
                      percent={selectedTeam.completionPercentage} 
                      size="small" 
                      status={selectedTeam.status === 'completed' ? 'success' : 'active'}
                    />
                    <Text className="text-sm text-gray-500">
                      {selectedTeam.completionPercentage}% complete
                    </Text>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Current Checkpoint Details */}
            {selectedTeam.status === 'in_progress' && selectedTeam.currentLegDetails && (
              <Card size="small" title="Current Checkpoint">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Checkpoint">
                    <Text strong>{selectedTeam.currentCheckpointName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Started At">
                    {selectedTeam.currentCheckpointStartTime}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time on Checkpoint">
                    <Text code>{selectedTeam.timeOnCurrentCheckpoint || '0:00'}</Text>
                    {selectedTeam.timeSinceLastScan && selectedTeam.timeSinceLastScan > 600 && (
                      <Tag color="orange" className="ml-2">Slow Progress</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Points">
                    <Space>
                      <Text>MCQ: {selectedTeam.currentLegDetails.mcqPoints}</Text>
                      <Text>Puzzle: {selectedTeam.currentLegDetails.puzzlePoints}</Text>
                      <Text>Time Bonus: {selectedTeam.currentLegDetails.timeBonus}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {selectedTeam.currentLegDetails.isCompleted ? (
                      <Tag color="green">Completed</Tag>
                    ) : (
                      <Tag color="blue">In Progress</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Last Completed Checkpoint */}
            {selectedTeam.lastCompletedCheckpoint && (
              <Card size="small" title="Last Completed Checkpoint">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Checkpoint">
                    <Text strong>{selectedTeam.lastCompletedCheckpoint.checkpoint}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Completed At">
                    {selectedTeam.lastCompletedCheckpoint.completedAt}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time Taken">
                    <Text code>{selectedTeam.lastCompletedCheckpoint.timeTaken}s</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Points Earned">
                    <Text strong className="text-green-600">{selectedTeam.lastCompletedCheckpoint.totalPoints}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Detailed Checkpoint Breakdown */}
            {selectedTeamDetails && selectedTeamDetails.legs && selectedTeamDetails.legs.length > 0 && (
              <Card 
                size="small" 
                title={
                  <div className="flex items-center gap-2">
                    <TrophyOutlined />
                    <span className="text-sm sm:text-base">Detailed Checkpoint Scoring</span>
                  </div>
                }
                loading={detailsLoading}
                extra={
                  <Text className="text-xs text-gray-500">
                    {selectedTeamDetails.legs.filter(leg => leg.endTime && leg.endTime > 0).length} / {selectedTeamDetails.legs.length} completed
                  </Text>
                }
              >
                {/* Mobile-friendly Cards Layout for small screens */}
                <div className="block sm:hidden space-y-3">
                  {selectedTeamDetails.legs.map((leg, index) => (
                    <Card 
                      key={index} 
                      size="small" 
                      className="mobile-checkpoint-card border border-gray-200"
                      bodyStyle={{ padding: '12px' }}
                    >
                      <div className="space-y-3">
                        {/* Checkpoint Header */}
                        <div className="mobile-checkpoint-header flex justify-between items-start">
                          <div>
                            <Text strong className="text-base">{leg.checkpoint}</Text>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {leg.puzzleId}
                            </div>
                          </div>
                          <Tag 
                            color={getCheckpointStatusColor(getCheckpointStatus(leg))}
                            className="ml-2"
                          >
                            {getCheckpointStatus(leg)}
                          </Tag>
                        </div>

                        {/* Timing Information */}
                        <div className="timing-section bg-gray-50 p-2 rounded text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Text className="text-gray-600">Start:</Text>
                              <div className="font-mono text-xs">
                                {leg.startTime ? new Date(leg.startTime).toLocaleTimeString() : 'Not started'}
                              </div>
                            </div>
                            <div>
                              <Text className="text-gray-600">End:</Text>
                              <div className="font-mono text-xs">
                                {leg.endTime ? new Date(leg.endTime).toLocaleTimeString() : 'Not finished'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <Text strong className="text-sm">Duration: {formatDuration(leg.timeTaken)}</Text>
                          </div>
                        </div>

                        {/* Points Breakdown */}
                        <div className="points-breakdown-section bg-blue-50 p-3 rounded">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Points Breakdown</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs">MCQ Points:</span>
                              <Text strong style={{ color: '#1890ff' }}>{leg.mcqPoints}</Text>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Puzzle Points:</span>
                              <Text strong style={{ color: '#52c41a' }}>{leg.puzzlePoints}</Text>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Time Bonus:</span>
                              <Text 
                                strong 
                                style={{ color: leg.timeBonus >= 0 ? '#52c41a' : '#ff4d4f' }}
                              >
                                {leg.timeBonus >= 0 ? '+' : ''}{leg.timeBonus}
                              </Text>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between items-center">
                              <span className="font-semibold text-sm">Total Points:</span>
                              <Text strong className="text-lg text-green-600">
                                {leg.mcqPoints + leg.puzzlePoints + leg.timeBonus}
                              </Text>
                            </div>
                          </div>
                        </div>

                        {/* MCQ Answer */}
                        <div className="flex justify-between items-center">
                          <div>
                            <Text className="text-xs text-gray-600">MCQ Answer:</Text>
                            <div className="text-sm font-medium">
                              {leg.mcqAnswerOptionId || 'Not answered'}
                            </div>
                          </div>
                          <Tag 
                            color={leg.isFirstCheckpoint ? 'orange' : 'default'}
                            className="text-xs"
                          >
                            {leg.isFirstCheckpoint ? 'First CP' : 'Regular'}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout for larger screens */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table
                    columns={[
                      {
                        title: 'Checkpoint',
                        key: 'checkpoint',
                        width: 140,
                        render: (_, leg: TeamLeg) => (
                          <div className="min-w-[120px]">
                            <Text strong className="text-sm">{leg.checkpoint}</Text>
                            <div className="text-xs text-gray-500 mt-1 truncate" title={leg.puzzleId}>
                              {leg.puzzleId}
                            </div>
                            <Tag 
                              color={getCheckpointStatusColor(getCheckpointStatus(leg))} 
                              className="mt-1"
                            >
                              {getCheckpointStatus(leg)}
                            </Tag>
                          </div>
                        ),
                      },
                      {
                        title: 'Timing',
                        key: 'timing',
                        width: 160,
                        render: (_, leg: TeamLeg) => (
                          <div className="min-w-[140px] text-xs space-y-1">
                            <div>
                              <span className="text-gray-500">Start:</span> 
                              <span className="ml-1 font-mono">
                                {leg.startTime ? new Date(leg.startTime).toLocaleTimeString() : 'Not started'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">End:</span> 
                              <span className="ml-1 font-mono">
                                {leg.endTime ? new Date(leg.endTime).toLocaleTimeString() : 'Not finished'}
                              </span>
                            </div>
                            <div className="pt-1">
                              <Text strong className="text-sm">Duration: {formatDuration(leg.timeTaken)}</Text>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Points Breakdown',
                        key: 'points',
                        width: 180,
                        render: (_, leg: TeamLeg) => (
                          <div className="min-w-[160px]">
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">MCQ:</span>
                                <Text strong style={{ color: '#1890ff' }}>{leg.mcqPoints}</Text>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Puzzle:</span>
                                <Text strong style={{ color: '#52c41a' }}>{leg.puzzlePoints}</Text>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Time Bonus:</span>
                                <Text 
                                  strong 
                                  style={{ color: leg.timeBonus >= 0 ? '#52c41a' : '#ff4d4f' }}
                                >
                                  {leg.timeBonus >= 0 ? '+' : ''}{leg.timeBonus}
                                </Text>
                              </div>
                              <div className="flex justify-between items-center border-t pt-1 mt-2">
                                <span className="font-semibold">Total:</span>
                                <Text strong className="text-base text-green-600">
                                  {leg.mcqPoints + leg.puzzlePoints + leg.timeBonus}
                                </Text>
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'MCQ Answer',
                        key: 'mcq',
                        width: 120,
                        render: (_, leg: TeamLeg) => (
                          <div className="min-w-[100px] text-center">
                            <div className="text-sm font-medium mb-1">
                              {leg.mcqAnswerOptionId || 'Not answered'}
                            </div>
                            <Tag 
                              color={leg.isFirstCheckpoint ? 'orange' : 'default'}
                            >
                              {leg.isFirstCheckpoint ? 'First CP' : 'Regular'}
                            </Tag>
                          </div>
                        ),
                      },
                    ]}
                    dataSource={selectedTeamDetails.legs.map((leg, index) => ({ ...leg, key: index }))}
                    pagination={false}
                    size="small"
                    scroll={{ x: 700 }}
                    className="checkpoint-details-table"
                  />
                </div>

                {/* Summary Statistics */}
                <div className="mt-4 summary-stats-grid">
                  <div className="summary-stat-item">
                    <div className="summary-stat-value text-blue-600">
                      {selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.mcqPoints, 0)}
                    </div>
                    <div className="summary-stat-label">Total MCQ Points</div>
                  </div>
                  <div className="summary-stat-item">
                    <div className="summary-stat-value text-green-600">
                      {selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.puzzlePoints, 0)}
                    </div>
                    <div className="summary-stat-label">Total Puzzle Points</div>
                  </div>
                  <div className="summary-stat-item">
                    <div className={`summary-stat-value ${
                      selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.timeBonus, 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.timeBonus, 0) >= 0 ? '+' : ''}
                      {selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.timeBonus, 0)}
                    </div>
                    <div className="summary-stat-label">Total Time Bonus</div>
                  </div>
                  <div className="summary-stat-item">
                    <div className="summary-stat-value text-purple-600">
                      {selectedTeamDetails.legs.reduce((sum, leg) => sum + leg.mcqPoints + leg.puzzlePoints + leg.timeBonus, 0)}
                    </div>
                    <div className="summary-stat-label">Grand Total</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Roadmap Progress */}
            <Card size="small" title="Roadmap Progress">
              <Timeline
                items={selectedTeam.roadmapProgress.map((checkpoint) => ({
                  color: 
                    checkpoint.status === 'completed' ? 'green' :
                    checkpoint.status === 'current' ? 'blue' : 'gray',
                  children: (
                    <div className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Text strong className={
                            checkpoint.status === 'completed' ? 'text-green-600' :
                            checkpoint.status === 'current' ? 'text-blue-600' : 'text-gray-500'
                          }>
                            Checkpoint {checkpoint.index}: {checkpoint.checkpoint}
                          </Text>
                          {checkpoint.status === 'current' && (
                            <Tag color="blue" className="ml-2">Current</Tag>
                          )}
                        </div>
                        <div className="text-right">
                          {checkpoint.points !== undefined && (
                            <Text strong className="text-green-600">
                              {checkpoint.points} pts
                            </Text>
                          )}
                          {checkpoint.timeTaken !== undefined && (
                            <div>
                              <Text className="text-xs text-gray-500">
                                {checkpoint.timeTaken}s
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }))}
              />
            </Card>

            {/* Performance Statistics */}
            <Card size="small" title="Performance Statistics">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Checkpoints Completed"
                    value={selectedTeam.roadmapProgress.filter(r => r.status === 'completed').length}
                    suffix={`/ ${selectedTeam.roadmapProgress.length}`}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Completion Rate"
                    value={selectedTeam.completionPercentage}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Average Points"
                    value={selectedTeam.roadmapProgress.filter(r => r.points).length > 0 ?
                      Math.round(selectedTeam.roadmapProgress
                        .filter(r => r.points)
                        .reduce((sum, r) => sum + (r.points || 0), 0) / 
                        selectedTeam.roadmapProgress.filter(r => r.points).length) : 0
                    }
                    suffix="pts/checkpoint"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Average Time"
                    value={selectedTeam.roadmapProgress.filter(r => r.timeTaken).length > 0 ?
                      Math.round(selectedTeam.roadmapProgress
                        .filter(r => r.timeTaken)
                        .reduce((sum, r) => sum + (r.timeTaken || 0), 0) / 
                        selectedTeam.roadmapProgress.filter(r => r.timeTaken).length) : 0
                    }
                    suffix="sec/checkpoint"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Action Buttons */}
            <Card size="small">
              <Space wrap>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={fetchTeamsData}
                  loading={loading}
                >
                  Refresh Data
                </Button>
                <Button 
                  icon={<ExportOutlined />}
                  onClick={() => {
                    // Export team data functionality
                    const teamData = JSON.stringify(selectedTeam, null, 2);
                    const blob = new Blob([teamData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `team-${selectedTeam.teamId}-data.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export Team Data
                </Button>
                <Button 
                  type="default"
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => {
                    // Could implement team-specific actions like alerts/notifications
                    message.info('Team-specific controls not implemented yet');
                  }}
                >
                  Team Actions
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Table, Badge, Progress, Button, Space, Tag, Drawer, Descriptions, message, Timeline, Statistic, Modal, Input } from 'antd'
import { 
  MonitorOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined,
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { GameService } from '../../services/GameService'
import { FirestoreService } from '../../services/FireStoreService'
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
  status: 'waiting' | 'active' | 'paused' | 'completed'
  activeTeams: number
  completedTeams: number
  totalTeams: number
  averageProgress: number
  totalPoints: number
}

export default function Monitor() {
  const [gameStatus, setGameStatus] = useState<GameStatusInfo>({
    status: 'waiting',
    activeTeams: 0,
    completedTeams: 0,
    totalTeams: 0,
    averageProgress: 0,
    totalPoints: 0
  })
  const [teams, setTeams] = useState<TeamMonitoringData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<TeamMonitoringData | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Real-time data fetching
  const fetchTeamsData = async () => {
    try {
      const teamsData = await GameService.getAllTeamsMonitoringData()
      setTeams(teamsData)
      
      // Calculate game status
      const totalTeams = teamsData.length
      const activeTeams = teamsData.filter(t => t.isActive && t.status === 'in_progress').length
      const completedTeams = teamsData.filter(t => t.status === 'completed').length
      const averageProgress = totalTeams > 0 
        ? teamsData.reduce((acc, team) => acc + team.completionPercentage, 0) / totalTeams
        : 0
      const totalPoints = teamsData.reduce((acc, team) => acc + team.totalPoints, 0)
      
      // Determine overall game status
      let status: 'waiting' | 'active' | 'paused' | 'completed' = 'waiting'
      if (completedTeams === totalTeams && totalTeams > 0) {
        status = 'completed'
      } else if (activeTeams > 0) {
        status = 'active'
      } else if (teamsData.some(t => t.gameStartTime)) {
        status = 'paused'
      }
      
      setGameStatus({
        status,
        activeTeams,
        completedTeams,
        totalTeams,
        averageProgress: Math.round(averageProgress),
        totalPoints
      })
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

  const handleGameControl = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'reset') => {
    // Double confirmation for reset action
    if (action === 'reset') {
      Modal.confirm({
        title: 'Reset Game Progress',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p><strong>⚠️ WARNING: This action cannot be undone!</strong></p>
            <p>This will:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Reset all team progress to 0</li>
              <li>Clear all checkpoint completions</li>
              <li>Reset all points and times</li>
              <li>Stop the current game</li>
            </ul>
            <p style={{ marginTop: '15px', color: '#ff4d4f' }}>
              Are you absolutely sure you want to reset the entire game?
            </p>
          </div>
        ),
        okText: 'Yes, Reset Game',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          // Second confirmation with text input
          let confirmationInput = '';
          
          Modal.confirm({
            title: 'Final Confirmation Required',
            icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
            content: (
              <div>
                <p><strong>🚨 FINAL WARNING</strong></p>
                <p>You are about to permanently delete all game progress for <strong>{teams.length} teams</strong>.</p>
                <p style={{ marginTop: '15px' }}>To confirm this action, please type <strong>"RESET GAME"</strong> in the field below:</p>
                <Input 
                  placeholder="Type 'RESET GAME' to confirm"
                  onChange={(e) => { confirmationInput = e.target.value; }}
                  style={{ marginTop: '10px' }}
                />
              </div>
            ),
            okText: 'Confirm Reset',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
              if (confirmationInput.toUpperCase() === 'RESET GAME') {
                executeGameControl('reset');
              } else {
                message.error('Confirmation text does not match. Reset cancelled.');
                return Promise.reject('Confirmation failed');
              }
            }
          });
        }
      });
      return;
    }

    // For other actions, execute directly
    executeGameControl(action);
  };

  const executeGameControl = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'reset') => {
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
        case 'stop':
          result = await GameService.stopGame()
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

  const showTeamDetails = (team: TeamMonitoringData) => {
    setSelectedTeam(team)
    setDrawerVisible(true)
  }

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
          <Text strong className="text-lg flex items-center gap-1">
            <TrophyOutlined className="text-yellow-500" />
            {points}
          </Text>
          {record.currentLegDetails && record.status === 'in_progress' && (
            <Text className="text-xs text-gray-500 block">
              Current: {record.currentLegDetails.mcqPoints + record.currentLegDetails.puzzlePoints + record.currentLegDetails.timeBonus}pts
            </Text>
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
      title: 'Completed',
      value: gameStatus.completedTeams,
      total: gameStatus.totalTeams,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircleOutlined className="text-green-600" />
    },
    {
      title: 'Average Progress',
      value: gameStatus.averageProgress,
      total: 100,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: <MonitorOutlined className="text-purple-600" />
    },
    {
      title: 'Total Points',
      value: gameStatus.totalPoints,
      total: '',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <TrophyOutlined className="text-orange-600" />
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
          <Tag color={gameStatus.status === 'active' ? 'green' : gameStatus.status === 'paused' ? 'orange' : 'blue'}>
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
                 gameStatus.status === 'paused' ? 'Game Paused' : 'Game Completed'}
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
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                    size="small"
                    loading={actionLoading === 'stop'}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Stop</span>
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
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                    size="small"
                    loading={actionLoading === 'stop'}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Stop</span>
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
              {(gameStatus.status === 'completed' || gameStatus.status === 'waiting') && gameStatus.totalTeams > 0 && (
                <Button 
                  danger 
                  icon={<RedoOutlined />}
                  onClick={() => handleGameControl('reset')}
                  size="small"
                  loading={actionLoading === 'reset'}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Reset Game</span>
                </Button>
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
            <span>Team Details: {selectedTeam?.username}</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={640}
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
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    // Could implement team-specific actions like pause/stop
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
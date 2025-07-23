import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Table, Badge, Progress, Button, Space, Tag } from 'antd'
import { 
  MonitorOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined,
  ExportOutlined,
  ReloadOutlined 
} from '@ant-design/icons'

const { Title, Text } = Typography

interface TeamProgress {
  id: string
  name: string
  currentCheckpoint: number
  totalCheckpoints: number
  points: number
  timeElapsed: string
  status: 'active' | 'completed' | 'paused'
  lastActivity: string
}

export default function Monitor() {
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'paused' | 'completed'>('waiting')
  const [teams, setTeams] = useState<TeamProgress[]>([
    {
      id: '1',
      name: 'Team Alpha',
      currentCheckpoint: 6,
      totalCheckpoints: 8,
      points: 85,
      timeElapsed: '45:23',
      status: 'active',
      lastActivity: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Team Beta',
      currentCheckpoint: 4,
      totalCheckpoints: 8,
      points: 62,
      timeElapsed: '52:10',
      status: 'active',
      lastActivity: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Team Gamma',
      currentCheckpoint: 8,
      totalCheckpoints: 8,
      points: 120,
      timeElapsed: '38:45',
      status: 'completed',
      lastActivity: '15 minutes ago'
    },
    {
      id: '4',
      name: 'Team Delta',
      currentCheckpoint: 3,
      totalCheckpoints: 8,
      points: 45,
      timeElapsed: '1:02:30',
      status: 'paused',
      lastActivity: '10 minutes ago'
    }
  ])

  const handleGameControl = (action: 'start' | 'pause' | 'stop') => {
    switch (action) {
      case 'start':
        setGameStatus('active')
        break
      case 'pause':
        setGameStatus('paused')
        break
      case 'stop':
        setGameStatus('completed')
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing'
      case 'completed': return 'success'
      case 'paused': return 'warning'
      default: return 'default'
    }
  }

  const columns = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: unknown, record: TeamProgress) => {
        const percentage = (record.currentCheckpoint / record.totalCheckpoints) * 100
        return (
          <div className="w-32">
            <Progress 
              percent={Math.round(percentage)} 
              size="small" 
              status={record.status === 'completed' ? 'success' : 'active'}
            />
            <Text className="text-xs text-gray-500">
              {record.currentCheckpoint}/{record.totalCheckpoints} checkpoints
            </Text>
          </div>
        )
      }
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => (
        <Text strong className="text-lg">{points}</Text>
      ),
      sorter: (a: TeamProgress, b: TeamProgress) => b.points - a.points
    },
    {
      title: 'Time',
      dataIndex: 'timeElapsed',
      key: 'timeElapsed',
      render: (time: string) => <Text code>{time}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={getStatusColor(status) as "success" | "processing" | "warning" | "error" | "default"} 
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      )
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (activity: string) => (
        <Text className="text-sm text-gray-500">{activity}</Text>
      )
    }
  ]

  const stats = [
    {
      title: 'Active Teams',
      value: teams.filter(t => t.status === 'active').length,
      total: teams.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Completed',
      value: teams.filter(t => t.status === 'completed').length,
      total: teams.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Average Progress',
      value: Math.round(teams.reduce((acc, team) => acc + (team.currentCheckpoint / team.totalCheckpoints), 0) / teams.length * 100),
      total: 100,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Total Points',
      value: teams.reduce((acc, team) => acc + team.points, 0),
      total: '',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setTeams(prevTeams => 
        prevTeams.map(team => ({
          ...team,
          lastActivity: Math.random() > 0.7 ? 'Just now' : team.lastActivity
        }))
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [])

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
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} size="small" className="text-xs sm:text-sm">
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
          <Tag color={gameStatus === 'active' ? 'green' : gameStatus === 'paused' ? 'orange' : 'blue'}>
            {gameStatus.toUpperCase()}
          </Tag>
        }
      >
        <Row gutter={[12, 16]} align="middle">
          <Col xs={24} sm={12}>
            <div className="text-center">
              <Text className="block text-xs sm:text-sm text-gray-500">Current Status</Text>
              <Text className="text-lg sm:text-2xl font-bold">
                {gameStatus === 'waiting' ? 'Waiting to Start' :
                 gameStatus === 'active' ? 'Game Active' :
                 gameStatus === 'paused' ? 'Game Paused' : 'Game Completed'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="horizontal" className="flex flex-wrap justify-center sm:justify-start">
              {gameStatus === 'waiting' && (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleGameControl('start')}
                  size="small"
                  className="text-xs sm:text-sm"
                >
                  Start Game
                </Button>
              )}
              {gameStatus === 'active' && (
                <>
                  <Button 
                    icon={<PauseCircleOutlined />}
                    onClick={() => handleGameControl('pause')}
                    size="small"
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Pause</span>
                  </Button>
                  <Button 
                    danger 
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                    size="small"
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Stop</span>
                  </Button>
                </>
              )}
              {gameStatus === 'paused' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleGameControl('start')}
                    size="small"
                    className="text-xs sm:text-sm"
                  >
                    Resume
                  </Button>
                  <Button 
                    danger 
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                    size="small"
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Stop</span>
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
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
          className="teams-monitor-table"
        />
      </Card>
    </div>
  )
}

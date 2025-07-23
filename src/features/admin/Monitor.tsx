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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-2">
            <MonitorOutlined />
            Live Monitor
          </Title>
          <Text className="text-gray-600">Real-time monitoring of team progress and game status</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />} type="default">
            Export Data
          </Button>
        </Space>
      </div>

      {/* Game Status Card */}
      <Card title="Game Status" extra={
        <Tag color={gameStatus === 'active' ? 'green' : gameStatus === 'paused' ? 'orange' : 'blue'}>
          {gameStatus.toUpperCase()}
        </Tag>
      }>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12}>
            <div className="text-center">
              <Text className="block text-sm text-gray-500">Current Status</Text>
              <Text className="text-2xl font-bold">
                {gameStatus === 'waiting' ? 'Waiting to Start' :
                 gameStatus === 'active' ? 'Game Active' :
                 gameStatus === 'paused' ? 'Game Paused' : 'Game Completed'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Space>
              {gameStatus === 'waiting' && (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleGameControl('start')}
                  size="large"
                >
                  Start Game
                </Button>
              )}
              {gameStatus === 'active' && (
                <>
                  <Button 
                    icon={<PauseCircleOutlined />}
                    onClick={() => handleGameControl('pause')}
                  >
                    Pause
                  </Button>
                  <Button 
                    danger 
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                  >
                    Stop Game
                  </Button>
                </>
              )}
              {gameStatus === 'paused' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleGameControl('start')}
                  >
                    Resume
                  </Button>
                  <Button 
                    danger 
                    icon={<StopOutlined />}
                    onClick={() => handleGameControl('stop')}
                  >
                    Stop Game
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card className={`${stat.bgColor} border ${stat.borderColor}`}>
              <div className="text-center">
                <Text className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}{stat.total && `/${stat.total}`}
                </Text>
                <br />
                <Text className={`text-sm ${stat.color}`}>{stat.title}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Teams Table */}
      <Card title="Team Progress" extra={
        <Text className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      }>
        <Table
          columns={columns}
          dataSource={teams}
          rowKey="id"
          pagination={false}
          size="middle"
          className="teams-monitor-table"
        />
      </Card>
    </div>
  )
}

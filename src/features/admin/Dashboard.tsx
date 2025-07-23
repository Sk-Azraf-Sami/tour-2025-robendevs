import { Card, Typography, Row, Col, Badge, Statistic, Progress } from 'antd'
import {
  TeamOutlined,
  QuestionCircleOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function Dashboard() {
  const stats = [
    {
      title: "Active Teams",
      value: 12,
      description: "Teams currently playing",
      icon: <TeamOutlined className="text-2xl text-blue-500" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Total MCQs",
      value: 24,
      description: "Questions in database",
      icon: <QuestionCircleOutlined className="text-2xl text-green-500" />,
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Checkpoints",
      value: 8, 
      description: "Active checkpoint locations",
      icon: <EnvironmentOutlined className="text-2xl text-purple-500" />,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Puzzles",
      value: 16,
      description: "Puzzle challenges created",
      icon: <TrophyOutlined className="text-2xl text-orange-500" />,
      color: "bg-orange-50 border-orange-200"
    }
  ]

  const recentActivity = [
    { team: "Team Alpha", action: "Completed Checkpoint 3", time: "2 minutes ago", status: "success" },
    { team: "Team Beta", action: "Started Checkpoint 2", time: "5 minutes ago", status: "processing" },
    { team: "Team Gamma", action: "Answered MCQ incorrectly", time: "7 minutes ago", status: "warning" },
    { team: "Team Delta", action: "Completed Puzzle 1", time: "10 minutes ago", status: "success" }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Title level={2} className="!mb-1">Dashboard Overview</Title>
          <Text className="text-gray-600">Monitor your treasure hunt game in real-time</Text>
        </div>
        <Badge status="processing" text="Game Active" />
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className={`${stat.color} border hover:shadow-md transition-shadow`}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                suffix={
                  <div className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Content Row */}
      <Row gutter={[16, 16]}>
        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined />
                <span>Recent Activity</span>
              </div>
            }
            className="h-full"
          >
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text strong className="text-sm">{activity.team}</Text>
                      <Badge 
                        status={activity.status as "success" | "processing" | "warning" | "error" | "default"} 
                        text=""
                      />
                    </div>
                    <Text className="text-xs text-gray-600">{activity.action}</Text>
                  </div>
                  <Text className="text-xs text-gray-500">{activity.time}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Game Status */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <PlayCircleOutlined />
                <span>Game Status</span>
              </div>
            }
            className="h-full"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <Text className="text-sm font-medium">Game State</Text>
                <Badge status="processing" text="Active" />
              </div>
              <div className="flex items-center justify-between py-2">
                <Text className="text-sm font-medium">Duration</Text>
                <Text className="text-sm">45:23</Text>
              </div>
              <div className="flex items-center justify-between py-2">
                <Text className="text-sm font-medium">Teams Finished</Text>
                <div className="flex items-center gap-2">
                  <Progress percent={25} size="small" className="w-16" />
                  <Text className="text-sm">3 / 12</Text>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <Text className="text-sm font-medium">Average Progress</Text>
                <div className="flex items-center gap-2">
                  <Progress percent={62} size="small" className="w-16" />
                  <Text className="text-sm">62%</Text>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <Text className="text-sm font-medium">System Status</Text>
                <div className="flex items-center gap-1">
                  <CheckCircleOutlined className="text-green-500" />
                  <Text className="text-sm text-green-600">Healthy</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

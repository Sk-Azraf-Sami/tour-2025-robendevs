import { Card, Typography, Row, Col, Badge, Progress } from 'antd'
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
      icon: <TeamOutlined className="text-xl sm:text-2xl text-indigo-600" />,
      color: "text-indigo-600"
    },
    {
      title: "Total MCQs",
      value: 24,
      description: "Questions in database",
      icon: <QuestionCircleOutlined className="text-xl sm:text-2xl text-green-600" />,
      color: "text-green-600"
    },
    {
      title: "Checkpoints",
      value: 8, 
      description: "Active checkpoint locations",
      icon: <EnvironmentOutlined className="text-xl sm:text-2xl text-purple-600" />,
      color: "text-purple-600"
    },
    {
      title: "Puzzles",
      value: 16,
      description: "Puzzle challenges created",
      icon: <TrophyOutlined className="text-xl sm:text-2xl text-orange-600" />,
      color: "text-orange-600"
    }
  ]

  const recentActivity = [
    { team: "Team Alpha", action: "Completed Checkpoint 3", time: "2 minutes ago", status: "success" },
    { team: "Team Beta", action: "Started Checkpoint 2", time: "5 minutes ago", status: "processing" },
    { team: "Team Gamma", action: "Answered MCQ incorrectly", time: "7 minutes ago", status: "warning" },
    { team: "Team Delta", action: "Completed Puzzle 1", time: "10 minutes ago", status: "success" }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Admin Dashboard</Title>
        <Text type="secondary" className="text-sm sm:text-base">Monitor and manage your treasure hunt game</Text>
      </div>

      {/* System Statistics Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 mx-2 sm:mx-0">
        <div className="text-center mb-3 sm:mb-4">
          <PlayCircleOutlined className="text-xl sm:text-2xl text-indigo-600 mb-1 sm:mb-2" />
          <Title level={4} className="text-base sm:text-lg">System Overview</Title>
        </div>
        <Row gutter={[12, 12]} className="text-center">
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <div className="p-2 sm:p-0">
                <div className="flex justify-center mb-1 sm:mb-2">{stat.icon}</div>
                <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <Text type="secondary" className="text-xs sm:text-sm">{stat.title}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Game Status Card */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <PlayCircleOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Game Status</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Real-time game monitoring and controls</Text>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between py-2">
            <Text className="text-sm sm:text-base font-medium">Game State</Text>
            <Badge status="processing" text="Active" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Text className="text-sm sm:text-base font-medium">Duration</Text>
            <Text className="text-sm sm:text-base">45:23</Text>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 space-y-1 sm:space-y-0">
            <Text className="text-sm sm:text-base font-medium">Teams Finished</Text>
            <div className="flex items-center gap-2">
              <Progress percent={25} size="small" strokeColor="#4f46e5" className="w-12 sm:w-16" />
              <Text className="text-sm sm:text-base">3 / 12</Text>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 space-y-1 sm:space-y-0">
            <Text className="text-sm sm:text-base font-medium">Average Progress</Text>
            <div className="flex items-center gap-2">
              <Progress percent={62} size="small" strokeColor="#4f46e5" className="w-12 sm:w-16" />
              <Text className="text-sm sm:text-base">62%</Text>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <Text className="text-sm sm:text-base font-medium">System Status</Text>
            <div className="flex items-center gap-1">
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-sm sm:text-base text-green-600">Healthy</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <ClockCircleOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Recent Activity</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Latest team activities and progress updates</Text>
        <div className="space-y-2 sm:space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start justify-between p-2 sm:p-3 border rounded-lg gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Badge 
                  status={activity.status as "success" | "processing" | "warning" | "error" | "default"} 
                  text=""
                  className="flex-shrink-0 mt-1"
                />
                <div className="min-w-0 flex-1">
                  <Text strong className="text-xs sm:text-sm block break-words">{activity.team}</Text>
                  <Text className="text-xs sm:text-sm text-gray-600 break-words">{activity.action}</Text>
                </div>
              </div>
              <Text type="secondary" className="text-xs flex-shrink-0">{activity.time}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

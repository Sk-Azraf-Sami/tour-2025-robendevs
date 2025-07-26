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
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl !mb-2" 
          style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Admin Dashboard
        </Title>
        <Text type="secondary" className="text-sm sm:text-base">Monitor and manage your treasure hunt game</Text>
      </div>

      {/* System Statistics Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mx-2 sm:mx-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="text-center mb-3 sm:mb-4">
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <PlayCircleOutlined className="text-xl sm:text-2xl text-white" />
          </div>
          <Title level={4} className="text-base sm:text-lg !mb-0" 
            style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            System Overview
          </Title>
        </div>
        <Row gutter={[12, 12]} className="text-center">
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <div className="p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="flex justify-center mb-2 sm:mb-3">{stat.icon}</div>
                <div className={`text-lg sm:text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <Text type="secondary" className="text-xs sm:text-sm font-medium">{stat.title}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Game Status Card */}
      <Card className="mx-2 sm:mx-0 border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              boxShadow: '0 4px 8px rgba(124, 58, 237, 0.3)'
            }}
          >
            <PlayCircleOutlined className="text-base sm:text-lg text-white" />
          </div>
          <Title level={4} className="!mb-0 text-base sm:text-lg"
            style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Game Status
          </Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Real-time game monitoring and controls</Text>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg shadow-sm">
            <Text className="text-sm sm:text-base font-medium">Game State</Text>
            <Badge status="processing" text="Active" />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg shadow-sm">
            <Text className="text-sm sm:text-base font-medium">Duration</Text>
            <Text className="text-sm sm:text-base font-mono">45:23</Text>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-white rounded-lg shadow-sm space-y-1 sm:space-y-0">
            <Text className="text-sm sm:text-base font-medium">Teams Finished</Text>
            <div className="flex items-center gap-2">
              <Progress percent={25} size="small" strokeColor="#7c3aed" className="w-12 sm:w-16" />
              <Text className="text-sm sm:text-base">3 / 12</Text>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-white rounded-lg shadow-sm space-y-1 sm:space-y-0">
            <Text className="text-sm sm:text-base font-medium">Average Progress</Text>
            <div className="flex items-center gap-2">
              <Progress percent={62} size="small" strokeColor="#7c3aed" className="w-12 sm:w-16" />
              <Text className="text-sm sm:text-base">62%</Text>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg shadow-sm">
            <Text className="text-sm sm:text-base font-medium">System Status</Text>
            <div className="flex items-center gap-1">
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-sm sm:text-base text-green-600">Healthy</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="mx-2 sm:mx-0 border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <ClockCircleOutlined className="text-base sm:text-lg text-white" />
          </div>
          <Title level={4} className="!mb-0 text-base sm:text-lg"
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Recent Activity
          </Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Latest team activities and progress updates</Text>
        <div className="space-y-2 sm:space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start justify-between p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 gap-2">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
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
              <Text type="secondary" className="text-xs flex-shrink-0 font-mono">{activity.time}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

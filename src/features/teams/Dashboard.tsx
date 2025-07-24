import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Progress, Typography, Row, Col, Tag } from 'antd'
import {
  QrcodeOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import type { TeamData, TeamActivity } from '../../types'
import { useTeamTimer, useTeamProgress } from './hooks'
import { generateRecentActivity } from './utils'

const { Title, Text } = Typography

export default function TeamDashboard() {
  const navigate = useNavigate()
  
  // Initialize team data
  const initialTeamData: TeamData = {
    currentCheckpoint: 3,
    totalCheckpoints: 8,
    totalTime: 2745, // seconds
    totalPoints: 85,
    status: 'active',
    nextLocation: 'Central Library - Main Entrance',
  }

  const { teamData, getProgressPercentage } = useTeamProgress(initialTeamData)
  const { currentTime, formatTime } = useTeamTimer(teamData.totalTime, teamData.status === 'active')
  const [recentActivities] = useState<TeamActivity[]>(generateRecentActivity())

  const handleScanQR = () => {
    navigate('/team/scan')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Team Dashboard</Title>
        <Text type="secondary" className="text-sm sm:text-base">Track your progress and continue your treasure hunt</Text>
      </div>

      {/* Game Status Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 mx-2 sm:mx-0">
        <div className="text-center mb-3 sm:mb-4">
          <PlayCircleOutlined className="text-xl sm:text-2xl text-indigo-600 mb-1 sm:mb-2" />
          <Title level={4} className="text-base sm:text-lg">Game Status</Title>
        </div>
        <Row gutter={[12, 12]} className="text-center">
          <Col xs={24} sm={8}>
            <div className="p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-indigo-600">{formatTime(currentTime)}</div>
              <Text type="secondary" className="text-xs sm:text-sm">Total Time</Text>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{teamData.totalPoints}</div>
              <Text type="secondary" className="text-xs sm:text-sm">Points Earned</Text>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {teamData.currentCheckpoint} / {teamData.totalCheckpoints}
              </div>
              <Text type="secondary" className="text-xs sm:text-sm">Checkpoints</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Progress Card */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <EnvironmentOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Progress Tracker</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Your journey through the treasure hunt</Text>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <Text className="text-sm sm:text-base">Overall Progress</Text>
            <Text type="secondary" className="text-xs sm:text-sm">{Math.round(getProgressPercentage())}% Complete</Text>
          </div>
          <Progress percent={getProgressPercentage()} strokeColor="#4f46e5" className="mb-3 sm:mb-4" />

          {teamData.status === 'active' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <EnvironmentOutlined className="text-blue-600 flex-shrink-0 mt-1 text-base sm:text-lg" />
              <div className="min-w-0 flex-1">
                <Text strong className="text-sm sm:text-base block">Next Checkpoint</Text>
                <Text type="secondary" className="text-xs sm:text-sm break-words">{teamData.nextLocation}</Text>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Card */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <QrcodeOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Next Action</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">
          {teamData.status === 'active'
            ? 'Scan the QR code at your current checkpoint to continue'
            : 'Waiting for game to start'}
        </Text>
        <div className="text-center space-y-3 sm:space-y-4">
          {teamData.status === 'active' ? (
            <>
              <div className="p-4 sm:p-8 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                <QrcodeOutlined className="text-4xl sm:text-6xl text-indigo-400 mb-2 sm:mb-4" />
                <Text type="secondary" className="block mb-2 sm:mb-4 text-sm sm:text-base">
                  Find and scan the QR code at:
                </Text>
                <Text strong className="text-sm sm:text-base break-words">{teamData.nextLocation}</Text>
              </div>
              <Button 
                type="primary" 
                size="large" 
                icon={<QrcodeOutlined />} 
                onClick={handleScanQR} 
                block
                className="h-12 sm:h-auto text-sm sm:text-base"
              >
                Scan QR Code
              </Button>
            </>
          ) : (
            <div className="p-4 sm:p-8 text-center">
              <ClockCircleOutlined className="text-4xl sm:text-6xl text-gray-400 mb-2 sm:mb-4" />
              <Text type="secondary" className="text-sm sm:text-base">
                Game hasn't started yet. Please wait for the admin to launch the treasure hunt.
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <TrophyOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Recent Activity</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Your latest achievements and progress</Text>
        <div className="space-y-2 sm:space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start justify-between p-2 sm:p-3 border rounded-lg gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <CheckCircleOutlined className="text-green-500 flex-shrink-0 mt-1 text-sm sm:text-base" />
                <div className="min-w-0 flex-1">
                  <Text strong className="text-xs sm:text-sm block break-words">{activity.action}</Text>
                  <Text type="secondary" className="text-xs">{activity.time}</Text>
                </div>
              </div>
              <Tag color="green" className="flex-shrink-0 text-xs">{activity.points}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

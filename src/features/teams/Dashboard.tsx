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
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2}>Team Dashboard</Title>
        <Text type="secondary">Track your progress and continue your treasure hunt</Text>
      </div>

      {/* Game Status Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="text-center mb-4">
          <PlayCircleOutlined className="text-2xl text-indigo-600 mb-2" />
          <Title level={4}>Game Status</Title>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{formatTime(currentTime)}</div>
              <Text type="secondary">Total Time</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teamData.totalPoints}</div>
              <Text type="secondary">Points Earned</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {teamData.currentCheckpoint} / {teamData.totalCheckpoints}
              </div>
              <Text type="secondary">Checkpoints</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Progress Card */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <EnvironmentOutlined />
          <Title level={4} className="!mb-0">Progress Tracker</Title>
        </div>
        <Text type="secondary" className="block mb-4">Your journey through the treasure hunt</Text>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text>Overall Progress</Text>
            <Text type="secondary">{Math.round(getProgressPercentage())}% Complete</Text>
          </div>
          <Progress percent={getProgressPercentage()} strokeColor="#4f46e5" className="mb-4" />

          {teamData.status === 'active' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <EnvironmentOutlined className="text-blue-600" />
              <div>
                <Text strong>Next Checkpoint</Text>
                <br />
                <Text type="secondary">{teamData.nextLocation}</Text>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Card */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <QrcodeOutlined />
          <Title level={4} className="!mb-0">Next Action</Title>
        </div>
        <Text type="secondary" className="block mb-4">
          {teamData.status === 'active'
            ? 'Scan the QR code at your current checkpoint to continue'
            : 'Waiting for game to start'}
        </Text>
        <div className="text-center space-y-4">
          {teamData.status === 'active' ? (
            <>
              <div className="p-8 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                <QrcodeOutlined className="text-6xl text-indigo-400 mb-4" />
                <Text type="secondary" className="block mb-4">
                  Find and scan the QR code at:
                  <br />
                  <Text strong>{teamData.nextLocation}</Text>
                </Text>
              </div>
              <Button type="primary" size="large" icon={<QrcodeOutlined />} onClick={handleScanQR} block>
                Scan QR Code
              </Button>
            </>
          ) : (
            <div className="p-8 text-center">
              <ClockCircleOutlined className="text-6xl text-gray-400 mb-4" />
              <Text type="secondary">
                Game hasn't started yet. Please wait for the admin to launch the treasure hunt.
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrophyOutlined />
          <Title level={4} className="!mb-0">Recent Activity</Title>
        </div>
        <Text type="secondary" className="block mb-4">Your latest achievements and progress</Text>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                <div>
                  <Text strong className="text-sm">{activity.action}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">{activity.time}</Text>
                </div>
              </div>
              <Tag color="green">{activity.points}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

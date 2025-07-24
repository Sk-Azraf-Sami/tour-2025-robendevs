import { useState } from 'react'
import { Card, Typography, Row, Col, Button, Steps, Checkbox, Alert, Divider, Space, Modal, List } from 'antd'
import { 
  RocketOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  PictureOutlined,
  SettingOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Step } = Steps

interface PreflightCheck {
  id: string
  name: string
  description: string
  status: 'success' | 'warning' | 'error'
  required: boolean
}

export default function Launch() {
  const [currentStep, setCurrentStep] = useState(0)
  const [launchModalVisible, setLaunchModalVisible] = useState(false)
  const [gameSettings, setGameSettings] = useState({
    randomizeRoutes: true,
    enableHints: true,
    sendWelcomeMessage: true,
    notifyTeams: true
  })

  const preflightChecks: PreflightCheck[] = [
    {
      id: '1',
      name: 'MCQ Questions',
      description: '24 questions configured',
      status: 'success',
      required: true
    },
    {
      id: '2',
      name: 'Puzzle Challenges',
      description: '16 puzzles ready',
      status: 'success',
      required: true
    },
    {
      id: '3',
      name: 'Team Registration',
      description: '12 teams registered',
      status: 'success',
      required: true
    },
    {
      id: '4',
      name: 'Checkpoint Locations',
      description: '8 checkpoints defined',
      status: 'success',
      required: true
    },
    {
      id: '5',
      name: 'QR Codes',
      description: 'All QR codes generated',
      status: 'success',
      required: true
    }
  ]

  const steps = [
    {
      title: 'Pre-flight Check',
      description: 'Verify all components are ready'
    },
    {
      title: 'Configure Launch',
      description: 'Set game parameters'
    },
    {
      title: 'Launch Game',
      description: 'Start the treasure hunt'
    }
  ]

  const handleLaunch = () => {
    setLaunchModalVisible(true)
  }

  const confirmLaunch = () => {
    console.log('Game launched with settings:', gameSettings)
    setLaunchModalVisible(false)
    setCurrentStep(2)
    // Here you would typically make an API call to start the game
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined className="text-green-500" />
      case 'warning':
        return <ExclamationCircleOutlined className="text-yellow-500" />
      case 'error':
        return <ExclamationCircleOutlined className="text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const allCriticalChecksPassed = preflightChecks
    .filter(check => check.required)
    .every(check => check.status === 'success')

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <RocketOutlined />
            Launch Game
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">Configure and launch your treasure hunt game</Text>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <Steps current={currentStep} className="mb-4 sm:mb-6" direction="vertical" responsive={false}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={<span className="text-sm sm:text-base">{step.title}</span>}
              description={<span className="text-xs sm:text-sm">{step.description}</span>}
            />
          ))}
        </Steps>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <>
          {/* Pre-flight Checks */}
          <Card title="Pre-flight System Check">
            <div className="space-y-4">
              {preflightChecks.map((check) => (
                <div
                  key={check.id}
                  className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <Text strong>{check.name}</Text>
                        {check.required && <Text className="text-red-500 ml-1">*</Text>}
                        <br />
                        <Text className="text-sm text-gray-600">{check.description}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            <div className="flex items-center justify-between">
              <div>
                {allCriticalChecksPassed ? (
                  <Alert
                    message="All critical checks passed!"
                    description="System is ready for launch."
                    type="success"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="Some checks failed"
                    description="Please resolve critical issues before launching."
                    type="error"
                    showIcon
                  />
                )}
              </div>
              <Button
                type="primary"
                size="large"
                disabled={!allCriticalChecksPassed}
                onClick={() => setCurrentStep(1)}
              >
                Continue to Configuration
              </Button>
            </div>
          </Card>
        </>
      )}

      {currentStep === 1 && (
        <>
          {/* Launch Configuration */}
          <Row gutter={[16, 16]} className="lg:gutter-24">
            <Col xs={24} lg={12}>
              <Card title={<span className="text-sm sm:text-base">Game Configuration</span>}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 pr-4">
                      <Text strong className="text-sm sm:text-base">Randomize Team Routes</Text>
                      <br />
                      <Text className="text-xs sm:text-sm text-gray-500">
                        Each team gets a unique checkpoint sequence
                      </Text>
                    </div>
                    <Checkbox
                      checked={gameSettings.randomizeRoutes}
                      onChange={(e) => setGameSettings({
                        ...gameSettings,
                        randomizeRoutes: e.target.checked
                      })}
                    />
                  </div>

                  <Divider className="!my-2" />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 pr-4">
                      <Text strong className="text-sm sm:text-base">Enable Hints System</Text>
                      <br />
                      <Text className="text-xs sm:text-sm text-gray-500">
                        Allow teams to request hints for challenges
                      </Text>
                    </div>
                    <Checkbox
                      checked={gameSettings.enableHints}
                      onChange={(e) => setGameSettings({
                        ...gameSettings,
                        enableHints: e.target.checked
                      })}
                    />
                  </div>

                  <Divider className="!my-2" />

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Text strong>Send Welcome Message</Text>
                      <br />
                      <Text className="text-sm text-gray-500">
                        Notify teams when game starts
                      </Text>
                    </div>
                    <Checkbox
                      checked={gameSettings.sendWelcomeMessage}
                      onChange={(e) => setGameSettings({
                        ...gameSettings,
                        sendWelcomeMessage: e.target.checked
                      })}
                    />
                  </div>

                  <Divider className="!my-2" />

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Text strong>Notify All Teams</Text>
                      <br />
                      <Text className="text-sm text-gray-500">
                        Send push notifications to all registered teams
                      </Text>
                    </div>
                    <Checkbox
                      checked={gameSettings.notifyTeams}
                      onChange={(e) => setGameSettings({
                        ...gameSettings,
                        notifyTeams: e.target.checked
                      })}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Game Summary">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <TeamOutlined className="text-blue-500 text-lg" />
                    <div>
                      <Text strong>12 Teams Registered</Text>
                      <br />
                      <Text className="text-sm text-gray-600">48 total team members</Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <QuestionCircleOutlined className="text-green-500 text-lg" />
                    <div>
                      <Text strong>24 MCQ Questions</Text>
                      <br />
                      <Text className="text-sm text-gray-600">Ready for deployment</Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <PictureOutlined className="text-purple-500 text-lg" />
                    <div>
                      <Text strong>16 Puzzle Challenges</Text>
                      <br />
                      <Text className="text-sm text-gray-600">With QR codes generated</Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <SettingOutlined className="text-orange-500 text-lg" />
                    <div>
                      <Text strong>8 Checkpoints</Text>
                      <br />
                      <Text className="text-sm text-gray-600">All locations configured</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Card>
            <div className="flex items-center justify-between">
              <Button onClick={() => setCurrentStep(0)}>
                Back to Checks
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleLaunch}
                className="bg-green-500 hover:bg-green-600"
              >
                Launch Game Now
              </Button>
            </div>
          </Card>
        </>
      )}

      {currentStep === 2 && (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
            <Title level={2} className="text-green-600">Game Launched Successfully!</Title>
            <Text className="text-lg text-gray-600 block mb-6">
              Your treasure hunt is now live and teams can start participating.
            </Text>
            <Space>
              <Button type="primary" size="large" onClick={() => window.location.href = '/admin/monitor'}>
                Go to Live Monitor
              </Button>
              <Button size="large" onClick={() => setCurrentStep(0)}>
                Launch Another Game
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Launch Confirmation Modal */}
      <Modal
        title="Confirm Game Launch"
        open={launchModalVisible}
        onOk={confirmLaunch}
        onCancel={() => setLaunchModalVisible(false)}
        okText="Launch Game"
        cancelText="Cancel"
        okButtonProps={{ 
          className: 'bg-green-500 hover:bg-green-600',
          size: 'large'
        }}
      >
        <Alert
          message="Are you ready to launch?"
          description="Once launched, teams will be notified and can begin the treasure hunt. Make sure all preparations are complete."
          type="warning"
          showIcon
          className="mb-4"
        />
        
        <Title level={5}>Selected Configuration:</Title>
        <List size="small">
          <List.Item>
            <Text>Randomize Routes: {gameSettings.randomizeRoutes ? 'Yes' : 'No'}</Text>
          </List.Item>
          <List.Item>
            <Text>Enable Hints: {gameSettings.enableHints ? 'Yes' : 'No'}</Text>
          </List.Item>
          <List.Item>
            <Text>Welcome Message: {gameSettings.sendWelcomeMessage ? 'Yes' : 'No'}</Text>
          </List.Item>
          <List.Item>
            <Text>Notify Teams: {gameSettings.notifyTeams ? 'Yes' : 'No'}</Text>
          </List.Item>
        </List>
      </Modal>
    </div>
  )
}

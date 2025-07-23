import { Card, Typography, Row, Col, Form, Input, InputNumber, Switch, Button, Divider, message } from 'antd'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface SettingsFormData {
  gameName: string
  basePoints: number
  bonusPoints: number
  penaltyPoints: number
  maxTeams: number
  maxParticipants: number
  gameDuration: number
  enableHints: boolean
  enableTimer: boolean
  allowRetries: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export default function Settings() {
  const [form] = Form.useForm()

  const handleSave = (values: SettingsFormData) => {
    console.log('Settings saved:', values)
    message.success('Settings saved successfully!')
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <SettingOutlined />
            Global Settings
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">Configure application-wide settings and preferences</Text>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Save </span>Settings
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          gameName: 'Tour 2025 - RobenDevs',
          basePoints: 10,
          bonusPoints: 5,
          penaltyPoints: 2,
          maxTeams: 50,
          maxParticipants: 200,
          gameDuration: 120,
          enableHints: true,
          enableTimer: true,
          allowRetries: false,
          emailNotifications: true,
          pushNotifications: true,
        }}
      >
        <Row gutter={[16, 16]} className="lg:gutter-24">
          {/* Game Configuration */}
          <Col xs={24} lg={12}>
            <Card title={<span className="text-sm sm:text-base">Game Configuration</span>} className="h-full">
              <Form.Item
                label="Game Name"
                name="gameName"
                rules={[{ required: true, message: 'Please enter game name' }]}
              >
                <Input placeholder="Enter game name" />
              </Form.Item>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Base Points"
                    name="basePoints"
                    rules={[{ required: true, message: 'Please enter base points' }]}
                  >
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Bonus Points (per minute saved)"
                    name="bonusPoints"
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Penalty Points (per minute over)"
                    name="penaltyPoints"
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Game Duration (minutes)"
                    name="gameDuration"
                  >
                    <InputNumber min={30} max={480} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Max Teams"
                    name="maxTeams"
                  >
                    <InputNumber min={1} max={100} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Max Participants"
                    name="maxParticipants"
                  >
                    <InputNumber min={1} max={500} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Game Features */}
          <Col xs={24} lg={12}>
            <Card title={<span className="text-sm sm:text-base">Game Features</span>} className="h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Text strong className="text-sm sm:text-base">Enable Hints</Text>
                    <br />
                    <Text className="text-xs sm:text-sm text-gray-500">Allow teams to request hints</Text>
                  </div>
                  <Form.Item name="enableHints" valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <Divider className="!my-2" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Text strong>Enable Timer</Text>
                    <br />
                    <Text className="text-sm text-gray-500">Show countdown timer to participants</Text>
                  </div>
                  <Form.Item name="enableTimer" valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <Divider className="!my-2" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Text strong>Allow Retries</Text>
                    <br />
                    <Text className="text-sm text-gray-500">Let teams retry failed challenges</Text>
                  </div>
                  <Form.Item name="allowRetries" valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <Divider className="!my-2" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Text strong>Email Notifications</Text>
                    <br />
                    <Text className="text-sm text-gray-500">Send updates via email</Text>
                  </div>
                  <Form.Item name="emailNotifications" valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <Divider className="!my-2" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Text strong>Push Notifications</Text>
                    <br />
                    <Text className="text-sm text-gray-500">Send real-time notifications</Text>
                  </div>
                  <Form.Item name="pushNotifications" valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* System Information */}
        <Card title="System Information">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Text strong className="block text-blue-600">Version</Text>
                <Text className="text-sm text-blue-700">1.0.0</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Text strong className="block text-green-600">Status</Text>
                <Text className="text-sm text-green-700">Active</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Text strong className="block text-purple-600">Environment</Text>
                <Text className="text-sm text-purple-700">Development</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  )
}

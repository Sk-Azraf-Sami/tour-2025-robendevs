import { useEffect } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Button,
  message,
} from "antd";
import { SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { FirestoreService } from "../../services/FireStoreService";

const { Title, Text } = Typography;

interface SettingsFormData {
  gameName: string;
  basePoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  maxTeams: number;
  maxParticipants: number;
  gameDuration: number;
  roundTime: number; // Time limit per checkpoint in minutes
  enableHints: boolean;
  enableTimer: boolean;
  allowRetries: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function Settings() {
  const [form] = Form.useForm();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await FirestoreService.getGlobalSettings();
        if (settings) {
          form.setFieldsValue({
            gameName: settings.gameName,
            basePoints: settings.base_points,
            bonusPoints: settings.bonus_per_minute,
            penaltyPoints: settings.penalty_points,
            maxTeams: settings.max_teams,
            maxParticipants: settings.max_participants,
            gameDuration: settings.game_duration,
            roundTime: settings.round_time || 5, // Default to 5 minutes if not set
            enableHints: settings.enable_hints ?? true,
            enableTimer: settings.enable_timer ?? true,
            allowRetries: settings.allow_retries ?? false,
            emailNotifications: settings.email_notifications ?? true,
            pushNotifications: settings.push_notifications ?? true,
          });
        }
      } catch {
        message.error("Failed to load settings");
      }
    }
    fetchSettings();
  }, [form]);

  const handleSave = async (values: SettingsFormData) => {
    try {
      await FirestoreService.updateGlobalSettings({
        gameName: values.gameName,
        base_points: values.basePoints,
        bonus_per_minute: values.bonusPoints,
        penalty_points: values.penaltyPoints,
        max_teams: values.maxTeams,
        max_participants: values.maxParticipants,
        game_duration: values.gameDuration,
        round_time: values.roundTime,
        // enable_hints: values.enableHints,
        // enable_timer: values.enableTimer,
        // allow_retries: values.allowRetries,
        // email_notifications: values.emailNotifications,
        // push_notifications: values.pushNotifications,
      });
      message.success("Settings saved to Firestore!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      message.error(
        `Failed to save settings: ${errorMessage}`
      );
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title
            level={2}
            className="!mb-1 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl"
          >
            <SettingOutlined />
            Global Settings
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">
            Configure application-wide settings and preferences
          </Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="inline">Save </span>Settings
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={[16, 16]} className="lg:gutter-24">
          {/* Game Configuration */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="text-sm sm:text-base">Game Configuration</span>
              }
              className="h-full"
            >
              <Form.Item
                label="Game Name"
                name="gameName"
                rules={[{ required: true, message: "Please enter game name" }]}
              >
                <Input placeholder="Enter game name" />
              </Form.Item>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Base Points"
                    name="basePoints"
                    rules={[
                      { required: true, message: "Please enter base points" },
                    ]}
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
                    label="Round Time (minutes per checkpoint)"
                    name="roundTime"
                    rules={[
                      { required: true, message: "Please enter round time" },
                    ]}
                    help="Time limit per checkpoint. Teams get bonus for finishing early, penalty for exceeding this time."
                  >
                    <InputNumber min={1} max={60} className="w-full" placeholder="5" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Game Duration (minutes)"
                    name="gameDuration"
                  >
                    <InputNumber min={30} max={480} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Max Teams" name="maxTeams">
                    <InputNumber min={1} max={100} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 16]} className="sm:gutter-16">
                <Col xs={24} sm={12}>
                  <Form.Item label="Max Participants" name="maxParticipants">
                    <InputNumber min={1} max={500} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        {/* System Information */}
        <Card title="System Information">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Text strong className="block text-blue-600">
                  Version
                </Text>
                <Text className="text-sm text-blue-700">1.0.0</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Text strong className="block text-green-600">
                  Status
                </Text>
                <Text className="text-sm text-green-700">Active</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Text strong className="block text-purple-600">
                  Environment
                </Text>
                <Text className="text-sm text-purple-700">Development</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}

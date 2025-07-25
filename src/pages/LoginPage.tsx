import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Tabs, Input, Button, Form, Alert, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  QrcodeOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/auth";
import { NavigationService } from "../services/NavigationService";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Handle navigation after successful login
  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = NavigationService.getRedirectPath(user);
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate]);

  const handleTeamSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setError("");
    const success = await login(values.username, values.password);
    if (!success) {
      setError("Invalid email or password");
    }
  };

  const handleAdminSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setError("");
    const success = await login(values.username, values.password);
    if (!success) {
      setError("Invalid username or password");
    }
  };

  const handleTabChange = () => {
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500 rounded-full mb-3 sm:mb-4">
            <TrophyOutlined className="text-lg sm:text-2xl text-white" />
          </div>
          <Title
            level={1}
            className="!text-2xl sm:!text-3xl !font-bold !text-gray-900 !mb-2"
          >
            Treasure Hunt
          </Title>
          <Text className="text-gray-600 text-base sm:text-lg">
            Management System
          </Text>
        </div>

        {/* Login Card with Tabs */}
        <Card className="shadow-lg rounded-xl border-0 mx-2 sm:mx-0">
          <Tabs
            defaultActiveKey="team"
            centered
            onChange={handleTabChange}
            size="small"
            items={[
              {
                key: "team",
                label: (
                  <span className="flex items-center gap-2">
                    <UserSwitchOutlined />
                    Team
                  </span>
                ),
                children: (
                  <div className="px-1 sm:px-2 pb-4">
                    <div className="text-center mb-4 sm:mb-6">
                      <Title level={4} className="!mb-2 text-base sm:text-lg">
                        Team Access
                      </Title>
                      <Text type="secondary" className="text-sm sm:text-base">
                        Join the treasure hunt adventure
                      </Text>
                    </div>

                    {error && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        className="mb-4"
                      />
                    )}

                    <Form
                      onFinish={handleTeamSubmit}
                      layout="vertical"
                      size="large"
                    >
                      <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                          {
                            required: true,
                            message: "Please input your username!",
                          },
                          {
                            type: "string",
                            message: "Please enter a valid username!",
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="Team083"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: "Please input your password!",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Enter your password"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isLoading}
                          className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-indigo-500 hover:bg-indigo-600 border-indigo-500 hover:border-indigo-600"
                        >
                          {isLoading ? "Joining Hunt..." : "Join Hunt"}
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                ),
              },
              {
                key: "admin",
                label: (
                  <span className="flex items-center gap-2">
                    <SettingOutlined />
                    Admin
                  </span>
                ),
                children: (
                  <div className="px-1 sm:px-2 pb-4">
                    <div className="text-center mb-4 sm:mb-6">
                      <Title level={4} className="!mb-2 text-base sm:text-lg">
                        Admin Access
                      </Title>
                      <Text type="secondary" className="text-sm sm:text-base">
                        Administrative access to manage treasure hunts
                      </Text>
                    </div>

                    {error && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        className="mb-4"
                      />
                    )}

                    <Form
                      onFinish={handleAdminSubmit}
                      layout="vertical"
                      size="large"
                    >
                      <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                          {
                            required: true,
                            message: "Please input your username!",
                          },
                          {
                            type: "string",
                            message: "Please enter a valid username!",
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="admin083"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: "Please input your password!",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Enter admin password"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isLoading}
                          className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-indigo-500 hover:bg-indigo-600 border-indigo-500 hover:border-indigo-600"
                        >
                          {isLoading ? "Signing in..." : "Admin Login"}
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Forgot Password & Sign Up Links 
        <div className="mt-4 sm:mt-6 text-center space-y-2 px-2 sm:px-0">
          <div>
            <Link 
              to="/forgot-password" 
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div>
            <Text className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign up
              </Link>
            </Text>
          </div>
        </div> */}
        {/* QR Scanner Test Link */}
        <div className="mt-8 flex justify-center">
          <Link to="/qr-test">
            <Button
              type="primary"
              icon={<QrcodeOutlined/>}
              className="!bg-[#555555] !border-0 !text-white hover:!bg-[#312f2f] font-semibold shadow-lg transition-all"
              size="large"
              style={{
                borderRadius: 999,
                padding: "0 28px",
                letterSpacing: 0.5,
              }}
            >
              Test QR Scanner on your device
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import { Layout, Menu, Button, Typography } from 'antd'
import {
  DashboardOutlined,
  QuestionCircleOutlined,
  PictureOutlined,
  TeamOutlined,
  SettingOutlined,
  MonitorOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const { Sider } = Layout
const { Title, Text } = Typography

const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/admin'
  },
  {
    key: '/admin/mcqs',
    icon: <QuestionCircleOutlined />,
    label: 'MCQs',
    path: '/admin/mcqs'
  },
  {
    key: '/admin/puzzles',
    icon: <PictureOutlined />,
    label: 'Puzzles',
    path: '/admin/puzzles'
  },
  {
    key: '/admin/teams',
    icon: <TeamOutlined />,
    label: 'Teams',
    path: '/admin/teams'
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    path: '/admin/settings'
  },
  {
    key: '/admin/monitor',
    icon: <MonitorOutlined />,
    label: 'Live Monitor',
    path: '/admin/monitor'
  },
  {
    key: '/admin/launch',
    icon: <PlayCircleOutlined />,
    label: 'Launch Game',
    path: '/admin/launch'
  }
]

interface AdminSidebarProps {
  collapsed: boolean
}

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      className="min-h-screen"
      theme="light"
      width={280}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-lg">
            <TrophyOutlined className="text-white text-lg" />
          </div>
          {!collapsed && (
            <div>
              <Title level={4} className="!mb-0 !text-gray-900">
                Treasure Hunt
              </Title>
              <Text className="text-xs text-gray-500">Admin Panel</Text>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1 py-4">
          <div className="px-4 pb-2">
            {!collapsed && (
              <Text className="text-xs uppercase font-medium text-gray-500 tracking-wider">
                Management
              </Text>
            )}
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            className="border-r-0"
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: <Link to={item.path}>{item.label}</Link>
            }))}
          />
        </div>

        <div className="border-t border-gray-200 p-4">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="w-full flex items-center justify-start"
            danger
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>
    </Sider>
  )
}

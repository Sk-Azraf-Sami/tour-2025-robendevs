import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import { Layout, Menu, Button, Typography } from 'antd'
import {
  QuestionCircleOutlined,
  PictureOutlined,
  TeamOutlined,
  SettingOutlined,
  MonitorOutlined,
  TrophyOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const { Sider } = Layout
const { Title, Text } = Typography

const menuItems = [
  // {
  //   key: '/admin',
  //   icon: <DashboardOutlined />,
  //   label: 'Dashboard',
  //   path: '/admin'
  // },
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
  // {
  //   key: '/admin/launch',
  //   icon: <PlayCircleOutlined />,
  //   label: 'Launch Game',
  //   path: '/admin/launch'
  // }
]

interface AdminSidebarProps {
  collapsed: boolean
  isMobile?: boolean
  onMenuClick?: () => void
}

export default function AdminSidebar({ collapsed, isMobile = false, onMenuClick }: AdminSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const handleMenuClick = () => {
    if (isMobile && onMenuClick) {
      onMenuClick()
    }
  }

  const sidebarContent = (
    <>
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 8px rgba(79, 70, 229, 0.3)'
            }}
          >
            <TrophyOutlined className="text-white text-sm sm:text-lg" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <Title level={5} className="!mb-0 !text-gray-900 text-sm sm:!text-base truncate font-bold">
                Treasure Hunt
              </Title>
              <Text className="text-xs text-indigo-600 block font-medium">Admin Panel</Text>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1 py-2 sm:py-4">
          <div className="px-3 sm:px-4 pb-2">
            {(!collapsed || isMobile) && (
              <Text className="text-xs uppercase font-medium text-gray-500 tracking-wider block">
                Management
              </Text>
            )}
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            className="border-r-0"
            onClick={handleMenuClick}
            inlineCollapsed={collapsed && !isMobile}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: <Link to={item.path} className="text-sm sm:text-base truncate">{item.label}</Link>
            }))}
          />
        </div>

        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="w-full flex items-center justify-start text-sm sm:text-base hover:bg-red-50 border-0 rounded-lg transition-all duration-300"
            style={{
              color: '#dc2626',
              fontWeight: '500'
            }}
            danger
          >
            {(!collapsed || isMobile) && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed && !isMobile}
      className="min-h-screen"
      theme="light"
      width={280}
      collapsedWidth={isMobile ? 0 : 80}
      breakpoint="lg"
    >
      {sidebarContent}
    </Sider>
  )
}

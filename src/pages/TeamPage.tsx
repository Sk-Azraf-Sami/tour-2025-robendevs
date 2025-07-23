import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Button, Typography } from 'antd'
import { TrophyOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/auth'
import { NavigationService } from '../services/NavigationService'

const { Header, Content } = Layout
const { Text } = Typography

export default function TeamPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user || !NavigationService.canAccessTeam(user)) {
      navigate('/login')
      return
    }

    // If at team root, redirect to dashboard
    if (location.pathname === '/team') {
      navigate('/team/dashboard')
    }
  }, [user, navigate, location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user || !NavigationService.canAccessTeam(user)) {
    return null
  }

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header className="bg-white border-b shadow-sm px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-xl text-indigo-600" />
            <div>
              <Text className="font-bold text-lg">Treasure Hunt</Text>
              <br />
              <Text type="secondary" className="text-sm">Team: {NavigationService.getTeamDisplayName(user)}</Text>
            </div>
          </div>
          <Button 
            type="default" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            Logout
          </Button>
        </div>
      </Header>
      <Content className="max-w-4xl mx-auto w-full p-4">
        <Outlet />
      </Content>
    </Layout>
  )
}

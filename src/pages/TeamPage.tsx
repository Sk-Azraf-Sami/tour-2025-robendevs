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
      <Header
        className="border-b shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          height: 'auto',
          minHeight: '72px',
          padding: '0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background elements */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />
        
        <div className="relative px-4 sm:px-6 lg:px-8 h-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-full py-3 sm:py-4">
            {/* Left section - Title and Team info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                  }}
                >
                  <TrophyOutlined 
                    className="text-lg sm:text-xl" 
                    style={{ color: '#fff' }} 
                  />
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <Text 
                    className="font-bold text-lg sm:text-xl lg:text-2xl block truncate leading-tight" 
                    style={{ color: '#fff', margin: 0 }}
                  >
                    Treasure Hunt
                  </Text>
                  
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <div 
                      className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                      title="Active Game"
                    />
                    <Text 
                      className="text-xs sm:text-sm font-medium truncate" 
                      style={{ color: '#cbd5e1' }}
                    >
                      Team: {NavigationService.getTeamDisplayName(user)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right section - Logout button */}
            <div className="flex-shrink-0 ml-4">
              <Button 
                type="default" 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="flex items-center gap-2 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="middle"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontWeight: '500',
                  borderRadius: '12px',
                  height: '40px',
                  minWidth: '40px'
                }}
              >
                <span className="hidden sm:inline font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom gradient line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)'
          }}
        />
      </Header>
      
      <Content className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </Content>
    </Layout>
  )
}
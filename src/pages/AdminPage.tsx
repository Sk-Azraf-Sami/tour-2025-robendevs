import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout, Button } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons'
import AdminSidebar from '../components/AdminSidebar'

const { Header, Content } = Layout

export default function AdminPage() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className="min-h-screen">
      <AdminSidebar collapsed={collapsed} />
      <Layout>
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg w-16 h-16"
          />
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

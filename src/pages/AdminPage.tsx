import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Layout, Button, Drawer } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined, TrophyOutlined } from "@ant-design/icons";
import AdminSidebar from "../components/AdminSidebar";

const { Header, Content } = Layout;

export default function AdminPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 992; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleMenuToggle = () => {
    if (isMobile) {
      setDrawerVisible(!drawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && <AdminSidebar collapsed={collapsed} isMobile={false} />}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={handleDrawerClose}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
          width={280}
          className="lg:hidden"
        >
          <AdminSidebar
            collapsed={false}
            isMobile={true}
            onMenuClick={handleDrawerClose}
          />
        </Drawer>
      )}

      <Layout>
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
          
          <div className="relative px-3 sm:px-4 h-full">
            <div className="flex items-center h-full py-3 sm:py-4">
              {/* Menu button and title */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Button
                  type="text"
                  icon={
                    collapsed || isMobile ? (
                      <MenuUnfoldOutlined />
                    ) : (
                      <MenuFoldOutlined />
                    )
                  }
                  onClick={handleMenuToggle}
                  className="flex items-center justify-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    fontWeight: '500',
                    borderRadius: '12px',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px'
                  }}
                />
                
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                      }}
                    >
                      <TrophyOutlined 
                        className="text-sm sm:text-lg text-white" 
                      />
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h1 className="font-bold text-base sm:text-lg text-white truncate leading-tight">
                      Admin Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300 truncate">
                      Treasure Hunt Management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Header>
        <Content className="overflow-auto min-h-full" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

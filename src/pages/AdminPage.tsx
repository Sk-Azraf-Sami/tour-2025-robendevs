import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Layout, Button, Drawer } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
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
        <Header className="bg-white border-b border-gray-200 px-3 sm:px-4 flex items-center h-14 sm:h-16">
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
            className="text-base sm:text-lg w-12 h-12 sm:w-16 sm:h-16"
            style={{ color: "#fff" }}
          />
          <div className="ml-2 sm:ml-4">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
              Admin Dashboard
            </h1>
          </div>
        </Header>
        <Content className="overflow-auto bg-gray-50 min-h-full">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

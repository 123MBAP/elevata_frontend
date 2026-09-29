// components/MainLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "../SideBar";
import ElevataBotWidget from "../AI/ElevataBotWidget";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#eaeff5]">
      {/* Top Header: Full width across the entire top, logo positioned at left corner over sidebar */}
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Workspace below Header */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Main Content View with margin for desktop sidebar */}
        <main className={`min-w-0 w-full flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-[#eaeff5] transition-all duration-200 ${isCollapsed ? 'md:ml-[68px]' : 'md:ml-64'}`}>
          <Outlet />
        </main>
      </div>

      {/* Global AI Chat Widget */}
      <ElevataBotWidget />
    </div>
  );
}
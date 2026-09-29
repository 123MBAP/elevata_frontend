// components/MainLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "../SideBar";
import ElevataBotWidget from "../AI/ElevataBotWidget";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-x-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-w-0 w-full flex-1 flex-col md:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-w-0 w-full flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global AI Chat Widget */}
      <ElevataBotWidget />
    </div>
  );
}
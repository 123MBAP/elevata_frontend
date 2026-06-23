// components/MainLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "../SideBar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 w-full">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
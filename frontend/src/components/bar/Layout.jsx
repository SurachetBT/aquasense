import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardMinus, Droplets, LogOut, Settings } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // รายการเมนูสำหรับจอมือถือ
  const menuItems = [
    { path: '/dashboard', label: 'หน้าหลัก', icon: LayoutDashboard },
    { path: '/reports', label: 'รายงาน', icon: ClipboardMinus },
    { path: '/users', label: 'ผู้ใช้งาน', icon: Users },
    { path: '/settings', label: 'ตั้งค่า', icon: Settings },
  ];

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* ========================================== */}
      {/* 💻 ส่วนที่ 1: สำหรับจอคอมพิวเตอร์ (Desktop) */}
      {/* ========================================== */}
      {/* ซ่อนบนมือถือ (hidden) และแสดงบนจอใหญ่ (md:block) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ========================================== */}
      {/* 📱 ส่วนที่ 2: แถบด้านบนสำหรับมือถือ (Mobile Topbar) */}
      {/* ========================================== */}
      {/* แสดงบนมือถือ และซ่อนบนจอใหญ่ (md:hidden) */}
      <div className="md:hidden bg-white h-14 border-b border-gray-200 flex items-center justify-between px-4 fixed top-0 w-full z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <Droplets className="text-blue-600" size={24} />
          <span className="font-bold text-lg text-gray-800">AquaSense</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* ========================================== */}
      {/* 📄 ส่วนที่ 3: พื้นที่แสดงเนื้อหาหลัก (Main Content) */}
      {/* ========================================== */}
      <main className="flex-1 w-full md:ml-64 pt-16 pb-20 md:pt-0 md:pb-0 p-4 md:p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>

      {/* ========================================== */}
      {/* 📱 ส่วนที่ 4: แถบเมนูด้านล่างสำหรับมือถือ (Mobile Bottom Nav) */}
      {/* ========================================== */}
      {/* แสดงบนมือถือ และซ่อนบนจอใหญ่ (md:hidden) */}
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full flex justify-around items-center h-16 z-20 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              {/* ขีดสีฟ้าด้านบนไอคอน (เวลาเลือกเมนูนั้น) */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
              
              <item.icon 
                size={22} 
                className={`mb-1 transition-all duration-200 ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400'}`} 
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

    </div>
  );
};

export default Layout;
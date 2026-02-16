import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, ClipboardMinus , Droplets } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  // รายการเมนู
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reports', label: 'Reports', icon: ClipboardMinus },
    { path: '/users', label: 'User Management', icon: Users },
    // เพิ่มเมนูอื่นๆ ตรงนี้ได้
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10 shadow-sm">
      
      {/* 1. Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Droplets className="text-blue-600 mr-2" size={28} />
        <span className="text-xl font-bold text-gray-800">AquaSense</span>
      </div>

      {/* 2. Menu Links */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          // เช็คว่าหน้าปัจจุบันตรงกับเมนูนี้ไหม เพื่อเปลี่ยนสี
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Profile / Logout (ด้านล่างสุด) */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
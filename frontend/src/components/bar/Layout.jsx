import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* ส่วนที่ 1: Sidebar ทางซ้าย */}
      <Sidebar />

      {/* ส่วนที่ 2: เนื้อหาหลัก ทางขวา */}
      {/* ml-64 คือเว้นระยะซ้ายเท่ากับความกว้าง Sidebar (w-64) */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Outlet คือจุดที่ React Router จะเอาหน้าต่างๆ มาแสดงตรงนี้ */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
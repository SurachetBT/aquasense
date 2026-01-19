import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. Import ไฟล์เข้ามา (เช็ค path ให้ถูกนะ)
import Login from './login';
import Dashboard from './Dashboard';
import UserManagement from './components/UserManagement/UserManagement'; 
import Layout from './components/bar/Layout';
function App() {
  return (
    <BrowserRouter>
      <Routes>    
        {/* หน้าแรกให้ไป Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
        {/* 2. กำหนด Path สำหรับหน้าจัดการ User */}
        <Route path="/users" element={<UserManagement />} />
        
        {/* ถ้ามีหน้า Dashboard ก็ใส่ไว้แบบนี้ */}
        {<Route path="/dashboard" element={<Dashboard />} />}
       </Route>
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
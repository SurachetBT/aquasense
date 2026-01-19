import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const AddUserModal = ({ onClose, onSuccess, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    username: '', name: '', email: '', password: '', confirm_password: '', role: 'user'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      // ยิงไปที่ /register (ต่อท้าย apiBaseUrl ที่รับมา)
      await axios.post(`${apiBaseUrl}/register`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('สร้างผู้ใช้งานสำเร็จ!');
      onSuccess();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">เพิ่มผู้ใช้งานใหม่</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
              <input type="text" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" required minLength={8} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input type="password" required minLength={8} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setFormData({...formData, confirm_password: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สิทธิ์การใช้งาน (Role)</label>
            <select className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setFormData({...formData, role: e.target.value})} value={formData.role}>
              <option value="user">User (พนักงานทั่วไป)</option>
              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 mt-2 transition">
            {loading ? 'กำลังบันทึก...' : 'สร้างบัญชี'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
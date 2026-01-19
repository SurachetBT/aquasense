import React, { useState } from 'react';
import axios from 'axios';
import { X, Shield } from 'lucide-react';

const ResetPasswordModal = ({ user, onClose, apiBaseUrl }) => {
  const [passwords, setPasswords] = useState({ new_password: '', confirm_new_password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_new_password) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const payload = { 
        new_password: passwords.new_password 
      };
      
      await axios.post(`${apiBaseUrl}/${user.id}/reset-password`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      onClose();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-orange-50">
          <h3 className="font-bold text-lg text-orange-800 flex items-center gap-2">
            <Shield size={20}/> รีเซ็ตรหัสผ่าน
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
        </div>
        <div className="p-4 bg-orange-50/30 text-sm text-gray-600 mb-2">
          กำลังเปลี่ยนรหัสผ่านให้: <strong>{user.username}</strong>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 pt-0">
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
            <input type="password" required minLength={8} className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" 
              onChange={e => setPasswords({...passwords, new_password: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" required minLength={8} className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" 
              onChange={e => setPasswords({...passwords, confirm_new_password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} 
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50 transition">
            {loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
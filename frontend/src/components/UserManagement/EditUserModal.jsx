import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, UserCog } from 'lucide-react';

const EditUserModal = ({ user, onClose, onSuccess, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลเก่ามาใส่ฟอร์ม
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email || '',
        role: user.role, // ค่า role เดิม (user/admin)
        is_active: user.is_active // ค่า boolean เดิม (true/false)
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // เตรียมข้อมูลสำหรับส่ง (Payload)
      // ไม่ต้องส่ง username เพราะ Schema เป็น Optional และเราไม่ได้แก้
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active // ส่งเป็น Boolean ตรงๆ ได้เลย (axios จัดการ JSON ให้)
      };

      // ยิง PATCH request
      await axios.patch(`${apiBaseUrl}/${user.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('แก้ไขข้อมูลสำเร็จ!');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        
        <div className="p-4 border-b flex justify-between items-center bg-blue-50">
          <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
            <UserCog size={20} /> แก้ไขข้อมูลผู้ใช้งาน
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Username</label>
              {/* Username แสดงให้ดูเฉยๆ ไม่ต้องเก็บลง State เพื่อส่ง */}
              <input 
                type="text" 
                value={user.username} 
                disabled 
                className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">ชื่อ-นามสกุล</label>
              <input 
                type="text" 
                required 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input 
              type="email" 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role Select */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">สิทธิ์การใช้งาน</label>
              <select 
                className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                {/* Value ตรงนี้ต้องตรงกับ Enum ใน Backend ("user", "admin") */}
                <option value="user">User (พนักงานทั่วไป)</option>
                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
              </select>
            </div>
            
            {/* Status Select (Highlight จุดสำคัญ) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">สถานะ</label>
              <select 
                className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium
                  ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}
                
                // 1. แปลง Boolean เป็น String เพื่อให้ select แสดงผลถูก
                value={formData.is_active.toString()} 
                
                // 2. แปลง String กลับเป็น Boolean ตอนเลือกค่า
                onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
              >
                <option value="true">✅ Active (ปกติ)</option>
                <option value="false">⛔ Inactive (ระงับ)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
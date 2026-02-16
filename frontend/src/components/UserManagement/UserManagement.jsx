import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserPlus, Trash2, Key, Search, Pencil, RefreshCw 
} from 'lucide-react';

// Import Components
import AddUserModal from './AddUserModal';
import ResetPasswordModal from './ResetPasswordModal';
import EditUserModal from './EditUserModal'; 

// ✅ 1. แก้ไขให้ใช้พอร์ต 9090 จาก config ส่วนกลาง
import { API_BASE_URL as BASE_URL } from '../../config';
const API_BASE_URL = `${BASE_URL}/v1/users`;

const UserManagement = () => {
  // --- States ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- 2. ฟังก์ชันดึงข้อมูล (เพิ่มการจัดการ Token) ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
            search: search,
            limit: 100 
        } 
      });

      // ตรวจสอบโครงสร้างข้อมูล
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data.items) {
        setUsers(response.data.items);
      } else {
        setUsers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      // ✅ ถ้า Token หมดอายุ (401) ให้เด้งไปหน้า Login
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้ (ตรวจสอบสิทธิ์ Admin)");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. useEffect ---
  useEffect(() => {
    // ใช้ debounce เล็กน้อยเพื่อไม่ให้ยิง API ถี่เกินไปขณะพิมพ์ค้นหา
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // --- 4. ฟังก์ชันลบ ---
  const handleDelete = async (user) => {
    if (!window.confirm(`คุณต้องการลบผู้ใช้ ${user.username} ใช่หรือไม่?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      // ✅ ตรวจสอบ Path การลบให้ตรงกับ Backend (ปกติจะใช้ user.id หรือ user._id)
      const userId = user.id || user._id;
      await axios.delete(`${API_BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("ลบผู้ใช้งานสำเร็จ");
      fetchUsers(); 
    } catch (err) {
      alert("ลบไม่สำเร็จ: " + (err.response?.data?.detail || err.message));
    }
  };

  // --- 5. ส่วนแสดงผล (Render) ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header & Actions */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" /> จัดการผู้ใช้งาน
            </h1>
            <p className="text-gray-500 text-sm mt-1">รายชื่อพนักงานทั้งหมดในระบบ</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
             {/* ช่องค้นหา */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ, อีเมล..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            {/* ปุ่มเพิ่มผู้ใช้ */}
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition shadow-sm whitespace-nowrap"
            >
                <UserPlus size={18} /> <span className="hidden sm:inline">เพิ่มผู้ใช้งาน</span>
            </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Loading State */}
        {loading && <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>}
        
        {/* Error State */}
        {!loading && error && (
            <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
                <p>{error}</p>
                <button onClick={fetchUsers} className="text-blue-600 underline flex items-center gap-1">
                    <RefreshCw size={16}/> ลองใหม่
                </button>
            </div>
        )}

        {/* Table Data */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* ✅ ส่วนหัวตาราง (Thead) ที่หายไป */}
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase">
                <tr>
                  <th className="p-4 font-medium">ชื่อผู้ใช้งาน</th>
                  <th className="p-4 font-medium">สิทธิ์ (Role)</th>
                  <th className="p-4 font-medium">สถานะ</th>
                  <th className="p-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100">
                {users.length > 0 ? users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition">
                    
                    {/* ข้อมูล User */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                        ${user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                        </span>
                      )}
                    </td>
                    
                    {/* Action Buttons */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {/* ปุ่ม Edit */}
                        <button 
                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="แก้ไขข้อมูล"
                        >
                            <Pencil size={18} />
                        </button>

                        {/* ปุ่ม Reset Password */}
                        <button 
                            onClick={() => { setSelectedUser(user); setShowResetModal(true); }}
                            className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                            title="เปลี่ยนรหัสผ่าน"
                        >
                            <Key size={18} />
                        </button>

                        {/* ปุ่ม Delete */}
                        <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="ลบผู้ใช้"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-12 text-center text-gray-400">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Modals Section --- */}
      {showAddModal && (
        <AddUserModal 
          apiBaseUrl={API_BASE_URL}
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { fetchUsers(); setShowAddModal(false); }} 
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal 
          apiBaseUrl={API_BASE_URL}
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSuccess={() => { fetchUsers(); setShowEditModal(false); }}
        />
      )}

      {showResetModal && selectedUser && (
        <ResetPasswordModal 
          apiBaseUrl={API_BASE_URL}
          user={selectedUser}
          onClose={() => { setShowResetModal(false); setSelectedUser(null); }}
        />
      )}

    </div>
  );
};

export default UserManagement;
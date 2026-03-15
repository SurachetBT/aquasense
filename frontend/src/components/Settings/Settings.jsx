import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Bell, UserPlus, Trash2, ToggleLeft, ToggleRight, Save, ShieldCheck, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Settings = () => {
    // LINE Config State
    const [lineConfig, setLineConfig] = useState({
        line_channel_access_token: '',
        line_channel_secret: ''
    });
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);

    // LINE Users State
    const [lineUsers, setLineUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', line_user_id: '' });
    const [userAdding, setUserAdding] = useState(false);

    const getAuthHeader = () => {
        const token = localStorage.getItem('accessToken');
        return { Authorization: `Bearer ${token}` };
    };

    // Fetch Initial Data
    useEffect(() => {
        fetchLineConfig();
        fetchLineUsers();
    }, []);

    const fetchLineConfig = async () => {
        setConfigLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/line_config`, { headers: getAuthHeader() });
            setLineConfig({
                line_channel_access_token: response.data.line_channel_access_token || '',
                line_channel_secret: response.data.line_channel_secret || ''
            });
        } catch (error) {
            console.error("Failed to fetch LINE config:", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchLineUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/line_users`, { headers: getAuthHeader() });
            setLineUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch LINE users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setConfigSaving(true);
        try {
            await axios.post(`${API_BASE_URL}/settings/line_config`, lineConfig, { headers: getAuthHeader() });
            alert("บันทึกการตั้งค่า LINE เรียบร้อยแล้ว");
        } catch (error) {
            console.error("Failed to save LINE config:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
        } finally {
            setConfigSaving(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.line_user_id) return;
        setUserAdding(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/line_users`, newUser, { headers: getAuthHeader() });
            setLineUsers([...lineUsers, response.data]);
            setNewUser({ name: '', line_user_id: '' });
        } catch (error) {
            console.error("Failed to add user:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มลูกค้า");
        } finally {
            setUserAdding(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("ยืนยันการลบลูกค้ารายนี้ออกจากการแจ้งเตือน?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/settings/line_users/${id}`, { headers: getAuthHeader() });
            setLineUsers(lineUsers.filter(user => user.id !== id));
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    const handleToggleUser = async (id) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/settings/line_users/${id}/toggle`, {}, { headers: getAuthHeader() });
            setLineUsers(lineUsers.map(user => user.id === id ? response.data : user));
        } catch (error) {
            console.error("Failed to toggle user:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <SettingsIcon size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">การตั้งค่าระบบ</h1>
                    <p className="text-slate-500 font-medium">จัดการ LINE Notify และรายชื่อผู้รับแจ้งเตือนฉุกเฉิน</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section 1: LINE OA Config */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <ShieldCheck className="text-green-500" size={20} />
                            <h2 className="text-xl font-bold text-slate-800">LINE OA Config</h2>
                        </div>
                        <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Channel Access Token</label>
                                <textarea 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono h-32"
                                    value={lineConfig.line_channel_access_token}
                                    onChange={(e) => setLineConfig({...lineConfig, line_channel_access_token: e.target.value})}
                                    placeholder="ใส่ Channel Access Token ที่นี่..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Channel Secret</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    value={lineConfig.line_channel_secret}
                                    onChange={(e) => setLineConfig({...lineConfig, line_channel_secret: e.target.value})}
                                    placeholder="ใส่ Channel Secret ที่นี่..."
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={configSaving}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {configSaving ? "กำลังบันทึก..." : "อัปเดตการตั้งค่า"}
                            </button>
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                <p className="text-[11px] text-amber-700">ระวัง: การเปลี่ยน Token จะส่งผลต่อระบบแจ้งเตือนทันที กรุณาตรวจสอบความถูกต้องก่อนบันทึก</p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Section 2: User List Management */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Add User Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus className="text-blue-500" />
                                เพิ่มผู้รับแจ้งเตือนใหม่
                            </h2>
                        </div>
                        <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <input 
                                    type="text"
                                    placeholder="ชื่อลูกค้า (เช่น คุณมาร์ค)"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex-[1.5]">
                                <input 
                                    type="text"
                                    placeholder="LINE User ID (ดูได้จาก LINE Developers)"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    value={newUser.line_user_id}
                                    onChange={(e) => setNewUser({...newUser, line_user_id: e.target.value})}
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={userAdding}
                                className="px-6 py-2 bg-slate-800 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                            >
                                {userAdding ? "รอสักครู่..." : "เพิ่มรายชื่อ"}
                            </button>
                        </form>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bell className="text-purple-500" />
                                <h2 className="text-xl font-bold text-slate-800">รายชื่อลูกค้า (รับแจ้งเตือนฉุกเฉิน)</h2>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                ทั้งหมด {lineUsers.length} คน
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่อลูกค้า</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">LINE User ID</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะรับแจ้งเตือน</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {usersLoading ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">กำลังโหลดข้อมูลลูกค้า...</td></tr>
                                    ) : lineUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium italic">ยังไม่มีรายชื่อลูกค้าในระบบพ่นแจ้งเตือน</td></tr>
                                    ) : (
                                        lineUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-[10px] text-slate-400">เพิ่มเมื่อ {new Date(user.created_at).toLocaleDateString('th-TH')}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.line_user_id}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleToggleUser(user.id)}
                                                        className={`transition-all ${user.is_active ? 'text-blue-500' : 'text-slate-300'}`}
                                                    >
                                                        {user.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

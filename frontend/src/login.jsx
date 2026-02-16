import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ 1. นำเข้า API_BASE_URL จาก config ส่วนกลาง
import { API_BASE_URL } from "./config";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // FastAPI OAuth2 ใช้ Form Data (URLSearchParams)
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      // --- STEP 1: Login (เปลี่ยนมาใช้ตัวแปร API_BASE_URL) ---
      const loginRes = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.detail || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }

      // เก็บ Access Token ลง LocalStorage
      const token = loginData.access_token;
      localStorage.setItem('accessToken', token);

      // --- STEP 2: ดึงข้อมูลโปรไฟล์ (รวมถึง Role Admin/User) ---
      try {
        const userRes = await fetch(`${API_BASE_URL}/v1/users/me`, { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          // ✅ เก็บข้อมูล User ไว้ใช้เช็คสิทธิ์ Admin ในหน้า Dashboard
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (userErr) {
        console.error("Error fetching user data:", userErr);
      }

      // --- STEP 3: ไปหน้า Dashboard ---
      navigate('/dashboard');

    } catch (err) {
      // ✅ จัดการ Error "Failed to fetch" (พอร์ตผิด/Server ดับ) ให้เข้าใจง่ายขึ้น
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (โปรดตรวจสอบ Docker หรือพอร์ต 9090)' 
        : err.message;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="กรอกชื่อผู้ใช้งาน"
                value={credentials.username}
                onChange={handleChange} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg shadow-blue-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
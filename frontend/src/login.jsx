import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  // 1. กำหนด State สำหรับเก็บค่าจาก Input
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 2. ฟังก์ชันจัดการการเปลี่ยนแปลงใน Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. ฟังก์ชันส่งข้อมูลไปยัง API
const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 1. เตรียมข้อมูลแบบ x-www-form-urlencoded เพื่อให้เข้ากับ OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      // 2. แก้ไข URL ให้ตรงกับ APIRouter prefix และ endpoint
      // ตัวอย่าง: http://localhost:8000/v1/auth/login
      const response = await fetch('http://localhost:9000/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // 3. เก็บข้อมูลตามที่ schemas.Token ของคุณส่งกลับมา
        // ปกติ OAuth2 จะส่ง access_token และ refresh_token
        localStorage.setItem('accessToken', data.access_token);
        
        // ถ้า API ส่งข้อมูล user กลับมาด้วย ให้เก็บไว้ (ถ้าไม่มีให้ข้ามบรรทัดนี้)
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }

        navigate('/dashboard');
      } else {
        // ดึง Error จาก HTTPException ที่คุณ raise ไว้
        setError(data.detail || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง');
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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login'; // นำเข้าไฟล์ Login.jsx ที่เราสร้างกันไว้

function App() {
  // ฟังก์ชันเช็คว่า Login หรือยัง (เช็คจาก LocalStorage)
  const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken');
    return !!token; // คืนค่า true ถ้ามี token, false ถ้าไม่มี
  };

  return (
    <Router>
      <div className="w-full h-screen bg-slate-50">
        <Routes>
          {/* หน้า Login */}
          <Route path="/login" element={<Login />} />

          {/* หน้า Dashboard (Protected: ถ้าไม่ได้ Login ให้เด้งไปหน้า /login) */}
          <Route 
            path="/Dashboard" 
            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
          />

          {/* หน้าแรก: ถ้า Login แล้วไป Dashboard ถ้ายังให้ไป Login */}
          <Route 
            path="/" 
            element={isAuthenticated() ? <Navigate to="/Dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
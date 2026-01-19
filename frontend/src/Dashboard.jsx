import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ 1. เพิ่ม useNavigate
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Activity, Skull, Power, RefreshCw, AlertTriangle, LogOut } from 'lucide-react'; // ✅ 2. เพิ่ม icon LogOut

const API_BASE_URL = "http://localhost:9000"; 

const Dashboard = () => {
  const navigate = useNavigate(); // ✅ 3. เรียกใช้ Hook
  
  const [sensors, setSensors] = useState({ temperature: 0, ph: 0, turbidity: 0, nh3: 0 });
  const [analysis, setAnalysis] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState('temperature');
  const [isConnected, setIsConnected] = useState(false);
  
  // State สำหรับ pump และ servo
  const [deviceStatus, setDeviceStatus] = useState({ 
    pump1: false, 
    pump2: false,
    servo1: false,
    servo2: false,
    servo3: false
  });

  // ✅ 4. ฟังก์ชัน Logout
  const handleLogout = async () => {
      // 1. ดึง Token จากเครื่องมาเตรียมไว้
      const token = localStorage.getItem('accessToken');

      try {
        if (token) {
          // 2. ยิงไปบอก Backend ให้ Blacklist Token นี้
          // (ปรับ URL '/v1/auth/logout' ให้ตรงกับ Router ที่คุณตั้งจริง)
          await axios.post(`${API_BASE_URL}/v1/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}` // ต้องส่ง Token ไปใน Header เพื่อให้ reusable_oauth2 รับค่าได้
            }
          });
        }
      } catch (error) {
        console.error("Logout failed on server:", error);
        // ต่อให้ Server Error ก็ไม่ต้องทำอะไร เพราะบรรทัดล่างจะลบ Token ในเครื่องทิ้งอยู่ดี
      } finally {
        // 3. ล้างข้อมูลในเครื่องและดีดกลับหน้า Login เสมอ
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        navigate('/login'); 
      }
    };

  const fetchLatestData = async () => {
    try {
      const [resTemp, resPh, resTurb, resNh3, resAnalysis] = await Promise.all([
        axios.get(`${API_BASE_URL}/sensors/latest/temperature`),
        axios.get(`${API_BASE_URL}/sensors/latest/ph`),
        axios.get(`${API_BASE_URL}/sensors/latest/turbidity`),
        axios.get(`${API_BASE_URL}/sensors/latest/nh3`),
        axios.get(`${API_BASE_URL}/sensors/status/analysis`) 
      ]);

      setSensors({
        temperature: resTemp.data.temperature || 0,
        ph: resPh.data.ph || 0,
        turbidity: resTurb.data.NTU || 0,
        nh3: resNh3.data.NH3 || 0
      });

      setAnalysis(resAnalysis.data);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching latest data:", error);
      setIsConnected(false);
    }
  };

  const fetchHistory = async (type) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sensors/history/${type}?limit=20`);
      const formattedData = res.data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: item[type === 'turbidity' ? 'NTU' : (type === 'nh3' ? 'NH3' : type)]
      })).reverse();
      setHistoryData(formattedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchLatestData();
    fetchHistory(selectedGraph);
    const interval = setInterval(() => {
      fetchLatestData();
      fetchHistory(selectedGraph);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedGraph]);

  const handleControl = async (device, action) => {
    try {
      await axios.post(`${API_BASE_URL}/control/${device}/${action}`);
      setDeviceStatus(prev => ({
        ...prev,
        [device]: action === 'on'
      }));
    } catch (error) {
      console.error("Control failed:", error);
      alert("สั่งงานไม่สำเร็จ Check Server!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-800">
      {/* Header */}
      {/* ✅ 5. ปรับ Header ให้รองรับปุ่ม Logout */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          🌊 AquaSense <span className="text-sm font-normal text-slate-500">Monitor System</span>
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? "ONLINE" : "OFFLINE"}
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* System Analysis Banner */}
      {analysis && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 shadow-sm transition-all
          ${analysis.status === 'normal' || analysis.status === 'good' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-orange-50 border-orange-200 text-orange-800'}
        `}>
          <div className={`p-3 rounded-full ${analysis.status === 'normal' || analysis.status === 'good' ? 'bg-green-100' : 'bg-orange-100'}`}>
            {analysis.status === 'normal' || analysis.status === 'good' 
              ? <Activity size={24} /> 
              : <AlertTriangle size={24} /> 
            }
          </div>
          <div>
            <h3 className="font-bold text-lg">System Analysis</h3>
            <p className="text-sm opacity-90">{analysis.message || JSON.stringify(analysis)}</p>
          </div>
        </div>
      )}

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SensorCard 
          title="Temperature" 
          value={`${sensors.temperature} °C`} 
          icon={<Thermometer className="text-orange-500" />} 
          color="orange"
          onClick={() => setSelectedGraph('temperature')}
          active={selectedGraph === 'temperature'}
        />
        <SensorCard 
          title="pH Level" 
          value={sensors.ph} 
          icon={<Droplets className="text-blue-500" />} 
          color="blue"
          onClick={() => setSelectedGraph('ph')}
          active={selectedGraph === 'ph'}
        />
        <SensorCard 
          title="Turbidity" 
          value={`${sensors.turbidity} NTU`} 
          icon={<Activity className="text-purple-500" />} 
          color="purple"
          onClick={() => setSelectedGraph('turbidity')}
          active={selectedGraph === 'turbidity'}
        />
        <SensorCard 
          title="Ammonia (NH3)" 
          value={`${sensors.nh3} ppm`} 
          icon={<Skull className="text-red-500" />} 
          color="red"
          onClick={() => setSelectedGraph('nh3')}
          active={selectedGraph === 'nh3'}
        />
      </div>

      {/* Graph & Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold capitalize">📊 {selectedGraph} History</h3>
            <button onClick={() => fetchHistory(selectedGraph)} className="p-2 hover:bg-slate-100 rounded-full">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Power className="w-5 h-5 text-slate-600" /> Control Center
          </h3>
          <div className="space-y-4 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Water Pumps</p>
            <PumpSwitch name="Pump 1" isOn={deviceStatus.pump1} onToggle={(state) => handleControl('pump1', state ? 'on' : 'off')} />
            <PumpSwitch name="Pump 2" isOn={deviceStatus.pump2} onToggle={(state) => handleControl('pump2', state ? 'on' : 'off')} />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feeders / Servos</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(num => {
                const deviceName = `servo${num}`;
                const isOn = deviceStatus[deviceName];
                
                return (
                  <button
                    key={num}
                    onClick={() => handleControl(deviceName, isOn ? 'off' : 'on')}
                    className={`py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 border
                      ${isOn 
                        ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                        : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                      }
                    `}
                  >
                    Servo {num}
                    <span className="block text-[10px] font-normal opacity-80">{isOn ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const colorMap = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', ring: 'ring-orange-500', label: 'bg-orange-100 text-orange-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', ring: 'ring-blue-500', label: 'bg-blue-100 text-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', ring: 'ring-purple-500', label: 'bg-purple-100 text-purple-600' },
  red: { bg: 'bg-red-50', border: 'border-red-500', ring: 'ring-red-500', label: 'bg-red-100 text-red-600' },
};

const SensorCard = ({ title, value, icon, color, onClick, active }) => {
  const theme = colorMap[color];
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md
        ${active ? `${theme.border} ring-1 ${theme.ring}` : 'border-slate-200'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${theme.bg}`}>{icon}</div>
        {active && <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${theme.label}`}>Selected</span>}
      </div>
      <h4 className="text-slate-500 text-sm font-medium uppercase">{title}</h4>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
};

const PumpSwitch = ({ name, isOn, onToggle }) => (
  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
    <span className="font-medium text-slate-700">{name}</span>
    <button 
      onClick={() => onToggle(!isOn)}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default Dashboard;
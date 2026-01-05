import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Activity, Skull, Power, RefreshCw } from 'lucide-react';

// ✅ Config: ตั้งค่า Base URL ตามที่คุณระบุ (Port 9000)
const API_BASE_URL = "http://localhost:9000"; 

const Dashboard = () => {
  // --- State เก็บข้อมูล ---
  const [sensors, setSensors] = useState({
    temperature: 0,
    ph: 0,
    turbidity: 0,
    nh3: 0
  });
  
  const [historyData, setHistoryData] = useState([]); // สำหรับกราฟ
  const [selectedGraph, setSelectedGraph] = useState('temperature'); // เลือกดูกราฟอะไร
  const [isConnected, setIsConnected] = useState(false);
  
  // State สำหรับสถานะปั๊ม (UI)
  const [pumpStatus, setPumpStatus] = useState({ pump1: false, pump2: false });

  // --- 1. Function ดึงข้อมูลล่าสุด (Get Latest Value) ---
  // API คุณแยก path กัน เราจึงใช้ Promise.all ยิงพร้อมกัน 4 ตัวเพื่อให้เร็ว
  const fetchLatestData = async () => {
    try {
      const [resTemp, resPh, resTurb, resNh3] = await Promise.all([
        axios.get(`${API_BASE_URL}/sensors/latest/temperature`),
        axios.get(`${API_BASE_URL}/sensors/latest/ph`),
        axios.get(`${API_BASE_URL}/sensors/latest/turbidity`),
        axios.get(`${API_BASE_URL}/sensors/latest/nh3`)
      ]);

      // Map ข้อมูลตาม Key ที่ API ส่งกลับมา (temperature, ph, NTU, NH3)
      setSensors({
        temperature: resTemp.data.temperature || 0,
        ph: resPh.data.ph || 0,
        turbidity: resTurb.data.NTU || 0,   // ระวัง: API ส่ง key "NTU"
        nh3: resNh3.data.NH3 || 0           // ระวัง: API ส่ง key "NH3"
      });

      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching latest data:", error);
      setIsConnected(false);
    }
  };

  // --- 2. Function ดึงข้อมูลกราฟ (Get History) ---
  const fetchHistory = async (type) => {
    try {
      // API: /sensors/history/{sensor_type}?limit=20
      const res = await axios.get(`${API_BASE_URL}/sensors/history/${type}?limit=20`);
      
      // แปลงข้อมูลให้กราฟเข้าใจง่ายๆ
      const formattedData = res.data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: item[type === 'turbidity' ? 'NTU' : (type === 'nh3' ? 'NH3' : type)] // เลือก key ให้ถูก
      })).reverse(); // กลับด้านให้เวลาปัจจุบันอยู่ขวาสุด

      setHistoryData(formattedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // --- 3. Initial Load & Polling ---
  useEffect(() => {
    fetchLatestData(); // ดึงค่าปัจจุบัน
    fetchHistory(selectedGraph); // ดึงกราฟตัวแรก

    const interval = setInterval(() => {
      fetchLatestData();
      // fetchHistory(selectedGraph); // ถ้าอยากให้กราฟขยับตลอดให้เปิดบรรทัดนี้
    }, 3000); // ทุก 3 วินาที

    return () => clearInterval(interval);
  }, [selectedGraph]); // รันใหม่ถ้าเปลี่ยนประเภทกราฟ

  // --- 4. Function สั่งงาน (Control) ---
  // API: POST /control/{device_name}/{action}
  const handleControl = async (device, action) => {
    try {
      await axios.post(`${API_BASE_URL}/control/${device}/${action}`);
      console.log(`Success: ${device} -> ${action}`);
      
      // อัปเดต UI ถ้าเป็นปั๊ม
      if (device.includes('pump')) {
        setPumpStatus(prev => ({ ...prev, [device]: action === 'on' }));
      }
    } catch (error) {
      console.error("Control failed:", error);
      alert("สั่งงานไม่สำเร็จ Check Server!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          🌊 AquaSense <span className="text-sm font-normal text-slate-500">Monitor System</span>
        </h1>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? "ONLINE (Port 9000)" : "OFFLINE"}
        </div>
      </header>

      {/* Sensor Cards Grid */}
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
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Power className="w-5 h-5 text-slate-600" /> Control Center
          </h3>
          
          {/* Pumps */}
          <div className="space-y-4 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Water Pumps</p>
            <PumpSwitch 
              name="Pump 1" 
              isOn={pumpStatus.pump1} 
              onToggle={(state) => handleControl('pump1', state ? 'on' : 'off')} 
            />
            <PumpSwitch 
              name="Pump 2" 
              isOn={pumpStatus.pump2} 
              onToggle={(state) => handleControl('pump2', state ? 'on' : 'off')} 
            />
          </div>

          {/* Servos */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feeders / Servos</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => handleControl(`servo${num}`, 'on')}
                  className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm transition-all active:scale-95 border border-blue-200"
                >
                  Servo {num}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Sub Components (เพื่อความสวยงามและ clean code) ---

const SensorCard = ({ title, value, icon, color, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md
      ${active ? `border-${color}-500 ring-1 ring-${color}-500` : 'border-slate-200'}
    `}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-${color}-50`}>{icon}</div>
      {active && <span className={`text-[10px] uppercase font-bold text-${color}-600 bg-${color}-100 px-2 py-1 rounded-full`}>Selected</span>}
    </div>
    <h4 className="text-slate-500 text-sm font-medium uppercase">{title}</h4>
    <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
  </div>
);

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
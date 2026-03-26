import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Activity, Skull, Power, RefreshCw, AlertTriangle, LogOut, BarChart3, CalendarCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from "../../config";

const Dashboard = () => {
  const navigate = useNavigate();

  // --- States ---
  const [sensors, setSensors] = useState({ temperature: 0, ph: 0, ph_voltage: 0, turbidity: 0, nh3: 0, tds: 0 });
  const [analysis, setAnalysis] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState('temperature');
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    pump1: false, pump2: false, servo1: false, servo2: false, servo3: false
  });
  const [deviceLoading, setDeviceLoading] = useState({}); // ✅ เพิ่ม state เพื่อเก็บสถานะรอโหลดของแต่ละปุ่ม

  const [summaryType, setSummaryType] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [servoLogs, setServoLogs] = useState({ 1: [], 2: [], 3: [] }); // ✅ เก็บประวัติแยกตามอุปกรณ์ (1: อาหาร, 2: pH Down, 3: pH Up)

  // --- Helper: Get Auth Header ---
  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- Functions ---
  const handleLogout = async () => {
    try {
      const headers = getAuthHeader();
      if (headers.Authorization) {
        await axios.post(`${API_BASE_URL}/v1/auth/logout`, {}, { headers });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      navigate('/login');
    }
  };
  const fetchLatestData = async () => {
    try {
      const headers = getAuthHeader();
      const [resTemp, resPh, resPhVoltage, resTurb, resNh3, resTds, resAnalysis] = await Promise.all([
        axios.get(`${API_BASE_URL}/sensors/latest/temperature`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/latest/ph`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/latest/ph_voltage`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/latest/turbidity`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/latest/nh3`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/latest/tds`, { headers }),
        axios.get(`${API_BASE_URL}/sensors/status/analysis`, { headers })
      ]);

      setSensors({
        temperature: Number(resTemp.data.temperature || 0),
        ph: Number(resPh.data.ph || 0).toFixed(2),
        ph_voltage: Number(resPhVoltage.data.voltage || 0).toFixed(2),
        turbidity: Number(resTurb.data.NTU || 0).toFixed(2),
        nh3: Number(resNh3.data.NH3 || 0).toFixed(2),
        tds: Number(resTds.data.tds || 0).toFixed(2)
      });

      setAnalysis(resAnalysis.data);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching latest data:", error);
      setIsConnected(false);
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const fetchHistory = async (type) => {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(`${API_BASE_URL}/sensors/history/${type}?limit=20`, { headers });
      const formattedData = res.data.map(item => {
        const rawValue = item[type === 'turbidity' ? 'NTU' : (type === 'nh3' ? 'NH3' : (type === 'tds' ? 'tds' : (type === 'ph_voltage' ? 'voltage' : type)))];
        return {
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: parseFloat(Number(rawValue || 0).toFixed(2))
        };
      }).reverse();
      setHistoryData(formattedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const headers = getAuthHeader();
      let url = `${API_BASE_URL}/reports/summary/${summaryType}`;
      if (summaryType === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        url += `?month=${parseInt(month)}&year=${parseInt(year)}`;
      }
      const res = await axios.get(url, { headers });
      setSummaryData(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  };
  const fetchServoLogs = async (num) => {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(`${API_BASE_URL}/control/logs/servo${num}`, { headers });
      setServoLogs(prev => ({ ...prev, [num]: res.data }));
    } catch (error) {
      console.error(`Error fetching logs for servo${num}:`, error);
    }
  };

  const handleControl = async (device, action) => {
    // 1. ตั้งค่าสถานะว่ากำลังโหลดอยู่สำหรับ device นี้
    setDeviceLoading(prev => ({ ...prev, [device]: true }));
    try {
      const headers = getAuthHeader();
      await axios.post(`${API_BASE_URL}/control/${device}/${action}`, {}, { headers });
      setDeviceStatus(prev => ({ ...prev, [device]: action === 'on' }));
      // ✅ ถ้าเป็น servo (1, 2, 3) และสั่งเปิด ให้ดึง log ใหม่
      if (device.startsWith('servo') && action === 'on') {
        const num = device.replace('servo', '');
        fetchServoLogs(num);
      }
    } catch (error) {
      console.error("Control failed:", error);
      alert("สั่งงานไม่สำเร็จ ตรวจสอบสิทธิ์ Admin หรือการเชื่อมต่อ Server!");
    } finally {
      // 2. ยกเลิกสถานะโหลดเมื่อเสร็จสิ้น
      setDeviceLoading(prev => ({ ...prev, [device]: false }));
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchLatestData();
    fetchHistory(selectedGraph);
    const interval = setInterval(() => {
      fetchLatestData();
      fetchHistory(selectedGraph);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedGraph]);

  useEffect(() => {
    fetchSummary();
    [1, 2, 3].forEach(num => fetchServoLogs(num));
  }, [summaryType, selectedMonth]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-800">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          🌊 AquaSense <span className="text-sm font-normal text-slate-500">Monitor System</span>
        </h1>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? "ONLINE" : "OFFLINE"}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* System Analysis Banner */}
      {analysis && (() => {
        const s = analysis.status?.toLowerCase();
        let styles = {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          iconBg: 'bg-slate-100',
          icon: <Activity size={24} />
        };

        if (s === 'good' || s === 'normal') {
          styles = {
            bg: 'bg-green-50 border-green-200 text-green-800',
            iconBg: 'bg-green-100',
            icon: <CheckCircle2 size={24} className="text-green-600" />
          };
        } else if (s === 'warning' || s === 'caution') {
          styles = {
            bg: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconBg: 'bg-yellow-100',
            icon: <AlertCircle size={24} className="text-yellow-600" />
          };
        } else if (s === 'critical' || s === 'danger') {
          styles = {
            bg: 'bg-red-50 border-red-200 text-red-800',
            iconBg: 'bg-red-100',
            icon: <AlertTriangle size={24} className="text-red-600" />
          };
        }

        return (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 shadow-sm transition-all ${styles.bg}`}>
            <div className={`p-3 rounded-full ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">System Analysis</h3>
              <p className="text-sm font-medium opacity-90">{analysis.message || JSON.stringify(analysis)}</p>
            </div>
          </div>
        );
      })()}

      {/* Sensor Cards (Realtime) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SensorCard title="Temperature" value={`${sensors.temperature} °C`} icon={<Thermometer className="text-orange-500" />} color="orange" onClick={() => setSelectedGraph('temperature')} active={selectedGraph === 'temperature'} idealRange=" 18-24 °C" />
        <SensorCard 
          title="pH Level" 
          value={sensors.ph} 
          subValue={sensors.ph_voltage ? `${sensors.ph_voltage} V` : null}
          icon={<Droplets className="text-blue-500" />} 
          color="blue" 
          onClick={() => setSelectedGraph('ph')} 
          active={selectedGraph === 'ph'} 
          idealRange="7.0-7.6"
        />
        <SensorCard title="Turbidity" value={`${sensors.turbidity} NTU`} icon={<Activity className="text-purple-500" />} color="purple" onClick={() => setSelectedGraph('turbidity')} active={selectedGraph === 'turbidity'} idealRange="น้อยกว่า 5 NTU" />
        <SensorCard title="TDS" value={`${sensors.tds} ppm`} icon={<Activity className="text-emerald-500" />} color="emerald" onClick={() => setSelectedGraph('tds')} active={selectedGraph === 'tds'} idealRange="น้อยกว่า 400 ppm" />
        <SensorCard title="Ammonia (NH3)" value={`${sensors.nh3} ppm`} icon={<Skull className="text-red-500" />} color="red" onClick={() => setSelectedGraph('nh3')} active={selectedGraph === 'nh3'} idealRange="น้อยกว่า 0.1 ppm" />
      </div>

      {/* ✅ SUMMARY SECTION (FIXED) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700">
            <BarChart3 className="w-5 h-5" />
            {summaryType === 'daily' ? 'สรุปรายวันนี้' : 'ภาพรวมรายเดือน'}
          </h3>

          <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => setSummaryType('daily')}
              className={`px-4 py-1.5 rounded-md transition-all ${summaryType === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Today
            </button>
            <button
              onClick={() => setSummaryType('monthly')}
              className={`px-4 py-1.5 rounded-md transition-all ${summaryType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Monthly
            </button>
          </div>

          {summaryType === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">เลือกเดือน:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
            </div>
          )}
        </div>

        {summaryLoading ? (
          <div className="text-center py-8 text-slate-400">Loading summary data...</div>
        ) : summaryData ? (
          <div>
            {/* Text Summary Banner */}
            {summaryData.summary_text && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
                <FileText size={16} />
                {summaryData.summary_text}
              </div>
            )}

            {/* Grid Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {summaryType === 'daily' && summaryData.statistics ? (
                // ✅ แสดงผลรายวัน (ใช้ customValue เพื่อโชว์เลขเดี่ยวๆ สวยๆ)
                <>
                  <StatBox
                    label="อุณหภูมิเฉลี่ย"
                    customValue={Number(summaryData.statistics.avg_temp ?? 0).toFixed(2)}
                    unit="°C"
                    color="orange"
                  />
                  <StatBox
                    label="ค่า pH เฉลี่ย"
                    customValue={Number(summaryData.statistics.avg_ph ?? 0).toFixed(2)}
                    unit=""
                    color="blue"
                  />
                  <StatBox
                    label="ความขุ่นเฉลี่ย"
                    customValue={Number(summaryData.statistics.avg_turbidity ?? 0).toFixed(2)}
                    unit="NTU"
                    color="purple"
                  />
                  <StatBox
                    label="แอมโมเนียสูงสุด"
                    customValue={Number(summaryData.statistics.max_nh3 ?? 0).toFixed(2)}
                    unit="ppm"
                    color="red"
                  />
                  <StatBox
                    label="TDS เฉลี่ย"
                    customValue={Number(summaryData.statistics.avg_tds ?? 0).toFixed(2)}
                    unit="ppm"
                    color="emerald"
                  />
                </>
              ) : summaryType === 'monthly' ? (
                // ✅ แสดงผลรายเดือน (ภาษาไทย)
                <>
                  <StatBox
                    label="รอบเดือนนี้"
                    customValue={summaryData.period}
                    color="blue"
                    icon={<CalendarCheck />}
                  />
                  <StatBox
                    label="ระดับคุณภาพ"
                    customValue={summaryData.grade}
                    color={summaryData.grade === 'A' ? 'green' : summaryData.grade === 'B' ? 'blue' : 'orange'}
                  />
                  <StatBox
                    label="จำนวนการบันทึก"
                    customValue={summaryData.total_logs}
                    unit="ครั้ง"
                    color="purple"
                  />
                  <StatBox
                    label="พบค่าวิกฤต"
                    customValue={summaryData.critical_count}
                    unit="ครั้ง"
                    color="red"
                    onClick={() => navigate('/reports')}
                  />
                </>
              ) : (
                <div className="col-span-4 text-center text-slate-400">Data format not supported</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">No summary data available.</div>
        )}
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
            {/* ✅ แก้ไข: เปลี่ยน width="100%" เป็น width="99%" เพื่อแก้ Warning Recharts */}
            <ResponsiveContainer width="99%" height="100%">
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
            <PumpSwitch name="Pump 1 น้ำเข้า" isOn={deviceStatus.pump1} onToggle={(state) => handleControl('pump1', state ? 'on' : 'off')} />
            <PumpSwitch name="Pump 2 น้ำออก" isOn={deviceStatus.pump2} onToggle={(state) => handleControl('pump2', state ? 'on' : 'off')} />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feeders / Servos</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(num => {
                const deviceName = `servo${num}`;
                const isOn = deviceStatus[deviceName];
                const isLoading = deviceLoading[deviceName]; // ดึงสถานะกำลังโหลด
                const labels = {
                  1: "อาหารปลา",
                  2: "PH down",
                  3: "PH up"
                };
                return (
                  <button 
                    key={num} 
                    onClick={() => handleControl(deviceName, isOn ? 'off' : 'on')} 
                    disabled={isLoading} // ปิดการกดระหว่างโหลด
                    className={`py-3 rounded-lg font-semibold text-sm flex flex-col items-center justify-center transition-all ${
                      isLoading ? 'opacity-70 cursor-wait' : 'active:scale-95'
                    } border ${
                      isOn 
                        ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                        : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {/* ไอคอนหมุนๆ ตอนโหลด (lucide-react มี class animate-spin) */}
                    {isLoading ? (
                      <RefreshCw className="animate-spin mb-1 text-current w-4 h-4 opacity-70" />
                    ) : (
                      labels[num]
                    )}
                    <span className="block text-[10px] font-normal opacity-80 mt-1">
                      {isLoading ? 'WAITING...' : (isOn ? 'ON' : 'OFF')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✅ ส่วนแสดงบันทึกย้อนหลัง (NEW & Expanded) */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-6">
            
            {/* 1. ประวัติการให้อาหาร */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประวัติการให้อาหารวันนี้</p>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{servoLogs[1].length} ครั้ง</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 flex flex-col gap-1">
                {servoLogs[1].length > 0 ? (
                  servoLogs[1].map((log, index) => (
                    <div key={index} className="flex justify-between items-center text-[13px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-600 font-medium">ครั้งที่ {servoLogs[1].length - index}</span>
                      <span className="text-slate-500 font-semibold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">ยังไม่มีการให้อาหารวันนี้</p>
                )}
              </div>
            </div>

            {/* 2. ประวัติการปรับระดับ PH */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">ประวัติการปรับค่า PH</p>
              <div className="grid grid-cols-2 gap-2">
                {/* PH Down */}
                <div className="bg-orange-50/30 p-2.5 rounded-xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 mb-2 flex justify-between">
                    <span>PH DOWN</span>
                    <span>{servoLogs[2].length}</span>
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {servoLogs[2].map((log, index) => (
                      <div key={index} className="text-[11px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-orange-50 mb-1">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                    {servoLogs[2].length === 0 && <span className="text-[10px] text-slate-400 italic">-</span>}
                  </div>
                </div>

                {/* PH Up */}
                <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 mb-2 flex justify-between">
                    <span>PH UP</span>
                    <span>{servoLogs[3].length}</span>
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {servoLogs[3].map((log, index) => (
                      <div key={index} className="text-[11px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-blue-50 mb-1">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                    {servoLogs[3].length === 0 && <span className="text-[10px] text-slate-400 italic">-</span>}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const colorMap = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', ring: 'ring-orange-500', label: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', ring: 'ring-blue-500', label: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', ring: 'ring-purple-500', label: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  red: { bg: 'bg-red-50', border: 'border-red-500', ring: 'ring-red-500', label: 'bg-red-100 text-red-600', text: 'text-red-600' },
  green: { bg: 'bg-green-50', border: 'border-green-500', ring: 'ring-green-500', label: 'bg-green-100 text-green-600', text: 'text-green-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', ring: 'ring-emerald-500', label: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-600' },
};

const SensorCard = ({ title, value, subValue, icon, color, onClick, active, idealRange }) => {
  const theme = colorMap[color] || colorMap.blue;
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${active ? `${theme.border} ring-1 ${theme.ring}` : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${theme.bg}`}>{icon}</div>
        <div className="flex flex-col items-end gap-1 text-right">
          {active && <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${theme.label}`}>Selected</span>}
          {idealRange && (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              เหมาะสม: {idealRange}
            </span>
          )}
        </div>
      </div>
      <h4 className="text-slate-500 text-sm font-medium uppercase">{title}</h4>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {subValue && <p className="text-sm font-medium text-slate-400 mb-1">{subValue}</p>}
      </div>
    </div>
  );
};

// ✅ UPDATED: Helper Component ที่รองรับทั้งแบบ Daily (Min/Avg/Max) และ Monthly (Single Value)
const StatBox = ({ label, data, customValue, unit, color, icon, onClick }) => {
  const theme = colorMap[color] || colorMap.blue;

  // กรณีเป็น Custom Value (สำหรับ Monthly เช่น Grade: A)
  if (customValue !== undefined) {
    return (
      <div 
        onClick={onClick}
        className={`p-4 rounded-lg border ${theme.bg} ${theme.border} border-opacity-20 flex flex-col justify-center h-full transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`font-bold text-sm ${theme.text}`}>{label}</span>
          {icon}
        </div>
        <div className="text-center mt-2">
          <p className="text-3xl font-bold text-slate-700">{customValue} <span className="text-xs text-slate-500 font-normal">{unit}</span></p>
        </div>
      </div>
    );
  }

  // กรณีเป็น Data Object (สำหรับ Daily: min/avg/max)
  if (!data) return null;

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border ${theme.bg} ${theme.border} border-opacity-20 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-bold text-sm ${theme.text}`}>{label}</span>
        <span className="text-xs text-slate-500 opacity-70">{unit}</span>
      </div>
      <div className="flex justify-between items-end text-slate-700">
        <div className="text-center">
          <p className="text-[10px] uppercase text-slate-400 font-bold">Min</p>
          <p className="font-semibold">{data.min ?? '-'}</p>
        </div>
        <div className="text-center px-4 border-x border-slate-200 border-opacity-50">
          <p className="text-[10px] uppercase text-slate-400 font-bold">Avg</p>
          <p className="font-bold text-lg">{data.avg ?? '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase text-slate-400 font-bold">Max</p>
          <p className="font-semibold">{data.max ?? '-'}</p>
        </div>
      </div>
    </div>
  );
};

const PumpSwitch = ({ name, isOn, onToggle }) => (
  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
    <span className="font-medium text-slate-700">{name}</span>
    <button onClick={() => onToggle(!isOn)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? 'bg-green-500' : 'bg-slate-300'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default Dashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Calendar, RefreshCw,
  AlertCircle, CheckCircle2, Droplets
} from 'lucide-react';

// ✅ ดึง URL ส่วนกลางมาใช้ (พอร์ต 9090) เพื่อให้เชื่อมต่อกับ Docker ได้
import { API_BASE_URL } from "../../config";

const ReportsPage = () => {
  // --- 1. State Management ---
  const [viewMode, setViewMode] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // --- 2. ฟังก์ชันดึงข้อมูล ---
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      let url = '';

      // ✅ ปรับ Path ให้ตรงตาม API Design ของคุณ
      if (viewMode === 'daily') {
        url = `${API_BASE_URL}/reports/table/daily?date=${selectedDate}`;
      } else {
        const [year, month] = selectedMonth.split('-');
        url = `${API_BASE_URL}/reports/table/monthly?month=${parseInt(month)}&year=${parseInt(year)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("📊 API Response:", response.data);

      // ✅ ระบบตรวจสอบข้อมูลป้องกัน App พัง (Safe Data Access)
      let safeData = [];
      if (Array.isArray(response.data)) {
        safeData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        safeData = response.data.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        safeData = response.data.items;
      }

      setData(safeData);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("ไม่สามารถโหลดข้อมูลรายงานได้ (โปรดเช็คการล็อกอินหรือ Server)");
      setData([]);
      // ถ้า Token หมดอายุ (401) ควรให้ผู้ใช้กลับไป Login
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [viewMode, selectedDate, selectedMonth]);

  // --- 3. Helper Functions ---

  const formatDateTime = (val) => {
    if (!val) return "-";

    // กรณีเป็น Object ของ MongoDB ($date)
    if (typeof val === 'object' && val.$date) {
      val = val.$date;
    }

    // กรณีส่งมาแค่เวลา "HH:mm"
    if (typeof val === 'string' && val.length === 5 && val.includes(':')) {
      return val + " น.";
    }

    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;

      return date.toLocaleString('th-TH', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return val;
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (['normal', 'ok', 'good'].includes(s)) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} /> ปกติ</span>;
    } else if (s === 'warning') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200"><AlertCircle size={12} /> เฝ้าระวัง</span>;
    } else {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} /> ผิดปกติ</span>;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> รายงานคุณภาพน้ำ
          </h1>
          <p className="text-gray-500 text-sm mt-1">ประวัติและผลการวิเคราะห์ค่าน้ำย้อนหลัง</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
            <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === 'daily' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>รายวัน</button>
            <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === 'monthly' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>รายเดือน</button>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            {viewMode === 'daily' ? (
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm bg-white" />
            ) : (
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm bg-white" />
            )}
          </div>
          <button onClick={fetchReports} className="bg-white text-gray-600 border border-gray-200 p-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition shadow-sm"><RefreshCw size={20} /></button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && <div className="p-12 text-center text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>}

        {!loading && error && (
          <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={32} className="opacity-50" />
            <p>{error}</p>
            <button onClick={fetchReports} className="text-blue-600 underline text-sm">ลองใหม่</button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase">
                {viewMode === 'daily' ? (
                  // 🌞 หัวตารางรายวัน
                  <tr>
                    <th className="p-4 font-medium">เวลา</th>
                    <th className="p-4 font-medium">สถานะ</th>
                    <th className="p-4 font-medium">pH</th>
                    <th className="p-4 font-medium">ความขุ่น (NTU)</th>
                    <th className="p-4 font-medium">NH3 (mg/L)</th>
                    <th className="p-4 font-medium">TDS (ppm)</th>
                    <th className="p-4 font-medium">อุณหภูมิ (°C)</th>
                    <th className="p-4 font-medium text-right">หมายเหตุ</th>
                  </tr>
                ) : (
                  // 📅 หัวตารางรายเดือน
                  <tr>
                    <th className="p-4 font-medium">วันที่</th>
                    <th className="p-4 font-medium">สถานะภาพรวม</th>
                    <th className="p-4 font-medium">pH (เฉลี่ย)</th>
                    <th className="p-4 font-medium">TDS (เฉลี่ย)</th>
                    <th className="p-4 font-medium">NH3 (สูงสุด)</th>
                    <th className="p-4 font-medium">อุณหภูมิ (เฉลี่ย)</th>
                    <th className="p-4 font-medium text-right">หมายเหตุ</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-gray-100">
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition text-sm text-gray-700">

                      {/* ===================================== */}
                      {/* 🌞 กรณีโหมดรายวัน (Daily) */}
                      {/* ===================================== */}
                      {viewMode === 'daily' && (
                        <>
                          {/* 1. เวลา */}
                          <td className="p-4 font-medium text-gray-900">{formatDateTime(row.time)}</td>
                          {/* 2. สถานะ */}
                          <td className="p-4">{getStatusBadge(row.status)}</td>
                          {/* 3. pH */}
                          <td className="p-4">{row.ph ?? '-'}</td>

                          {/* 4. ความขุ่น NTU */}
                          <td className="p-4">{row.turbidity ?? row.ntu ?? '-'}</td>

                          {/* 5. NH3 */}
                          <td className="p-4">{row.nh3 ?? '-'}</td>

                          {/* 6. TDS */}
                          <td className="p-4">{row.tds ?? '-'}</td>

                          {/* 7. อุณหภูมิ */}
                          <td className="p-4 flex items-center gap-1">
                            {row.temp ? <><Droplets size={14} className="text-blue-400" /> {row.temp}</> : '-'}
                          </td>

                          {/* 8. หมายเหตุ */}
                          <td className="p-4 text-right">
                            {row.issues && row.issues !== "ปกติ" ? (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-xs">{row.issues}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* ===================================== */}
                      {/* 📅 กรณีโหมดรายเดือน (Monthly) */}
                      {/* ===================================== */}
                      {viewMode === 'monthly' && (
                        <>
                          <td className="p-4 font-medium text-gray-900">{formatDateTime(row.date)}</td>
                          <td className="p-4">{getStatusBadge(row.status)}</td>
                          <td className="p-4">{row.avg_ph !== "-" ? row.avg_ph : '-'}</td>
                          <td className="p-4">{row.avg_tds !== "-" ? row.avg_tds : '-'}</td>
                          <td className="p-4">{row.avg_turbidity !== "-" ? row.avg_turbidity : '-'}</td>
                          <td className="p-4 text-red-600">{row.max_nh3 !== "-" ? row.max_nh3 : '-'}</td>
                          <td className="p-4 flex items-center gap-1">
                            {row.avg_temp !== "-" ? <><Droplets size={14} className="text-blue-400" /> {row.avg_temp}</> : '-'}
                          </td>
                          <td className="p-4 text-right text-gray-500 text-xs">
                            {row.note || '-'}
                          </td>
                        </>
                      )}

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={viewMode === 'daily' ? "8" : "7"} className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                      <FileText size={48} className="opacity-20" />
                      <span>ไม่พบข้อมูลในช่วงเวลานี้</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReportsPage;
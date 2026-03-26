import time
from datetime import datetime
from typing import Optional, Dict
from apiapp.modules.notification.service import LineBotService
from .repository import SensorRepository
from .schemas import (
    SensorPH, SensorPHVoltage, SensorTurbidity, SensorNH3, SensorTemperature, SensorTDS
)
from apiapp.modules.reports.model import WaterAnalysisLog
class SensorUseCase:
    # ---------------------------------------------------------
    # 🧠 ส่วนความจำของระบบ (Class Variables)
    # ---------------------------------------------------------
    _last_alert_time: float = 0

    # เก็บค่าล่าสุดที่ "บันทึกลง DB" (เอาไว้เทียบ Deadband)
    _last_saved_values: dict[str, Optional[float]] = {
        "ph": None, "ph_voltage": None, "turbidity": None, "nh3": None, "temperature": None, "tds": None
    }
    
    # เก็บเวลาล่าสุดที่ "บันทึกลง DB" (เอาไว้ทำ Heartbeat)
    _last_saved_times: dict[str, float] = {
        "ph": 0, "ph_voltage": 0, "turbidity": 0, "nh3": 0, "temperature": 0, "tds": 0
    }

    # ตัวแปรจำเวลาบันทึก Snapshot รายชั่วโมง
    _last_log_time: float = 0 

    # 🎯 ตั้งค่าความละเอียด
    THRESHOLDS = {
        "ph": 0.1, "ph_voltage": 0.01, "turbidity": 0.4, "nh3": 0.05, "temperature": 0.5, "tds": 10.0
    }

    def __init__(self):
        self.repo = SensorRepository()
        self.line_service = LineBotService()

    # ---------------------------------------------------------
    # 🕵️‍♂️ ฟังก์ชันช่วยตัดสินใจ (Helper Function)
    # ---------------------------------------------------------
    def _determine_water_quality(self, ph, temp, ntu, nh3, tds):
        issues = [] 

        # 3. ตรวจสอบเงื่อนไข
        if ph is not None:
            if ph < 6.5: issues.append(f"pH ต่ำเกินไป ({ph:.1f})")
            elif ph > 8.5: issues.append(f"pH สูงเกินไป ({ph:.1f})")

        if temp is not None:
            if temp < 15: issues.append(f"น้ำเย็นเกินไป ({temp:.1f}°C)")
            elif temp > 30: issues.append(f"น้ำร้อนเกินไป ({temp:.1f}°C)")

        if ntu is not None:
            if ntu > 5.0: issues.append(f"น้ำขุ่นมาก ({ntu:.1f} NTU)")

        if tds is not None:
            if tds > 400: issues.append(f"ค่า TDS สูงเกินไป ({tds:.1f} ppm)")

        # 4. สรุปผล
        status = "Good"
        color = "green"
        message = "คุณภาพน้ำปกติ เหมาะแก่การเลี้ยงสัตว์น้ำ"

        if issues:
            is_critical = any("อันตราย" in msg for msg in issues) or \
                          any("สูงเกินไป" in msg for msg in issues) or \
                          any("ต่ำเกินไป" in msg for msg in issues)

            if is_critical:
                status = "Critical"
                color = "red"
                message = "คุณภาพน้ำวิกฤต! กรุณาตรวจสอบทันที"
            else:
                status = "Warning"
                color = "orange"
                message = "คุณภาพน้ำเริ่มมีปัญหา"
        
        return status, color, message, issues

    def _should_save(self, sensor_type: str, current_value: float) -> bool:
        now = time.time()
        last_val = self._last_saved_values[sensor_type]
        last_time = self._last_saved_times[sensor_type]
        threshold = self.THRESHOLDS[sensor_type]

        if last_val is None: return True
        if abs(current_value - last_val) >= threshold: return True
        if (now - last_time) > 1800: return True 

        return False

    def _update_memory(self, sensor_type: str, value: float):
        self._last_saved_values[sensor_type] = value
        self._last_saved_times[sensor_type] = time.time()

    # ---------------------------------------------------------
    # 💾 ส่วนบันทึกข้อมูล (Record)
    # ---------------------------------------------------------
    async def record_ph(self, data: SensorPH):
        saved = False
        if self._should_save("ph", data.ph):
            await self.repo.add_ph(data)
            self._update_memory("ph", data.ph)
            print(f"✅ Saved pH: {data.ph}")
            saved = True
        return {"status": "success", "type": "ph", "value": data.ph, "saved": saved}

    async def record_ph_voltage(self, data: SensorPHVoltage):
        saved = False
        if self._should_save("ph_voltage", data.voltage):
            await self.repo.add_ph_voltage(data)
            self._update_memory("ph_voltage", data.voltage)
            print(f"✅ Saved pH Voltage: {data.voltage}")
            saved = True
        return {"status": "success", "type": "ph_voltage", "value": data.voltage, "saved": saved}

    async def record_turbidity(self, data: SensorTurbidity):
        saved = False
        # ✅ Scale NTU value: max 125 -> 10.0 (divided by 12.5)
        data.NTU = data.NTU / 12.5
        
        if self._should_save("turbidity", data.NTU):
            await self.repo.add_turbidity(data)
            self._update_memory("turbidity", data.NTU)
            print(f"✅ Saved Turbidity: {data.NTU}")
            saved = True
        return {"status": "success", "type": "turbidity", "value": data.NTU, "saved": saved}

    async def record_nh3(self, data: SensorNH3):
        saved = False
        if self._should_save("nh3", data.NH3):
            await self.repo.add_nh3(data)
            self._update_memory("nh3", data.NH3)
            print(f"✅ Saved NH3: {data.NH3}")
            saved = True
        return {"status": "success", "type": "nh3", "value": data.NH3, "saved": saved}

    async def record_temperature(self, data: SensorTemperature):
        saved = False
        if self._should_save("temperature", data.temperature):
            await self.repo.add_temperature(data)
            self._update_memory("temperature", data.temperature)
            print(f"✅ Saved Temp: {data.temperature}")
            saved = True
        return {"status": "success", "type": "temperature", "value": data.temperature, "saved": saved}

    async def record_tds(self, data: SensorTDS):
        saved = False
        if self._should_save("tds", data.tds):
            await self.repo.add_tds(data)
            self._update_memory("tds", data.tds)
            print(f"✅ Saved TDS: {data.tds}")
            saved = True
        return {"status": "success", "type": "tds", "value": data.tds, "saved": saved}

    # --- ส่วนดึงข้อมูล (Get) ---
    async def get_current(self, sensor_type: str):
        return await self.repo.get_latest(sensor_type)

    async def get_history(self, sensor_type: str):
        return await self.repo.get_history(sensor_type)
    
    # ---------------------------------------------------------
    # 📊 ส่วนวิเคราะห์และแจ้งเตือน (Analysis) + Snapshot Log
    # ---------------------------------------------------------
    async def run_hourly_snapshot(self):
        """
        บันทึก Snapshot รายชั่วโมงลงฐานข้อมูล
        """
        # 1. ดึงค่าล่าสุด
        ph_data = await self.repo.get_latest("ph")
        ph_v_data = await self.repo.get_latest("ph_voltage")
        temp_data = await self.repo.get_latest("temperature")
        nh3_data = await self.repo.get_latest("nh3")
        turb_data = await self.repo.get_latest("turbidity")
        tds_data = await self.repo.get_latest("tds")

        # 2. แปลงค่า
        ph = ph_data.ph if ph_data else None
        ph_v = ph_v_data.voltage if ph_v_data else None
        temp = temp_data.temperature if temp_data else None
        nh3 = nh3_data.NH3 if nh3_data else None
        ntu = turb_data.NTU if turb_data else None
        tds = tds_data.tds if tds_data else None

        if not any([ph, ph_v, temp, nh3, ntu, tds]):
            print("⚠️ No data available for hourly snapshot")
            return None

        # 3. วิเคราะห์คุณภาพน้ำ
        status, color, message, issues = self._determine_water_quality(ph, temp, ntu, nh3, tds)

        # 4. บันทึกลง DB
        log = WaterAnalysisLog(
            timestamp=datetime.now(),
            status=status,
            issues=issues,
            ph=ph, ph_voltage=ph_v, turbidity=ntu, nh3=nh3, temperature=temp, tds=tds
        )
        await log.save()
        print(f"📝 บันทึก Snapshot เรียบร้อย (Backend Task): {status}")

        # 5. แจ้งเตือน LINE หากวิกฤต (Cooldown 1 ชม.)
        if status == "Critical":
            current_time = time.time()
            if (current_time - SensorUseCase._last_alert_time) > 3600:
                alert_msg = f"🚨 แจ้งเตือนภัยวิกฤต (ระบบตรวจพบอัตโนมัติ)!\nสถานะ: {message}\n"
                for issue in issues: alert_msg += f"• {issue}\n"
                await self.line_service.send_alert(alert_msg)
                SensorUseCase._last_alert_time = current_time

        SensorUseCase._last_log_time = time.time()
        return log

    async def analyze_water_quality(self):
        # 1. ดึงค่าล่าสุด
        ph_data = await self.repo.get_latest("ph")
        ph_v_data = await self.repo.get_latest("ph_voltage")
        temp_data = await self.repo.get_latest("temperature")
        nh3_data = await self.repo.get_latest("nh3")
        turb_data = await self.repo.get_latest("turbidity")
        tds_data = await self.repo.get_latest("tds")

        # 2. แปลงค่า
        ph = ph_data.ph if ph_data else None
        ph_v = ph_v_data.voltage if ph_v_data else None
        temp = temp_data.temperature if temp_data else None
        nh3 = nh3_data.NH3 if nh3_data else None
        ntu = turb_data.NTU if turb_data else None
        tds = tds_data.tds if tds_data else None

        if not any([ph, ph_v, temp, nh3, ntu, tds]):
            return {"status": "No Data", "message": "Waiting...", "color": "gray", "issues": []}

        # 3. วิเคราะห์คุณภาพน้ำ
        status, color, message, issues = self._determine_water_quality(ph, temp, ntu, nh3, tds)

        # 4. แจ้งเตือน LINE (Cooldown) - เฉพาะเมื่อเรียกจาก Dashboard
        if status == "Critical":
            current_time = time.time()
            if (current_time - SensorUseCase._last_alert_time) > 3600:
                alert_msg = f"🚨 แจ้งเตือนภัยวิกฤต!\nสถานะ: {message}\n"
                for issue in issues: alert_msg += f"• {issue}\n"
                await self.line_service.send_alert(alert_msg)
                SensorUseCase._last_alert_time = current_time

        # ---------------------------------------------------------
        # ✅ บันทึก Snapshot หากถึงรอบเวลา
        # ---------------------------------------------------------
        current_ts = time.time()
        if (current_ts - SensorUseCase._last_log_time) > 3600:
            await self.run_hourly_snapshot()

        return {
            "status": status, "message": message, "color": color, "issues": issues,
            "current_values": { "ph": ph, "temp": temp, "nh3": nh3, "ntu": ntu, "tds": tds }
        }
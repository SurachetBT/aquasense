import time
from apiapp.modules.notification.service import LineBotService
from .repository import SensorRepository
from .schemas import SensorPH, SensorTurbidity, SensorNH3, SensorTemperature

class SensorUseCase:
    # ---------------------------------------------------------
    # 🧠 ส่วนความจำของระบบ (Class Variables)
    # ---------------------------------------------------------
    # 1. ตัวแปรจำเวลาแจ้งเตือนล่าสุด (ใช้ร่วมกันทุกครั้งที่เรียก)
    _last_alert_time = 0

    # 2. เก็บค่าล่าสุดที่ "บันทึกลง DB" (เอาไว้เทียบ Deadband)
    _last_saved_values = {
        "ph": None, "turbidity": None, "nh3": None, "temperature": None
    }
    
    # 3. เก็บเวลาล่าสุดที่ "บันทึกลง DB" (เอาไว้ทำ Heartbeat)
    _last_saved_times = {
        "ph": 0, "turbidity": 0, "nh3": 0, "temperature": 0
    }

    # 🎯 ตั้งค่าความละเอียด (เปลี่ยนเกินนี้ถึงจะบันทึก)
    THRESHOLDS = {
        "ph": 0.1,          # pH เปลี่ยน 0.1
        "turbidity": 5.0,   # ความขุ่นเปลี่ยน 5 NTU
        "nh3": 0.05,        # แอมโมเนียเปลี่ยน 0.05
        "temperature": 0.5  # อุณหภูมิเปลี่ยน 0.5 องศา
    }

    def __init__(self):
        self.repo = SensorRepository()
        self.line_service = LineBotService()

    # ---------------------------------------------------------
    # 🕵️‍♂️ ฟังก์ชันช่วยตัดสินใจ (Helper Function)
    # ---------------------------------------------------------
    def _should_save(self, sensor_type: str, current_value: float) -> bool:
        """
        ตัดสินใจว่าจะบันทึกหรือไม่?
        Return: True = บันทึก, False = ไม่บันทึก
        """
        now = time.time()
        last_val = self._last_saved_values[sensor_type]
        last_time = self._last_saved_times[sensor_type]
        threshold = self.THRESHOLDS[sensor_type]

        # 1. บันทึกครั้งแรกเสมอ
        if last_val is None:
            return True

        # 2. เช็ค Deadband (ค่าเปลี่ยนเกินกำหนดไหม?)
        diff = abs(current_value - last_val)
        if diff >= threshold:
            return True

        # 3. Heartbeat: บังคับบันทึกทุก 30 นาที (1800 วิ) กันกราฟขาด
        if (now - last_time) > 1800:
            return True

        return False

    def _update_memory(self, sensor_type: str, value: float):
        """อัปเดตความจำเมื่อบันทึกเสร็จ"""
        self._last_saved_values[sensor_type] = value
        self._last_saved_times[sensor_type] = time.time()

    # ---------------------------------------------------------
    # 💾 ส่วนบันทึกข้อมูล (Record) - กรองด้วย Deadband
    # ---------------------------------------------------------
    async def record_ph(self, data: SensorPH):
        if self._should_save("ph", data.ph):
            await self.repo.add_ph(data)
            self._update_memory("ph", data.ph)
            print(f"✅ Saved pH: {data.ph}")
            saved = True
        else:
            saved = False
        return {"status": "success", "type": "ph", "value": data.ph, "saved": saved}

    async def record_turbidity(self, data: SensorTurbidity):
        if self._should_save("turbidity", data.NTU):
            await self.repo.add_turbidity(data)
            self._update_memory("turbidity", data.NTU)
            print(f"✅ Saved Turbidity: {data.NTU}")
            saved = True
        else:
            saved = False
        return {"status": "success", "type": "turbidity", "value": data.NTU, "saved": saved}

    async def record_nh3(self, data: SensorNH3):
        if self._should_save("nh3", data.NH3):
            await self.repo.add_nh3(data)
            self._update_memory("nh3", data.NH3)
            print(f"✅ Saved NH3: {data.NH3}")
            saved = True
        else:
            saved = False
        return {"status": "success", "type": "nh3", "value": data.NH3, "saved": saved}

    async def record_temperature(self, data: SensorTemperature):
        if self._should_save("temperature", data.temperature):
            await self.repo.add_temperature(data)
            self._update_memory("temperature", data.temperature)
            print(f"✅ Saved Temp: {data.temperature}")
            saved = True
        else:
            saved = False
        return {"status": "success", "type": "temperature", "value": data.temperature, "saved": saved}

    # --- ส่วนดึงข้อมูล (Get) ---
    async def get_current(self, sensor_type: str):
        return await self.repo.get_latest(sensor_type)

    async def get_history(self, sensor_type: str):
        return await self.repo.get_history(sensor_type)
    
    # ---------------------------------------------------------
    # 📊 ส่วนวิเคราะห์และแจ้งเตือน (Analysis)
    # ---------------------------------------------------------
    async def analyze_water_quality(self):
        # 1. ดึงค่าล่าสุดจาก DB
        ph_data = await self.repo.get_latest("ph")
        temp_data = await self.repo.get_latest("temperature")
        nh3_data = await self.repo.get_latest("nh3")
        turb_data = await self.repo.get_latest("turbidity")

        # 2. แปลงค่า (Safely Handle None)
        ph = ph_data.ph if ph_data else None
        temp = temp_data.temperature if temp_data else None
        nh3 = nh3_data.NH3 if nh3_data else None
        ntu = turb_data.NTU if turb_data else None

        # ถ้าไม่มีข้อมูลเลย
        if not any([ph, temp, nh3, ntu]):
            return {
                "status": "No Data",
                "message": "Waiting for sensor data...",
                "color": "gray",
                "issues": []
            }

        issues = [] 

        # 3. ตรวจสอบเงื่อนไข (Logic)
        if ph is not None:
            if ph < 6.5: issues.append(f"pH ต่ำเกินไป ({ph:.1f})")
            elif ph > 8.5: issues.append(f"pH สูงเกินไป ({ph:.1f})")

        if nh3 is not None:
            if nh3 > 0.5: issues.append(f"แอมโมเนียสูงอันตราย ({nh3:.2f})")
            elif nh3 > 0.02: issues.append(f"เริ่มมีแอมโมเนีย ({nh3:.2f})")

        if temp is not None:
            if temp < 20: issues.append(f"น้ำเย็นเกินไป ({temp:.1f}°C)")
            elif temp > 32: issues.append(f"น้ำร้อนเกินไป ({temp:.1f}°C)")

        if ntu is not None:
            if ntu > 50: issues.append(f"น้ำขุ่นมาก ({ntu:.1f})")

        # 4. สรุปผล (ค่าเริ่มต้น = ปกติ)
        status = "Good"
        color = "green"
        message = "คุณภาพน้ำปกติ เหมาะแก่การเลี้ยงสัตว์น้ำ"

        # ถ้ามีปัญหา
        if issues:
            is_critical = any("อันตราย" in msg for msg in issues) or \
                          any("สูงเกินไป" in msg for msg in issues) or \
                          any("ต่ำเกินไป" in msg for msg in issues)

            if is_critical:
                status = "Critical"
                color = "red"
                message = "คุณภาพน้ำวิกฤต! กรุณาตรวจสอบทันที"

                # 🔥 แจ้งเตือน LINE (มี Cooldown)
                current_time = time.time()
                # เช็คเวลาจาก Class Variable (_last_alert_time)
                # ตั้ง Cooldown ไว้ 3600 วิ (1 ชม.) ถ้าจะเทสแก้เป็น 60
                if (current_time - SensorUseCase._last_alert_time) > 3600:
                    
                    alert_msg = f"🚨 แจ้งเตือนภัยวิกฤต!\nสถานะ: {message}\n"
                    for issue in issues:
                        alert_msg += f"• {issue}\n"
                    
                    self.line_service.send_alert(alert_msg)
                    
                    # อัปเดตเวลาล่าสุด
                    SensorUseCase._last_alert_time = current_time

            else:
                # กรณี Warning
                status = "Warning"
                color = "orange"
                message = "คุณภาพน้ำเริ่มมีปัญหา"

        # 5. ส่งค่ากลับเสมอ (อยู่นอก if/else)
        return {
            "status": status,
            "message": message,
            "color": color,
            "issues": issues,
            "current_values": {
                "ph": ph, "temp": temp, "nh3": nh3, "ntu": ntu
            }
        }
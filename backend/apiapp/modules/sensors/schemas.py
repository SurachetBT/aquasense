from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import Field
from beanie import Document # ✅ ต้องใช้ Document เพื่อบันทึกลง MongoDB

# --- ฟังก์ชันเวลา (UTC+7) ---
def now_thai():
    return datetime.utcnow() + timedelta(hours=7)

# ==========================================
# 📡 Sensor Models (ข้อมูลดิบจาก Sensor)
# ==========================================

# --- pH ---
class SensorPH(Document):
    ph: float
    device_id: str = "esp32_default" # ใส่ Default ไว้กัน Error
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_ph" # ชื่อตารางใน DB

# --- Turbidity (NTU) ---
class SensorTurbidity(Document):
    NTU: float
    device_id: str = "esp32_default"
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_turbidity"

# --- NH3 ---
class SensorNH3(Document):
    NH3: float
    device_id: str = "esp32_default"
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_nh3"

# --- Temperature ---
class SensorTemperature(Document):
    temperature: float
    device_id: str = "esp32_default"
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_temperature"

# --- TDS ---
class SensorTDS(Document):
    tds: float
    device_id: str = "esp32_default"
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_tds"

# --- pH Voltage ---
class SensorPHVoltage(Document):
    voltage: float
    device_id: str = "esp32_default"
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_ph_voltage"
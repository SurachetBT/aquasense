from beanie import Document
from pydantic import Field
from datetime import datetime, timedelta
from typing import Optional

# ฟังก์ชันสำหรับเวลาไทย (UTC+7)
def now_thai():
    return datetime.utcnow() + timedelta(hours=7)

# ==========================================
# 1. Sensor pH
# ==========================================
class SensorPH(Document):
    device_id: str
    ph: float
    # ใช้ default_factory เพื่อให้เวลาอัปเดตตอนบันทึกจริง
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        # กำหนดชื่อ Collection ใน MongoDB ให้ตรงกับของเดิม
        name = "sensor_PH"

# ==========================================
# 2. Sensor Turbidity (ความขุ่น)
# ==========================================
class SensorTurbidity(Document):
    device_id: str
    NTU: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_NTU"

# ==========================================
# 3. Sensor Ammonia (NH3)
# ==========================================
class SensorNH3(Document):
    device_id: str
    NH3: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_NH3"

# ==========================================
# 4. Sensor Temperature (อุณหภูมิ)
# ==========================================
class SensorTemperature(Document):
    device_id: str
    temperature: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_temperature"
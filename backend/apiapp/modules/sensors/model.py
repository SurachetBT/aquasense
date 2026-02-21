from beanie import Document
from pydantic import Field
from datetime import datetime, timedelta
from typing import Optional
import pymongo
# ฟังก์ชันสำหรับเวลาไทย (UTC+7)
def now_thai():
    return datetime.utcnow() + timedelta(hours=7)

SECONDS_TO_EXPIRE = 604800  # 7 วัน

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
        indexes = [
            pymongo.IndexModel(
                [("timestamp", pymongo.ASCENDING)],
                expireAfterSeconds=SECONDS_TO_EXPIRE
            )
        ]

# ==========================================
# 2. Sensor Turbidity (ความขุ่น)
# ==========================================
class SensorTurbidity(Document):
    device_id: str
    NTU: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_NTU"
        indexes = [
            pymongo.IndexModel(
                [("timestamp", pymongo.ASCENDING)],
                expireAfterSeconds=SECONDS_TO_EXPIRE
            )
        ]

# ==========================================
# 3. Sensor Ammonia (NH3)
# ==========================================
class SensorNH3(Document):
    device_id: str
    NH3: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_NH3"
        indexes = [
            pymongo.IndexModel(
                [("timestamp", pymongo.ASCENDING)],
                expireAfterSeconds=SECONDS_TO_EXPIRE
            )
        ]

# ==========================================
# 4. Sensor Temperature (อุณหภูมิ)
# ==========================================
class SensorTemperature(Document):
    device_id: str
    temperature: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_temperature"
        indexes = [
            pymongo.IndexModel(
                [("timestamp", pymongo.ASCENDING)],
                expireAfterSeconds=SECONDS_TO_EXPIRE
            )
        ]

# ==========================================
# 5. Sensor TDS (ความเข้มข้นของสารละลาย)
# ==========================================
class SensorTDS(Document):
    device_id: str
    tds: float
    timestamp: datetime = Field(default_factory=now_thai)

    class Settings:
        name = "sensor_TDS"
        indexes = [
            pymongo.IndexModel(
                [("timestamp", pymongo.ASCENDING)],
                expireAfterSeconds=SECONDS_TO_EXPIRE
            )
        ]
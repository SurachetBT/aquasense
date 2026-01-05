from pydantic import BaseModel, Field
from datetime import datetime, timedelta

def now_thai():
    return datetime.utcnow() + timedelta(hours=7)

# --- Base Schema (ส่วนที่เหมือนกัน) ---
class SensorBase(BaseModel):
    device_id: str
    timestamp: datetime = Field(default_factory=now_thai)

# --- pH ---
class SensorPH(SensorBase):
    ph: float

# --- Turbidity (NTU) ---
class SensorTurbidity(SensorBase):
    NTU: float

# --- NH3 ---
class SensorNH3(SensorBase):
    NH3: float

# --- Temperature ---
class SensorTemperature(SensorBase):
    temperature: float
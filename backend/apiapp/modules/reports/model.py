# app/modules/reports/model.py
from beanie import Document
from datetime import datetime
from pydantic import Field
from typing import List, Optional

from datetime import datetime, timedelta, timezone

# ฟังก์ชันเวลา (ไทย UTC+7)
def now_thai():
    # ใช้ timezone offset สำหรับประเทศไทย
    tz_thai = timezone(timedelta(hours=7))
    return datetime.now(tz_thai)

class WaterAnalysisLog(Document):
    """
    เก็บผลวิเคราะห์รายชั่วโมง (Snapshot)
    ย้ายมาอยู่ที่ Reports เพราะเน้นใช้ทำรายงาน
    """
    timestamp: datetime = Field(default_factory=now_thai)
    status: str                 
    issues: List[str] = []      
    
    ph: Optional[float] = None
    ph_voltage: Optional[float] = None
    turbidity: Optional[float] = None
    nh3: Optional[float] = None
    temperature: Optional[float] = None
    tds: Optional[float] = None

    class Settings:
        name = "water_analysis"
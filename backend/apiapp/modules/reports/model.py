# app/modules/reports/model.py
from beanie import Document
from datetime import datetime
from pydantic import Field
from typing import List, Optional

# ฟังก์ชันเวลา (ถ้าใช้)
def now_thai():
    return datetime.utcnow()

class WaterAnalysisLog(Document):
    """
    เก็บผลวิเคราะห์รายชั่วโมง (Snapshot)
    ย้ายมาอยู่ที่ Reports เพราะเน้นใช้ทำรายงาน
    """
    timestamp: datetime = Field(default_factory=now_thai)
    status: str                 
    issues: List[str] = []      
    
    ph: Optional[float] = None
    turbidity: Optional[float] = None
    nh3: Optional[float] = None
    temperature: Optional[float] = None
    tds: Optional[float] = None

    class Settings:
        name = "water_analysis"
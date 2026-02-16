from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 🌞 ส่วนของรายวัน (Daily)
# ==========================================

class DailyStatistics(BaseModel):
    """ สถิติย่อยใน Card รายวัน """
    critical: int
    warning: int
    avg_ph: float
    max_nh3: float
    avg_turbidity: float  
    avg_temp: float

class DailySummaryResponse(BaseModel):
    """ Card สรุปยอดรายวัน """
    date: str
    summary_text: str
    statistics: DailyStatistics

class DailyTableRow(BaseModel):
    """ แถวในตารางรายวัน """
    time: str
    status: str
    ph: str
    temp: str
    nh3: str
    turbidity: str  
    issues: str

# ==========================================
# 📅 ส่วนของรายเดือน (Monthly)
# ==========================================

class MonthlySummaryResponse(BaseModel):
    """ Card สรุปยอดรายเดือน """
    period: str
    grade: str
    total_logs: int
    critical_count: int

class MonthlyTableRow(BaseModel):
    """ แถวในตารางรายเดือน """
    date: str
    status: str
    avg_ph: str
    avg_temp: str
    max_nh3: str
    avg_turbidity: str 
    note: str
from beanie import Document
from datetime import datetime, timedelta, timezone
from pydantic import Field

# ฟังก์ชันเวลา (ไทย UTC+7) ที่เดียวกับที่ใช้ใน reports
def now_thai():
    tz_thai = timezone(timedelta(hours=7))
    return datetime.now(tz_thai)

class FeedingLog(Document):
    """
    เก็บประวัติการให้อาหารปลา
    """
    timestamp: datetime = Field(default_factory=now_thai)
    device_name: str = "servo1"
    action: str = "on"

    class Settings:
        name = "feeding_logs"

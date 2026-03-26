from beanie import Document
from datetime import datetime, timedelta, timezone
from pydantic import Field

# ฟังก์ชันเวลา (ไทย UTC+7) ที่เดียวกับที่ใช้ใน reports
# ฟังก์ชันเวลา (ไทย UTC+7) - เปลี่ยนเป็น Naive เพื่อให้ Front-end แสดงผลตรงๆ
def now_thai():
    # ใช้ UTC + 7 ชม. โดยไม่เก็บข้อมุล Timezone (Naive)
    return datetime.utcnow() + timedelta(hours=7)

class FeedingLog(Document):
    """
    เก็บประวัติการให้อาหารปลา
    """
    timestamp: datetime = Field(default_factory=now_thai)
    device_name: str = "servo1"
    action: str = "on"

    class Settings:
        name = "feeding_logs"

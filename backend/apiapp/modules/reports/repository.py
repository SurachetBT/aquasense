from datetime import datetime
from typing import List
from .model import WaterAnalysisLog

class ReportRepository:
    
    async def create_log(self, log_data: WaterAnalysisLog) -> WaterAnalysisLog:
        """ บันทึก Log ใหม่ลง Database """
        return await log_data.save()

    async def get_by_date_range(self, start: datetime, end: datetime) -> List[WaterAnalysisLog]:
        """ ดึงข้อมูลตามช่วงเวลา (ใช้ได้ทั้ง รายวัน และ รายเดือน) """
        return await WaterAnalysisLog.find(
            WaterAnalysisLog.timestamp >= start,
            WaterAnalysisLog.timestamp <= end
        ).to_list()
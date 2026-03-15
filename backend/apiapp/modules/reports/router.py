from fastapi import APIRouter, Depends
from .use_case import ReportUseCase

router = APIRouter(prefix="/reports", tags=["Reports"])

def get_report_use_case():
    return ReportUseCase()

from typing import Optional

# 1. สรุปยอดวันนี้ (Cards)
@router.get("/summary/daily")
async def get_daily_summary(date: Optional[str] = None, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_today_summary(date)

# 2. ตารางวันนี้ (Table)
@router.get("/table/daily")
async def get_daily_table(date: Optional[str] = None, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_daily_table(date)

# 3. สรุปยอดเดือน (Cards)
@router.get("/summary/monthly")
async def get_monthly_summary(month: int, year: int, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_monthly_summary(month, year)

# 4. ตารางเดือน (Table)
@router.get("/table/monthly")
async def get_monthly_table(month: int, year: int, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_monthly_table(month, year)

# 5. สรุปยอดรายสัปดาห์ (Cards)
@router.get("/summary/weekly")
async def get_weekly_summary(date: Optional[str] = None, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_weekly_summary(date)

# 6. ตารางรายสัปดาห์ (Table)
@router.get("/table/weekly")
async def get_weekly_table(date: Optional[str] = None, use_case: ReportUseCase = Depends(get_report_use_case)):
    return await use_case.get_weekly_table(date)
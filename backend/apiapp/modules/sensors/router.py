from fastapi import APIRouter, Depends, HTTPException
from typing import List

# ✅ แก้ตรงนี้: เปลี่ยนจาก .schemas เป็น .model
from .model import SensorPH, SensorTurbidity, SensorNH3, SensorTemperature

# Import Use Case
from .use_case import SensorUseCase

# สร้าง Router
# หมายเหตุ: prefix="/sensors" แปลว่า endpoint ทั้งหมดจะขึ้นต้นด้วย /sensors
router = APIRouter(prefix="/sensors", tags=["Sensors"])

# Dependency Injection สำหรับ UseCase
def get_use_case():
    return SensorUseCase()

# ==========================================
# 📥 POST: บันทึกข้อมูล (Add Data)
# ==========================================

@router.post("/add/ph")
async def add_ph(data: SensorPH, use_case: SensorUseCase = Depends(get_use_case)):
    # ใส่ await เพราะ record_ph เป็น async function
    return await use_case.record_ph(data)

@router.post("/add/turbidity")
async def add_turbidity(data: SensorTurbidity, use_case: SensorUseCase = Depends(get_use_case)):
    return await use_case.record_turbidity(data)

@router.post("/add/nh3")
async def add_nh3(data: SensorNH3, use_case: SensorUseCase = Depends(get_use_case)):
    return await use_case.record_nh3(data)

@router.post("/add/temperature")
async def add_temperature(data: SensorTemperature, use_case: SensorUseCase = Depends(get_use_case)):
    return await use_case.record_temperature(data)

# ==========================================
# 📤 GET: ดึงข้อมูล (Retrieve Data)
# ==========================================

@router.get("/latest/{sensor_type}")
async def get_latest(sensor_type: str, use_case: SensorUseCase = Depends(get_use_case)):
    """
    ดึงข้อมูลล่าสุดของ Sensor ที่ระบุ
    sensor_type options: 'ph', 'turbidity', 'nh3', 'temperature'
    """
    result = await use_case.get_current(sensor_type)
    
    if not result:
        # ถ้าหาไม่เจอ ให้ return 404 (Not Found)
        raise HTTPException(status_code=404, detail=f"No data found for sensor type: {sensor_type}")
    
    return result

@router.get("/history/{sensor_type}")
async def get_history(sensor_type: str, limit: int = 20, use_case: SensorUseCase = Depends(get_use_case)):
    """
    ดึงประวัติข้อมูล (Default 20 รายการล่าสุด)
    """
    return await use_case.get_history(sensor_type)

@router.get("/status/analysis")
async def get_system_status(use_case: SensorUseCase = Depends(get_use_case)):
    """
    วิเคราะห์คุณภาพน้ำรวมจากเซนเซอร์ทุกตัว
    """
    return await use_case.analyze_water_quality()
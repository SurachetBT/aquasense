from typing import List, Optional, Union
from .model import SensorPH, SensorPHVoltage, SensorTurbidity, SensorNH3, SensorTemperature, SensorTDS
from .schemas import (
    SensorPH as SchemaPH,
    SensorPHVoltage as SchemaPHVoltage,
    SensorTurbidity as SchemaTurbidity,
    SensorNH3 as SchemaNH3, 
    SensorTemperature as SchemaTemperature,
    SensorTDS as SchemaTDS
)

class SensorRepository:
    
    # ==========================================
    # 💾 ส่วนบันทึกข้อมูล (Create / Insert)
    # ==========================================
    
    async def add_ph(self, data: SchemaPH) -> SensorPH:
        # สร้าง Object Beanie จากข้อมูล Pydantic
        record = SensorPH(
            device_id=data.device_id,
            ph=data.ph
            # timestamp จะถูกสร้างเองจาก default_factory ใน model.py
        )
        await record.insert() # สั่งบันทึกลง MongoDB
        return record

    async def add_ph_voltage(self, data: SchemaPHVoltage) -> SensorPHVoltage:
        record = SensorPHVoltage(
            device_id=data.device_id,
            voltage=data.voltage
        )
        await record.insert()
        return record

    async def add_turbidity(self, data: SchemaTurbidity) -> SensorTurbidity:
        record = SensorTurbidity(
            device_id=data.device_id,
            NTU=data.NTU
        )
        await record.insert()
        return record

    async def add_nh3(self, data: SchemaNH3) -> SensorNH3:
        record = SensorNH3(
            device_id=data.device_id,
            NH3=data.NH3
        )
        await record.insert()
        return record

    async def add_temperature(self, data: SchemaTemperature) -> SensorTemperature:
        record = SensorTemperature(
            device_id=data.device_id,
            temperature=data.temperature
        )
        await record.insert()
        return record

    async def add_tds(self, data: SchemaTDS) -> SensorTDS:
        record = SensorTDS(
            device_id=data.device_id,
            tds=data.tds
        )
        await record.insert()
        return record

    # ==========================================
    # 🔍 ส่วนดึงข้อมูล (Read / Query)
    # ==========================================

    async def get_latest(self, sensor_type: str):
        """ดึงข้อมูลล่าสุด 1 ตัว"""
        model = self._get_model_class(sensor_type)
        if model:
            # find_all() -> เรียง timestamp ถอยหลัง (-) -> เอาตัวแรก
            return await model.find_all().sort("-timestamp").first_or_none()
        return None

    async def get_history(self, sensor_type: str, limit: int = 20):
        """ดึงข้อมูลย้อนหลังตามจำนวน limit"""
        model = self._get_model_class(sensor_type)
        if model:
            # .to_list() จำเป็นต้องใส่เสมอใน Beanie เมื่อดึงหลายตัว
            return await model.find_all().sort("-timestamp").limit(limit).to_list()
        return []

    # ==========================================
    # 🛠️ Helper Function (Private)
    # ==========================================
    
    def _get_model_class(self, sensor_type: str):
        """ช่วยแปลง string เป็น Class ของ Beanie"""
        if sensor_type == "ph": 
            return SensorPH
        elif sensor_type == "ph_voltage":
            return SensorPHVoltage
        elif sensor_type == "turbidity": 
            return SensorTurbidity
        elif sensor_type == "nh3": 
            return SensorNH3
        elif sensor_type == "temperature": 
            return SensorTemperature
        elif sensor_type == "tds":
            return SensorTDS
        return None
from .repository import SensorRepository
from .schemas import SensorPH, SensorTurbidity, SensorNH3, SensorTemperature

class SensorUseCase:
    def __init__(self):
        self.repo = SensorRepository()

    # ✅ ต้องแก้เป็น async def และใส่ await เวลาเรียก repo

    async def record_ph(self, data: SensorPH):
        await self.repo.add_ph(data)  # รอให้บันทึกเสร็จก่อน
        return {"status": "success", "type": "ph", "value": data.ph}

    async def record_turbidity(self, data: SensorTurbidity):
        await self.repo.add_turbidity(data)
        return {"status": "success", "type": "turbidity", "value": data.NTU}

    async def record_nh3(self, data: SensorNH3):
        await self.repo.add_nh3(data)
        return {"status": "success", "type": "nh3", "value": data.NH3}

    async def record_temperature(self, data: SensorTemperature):
        await self.repo.add_temperature(data)
        return {"status": "success", "type": "temperature", "value": data.temperature}

    async def get_current(self, sensor_type: str):
        return await self.repo.get_latest(sensor_type)

    async def get_history(self, sensor_type: str):
        return await self.repo.get_history(sensor_type)
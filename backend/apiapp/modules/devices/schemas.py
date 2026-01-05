from pydantic import BaseModel

class DeviceCommandResponse(BaseModel):
    status: str      # เช่น "success" หรือ "error"
    device: str      # เช่น "pump1"
    action: str      # เช่น "on" หรือ "off"
    message: str     # ข้อความเพิ่มเติม
from fastapi import APIRouter, Depends
from .schemas import DeviceCommandResponse
from .use_case import DeviceUseCase

# สร้าง Router ชื่อ Control
router = APIRouter(prefix="/control", tags=["Control (Devices)"])

def get_use_case():
    return DeviceUseCase()

# สร้าง API แบบ POST หรือ GET ก็ได้ (แต่ Control นิยมใช้ POST)
# URL จะเป็น: /control/pump1/on
@router.post("/{device_name}/{action}", response_model=DeviceCommandResponse)
def control_device(
    device_name: str, 
    action: str, 
    use_case: DeviceUseCase = Depends(get_use_case)
):
    # เรียก Use Case ให้ทำงาน
    result = use_case.execute_command(device_name, action)
    return result
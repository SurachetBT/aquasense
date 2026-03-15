from fastapi import APIRouter, status, Depends
from typing import List
from .schema import SystemSettingsResponse, SystemSettingsRequest, LineUserResponse, LineUserRequest
from .use_case import SettingsUseCase
from ...core.security import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/line_config", response_model=SystemSettingsResponse)
async def get_line_config(current_user=Depends(get_current_user)):
    """ดึงการตั้งค่า LINE Token (สำหรับ Admin)"""
    return await SettingsUseCase.get_system_settings()

@router.post("/line_config", response_model=SystemSettingsResponse)
async def update_line_config(data: SystemSettingsRequest, current_user=Depends(get_current_user)):
    """อัปเดตการตั้งค่า LINE Token (สำหรับ Admin)"""
    return await SettingsUseCase.update_system_settings(data)

@router.get("/line_users", response_model=List[LineUserResponse])
async def get_line_users(current_user=Depends(get_current_user)):
    """ดึงรายชื่อลูกค้าที่รับแจ้งเตือน LINE ทั้งหมด"""
    return await SettingsUseCase.get_all_line_users()

@router.post("/line_users", response_model=LineUserResponse, status_code=status.HTTP_201_CREATED)
async def add_line_user(data: LineUserRequest, current_user=Depends(get_current_user)):
    """เพิ่มลูกค้าใหม่เพื่อรับการแจ้งเตือน LINE"""
    return await SettingsUseCase.create_line_user(data)

@router.delete("/line_users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_line_user(user_id: str, current_user=Depends(get_current_user)):
    """ลบลูกค้าออกจากการรับแจ้งเตือน LINE"""
    await SettingsUseCase.delete_line_user(user_id)
    return None

@router.put("/line_users/{user_id}/toggle", response_model=LineUserResponse)
async def toggle_line_user(user_id: str, current_user=Depends(get_current_user)):
    """เปิดปิดรับแจ้งเตือนของลูกค้ารายบุคคล"""
    return await SettingsUseCase.toggle_line_user(user_id)

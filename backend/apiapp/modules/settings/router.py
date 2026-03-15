from fastapi import APIRouter, status, Depends
from typing import List
from .schema import SystemSettingsResponse, SystemSettingsRequest, LineUserResponse, LineUserRequest, LineRequestSchema
from .use_case import SettingsUseCase
from ...core.security import get_current_user, get_current_admin
from ...modules.user.model import User

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/line_config", response_model=SystemSettingsResponse)
async def get_line_config(current_user=Depends(get_current_user)):
    """ดึงการตั้งค่า LINE Token (สำหรับ Admin)"""
    return await SettingsUseCase.get_system_settings()

@router.post("/line_config", response_model=SystemSettingsResponse)
async def update_line_config(data: SystemSettingsRequest, admin: User = Depends(get_current_admin)):
    """อัปเดตการตั้งค่า LINE Token (สำหรับ Admin)"""
    return await SettingsUseCase.update_system_settings(data)

@router.get("/line_users", response_model=List[LineUserResponse])
async def get_line_users(current_user=Depends(get_current_user)):
    """ดึงรายชื่อลูกค้าที่รับแจ้งเตือน LINE ทั้งหมด"""
    return await SettingsUseCase.get_all_line_users()

@router.post("/line_users", response_model=LineUserResponse, status_code=status.HTTP_201_CREATED)
async def add_line_user(data: LineUserRequest, admin: User = Depends(get_current_admin)):
    """เพิ่มลูกค้าใหม่เพื่อรับการแจ้งเตือน LINE"""
    return await SettingsUseCase.create_line_user(data)

@router.delete("/line_users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_line_user(user_id: str, admin: User = Depends(get_current_admin)):
    """ลบลูกค้าออกจากการรับแจ้งเตือน LINE"""
    await SettingsUseCase.delete_line_user(user_id)
    return None

@router.put("/line_users/{id}/toggle", response_model=LineUserResponse)
async def toggle_line_user(id: str, admin: User = Depends(get_current_admin)):
    """เปิดปิดรับแจ้งเตือนของลูกค้ารายบุคคล"""
    return await SettingsUseCase.toggle_line_user(id)

# --- Line Inbox Endpoints ---

@router.get("/line_requests", response_model=List[LineRequestSchema])
async def get_line_requests(admin: User = Depends(get_current_admin)):
    return await SettingsUseCase.get_all_line_requests()

@router.post("/line_requests/{id}/approve", response_model=LineUserResponse)
async def approve_request(id: str, admin: User = Depends(get_current_admin)):
    return await SettingsUseCase.approve_line_request(id)

@router.delete("/line_requests/{id}/reject")
async def reject_request(id: str, admin: User = Depends(get_current_admin)):
    await SettingsUseCase.reject_line_request(id)
    return {"status": "success"}

from ...core.exceptions import NotFoundError
from .model import SystemSettings, LineUser, get_bangkok_time
from .schema import SystemSettingsRequest, LineUserRequest
from beanie import PydanticObjectId
from typing import List

class SettingsUseCase:
    @staticmethod
    async def get_system_settings() -> SystemSettings:
        settings = await SystemSettings.find_one()
        if not settings:
            # Create a default empty one
            settings = SystemSettings()
            await settings.insert()
        return settings

    @staticmethod
    async def update_system_settings(data: SystemSettingsRequest) -> SystemSettings:
        settings = await SystemSettings.find_one()
        if not settings:
            settings = SystemSettings(**data.model_dump())
            await settings.insert()
            return settings
            
        # Update fields
        settings.line_channel_access_token = data.line_channel_access_token
        settings.line_channel_secret = data.line_channel_secret
        settings.updated_at = get_bangkok_time()
        await settings.save()
        return settings

    @staticmethod
    async def get_all_line_users() -> List[LineUser]:
        return await LineUser.find_all().to_list()

    @staticmethod
    async def create_line_user(data: LineUserRequest) -> LineUser:
        user = LineUser(**data.model_dump())
        await user.insert()
        return user

    @staticmethod
    async def delete_line_user(user_id: str):
        user = await LineUser.get(PydanticObjectId(user_id))
        if not user:
            raise NotFoundError(detail="Line User not found")
        await user.delete()

    @staticmethod
    async def toggle_line_user(user_id: str) -> LineUser:
        user = await LineUser.get(PydanticObjectId(user_id))
        if not user:
            raise NotFoundError(detail="Line User not found")
        user.is_active = not user.is_active
        await user.save()
        return user

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId

class SystemSettingsRequest(BaseModel):
    line_channel_access_token: Optional[str] = ""
    line_channel_secret: Optional[str] = ""

class SystemSettingsResponse(BaseModel):
    id: Optional[PydanticObjectId] = None
    line_channel_access_token: Optional[str] = ""
    line_channel_secret: Optional[str] = ""
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

class LineUserRequest(BaseModel):
    name: str
    line_user_id: str

class LineUserResponse(BaseModel):
    id: PydanticObjectId
    name: str
    line_user_id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True)

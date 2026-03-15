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

class LineRequestSchema(BaseModel):
    id: PyObjectId = Field(alias="_id")
    line_user_id: str
    display_name: Optional[str] = None
    picture_url: Optional[str] = None
    last_message: str
    status: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class LineUserResponse(BaseModel):
    id: PydanticObjectId
    name: str
    line_user_id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True)

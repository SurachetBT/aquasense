from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
import pytz

def get_bangkok_time():
    tz = pytz.timezone('Asia/Bangkok')
    return datetime.now(tz)

class SystemSettings(Document):
    # There should only be one document for this.
    line_channel_access_token: Optional[str] = ""
    line_channel_secret: Optional[str] = ""
    updated_at: datetime = Field(default_factory=get_bangkok_time)

    class Settings:
        name = "system_settings"

class LineUser(Document):
    name: str = ""
    line_user_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=get_bangkok_time)

    class Settings:
        name = "line_users"

class LineRequest(Document):
    line_user_id: str
    display_name: Optional[str] = None
    picture_url: Optional[str] = None
    last_message: str
    status: str = "pending" # pending, approved, rejected
    created_at: datetime = Field(default_factory=get_bangkok_time)

    class Settings:
        name = "line_requests"

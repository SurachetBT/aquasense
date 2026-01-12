from datetime import datetime
from beanie import Document
from pymongo import IndexModel, ASCENDING

class BlacklistedToken(Document):
    token: str
    # เก็บเวลาที่แบน (User กด logout ตอนไหน)
    created_at: datetime = datetime.now()
    
    class Settings:
        name = "blacklisted_tokens"
        indexes = [
            # 1. Index ที่ตัว Token เพื่อให้ค้นหาเร็ว
            IndexModel("token", unique=True),
            
            # 2. ✅ TTL Index: ลบตัวเองทิ้งอัตโนมัติเมื่อครบ 1 วัน (86400 วินาที)
            # (ไม่ต้องเปลืองพื้นที่เก็บ Token เก่าที่หมดอายุไปแล้ว)
            IndexModel("created_at", expireAfterSeconds=86400) 
        ]
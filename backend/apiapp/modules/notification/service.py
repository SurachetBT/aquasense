from linebot import LineBotApi
from linebot.models import TextSendMessage
from linebot.exceptions import LineBotApiError
from apiapp.modules.settings.model import SystemSettings, LineUser
from loguru import logger

class LineBotService:
    async def send_alert(self, message: str):
        """
        ฟังก์ชันสำหรับส่งข้อความแจ้งเตือน (Push Message) ไปหาทุกคนที่ลงทะเบียนไว้
        อ่าน Token และรายชื่อผู้รับจาก Database โดยตรง
        """
        try:
            # 1. ดึงการตั้งค่า LINE จาก DB
            config = await SystemSettings.find_one()
            if not config or not config.line_channel_access_token:
                logger.warning("⚠️ LINE Alert skipped: No Channel Access Token found in Settings.")
                return

            # 2. ดึงรายชื่อผู้รับ (LineUser) ทั้งหมดที่เปิดใช้งานอยู่
            target_users = await LineUser.find({"is_active": True}).to_list()
            if not target_users:
                logger.info("ℹ️ No active Line Users found for notification.")
                return

            # 3. เริ่มต้นเชื่อมต่อ LINE (สร้าง instance ใหม่เพื่อใช้ token ล่าสุด)
            line_bot_api = LineBotApi(config.line_channel_access_token)
            
            # 4. วนลูปส่งให้ทุกคน
            sent_count = 0
            for user in target_users:
                try:
                    line_bot_api.push_message(
                        user.line_user_id,
                        TextSendMessage(text=message)
                    )
                    sent_count += 1
                except LineBotApiError as e:
                    logger.error(f"❌ Failed to send LINE to {user.name} ({user.line_user_id}): {e}")

            logger.info(f"✅ LINE Broadcast Sent to {sent_count}/{len(target_users)} users: {message[:20]}...")
            
        except Exception as e:
            logger.error(f"❌ LINE Service Error: {e}")
from linebot import LineBotApi
from linebot.models import TextSendMessage
from linebot.exceptions import LineBotApiError
from apiapp.core.config import settings

class LineBotService:
    def __init__(self):
        # เริ่มต้นเชื่อมต่อ LINE
        self.line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)
        self.target_id = settings.LINE_USER_ID

    def send_alert(self, message: str):
        """
        ฟังก์ชันสำหรับส่งข้อความแจ้งเตือน (Push Message)
        ใครๆ ก็เรียกใช้ฟังก์ชันนี้ได้
        """
        try:
            self.line_bot_api.push_message(
                self.target_id,
                TextSendMessage(text=message)
            )
            print(f"✅ LINE Alert Sent: {message[:20]}...")
        except LineBotApiError as e:
            print(f"❌ LINE Error: {e}")
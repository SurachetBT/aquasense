from fastapi import APIRouter, Request, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from apiapp.modules.settings.model import SystemSettings
from loguru import logger

# สร้าง Router
router = APIRouter(prefix="/callback", tags=["AquaSense"])

@router.post("")
async def callback(request: Request):
    # 1. ดึงการตั้งค่าล่าสุดจาก DB
    config = await SystemSettings.find_one()
    if not config or not config.line_channel_secret:
        logger.error("❌ LINE Callback failed: No Channel Secret found in Settings.")
        return "LINE Config Missing"

    # 2. รับ Signature และ Body
    signature = request.headers.get("X-Line-Signature", "")
    body = await request.body()
    body_str = body.decode("utf-8")

    # 3. เตรียมตัวจัดการ LINE แบบ dynamic
    line_bot_api = LineBotApi(config.line_channel_access_token)
    handler = WebhookHandler(config.line_channel_secret)

    # 4. นิยาม Handler ภายใน (เพื่อให้เข้าถึง line_bot_api ตัวปัจจุบัน)
    @handler.add(MessageEvent, message=TextMessage)
    def handle_message(event):
        user_msg = event.message.text.lower()
        
        # Print User ID เพื่อให้ Admin เอาไปใส่ในหน้า Settings
        logger.info(f"------------ 🆔 เจอ USER ID แล้ว! ------------")
        logger.info(f"User ID: {event.source.user_id}")
        logger.info(f"----------------------------------------------")

        reply_text = "ผมยังไม่เข้าใจคำสั่งครับ"
        
        if "สถานะ" in user_msg:
            reply_text = "ระบบ AquaSense ทำงานปกติครับ"
        elif "สวัสดี" in user_msg:
            reply_text = f"สวัสดีครับ! ผมคือบอท AquaSense 🐟\n\nรหัส User ID ของคุณคือ:\n{event.source.user_id}\n\nกรุณาส่งรหัสนี้ให้แอดมินเพื่อลงทะเบียนรับแจ้งเตือนนะครับ"

        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text=reply_text)
        )

    # 5. ตรวจสอบและประมวลผล
    try:
        handler.handle(body_str, signature)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    return "OK"
from fastapi import APIRouter, Request, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from apiapp.modules.settings.model import SystemSettings, LineUser, LineRequest
from loguru import logger
import json

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
        user_id = event.source.user_id
        user_msg = event.message.text.lower()
        
        # 1. เช็คว่าเป็นลูกค้าที่ลงทะเบียนแล้วหรือยัง (ใช้รันไทม์เช็ค)
        # หมายเหตุ: เนื่องจากอยู่ใน async handler ที่เรียกแบบ sync ของ line sdk 
        # เราอาจต้องใช้ loop.run_until_complete หรือ เปลี่ยนไปใช้ webhook handler แบบ async ถ้า sdk รองรับ
        # แต่เพื่อความง่าย เราจะใช้การรันแบบปกติ และรัน DB แบบ sync-like หรือดึงก่อน
        
        import asyncio
        loop = asyncio.get_event_loop()
        
        async def process_user():
            is_registered = await LineUser.find_one(LineUser.line_user_id == user_id)
            if not is_registered:
                # ถ้ายังไม่ลงทะเบียน ให้เช็คใน Inbox (LineRequest)
                existing_request = await LineRequest.find_one(LineRequest.line_user_id == user_id)
                
                # พยายามดึงชื่อจาก LINE Profile
                display_name = "ลูกค้าใหม่"
                picture_url = None
                try:
                    profile = line_bot_api.get_profile(user_id)
                    display_name = profile.display_name
                    picture_url = profile.picture_url
                except Exception as e:
                    logger.warning(f"Could not get LINE profile for {user_id}: {e}")

                if existing_request:
                    existing_request.last_message = event.message.text
                    existing_request.display_name = display_name
                    existing_request.picture_url = picture_url
                    await existing_request.save()
                else:
                    new_request = LineRequest(
                        line_user_id=user_id,
                        display_name=display_name,
                        picture_url=picture_url,
                        last_message=event.message.text
                    )
                    await new_request.insert()
                
                return f"สวัสดีครับคุณ {display_name}! ✨\n\nระบบได้รับข้อความแล้ว ขณะนี้คุณยังไม่ได้ลงทะเบียนรับแจ้งเตือน\n\nรหัสของคุณคือ:\n{user_id}\n\nแอดมินกำลังตรวจสอบข้อมูลเพื่อลงทะเบียนให้ครับ"
            
            # ถ้าลงทะเบียนแล้ว
            if "สถานะ" in user_msg:
                return "ระบบ AquaSense ทำงานปกติครับ ทุกอย่างเรียบร้อยดี"
            return "สวัสดีครับ! ขอบคุณที่ทักมานะครับ หากมีเหตุการณ์ฉุกเฉินทางเราจะรีบแจ้งเตือนทันทีครับ"

        reply_text = loop.run_until_complete(process_user())

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
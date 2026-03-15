from fastapi import APIRouter, Request, Header, HTTPException
from linebot import LineBotApi, WebhookParser
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from apiapp.modules.settings.model import SystemSettings, LineUser, LineRequest
from loguru import logger

# สร้าง Router
router = APIRouter(prefix="/callback", tags=["AquaSense"])

@router.post("")
async def callback(request: Request, x_line_signature: str = Header(None)):
    # 1. ดึงการตั้งค่าล่าสุดจาก DB
    config = await SystemSettings.find_one()
    if not config or not config.line_channel_secret:
        logger.error("❌ LINE Callback failed: No Channel Secret found in Settings.")
        return "LINE Config Missing"

    # 2. รับ Body
    body = await request.body()
    body_str = body.decode("utf-8")

    # 3. เตรียม Parser และ API
    line_bot_api = LineBotApi(config.line_channel_access_token)
    parser = WebhookParser(config.line_channel_secret)

    # 4. ตรวจสอบ Signature และดึง Events
    try:
        events = parser.parse(body_str, x_line_signature)
    except InvalidSignatureError:
        logger.warning("❌ Invalid LINE Signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"❌ Error parsing LINE webhook: {e}")
        return "Error"

    # 5. ประมวลผลแต่ละ Event แบบ Async
    for event in events:
        if not isinstance(event, MessageEvent) or not isinstance(event.message, TextMessage):
            continue

        user_id = event.source.user_id
        user_msg = event.message.text.lower()
        reply_token = event.reply_token

        # ส่วน Logic ตรวจสอบผู้ใช้
        is_registered = await LineUser.find_one(LineUser.line_user_id == user_id)
        
        if not is_registered:
            # ถ้ายังไม่ลงทะเบียน ให้เก็บลง Inbox
            existing_request = await LineRequest.find_one(LineRequest.line_user_id == user_id)
            
            display_name = "ลูกค้าใหม่"
            picture_url = None
            try:
                # ดึงโปรไฟล์ (เป็น Sync call ใน SDK v2)
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
            
            msg = f"สวัสดีครับคุณ {display_name}! ✨\n\nระบบได้รับข้อความแล้ว ขณะนี้คุณยังไม่ได้ลงทะเบียนรับแจ้งเตือน\n\nรหัสของคุณคือ:\n{user_id}\n\nแอดมินกำลังตรวจสอบข้อมูลเพื่อลงทะเบียนให้ครับ"
        else:
            # ถ้าลงทะเบียนแล้ว
            if "สถานะ" in user_msg:
                msg = "ระบบ AquaSense ทำงานปกติครับ ทุกอย่างเรียบร้อยดี ✅"
            else:
                msg = "สวัสดีครับ! ขอบคุณที่ทักมานะครับ หากมีเหตุการณ์น้ำผิดปกติ ระบบจะรีบแจ้งเตือนคุณทันทีครับ 🐟"

        # ส่งข้อความตอบกลับ
        line_bot_api.reply_message(reply_token, TextSendMessage(text=msg))

    return "OK"
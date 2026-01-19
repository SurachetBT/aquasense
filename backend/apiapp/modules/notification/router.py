from fastapi import APIRouter, Request, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from apiapp.core.config import settings

# สร้าง Router (Prefix คือ /callback แล้ว)
router = APIRouter(prefix="/callback", tags=["AquaSense"])

# เตรียมตัวจัดการ LINE
line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN) # <--- เพิ่มตัวนี้
handler = WebhookHandler(settings.LINE_CHANNEL_SECRET)

# ✅ แก้ตรงนี้: ใช้ "" พอครับ (เพราะ Prefix มีคำว่า /callback อยู่แล้ว)
@router.post("")
async def callback(request: Request):
    # 1. รับ Signature
    signature = request.headers.get("X-Line-Signature", "")
    
    # 2. อ่าน Body
    body = await request.body()
    body_str = body.decode("utf-8")

    # 3. ตรวจสอบความถูกต้อง
    try:
        handler.handle(body_str, signature)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    return "OK"

# --- ส่วนตอบกลับอัตโนมัติ (Auto Reply) ---
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_msg = event.message.text.lower()
    
    # 🔥 Print User ID ออกมาดู (ตามที่คุณต้องการ)
    print(f"------------ 🆔 เจอ USER ID แล้ว! ------------")
    print(f"User ID: {event.source.user_id}")
    print(f"----------------------------------------------")

    reply_text = "ผมยังไม่เข้าใจคำสั่งครับ"
    
    if "สถานะ" in user_msg:
        reply_text = "ระบบปกติครับ (เดี๋ยวเขียนโค้ดดึงค่าจริงมาใส่)"
    elif "สวัสดี" in user_msg:
        reply_text = "สวัสดีครับ! ผมคือบอท AquaSense 🐟"

    # ✅ เพิ่มตรงนี้: สั่งให้บอทตอบกลับไปหาคนส่ง
    line_bot_api.reply_message(
        event.reply_token,  # Token สำหรับตอบกลับ (ใช้ได้ครั้งเดียว)
        TextSendMessage(text=reply_text)
    )
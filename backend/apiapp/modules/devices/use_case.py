import paho.mqtt.publish as publish
from apiapp.core.config import settings

class DeviceUseCase:
    
    async def execute_command(self, device_name: str, action: str):
        """
        device_name: pump1, pump2, servo1, servo2, servo3
        action: on, off
        """
        
        # 1. เช็คว่าคำสั่งถูกต้องไหม (on หรือ off เท่านั้น)
        if action not in ["on", "off"]:
            return {
                "status": "error", 
                "message": "Invalid action. Use 'on' or 'off'.",
                "device": device_name,
                "action": action
            }

        # 2. แปลงชื่ออุปกรณ์ เป็น MQTT Topic (ต้องตรงกับ ESP32 เป๊ะๆ)
        topic_map = {
            "pump1": "aquasense/commands/pump1",
            "pump2": "aquasense/commands/pump2",
            "servo1": "aquasense/commands/servo1",
            "servo2": "aquasense/commands/servo2",
            "servo3": "aquasense/commands/servo3"
        }

        if device_name not in topic_map:
            return {
                "status": "error", 
                "message": f"Unknown device: {device_name}",
                "device": device_name,
                "action": action
            }

        topic = topic_map[device_name]

        # 3. ส่งคำสั่งไป MQTT Broker
        try:
            # ใช้ค่า Broker จาก config.py
            publish.single(
                topic, 
                payload=action, 
                hostname=settings.MQTT_BROKER,
                port=settings.MQTT_PORT
            )
            
            # ✅ 4. บันทึก Log เฉพาะกรณีให้อาหารปลา (servo1) และเป็นคำสั่ง 'on'
            if device_name == "servo1" and action == "on":
                from .model import FeedingLog
                try:
                    await FeedingLog(device_name=device_name, action=action).create()
                    print(f"📝 Recorded FeedingLog for {device_name}")
                except Exception as log_err:
                    print(f"⚠️ Failed to record FeedingLog: {log_err}")

            return {
                "status": "success", 
                "message": f"Command '{action}' sent to {device_name}",
                "device": device_name,
                "action": action
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": f"MQTT Error: {str(e)}",
                "device": device_name,
                "action": action
            }
import calendar
from datetime import datetime
from typing import Optional
from .repository import ReportRepository 

class ReportUseCase:
    
    def __init__(self):
        self.repo = ReportRepository()

    # =========================================================
    # 📊 โซนสรุปผล (Cards)
    # =========================================================
    async def get_today_summary(self, date_str: Optional[str] = None):
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                target_date = datetime.now()
        else:
            target_date = datetime.now()

        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        logs = await self.repo.get_by_date_range(start_of_day, end_of_day)

        if not logs: return {"message": "รอข้อมูล..."}

        critical_count = sum(1 for log in logs if log.status == "Critical")
        warning_count = sum(1 for log in logs if log.status == "Warning")
        
        # --- คำนวณ pH ---
        ph_values = [log.ph for log in logs if log.ph is not None]
        avg_ph = sum(ph_values) / len(ph_values) if ph_values else 0
        
        # --- คำนวณ NH3 ---
        nh3_values = [log.nh3 for log in logs if log.nh3 is not None]
        max_nh3 = max(nh3_values) if nh3_values else 0

        temp_values = [log.temperature for log in logs if log.temperature is not None]
        avg_temp = sum(temp_values) / len(temp_values) if temp_values else 0

        # --- [NEW] ✅ คำนวณ Turbidity (ความขุ่น) ---
        # หมายเหตุ: เช็คทั้ง turbidity และ NTU เผื่อชื่อตัวแปรใน DB ต่างกัน
        turbidity_values = []
        for log in logs:
            val = getattr(log, 'turbidity', getattr(log, 'NTU', None))
            if val is not None:
                turbidity_values.append(val)
        
        avg_turbidity = sum(turbidity_values) / len(turbidity_values) if turbidity_values else 0

        # --- [NEW] ✅ คำนวณ TDS ---
        tds_values = [log.tds for log in logs if log.tds is not None]
        avg_tds = sum(tds_values) / len(tds_values) if tds_values else 0

        daily_message = "เยี่ยมมาก"
        if critical_count > 0: daily_message = "มีวิกฤต!"
        elif warning_count > 0: daily_message = "ต้องระวัง"

        return {
            "date": start_of_day.strftime("%Y-%m-%d"),
            "summary_text": daily_message,
            "statistics": {
                "critical": critical_count, 
                "warning": warning_count,
                "avg_ph": round(avg_ph, 2), 
                "max_nh3": round(max_nh3, 3),
                "avg_turbidity": round(avg_turbidity, 2),
                "avg_temp": round(avg_temp, 1),
                "avg_tds": round(avg_tds, 1)
            }
        }

    async def get_weekly_summary(self, start_date_str: Optional[str] = None):
        """ ดึงสรุปผลย้อนหลัง 7 วัน """
        from datetime import timedelta
        
        if start_date_str:
            try:
                end_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            except ValueError:
                end_date = datetime.now()
        else:
            end_date = datetime.now()

        # ให้ end_date เป็นสิ้นสุดของวัน (23:59:59)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        # ถอยหลังไป 6 วัน (รวมวันจบจะได้ 7 วันพอดี) ตั้งแต่เริ่มวัน (00:00:00)
        start_date = (end_date - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

        logs = await self.repo.get_by_date_range(start_date, end_date)

        if not logs: return {"message": "ไม่พบข้อมูลในช่วง 7 วัน"}

        critical_count = sum(1 for log in logs if log.status == "Critical")
        warning_count = sum(1 for log in logs if log.status == "Warning")
        
        # --- คำนวณ pH ---
        ph_values = [log.ph for log in logs if log.ph is not None]
        avg_ph = sum(ph_values) / len(ph_values) if ph_values else 0
        
        # --- คำนวณ NH3 ---
        nh3_values = [log.nh3 for log in logs if log.nh3 is not None]
        max_nh3 = max(nh3_values) if nh3_values else 0

        temp_values = [log.temperature for log in logs if log.temperature is not None]
        avg_temp = sum(temp_values) / len(temp_values) if temp_values else 0

        # --- คำนวณ Turbidity ---
        turbidity_values = []
        for log in logs:
            val = getattr(log, 'turbidity', getattr(log, 'NTU', None))
            if val is not None:
                turbidity_values.append(val)
        
        avg_turbidity = sum(turbidity_values) / len(turbidity_values) if turbidity_values else 0

        # --- คำนวณ TDS ---
        tds_values = [log.tds for log in logs if log.tds is not None]
        avg_tds = sum(tds_values) / len(tds_values) if tds_values else 0

        weekly_message = "เยี่ยมมาก"
        if critical_count > 0: weekly_message = "มีวิกฤต!"
        elif warning_count > 0: weekly_message = "ต้องระวัง"

        return {
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "summary_text": weekly_message,
            "statistics": {
                "critical": critical_count, 
                "warning": warning_count,
                "avg_ph": round(avg_ph, 2), 
                "max_nh3": round(max_nh3, 3),
                "avg_turbidity": round(avg_turbidity, 2),
                "avg_temp": round(avg_temp, 1),
                "avg_tds": round(avg_tds, 1)
            }
        }

    async def get_monthly_summary(self, month: int, year: int):
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime(year, month, 1, 0, 0, 0)
        end_date = datetime(year, month, last_day, 23, 59, 59)

        logs = await self.repo.get_by_date_range(start_date, end_date)

        if not logs: return {"message": "ไม่พบข้อมูล"}

        critical_count = sum(1 for log in logs if log.status == "Critical")
        total = len(logs)
        
        grade = "A"
        if critical_count > (total * 0.1): grade = "C"
        elif critical_count > 0: grade = "B"

        return {
            "period": f"{month}/{year}",
            "grade": grade,
            "total_logs": total,
            "critical_count": critical_count
        }

    # =========================================================
    # 📋 โซนตาราง (Tables)
    # =========================================================
    async def get_daily_table(self, date_str: Optional[str] = None):
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                target_date = datetime.now()
        else:
            target_date = datetime.now()

        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        logs = await self.repo.get_by_date_range(start_of_day, end_of_day)

        table_rows = []
        for log in logs:
            # ดึงค่า turbidity อย่างปลอดภัย (รองรับทั้งชื่อ turbidity และ NTU)
            turbid_val = getattr(log, 'turbidity', getattr(log, 'NTU', None))
            
            table_rows.append({
                "time": log.timestamp.strftime("%H:%M"),
                "status": log.status,
                "ph": f"{log.ph:.2f}" if log.ph is not None else "-",
                "temp": f"{log.temperature:.1f}" if log.temperature is not None else "-",
                "nh3": f"{log.nh3:.3f}" if log.nh3 is not None else "-",
                
                # --- [NEW] ✅ ใส่ค่าความขุ่นลงตาราง ---
                "turbidity": f"{turbid_val:.2f}" if turbid_val is not None else "-",
                
                # --- [NEW] ✅ ใส่ค่า TDS ลงตาราง ---
                "tds": f"{log.tds:.1f}" if log.tds is not None else "-",
                
                "issues": ", ".join(log.issues) if log.issues else "ปกติ"
            })
        return table_rows

    async def get_monthly_table(self, month: int, year: int):
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime(year, month, 1, 0, 0, 0)
        end_date = datetime(year, month, last_day, 23, 59, 59)

        logs = await self.repo.get_by_date_range(start_date, end_date)

        table_rows = []
        for day in range(1, last_day + 1):
            day_logs = [log for log in logs if log.timestamp.day == day]
            date_str = f"{year}-{month:02d}-{day:02d}"

            if not day_logs:
                table_rows.append({
                    "date": date_str, 
                    "status": "No Data",
                    "avg_ph": "-", 
                    "avg_temp": "-", 
                    "max_nh3": "-", 
                    "avg_turbidity": "-", 
                    "avg_tds": "-",
                    "note": "ไม่มีข้อมูล"
                })
                continue

            # เตรียม List ข้อมูลดิบ
            ph_list = [l.ph for l in day_logs if l.ph is not None]
            temp_list = [l.temperature for l in day_logs if l.temperature is not None]
            nh3_list = [l.nh3 for l in day_logs if l.nh3 is not None]
            tds_list = [l.tds for l in day_logs if l.tds is not None]
            
            # --- [NEW] ✅ ดึงค่าความขุ่นของวันนั้น ---
            turbid_list = []
            for l in day_logs:
                val = getattr(l, 'turbidity', getattr(l, 'NTU', None))
                if val is not None:
                    turbid_list.append(val)

            # คำนวณค่าเฉลี่ย/สูงสุด
            avg_ph = sum(ph_list) / len(ph_list) if ph_list else 0
            avg_temp = sum(temp_list) / len(temp_list) if temp_list else 0
            max_nh3 = max(nh3_list) if nh3_list else 0
            avg_turbidity = sum(turbid_list) / len(turbid_list) if turbid_list else 0 # <--- ✅ คำนวณเฉลี่ย
            avg_tds = sum(tds_list) / len(tds_list) if tds_list else 0

            daily_status = "Good"
            if any(l.status == "Critical" for l in day_logs): daily_status = "Critical"
            elif any(l.status == "Warning" for l in day_logs): daily_status = "Warning"

            table_rows.append({
                "date": date_str, 
                "status": daily_status,
                "avg_ph": f"{avg_ph:.2f}", 
                "avg_temp": f"{avg_temp:.1f}",
                "max_nh3": f"{max_nh3:.3f}",
                
                # --- [NEW] ✅ ส่งค่าเฉลี่ยความขุ่นกลับไป ---
                "avg_turbidity": f"{avg_turbidity:.2f}",
                "avg_tds": f"{avg_tds:.1f}",
                
                "note": f"บันทึก {len(day_logs)} ครั้ง"
            })
        return table_rows

    async def get_weekly_table(self, start_date_str: Optional[str] = None):
        """ ดึงตารางข้อมูลรายสัปดาห์ 7 วัน """
        from datetime import timedelta
        
        if start_date_str:
            try:
                end_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            except ValueError:
                end_date = datetime.now()
        else:
            end_date = datetime.now()

        end_date_time = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        start_date_time = (end_date_time - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

        logs = await self.repo.get_by_date_range(start_date_time, end_date_time)

        table_rows = []
        # วนลูปสร้างข้อมูล 7 วัน
        for i in range(7):
            current_day = start_date_time + timedelta(days=i)
            date_str = current_day.strftime("%Y-%m-%d")
            
            # ดึง log เฉพาะของวันนั้น
            day_logs = [log for log in logs if log.timestamp.strftime("%Y-%m-%d") == date_str]

            if not day_logs:
                table_rows.append({
                    "date": date_str, 
                    "status": "No Data",
                    "avg_ph": "-", 
                    "avg_temp": "-", 
                    "max_nh3": "-", 
                    "avg_turbidity": "-", 
                    "avg_tds": "-",
                    "note": "ไม่มีข้อมูล"
                })
                continue

            # เตรียม List ข้อมูลดิบ
            ph_list = [l.ph for l in day_logs if l.ph is not None]
            temp_list = [l.temperature for l in day_logs if l.temperature is not None]
            nh3_list = [l.nh3 for l in day_logs if l.nh3 is not None]
            tds_list = [l.tds for l in day_logs if l.tds is not None]
            turbid_list = []
            for l in day_logs:
                val = getattr(l, 'turbidity', getattr(l, 'NTU', None))
                if val is not None:
                    turbid_list.append(val)

            avg_ph = sum(ph_list) / len(ph_list) if ph_list else 0
            avg_temp = sum(temp_list) / len(temp_list) if temp_list else 0
            max_nh3 = max(nh3_list) if nh3_list else 0
            avg_turbidity = sum(turbid_list) / len(turbid_list) if turbid_list else 0
            avg_tds = sum(tds_list) / len(tds_list) if tds_list else 0

            daily_status = "Good"
            if any(l.status == "Critical" for l in day_logs): daily_status = "Critical"
            elif any(l.status == "Warning" for l in day_logs): daily_status = "Warning"

            table_rows.append({
                "date": date_str, 
                "status": daily_status,
                "avg_ph": f"{avg_ph:.2f}", 
                "avg_temp": f"{avg_temp:.1f}",
                "max_nh3": f"{max_nh3:.3f}",
                "avg_turbidity": f"{avg_turbidity:.2f}",
                "avg_tds": f"{avg_tds:.1f}",
                "note": f"บันทึก {len(day_logs)} ครั้ง"
            })
            
        return table_rows
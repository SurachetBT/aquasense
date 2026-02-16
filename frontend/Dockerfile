FROM node:20-alpine

WORKDIR /app

# 1. ติดตั้ง Dependencies ก่อนเพื่อความเร็วในการ Build ครั้งถัดไป
COPY package*.json ./
RUN npm install

# 2. ก๊อปปี้โค้ดทั้งหมด
COPY . .

# 3. เปิด Port 5173 (Port มาตรฐานของ Vite)
EXPOSE 5173

# 4. สั่งรันด้วยคำสั่ง dev 
# --host 0.0.0.0 จำเป็นมากเพื่อให้เข้าถึงจากนอก Container ได้
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# ==========================================
# STAGE 1: Backend Builder
# ==========================================
FROM python:3.12-slim-trixie AS backend-builder
WORKDIR /app

ENV PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

RUN pip install poetry

COPY pyproject.toml poetry.lock* ./
RUN touch README.md

# ตั้งค่าให้สร้าง .venv ไว้ในโฟลเดอร์โปรเจกต์
RUN poetry config virtualenvs.in-project true

# ✅ เพิ่ม --no-root เพื่อป้องกัน Error ตอนหาแพ็กเกจไม่เจอ
RUN poetry install --no-interaction --no-root

COPY . .

# ==========================================
# STAGE 2: Final Production Image
# ==========================================
FROM python:3.12-slim-trixie

ENV TZ=Asia/Bangkok \
    LANG=th_TH.UTF-8 \
    LANGUAGE=th_TH:en

RUN apt-get update && \
    apt-get install -y --no-install-recommends locales && \
    sed -i '/th_TH.UTF-8/s/^# //g' /etc/locale.gen && locale-gen && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get autoclean && \
    rm -rf /var/cache/apt/archives/*.deb

WORKDIR /app

# 🌟 ติดตั้ง poetry ใน Stage นี้ด้วย เพื่อให้รันคำสั่ง 'poetry run' ในสคริปต์ได้
RUN pip install poetry

# ก๊อปปี้ .venv และโค้ดทั้งหมดมาจาก Stage 1
COPY --from=backend-builder /app/.venv ./.venv
COPY . .

# 🌟 1. ให้สิทธิ์การรันสคริปต์
RUN chmod +x ./scripts/run-dev

# 🌟 2. ตั้งค่า PATH ให้ชี้ไปที่ .venv
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 9000

# 🌟 3. รันสคริปต์ ./scripts/run-dev
CMD ["./scripts/run-dev"]
import datetime
import typing as t
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

from ...core import security
from ...core.config import settings
from ...core.exceptions import AuthError
from ..user.repository import UserRepository, get_user_repository
from ..user.model import User
from . import schemas

class AuthUseCase:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    # 👇 Helper Function: ตรวจสอบ User/Password
    async def _authenticate_user(self, username: str, password: str) -> User:
        user = await self.repository.find_one(
            filters={"username": username, "is_active": True}
        )
        if not user or not user.verify_password(password):
            raise AuthError("Incorrect username or password")
        return user

    # ==========================================
    # 1. Login สำหรับ Swagger UI (OAuth2 Spec)
    # ==========================================
    async def login_for_access_token(
        self, form_data: OAuth2PasswordRequestForm
    ) -> dict:
        user = await self._authenticate_user(form_data.username, form_data.password)

        access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.jwt_handler.create_access_token(
            data={"sub": str(user.id), "token_type": "access"},
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}

    # ==========================================
    # 2. Login สำหรับ App (Custom Response)
    # ==========================================
    async def authentication(
        self, form_data: OAuth2PasswordRequestForm
    ) -> schemas.Token:
        user = await self._authenticate_user(form_data.username, form_data.password)

        # อัปเดตเวลา Login ล่าสุด
        await self.repository.update(
            entity_id=user.id, 
            update_data={"last_login_date": datetime.datetime.now()}
        )

        # คำนวณเวลา
        now = datetime.datetime.now()
        access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = datetime.timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
        expires_at = now + access_token_expires

        return schemas.Token(
            access_token=security.jwt_handler.create_access_token(
                data={"sub": str(user.id), "token_type": "access"},
                expires_delta=access_token_expires,
            ),
            refresh_token=security.jwt_handler.create_refresh_token(
                data={"sub": str(user.id), "token_type": "refresh"},
                expires_delta=refresh_token_expires,
            ),
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires_at=expires_at,
            issued_at=now,
            scope=""
        )

    # ==========================================
    # 3. Refresh Token
    # ==========================================
    async def refresh_token(self, token: str) -> schemas.GetAccessTokenResponse:
        try:
            # 1. แกะ Token ดูไส้ใน
            payload = security.jwt_handler.decode_token(token)
            
            # 2. เช็คว่าเป็น Refresh Token หรือไม่
            if payload.get("token_type") != "refresh":
                 raise AuthError("Invalid token type")
                 
            user_id = payload.get("sub")
            if user_id is None:
                raise AuthError("Invalid token subject")
                
        except Exception:
            raise AuthError("Invalid refresh token")

        # 3. เช็ค User ใน DB
        user = await self.repository.get(user_id)
        if not user or not user.is_active:
            raise AuthError("User not found or inactive")

        # 4. ออก Access Token ใบใหม่
        access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.jwt_handler.create_access_token(
            data={"sub": str(user.id), "token_type": "access"},
            expires_delta=access_token_expires
        )

        return schemas.GetAccessTokenResponse(
            access_token=new_access_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

# Dependency Injection
async def get_auth_use_case(
    repository: UserRepository = Depends(get_user_repository),
) -> AuthUseCase:
    return AuthUseCase(repository)
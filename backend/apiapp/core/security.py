from datetime import datetime, timedelta, timezone
import bcrypt

from jose import jwt
from jose.exceptions import JWTError

from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, status, Depends

from .config import settings
from ..modules.user import model
from .exceptions import ValidationError
from ..modules.user.repository import UserRepository, get_user_repository
from ..modules.auth.model import BlacklistedToken

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/v1/auth/token")
repository: UserRepository = Depends(get_user_repository)
ALGORITHM = "HS256"
# JWT_HEADER = {"alg": ALGORITHM[0]}
# JWE_HEADER = {"alg": ALGORITHM[1], "enc": "A256CBC-HS512"}


class JWTHandler:
    def __init__(self, secret_key: str, algorithm: str):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def create_refresh_token(
        self, data: dict, expires_delta: timedelta | None = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def decode_token(self, token: str, token_type: str | None = None) -> dict:
        try:
            decoded_payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )

            if token_type and decoded_payload.get("token_type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Token type incorrect: expected '{token_type}' but got '{decoded_payload.get('token_type')}'",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return decoded_payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token Expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token Invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Decode Error Token: {e}",
            )

    def refresh_token(self, refresh_token_str: str) -> str:
        try:
            payload = self.decode_token(refresh_token_str, token_type="refresh")
        except HTTPException as e:
            raise e

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No sub in Refresh Token",
            )

        new_access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        new_access_token = self.create_access_token(
            data={"sub": user_id, "token_type": "access"},
            expires_delta=new_access_token_expires,
        )
        return new_access_token


async def get_current_user(
    token: str = Depends(reusable_oauth2),
    repository: UserRepository = Depends(get_user_repository),
) -> model.User:
    
    is_blacklisted = await BlacklistedToken.find_one(BlacklistedToken.token == token)
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked (Logged out)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # 1. Decode Token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        # 2. ดึง User ID (sub) ออกมาจาก Payload
        user_id: str = payload.get("sub")
        
        if user_id is None:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
            
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    # 3. (สำคัญ) เอา ID ไปค้นหาใน Database ผ่าน Repository
    # สมมติว่า repository ของคุณมีเมธอด get_by_id หรือ get
    user = await repository.find_by_id(user_id)

    # 4. ถ้าหาไม่เจอ (User ถูกลบไปแล้ว หรือ Token มั่วมา)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )

    # 5. ส่ง User ตัวจริงกลับไป
    return user

async def get_current_admin(
    current_user: model.User = Depends(get_current_user) 
) -> model.User:
    
    # ✅ แก้ตรงนี้: เติม .value เพื่อดึงค่า string ออกมา ("admin")
    # หรือใช้ str(current_user.role) ก็ได้ถ้าเป็น StrEnum
    if current_user.role.value != "admin": 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource (Admin only)"
        )
        
    return current_user

jwt_handler = JWTHandler(settings.SECRET_KEY, ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(14)).decode()

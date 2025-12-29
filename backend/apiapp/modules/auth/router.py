from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordRequestForm,
)
import typing

# Import schemas
from . import schemas
from .schemas import GetAccessTokenResponse

from ...core import security, exceptions
from ...core.config import settings
from .use_case import AuthUseCase, get_auth_use_case


router = APIRouter(
    prefix="/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/token",
    summary="Get OAuth2 access token",
    response_model=schemas.GetAccessTokenResponse
)
async def login_for_access_token(
    form_data: typing.Annotated[OAuth2PasswordRequestForm, Depends()],
    use_case: AuthUseCase = Depends(get_auth_use_case)
) -> schemas.GetAccessTokenResponse:
    try:
        return await use_case.login_for_access_token(
            form_data=form_data
        )
    except (exceptions.BusinessLogicError, exceptions.ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    name="auth:login", # <--- แก้ไขจุดที่ 1: ย้าย name มาไว้ตรงนี้
    response_model=schemas.Token
)
async def authentication(
    form_data: typing.Annotated[OAuth2PasswordRequestForm, Depends()],
    use_case: AuthUseCase = Depends(get_auth_use_case),
    # ลบ name="..." ตรงนี้ออก
) -> schemas.Token:
    try:
        return await use_case.authentication(
            form_data=form_data
        )
    except (exceptions.BusinessLogicError, exceptions.ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/refresh_token", response_model=GetAccessTokenResponse)
async def refresh_token(
    credentials: typing.Annotated[HTTPAuthorizationCredentials, Security(HTTPBearer())],
    use_case: AuthUseCase = Depends(get_auth_use_case)
) -> GetAccessTokenResponse:
    
    refresh_token_str = credentials.credentials

    try:
        # แก้ไขจุดที่ 2: ส่ง string เข้าไปแทน object
        # หมายเหตุ: ต้องไปเช็คใน UseCase ว่ารับ parameter ชื่อ token หรือ credentials 
        # ถ้า UseCase เขียนว่า def refresh_token(self, token: str): ให้ใช้บรรทัดล่างนี้
        return await use_case.refresh_token(
            token=refresh_token_str 
        )
    except (exceptions.BusinessLogicError, exceptions.ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
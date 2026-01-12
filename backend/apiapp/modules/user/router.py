"""
User API router with REST endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_pagination import Page, Params

from apiapp.core.exceptions import BusinessLogicError, DuplicatedError, ValidationError

from .use_case import get_user_use_case, UserUseCase
from .schemas import CreateUser, GetUser, UpdateUser, UserResponse, ResetPasswordRequest
from ...core.security import get_current_user


router = APIRouter(
    prefix="/v1/users",
    tags=["User"],
)

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/", dependencies=[Depends(Params)], response_model=Page[UserResponse])
async def get_user_list(
    use_case: UserUseCase = Depends(get_user_use_case),
    params: GetUser = Depends(),
    current_user: dict = Depends(get_current_user),
):
    """
    Get a list of users.
    This endpoint retrieves paginated list of users with filtering and search.
    """
    try:
        # ใช้ search_users method เพื่อรองรับทั้ง search และ filtering
        return await use_case.search_users(
            query=params.search,
            role=params.role.value if params.role else None,
            is_active=params.is_active,
        )
    except (BusinessLogicError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
)
async def create_user(
    user_data: CreateUser, use_case: UserUseCase = Depends(get_user_use_case),current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """
    Register a new user.
    This endpoint handles user registration with business logic validation.
    """
    try:
        # ✅ ใช้ base create method ที่ return UserResponse
        return await use_case.create_user(user_data)
    except (DuplicatedError, BusinessLogicError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    use_case: UserUseCase = Depends(get_user_use_case),
    current_user: dict = Depends(get_current_user),
):
    """
    Get user by ID.
    This endpoint retrieves a user by their unique identifier.
    """
    user_response = await use_case.get_by_id(user_id)
    if not user_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user_response


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UpdateUser,
    use_case: UserUseCase = Depends(get_user_use_case),
    current_user: dict = Depends(get_current_user),
):
    """
    Update user by ID.
    This endpoint allows partial updates to user information.
    """
    try:
        # ใช้ method ที่มี business logic validation
        user_response = await use_case.update_user(user_id, data)
        if not user_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user_response
    except (DuplicatedError, BusinessLogicError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    use_case: UserUseCase = Depends(get_user_use_case),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete user by ID.
    Performs a hard delete on the user record.
    """
    success = await use_case.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return

@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    user_id: str,
    payload: ResetPasswordRequest,
    use_case: UserUseCase = Depends(get_user_use_case),
    current_user: dict = Depends(get_current_user),
):
    """
    Admin Reset Password for user.
    Takes a new password and updates the user's password hash.
    """
    success = await use_case.reset_password(user_id, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return {"message": "Password reset successfully"}
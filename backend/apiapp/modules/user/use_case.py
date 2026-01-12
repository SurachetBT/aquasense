"""
User use case containing business logic
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi_pagination import Page
from werkzeug.security import generate_password_hash
from fastapi import Depends

from .model import User
from .repository import UserRepository, get_user_repository
from .schemas import CreateUser, UpdateUser, UserResponse, UserRole
from ...core.base_use_case import BaseUseCase
from ...core.exceptions import ValidationError, DuplicatedError, BusinessLogicError


class UserUseCase(BaseUseCase[User, UserRepository, UserResponse]):
    """Use case for User business operations"""

    def __init__(self, repository: UserRepository):
        super().__init__(repository, UserResponse)

    async def create_user(self, user_data: CreateUser) -> User:
        """Register a new user with complete business logic"""

        # Business validation: Check username uniqueness
        existing_user = await self.repository.find_by_username(user_data.username)
        if existing_user:
            raise DuplicatedError("Username already exists")

        # Business validation: Check email uniqueness (if provided)
        if user_data.email:
            existing_email = await self.repository.find_by_email(user_data.email)
            if existing_email:
                raise DuplicatedError("Email already exists")

        # Business logic: Hash password
        hashed_password = generate_password_hash(user_data.password)

        # Business logic: Set default values and timestamps
        user_dict = user_data.model_dump(exclude={"password", "confirm_password"})
        role_to_save = getattr(user_data, 'role', UserRole.USER.value)
        user_dict.update(
            {
                "hashed_password": hashed_password,
                "is_active": True,
                "role": role_to_save,  
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        )
        try:
            user = User(**user_dict)
            new_user = await self.repository.create(user)
            return new_user
        except Exception as e:
            raise ValidationError(f"Registration failed: {str(e)}")

    async def search_users(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Page[UserResponse]:
        """Search users with business logic"""
        # เรียกใช้ repository method ที่จัดการ search logic
        documents_page = await self.repository.search_users(
            query=query, role=role, is_active=is_active
        )

        # แค่ convert เป็น response schema
        return self.convert_page_to_response_schema(documents_page, UserResponse)

    async def update_user(
        self, user_id: str, data: UpdateUser
    ) -> Optional[UserResponse]:
        """Update user and return UserResponse with business logic validation"""
        # ตรวจสอบว่า user มีอยู่จริงไหม
        existing_user = await self.repository.find_by_id(user_id)
        if not existing_user:
            return None

        # ตรวจสอบ username uniqueness หากมีการอัปเดต
        update_data = data.model_dump(exclude_none=True)
        if "username" in update_data:
            # ตรวจสอบว่า username ใหม่ซ้ำกับคนอื่นไหม (ยกเว้นตัวเอง)
            existing_with_username = await self.repository.find_one(
                {
                    "username": update_data["username"].lower().strip(),
                    "_id": {"$ne": existing_user.id},
                }
            )
            if existing_with_username:
                raise DuplicatedError("Username already exists")

        # อัปเดต password หากมี
        if "password" in update_data:
            password = update_data.pop("password")  # เอาออกจาก update_data
            # Hash password และเพิ่มเข้าไปใน update_data
            from werkzeug.security import generate_password_hash

            update_data["hashed_password"] = generate_password_hash(password)

        # อัปเดตข้อมูลอื่นๆ ผ่าน base method (จะ return UserResponse)
        return await self.update(user_id, update_data)
        
    
    #Delete User
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user by ID (Hard Delete)
        Returns True if deleted successfully, False if not found.
        """
        # ตรวจสอบว่า user มีอยู่จริงไหมก่อนลบ (Optional แต่แนะนำเพื่อความชัวร์)
        existing_user = await self.repository.find_by_id(user_id)
        if not existing_user:
            return False

        # เรียกใช้ delete method ของ BaseUseCase หรือ Repository
        # สมมติว่า BaseUseCase มี method delete(id) หรือ repository มี delete(id)
        # ถ้า BaseUseCase ไม่มี ให้เรียก self.repository.delete(user_id)
        try:
            await self.repository.delete(user_id)
            return True
        except Exception:
            # กรณีเกิด Error ตอนลบ (เช่น ID ผิด format หรือ Database error)
            return False
        
    # ฟังก์ชัน Reset Password    
    async def reset_password(self, user_id: str, new_password: str) -> bool:
        """
        Admin Reset Password for user
        """
        existing_user = await self.repository.find_by_id(user_id)
        if not existing_user:
            return False

        from werkzeug.security import generate_password_hash

        # เตรียมข้อมูลสำหรับอัปเดต
        update_data = {
            "hashed_password": generate_password_hash(new_password),
            "updated_at": datetime.now(timezone.utc),
        }

        # เรียก repository เพื่ออัปเดตข้อมูล
        await self.repository.update(existing_user.id, update_data)
        return True    


# Dependency providers
async def get_user_use_case(
    repository: UserRepository = Depends(get_user_repository),
) -> UserUseCase:
    """Get user use case with injected dependencies"""
    return UserUseCase(repository)
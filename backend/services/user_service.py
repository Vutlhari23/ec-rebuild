"""
This module defines methods for managing User resource

It uses:
    - get_db method from the database module
    - pydantic models
        - UserCreate - passed as parameter when creating User object
        - UserUpdate - passed as parameter when updating User object
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from typing import List, Optional
from models.user import User
from schemas.user import UserCreate, UserUpdate
from security_context.security_context import get_password_hash


async def create_user(db: Session, email:str, password:str, employee_id:int) -> User:
    """
    Create a new User in the database.

    Args:
        employee_id:(int)
        password: (str) password hash
        email: (email)
        db (Session): Database session.

    Returns:
        User: The newly created User object.
    """
    user = User(username=email, password=password, employee_id=employee_id)
    user.password = get_password_hash(user.password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user(db: Session, user_id: int) -> Optional[User]:
    """
    Retrieve a single User by ID.
    """

    result = await db.execute(select(User).where(User.id == user_id))

    user = result.scalars().first()
    return user


async def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """
    Retrieve all Users within a specified range.
    """
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


async def update_user(db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
    """
    Update an existing User by ID.

    Args:
        db (Session): Database session.
        user_id (int): User ID to update.
        user_in (UserUpdate): Data to update.

    Returns:
        User | None: Updated User or None if not found.
    """

    result = await db.execute(select(User).where(User.id == user_id))

    if not result:
        raise HTTPException(status_code=404, detail="User not found.")

    user = result.scalars().first()

    for field, value in user_in.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: Session, user_id: int) -> Optional[dict]:
    """
    Delete a User by ID.

    Returns True if deleted, False if not found.
    """

    result = await db.execute(select(User).where(User.id == user_id))

    user = result.scalars().first()

    await db.delete(user)
    await db.commit()
    return {"message": f"User {user_id} deleted successfully"}

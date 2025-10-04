"""
This module defines routes for accessing User resource

It uses:
    - get_db method from the database module
    - pydantic models
        - UserCreate - passed as parameter when creating User object
        - UserUpdate - passed as parameter when updating User object
        - UserResponse - passed as parameter when returning User object

    - User service methods
        -create_user to insert new User into the database
        -update_user to update existing User into the database
        - get_user to get existing User from the database
        - get_all_users to get all User from the database
        -delete_user to delete User from the database

"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
)
from services.user_service import (
    create_user,
    get_user,
    get_all_users,
    update_user,
    delete_user,
)

router = APIRouter(prefix="/api/v1/user", tags=["users"])


@router.post("/", status_code=201, response_model=UserResponse)
async def create_user_route(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new User.
    """
    return await create_user(db, user_in)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_route(user_id: int, db: Session = Depends(get_db)):
    """
    Get a single User by ID.
    """
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=List[UserResponse])
async def list_user_route(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """
    Get a list of all Users within a specific range(optional).
    """
    return await get_all_users(db, skip=skip, limit=limit)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_route(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing User.
    """
    user = await update_user(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
async def delete_user_route(user_id: int, db: Session = Depends(get_db)):
    """
    Delete an User by ID.
    """
    success = await delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return success

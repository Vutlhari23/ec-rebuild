"""
Pydantic BaseModel classes for User schemas.

These classes define the structure and validation rules for User data,
providing input (`UserCreate`) and output (`UserResponse`) representations.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from utils.utc_to_local import utc_to_local

class UserCreate(BaseModel):
    """
    Pydantic schema for User input.

    Attributes:
        username (str): The username of the user.
        password (str): The password of the user.
        employee_id (int): The ID of the employee.

    """

    username: str
    password: str
    employee_id: int


class UserUpdate(BaseModel):
    """
    Pydantic schema for User update.

    Attributes:
        username (str): The username of the user.
        password (str): The password of the user.
        employee_id (int): The ID of the employee.
    """

    username: Optional[str] = None
    password: Optional[str] = None
    employee_id: Optional[int] = None


class UserResponse(BaseModel):
    """
    Pydantic schema for User output.

    Extends:
        UserCreate

    Attributes:
        id (int): The User id.
        creation_date (datetime): The date and time when the User was created.
        update_date (datetime): The date and time when the User was last updated.

    Config:
        from_attributes (bool): Enables compatibility with ORM objects,
        allowing automatic conversion between SQLAlchemy models and Pydantic schemas.
    """

    id: int
    username: str
    employee_id: int
    creation_date: datetime
    update_date: Optional[datetime] = None


    model_config = ConfigDict(from_attributes=True)

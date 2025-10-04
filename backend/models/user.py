from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, String
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database import Base


class User(Base):
    """
    SQLAlchemy model for user.
    This class represents a table of a employee.

    Attributes:
        id (int): Auto generated primary key.
        username (str): Username.
        password (str): Password.
        creation_date (datetime): Date the user was created.
        update_date (datetime): Date the user was last updated.
        employee_id (int): Foreign key referencing the `Employee` table.

    """

    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    creation_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    update_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=True, onupdate=datetime.utcnow
    )
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"))

    employee: Mapped["Employee"] = relationship(back_populates="user")

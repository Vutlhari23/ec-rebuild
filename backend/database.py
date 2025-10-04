

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# from database import Database
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database connection configuration

DATABASE_URL = os.getenv("DATABASE_URL")


# engine = create_engine(DATABASE_URL.replace("+asyncpg", ""))
engine = create_async_engine(DATABASE_URL, echo=True)
# engine = create_engine("postgresql+asyncpg://postgres:1234@localhost:5432/$postgres")
"""
     sqlalchemy.orm.sessionmaker: Factory for creating database sessions.
    Configured for manual commit and flush to allow fine-grained transaction control.
"""
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

"""
     sqlalchemy.ext.declarative.api.DeclarativeMeta: Base class for all ORM models.
     Models should inherit from this to link with database metadata.
"""
Base = declarative_base()


async def init_db():
    # import models here to register them with Base
    from models import (

        user,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

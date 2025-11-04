from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# For SQLite development (easier to set up)
DATABASE_URL = "sqlite+aiosqlite:///./exam_system.db"

# For PostgreSQL with asyncpg (uncomment if you have PostgreSQL setup)
DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost/postgres"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
"""
This module serves as the entry point for running a FastAPI application.

It creates a FastAPI instance and starts the ASGI server using Uvicorn
when the script is executed directly. Uvicorn provides high performance
for serving asynchronous Python web applications.
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import uvicorn
from database import init_db

from routes.user_routes import router as user_router




@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()  # called once at startup
    yield
    # cleanup code goes here (if needed)


app = FastAPI(lifespan=lifespan)


# default root endpoint
@app.get("/")
async def root():
    return {"message": "Backend is running"}


app.include_router(auth_router)




# default root endpoint
@app.get("/")
async def root():
    return {"message": "Backend is running"}


if __name__ == "__main__":
    uvicorn.run(app)

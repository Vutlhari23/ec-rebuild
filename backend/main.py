from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import create_tables, engine
from routes import auth, tests

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    await create_tables()
    yield
    # Clean up on shutdown
    await engine.dispose()

app = FastAPI(
    title="Exam System API",
    description="A comprehensive exam system with async backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tests.router, prefix="/api", tags=["Tests"])

@app.get("/")
async def root():
    return {"message": "Exam System API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
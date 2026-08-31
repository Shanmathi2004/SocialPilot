from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router


app = FastAPI(
    title="SocialPilot API",
    description="SocialPilot Social Media Scheduler Backend",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

app.include_router(auth_router)


# ---------------------------------------------------------
# Basic endpoints
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Welcome to SocialPilot"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SocialPilot Backend"
    }


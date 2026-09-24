from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.social_accounts import router as social_accounts_router
from app.social.instagram import router as instagram_router
from app.routes.posts import router as posts_router
from app.routes.publishing_logs import router as publishing_logs_router
from app.routes.publishing import router as publishing_router
from app.routes.publishing_queue import router as publishing_queue_router
from app.routes.campaigns import router as campaigns_router

app = FastAPI(
    title="SocialPilot API",
    version="1.0.0",
)
app.include_router(instagram_router)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(social_accounts_router)
app.include_router(posts_router)
app.include_router(publishing_logs_router)
app.include_router(publishing_router)
app.include_router(publishing_queue_router)
app.include_router(campaigns_router)
# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Welcome to SocialPilot"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "SocialPilot Backend",
    }
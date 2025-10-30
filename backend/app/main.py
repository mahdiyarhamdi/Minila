"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .core.rate_limit import init_rate_limiter

settings = get_settings()

# ایجاد FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="MVP platform for passenger-freight coordination",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    """رویدادهای startup."""
    # مقداردهی اولیه rate limiter
    init_rate_limiter(settings.REDIS_URL)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """رویدادهای shutdown."""
    # بستن اتصالات (DB, Redis, ...)
    pass


@app.get("/health", tags=["Health"])
def health() -> dict[str, bool]:
    """Health check endpoint.
    
    Returns:
        وضعیت سلامت سرور
    """
    return {"ok": True}


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    """Root endpoint با اطلاعات API.
    
    Returns:
        پیام خوش‌آمدگویی و لینک docs
    """
    return {
        "message": "Backend is running.",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


# ==================== Router Registration ====================
# TODO: ثبت روترها در اینجا
# from .api.routers import auth, users, communities, cards, messages
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
# app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(communities.router, prefix="/api/v1/communities", tags=["Communities"])
# app.include_router(cards.router, prefix="/api/v1/cards", tags=["Cards"])
# app.include_router(messages.router, prefix="/api/v1/messages", tags=["Messages"])


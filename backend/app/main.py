"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .core.config import get_settings
from .core.rate_limit import init_rate_limiter
from .core.database import close_db, get_db_session
from .utils.logger import logger
from .utils.seed import run_startup_checks

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """مدیریت lifecycle اپلیکیشن.
    
    Startup و shutdown events را مدیریت می‌کند.
    """
    # Startup
    logger.info("Starting up Minila API...")
    init_rate_limiter(settings.REDIS_URL)
    logger.info("Rate limiter initialized")
    
    # Run startup health checks and ensure admin exists
    try:
        async with get_db_session() as db:
            await run_startup_checks(db)
    except Exception as e:
        logger.error(f"Startup checks failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Minila API...")
    await close_db()
    logger.info("Database connections closed")


# ایجاد FastAPI app با metadata کامل
app = FastAPI(
    title="Minila API",
    description="""
# API پلتفرم هماهنگی مسافر-ارسال کننده بار

این API امکانات زیر را فراهم می‌کند:

## ویژگی‌های اصلی
- **احراز هویت**: ثبت‌نام و ورود با OTP
- **مدیریت کاربران**: پروفایل کاربری
- **کامیونیتی**: ساخت و مدیریت کامیونیتی‌ها و عضویت‌ها
- **کارت‌های سفر/بار**: ایجاد و جست‌وجوی کارت‌ها
- **پیام‌رسانی**: ارتباط بین کاربران با قید کامیونیتی مشترک

## امنیت
- JWT Authentication
- Rate Limiting
- CORS محدود به domainهای مجاز

## نسخه
MVP v0.1.0
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "auth",
            "description": "احراز هویت و ثبت‌نام - ورود با OTP، دریافت JWT"
        },
        {
            "name": "users",
            "description": "مدیریت کاربران - پروفایل و ویرایش اطلاعات"
        },
        {
            "name": "communities",
            "description": "کامیونیتی‌ها - ساخت، عضویت، مدیریت درخواست‌ها"
        },
        {
            "name": "cards",
            "description": "کارت‌های سفر و بار - ایجاد، جست‌وجو، مدیریت"
        },
        {
            "name": "messages",
            "description": "پیام‌رسانی - ارسال و دریافت پیام با rate limit"
        },
        {
            "name": "locations",
            "description": "مکان‌ها - جستجوی کشورها و شهرها با پشتیبانی سه زبان"
        },
        {
            "name": "admin",
            "description": "پنل مدیریت - داشبورد آماری، مدیریت کاربران، کامیونیتی‌ها و لاگ‌ها (فقط ادمین)"
        },
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Exception Handlers ====================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handler برای خطاهای validation.
    
    Args:
        request: درخواست FastAPI
        exc: خطای validation
        
    Returns:
        پاسخ JSON با جزئیات خطا
    """
    logger.warning(f"Validation error: {exc.errors()}")
    # Convert errors to JSON-serializable format
    errors = []
    for error in exc.errors():
        err_dict = dict(error)
        # Ensure all values are JSON serializable
        if 'ctx' in err_dict and err_dict['ctx']:
            err_dict['ctx'] = {k: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v 
                              for k, v in err_dict['ctx'].items()}
        errors.append(err_dict)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handler برای خطاهای عمومی.
    
    Args:
        request: درخواست FastAPI
        exc: خطا
        
    Returns:
        پاسخ JSON با پیام خطا
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error"
        }
    )


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
        "message": "Minila API is running.",
        "version": "0.1.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


# ==================== Router Registration ====================

from .api.routers import auth, users, communities, cards, messages, locations, admin, reports

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(communities.router)
app.include_router(cards.router)
app.include_router(messages.router)
app.include_router(locations.router)
app.include_router(admin.router)
app.include_router(reports.router)

logger.info("All routers registered successfully")


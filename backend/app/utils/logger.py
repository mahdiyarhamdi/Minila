"""Logging configuration."""
import logging
import sys
from typing import Any

# تنظیم فرمت لاگ
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger(name: str = "minila", level: int = logging.INFO) -> logging.Logger:
    """تنظیم و دریافت logger.
    
    Args:
        name: نام logger
        level: سطح لاگ (INFO, DEBUG, WARNING, ERROR, CRITICAL)
        
    Returns:
        Logger تنظیم‌شده
    """
    logger = logging.getLogger(name)
    
    # جلوگیری از تکرار handler
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Handler برای stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    # Formatter
    formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger


# Logger پیش‌فرض
logger = setup_logger()


def log_event(
    event_type: str,
    message: str,
    level: str = "info",
    **extra: Any
) -> None:
    """ثبت رویداد با جزئیات اضافی.
    
    Args:
        event_type: نوع رویداد (signup, login, card_create, ...)
        message: پیام لاگ
        level: سطح لاگ (info, warning, error)
        **extra: اطلاعات اضافی
    """
    log_msg = f"[{event_type}] {message}"
    
    if extra:
        log_msg += f" | {extra}"
    
    if level == "info":
        logger.info(log_msg)
    elif level == "warning":
        logger.warning(log_msg)
    elif level == "error":
        logger.error(log_msg)
    else:
        logger.debug(log_msg)


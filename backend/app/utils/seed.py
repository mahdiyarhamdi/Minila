"""Database seeding and startup health check utilities."""
import os
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from ..models.user import User
from ..core.security import hash_password
from .logger import logger
from .email import send_email


# Default admin credentials from environment or hardcoded defaults
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "mahdiyarhamdi@gmail.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "Hamdi@0912")
DEFAULT_ADMIN_FIRST_NAME = os.getenv("DEFAULT_ADMIN_FIRST_NAME", "Admin")
DEFAULT_ADMIN_LAST_NAME = os.getenv("DEFAULT_ADMIN_LAST_NAME", "Minila")

# Startup health check file to track crashes
STARTUP_MARKER_FILE = Path("/tmp/minila_last_startup.txt")


async def seed_default_admin(db: AsyncSession) -> bool:
    """Seed the default admin user if it doesn't exist.
    
    This ensures there's always an admin user available for recovery purposes.
    
    Args:
        db: Database session
        
    Returns:
        True if admin was created, False if already exists
    """
    try:
        # Check if admin already exists
        result = await db.execute(
            select(User).where(User.email == DEFAULT_ADMIN_EMAIL)
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            # Make sure they're admin and update password
            needs_update = False
            
            if not existing_admin.is_admin:
                existing_admin.is_admin = True
                needs_update = True
                logger.info(f"Promoted existing user {DEFAULT_ADMIN_EMAIL} to admin")
            
            # Always update password to default
            new_hashed_password = hash_password(DEFAULT_ADMIN_PASSWORD)
            existing_admin.password = new_hashed_password
            existing_admin.is_active = True
            existing_admin.email_verified = True
            needs_update = True
            
            if needs_update:
                await db.commit()
                logger.info(f"Updated admin credentials for {DEFAULT_ADMIN_EMAIL}")
            
            return False
        
        # Create the default admin
        hashed_password = hash_password(DEFAULT_ADMIN_PASSWORD)
        
        admin_user = User(
            email=DEFAULT_ADMIN_EMAIL,
            password=hashed_password,
            first_name=DEFAULT_ADMIN_FIRST_NAME,
            last_name=DEFAULT_ADMIN_LAST_NAME,
            email_verified=True,
            is_active=True,
            is_admin=True,
            preferred_language="fa"
        )
        
        db.add(admin_user)
        await db.commit()
        
        logger.info(f"✅ Default admin user created: {DEFAULT_ADMIN_EMAIL}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to seed default admin: {e}")
        await db.rollback()
        return False


async def ensure_admin_exists(db: AsyncSession) -> None:
    """Ensure at least one admin user exists.
    
    If no admin users exist, creates the default admin.
    """
    try:
        # Check if any admin exists
        result = await db.execute(
            select(User).where(User.is_admin == True)
        )
        admins = result.scalars().all()
        
        if not admins:
            logger.warning("⚠️ No admin users found! Creating default admin...")
            await seed_default_admin(db)
        else:
            logger.info(f"Found {len(admins)} admin user(s)")
            
    except Exception as e:
        logger.error(f"Error checking for admin users: {e}")


async def check_startup_health(db: AsyncSession) -> dict:
    """Check system health on startup and alert if recovering from crash.
    
    This function:
    1. Checks database connectivity
    2. Checks if this is a recovery from crash
    3. Sends alerts to admins if issues detected
    
    Returns:
        dict with health status information
    """
    health_info = {
        "database_ok": False,
        "is_recovery": False,
        "last_shutdown": None,
        "tables_exist": False,
        "user_count": 0,
        "issues": []
    }
    
    try:
        # 1. Test database connectivity
        result = await db.execute(text("SELECT 1"))
        health_info["database_ok"] = result.scalar() == 1
    except Exception as e:
        health_info["issues"].append(f"Database connection error: {e}")
        logger.error(f"Database health check failed: {e}")
        return health_info
    
    try:
        # 2. Check if essential tables exist
        result = await db.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user'
        """))
        health_info["tables_exist"] = result.scalar() > 0
        
        if not health_info["tables_exist"]:
            health_info["issues"].append("User table does not exist - database may have been wiped")
    except Exception as e:
        health_info["issues"].append(f"Table check error: {e}")
    
    try:
        # 3. Get user count
        if health_info["tables_exist"]:
            result = await db.execute(select(User))
            users = result.scalars().all()
            health_info["user_count"] = len(users)
            
            if health_info["user_count"] == 0:
                health_info["issues"].append("No users in database - data may have been lost")
    except Exception as e:
        health_info["issues"].append(f"User count error: {e}")
    
    try:
        # 4. Check if this is a recovery from crash
        if STARTUP_MARKER_FILE.exists():
            last_startup_str = STARTUP_MARKER_FILE.read_text().strip()
            last_startup = datetime.fromisoformat(last_startup_str)
            health_info["last_shutdown"] = last_startup
            
            # If less than 1 minute since last startup, might be crash loop
            time_since_last = datetime.utcnow() - last_startup
            if time_since_last < timedelta(minutes=1):
                health_info["is_recovery"] = True
                health_info["issues"].append(f"Rapid restart detected (last startup: {time_since_last.seconds}s ago)")
    except Exception as e:
        logger.warning(f"Could not check startup marker: {e}")
    
    # Update startup marker
    try:
        STARTUP_MARKER_FILE.write_text(datetime.utcnow().isoformat())
    except Exception as e:
        logger.warning(f"Could not write startup marker: {e}")
    
    return health_info


async def send_startup_alerts(db: AsyncSession, health_info: dict) -> None:
    """Send alerts to admins if startup health check found issues.
    
    Args:
        db: Database session
        health_info: Results from check_startup_health
    """
    if not health_info["issues"]:
        logger.info("✅ Startup health check passed")
        return
    
    logger.warning(f"⚠️ Startup health issues detected: {health_info['issues']}")
    
    # Get admin emails
    try:
        result = await db.execute(
            select(User).where(User.is_admin == True, User.is_active == True)
        )
        admins = result.scalars().all()
        admin_emails = [admin.email for admin in admins]
    except Exception:
        # Fallback to default admin
        admin_emails = [DEFAULT_ADMIN_EMAIL]
    
    # Build alert email
    subject = "🚨 Minila Server Recovery Alert"
    
    body = f"""
🚨 Minila Server Recovery Alert
================================

The Minila backend server has restarted and detected potential issues:

Startup Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

Health Status:
- Database Connection: {'✅ OK' if health_info['database_ok'] else '❌ FAILED'}
- Tables Exist: {'✅ Yes' if health_info['tables_exist'] else '❌ No'}
- User Count: {health_info['user_count']}
- Recovery Mode: {'⚠️ Yes (rapid restart)' if health_info['is_recovery'] else 'No'}

Issues Detected:
"""
    
    for issue in health_info["issues"]:
        body += f"  ❗ {issue}\n"
    
    body += f"""

Recommended Actions:
1. Check server logs: docker logs minila_backend
2. Check database logs: docker logs minila_db
3. Verify backups: https://minila.app/admin/backups
4. Check server resources: free -h, docker stats

---
Panel: https://minila.app/admin
"""
    
    # Send to all admins
    for email in admin_emails:
        try:
            if send_email(email, subject, body):
                logger.info(f"Startup alert sent to {email}")
            else:
                logger.warning(f"Failed to send startup alert to {email}")
        except Exception as e:
            logger.error(f"Error sending startup alert to {email}: {e}")


async def run_startup_checks(db: AsyncSession) -> None:
    """Run all startup checks and send alerts if needed.
    
    This is the main function to call from main.py lifespan.
    """
    logger.info("🔍 Running startup health checks...")
    
    # Check health
    health_info = await check_startup_health(db)
    
    # Send alerts if issues found
    await send_startup_alerts(db, health_info)
    
    # Ensure admin exists
    await ensure_admin_exists(db)


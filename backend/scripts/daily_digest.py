#!/usr/bin/env python3
"""Daily digest email script.

ارسال خلاصه روزانه هشدارها به ادمین‌ها.
این اسکریپت باید روزانه ساعت 9 صبح اجرا شود.

Usage:
    python -m scripts.daily_digest

Cron (server time UTC+3:30):
    30 5 * * * cd /opt/minila/backend && /usr/bin/python3 -m scripts.daily_digest >> /var/log/minila_digest.log 2>&1
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db_session
from app.services import alert_service


async def main():
    """ارسال خلاصه روزانه."""
    print("=" * 50)
    print("Starting daily digest...")
    print("=" * 50)
    
    try:
        async with get_db_session() as db:
            success = await alert_service.send_daily_digest(db)
            
            if success:
                print("✅ Daily digest sent successfully")
            else:
                print("⚠️ No alerts to send or no admins found")
                
    except Exception as e:
        print(f"❌ Error sending daily digest: {e}")
        raise
    
    print("=" * 50)
    print("Daily digest completed")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())


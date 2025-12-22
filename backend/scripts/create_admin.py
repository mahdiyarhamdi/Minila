#!/usr/bin/env python3
"""اسکریپت ساخت کاربر ادمین.

استفاده:
    python scripts/create_admin.py <email>
    
مثال:
    python scripts/create_admin.py admin@minila.local
"""
import asyncio
import sys
from pathlib import Path

# اضافه کردن مسیر پروژه به PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User


async def make_admin(email: str) -> bool:
    """تبدیل کاربر به ادمین با ایمیل."""
    async with AsyncSessionLocal() as db:
        # پیدا کردن کاربر
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ کاربر با ایمیل {email} یافت نشد!")
            return False
        
        if user.is_admin:
            print(f"ℹ️  کاربر {email} از قبل ادمین است.")
            return True
        
        # تبدیل به ادمین
        user.is_admin = True
        await db.commit()
        
        print(f"✅ کاربر {email} با موفقیت ادمین شد!")
        print(f"   - ID: {user.id}")
        print(f"   - نام: {user.first_name} {user.last_name}")
        print(f"   - is_admin: True")
        return True


async def create_admin_user(email: str, password: str, first_name: str = "Admin", last_name: str = "User") -> bool:
    """ساخت کاربر ادمین جدید."""
    from app.core.security import hash_password
    from datetime import datetime
    
    async with AsyncSessionLocal() as db:
        # بررسی وجود کاربر
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"ℹ️  کاربر با ایمیل {email} از قبل وجود دارد.")
            if not existing.is_admin:
                existing.is_admin = True
                await db.commit()
                print(f"✅ کاربر به ادمین تبدیل شد!")
            return True
        
        # ساخت کاربر جدید
        hashed_password = hash_password(password)
        user = User(
            email=email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            is_admin=True,
            is_active=True,
            email_verified=True,
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        print(f"✅ کاربر ادمین با موفقیت ساخته شد!")
        print(f"   - ID: {user.id}")
        print(f"   - Email: {user.email}")
        print(f"   - Password: {password}")
        print(f"   - is_admin: True")
        return True


async def list_admins() -> None:
    """نمایش لیست ادمین‌ها."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.is_admin == True))
        admins = result.scalars().all()
        
        if not admins:
            print("ℹ️  هیچ ادمینی وجود ندارد.")
            return
        
        print(f"\n📋 لیست ادمین‌ها ({len(admins)} نفر):")
        print("-" * 50)
        for admin in admins:
            print(f"  - {admin.email} (ID: {admin.id})")
            print(f"    نام: {admin.first_name} {admin.last_name}")
            print(f"    فعال: {'✅' if admin.is_active else '❌'}")
            print()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nدستورات موجود:")
        print("  python scripts/create_admin.py make <email>           - تبدیل کاربر موجود به ادمین")
        print("  python scripts/create_admin.py create <email> <pass>  - ساخت کاربر ادمین جدید")
        print("  python scripts/create_admin.py list                   - نمایش لیست ادمین‌ها")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "make" and len(sys.argv) >= 3:
        email = sys.argv[2]
        asyncio.run(make_admin(email))
    
    elif command == "create" and len(sys.argv) >= 4:
        email = sys.argv[2]
        password = sys.argv[3]
        first_name = sys.argv[4] if len(sys.argv) > 4 else "Admin"
        last_name = sys.argv[5] if len(sys.argv) > 5 else "User"
        asyncio.run(create_admin_user(email, password, first_name, last_name))
    
    elif command == "list":
        asyncio.run(list_admins())
    
    else:
        # برای سازگاری با نسخه قبلی - اگر فقط ایمیل داده شد
        email = sys.argv[1]
        asyncio.run(make_admin(email))


if __name__ == "__main__":
    main()





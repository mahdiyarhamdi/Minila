"""
اسکریپت ساده برای اضافه کردن داده‌های تستی کشورها و شهرها.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.models.location import Country, City
from sqlalchemy import select


async def add_test_data():
    """اضافه کردن داده‌های تست."""
    async with AsyncSessionLocal() as session:
        # بررسی اینکه آیا داده وجود دارد
        result = await session.execute(select(Country))
        existing = result.scalars().first()
        
        if existing:
            print("✅ داده‌ها قبلاً اضافه شده‌اند.")
            return
        
        print("📝 در حال اضافه کردن کشورها...")
        
        # ایران
        iran = Country(
            name="Iran",
            name_en="Iran",
            name_fa="ایران",
            name_ar="إيران",
            iso_code="IR"
        )
        
        # امارات
        uae = Country(
            name="United Arab Emirates",
            name_en="United Arab Emirates",
            name_fa="امارات متحده عربی",
            name_ar="الإمارات العربية المتحدة",
            iso_code="AE"
        )
        
        # ترکیه
        turkey = Country(
            name="Turkey",
            name_en="Turkey",
            name_fa="ترکیه",
            name_ar="تركيا",
            iso_code="TR"
        )
        
        session.add_all([iran, uae, turkey])
        await session.flush()
        
        print("✅ کشورها اضافه شدند.")
        print("📝 در حال اضافه کردن شهرها...")
        
        # شهرهای ایران
        cities_iran = [
            City(name="Tehran", name_en="Tehran", name_fa="تهران", name_ar="طهران", 
                 airport_code="IKA", country_id=iran.id),
            City(name="Mashhad", name_en="Mashhad", name_fa="مشهد", name_ar="مشهد",
                 airport_code="MHD", country_id=iran.id),
            City(name="Isfahan", name_en="Isfahan", name_fa="اصفهان", name_ar="أصفهان",
                 airport_code="IFN", country_id=iran.id),
            City(name="Shiraz", name_en="Shiraz", name_fa="شیراز", name_ar="شیراز",
                 airport_code="SYZ", country_id=iran.id),
            City(name="Tabriz", name_en="Tabriz", name_fa="تبریز", name_ar="تبريز",
                 airport_code="TBZ", country_id=iran.id),
        ]
        
        # شهرهای امارات
        cities_uae = [
            City(name="Dubai", name_en="Dubai", name_fa="دبی", name_ar="دبي",
                 airport_code="DXB", country_id=uae.id),
            City(name="Abu Dhabi", name_en="Abu Dhabi", name_fa="ابوظبی", name_ar="أبو ظبي",
                 airport_code="AUH", country_id=uae.id),
            City(name="Sharjah", name_en="Sharjah", name_fa="شارجه", name_ar="الشارقة",
                 airport_code="SHJ", country_id=uae.id),
        ]
        
        # شهرهای ترکیه
        cities_turkey = [
            City(name="Istanbul", name_en="Istanbul", name_fa="استانبول", name_ar="إسطنبول",
                 airport_code="IST", country_id=turkey.id),
            City(name="Ankara", name_en="Ankara", name_fa="آنکارا", name_ar="أنقرة",
                 airport_code="ESB", country_id=turkey.id),
            City(name="Antalya", name_en="Antalya", name_fa="آنتالیا", name_ar="أنطاليا",
                 airport_code="AYT", country_id=turkey.id),
        ]
        
        all_cities = cities_iran + cities_uae + cities_turkey
        session.add_all(all_cities)
        
        await session.commit()
        
        print(f"✅ {len(all_cities)} شهر اضافه شدند.")
        print("\n🎉 داده‌های تست با موفقیت اضافه شدند!")
        print(f"   - {len([iran, uae, turkey])} کشور")
        print(f"   - {len(all_cities)} شهر با فرودگاه")


if __name__ == "__main__":
    asyncio.run(add_test_data())


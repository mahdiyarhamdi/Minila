"""
اسکریپت برای populate کردن دیتابیس با کشورها و شهرهای دارای فرودگاه.

این اسکریپت از داده‌های GeoNames استفاده می‌کند:
- countryInfo.txt: اطلاعات کشورها
- alternateNamesV2.txt: نام‌های جایگزین (فارسی و عربی)
- allCountries.txt: شهرها (فیلتر شده برای شهرهای دارای فرودگاه)

نحوه استفاده:
    python3 scripts/populate_locations.py
"""

import asyncio
import sys
from pathlib import Path
import csv
import urllib.request
import zipfile
import io
from typing import Optional

# اضافه کردن مسیر root به sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session_context
from app.models.location import Country, City
from app.utils.logger import logger


# URLs for GeoNames data
GEONAMES_COUNTRY_INFO = "http://download.geonames.org/export/dump/countryInfo.txt"
GEONAMES_AIRPORTS = "http://download.geonames.org/export/dump/allCountries.zip"
GEONAMES_ALTERNATE_NAMES = "http://download.geonames.org/export/dump/alternateNamesV2.zip"


def download_file(url: str) -> bytes:
    """دانلود فایل از URL."""
    logger.info(f"Downloading {url}...")
    with urllib.request.urlopen(url) as response:
        data = response.read()
    logger.info(f"Downloaded {len(data)} bytes")
    return data


def parse_country_info(data: bytes) -> dict[str, dict]:
    """پارس countryInfo.txt و استخراج اطلاعات کشورها."""
    countries = {}
    text = data.decode('utf-8')
    
    for line in text.split('\n'):
        # Skip comments and empty lines
        if line.startswith('#') or not line.strip():
            continue
            
        parts = line.split('\t')
        if len(parts) < 5:
            continue
            
        iso_code = parts[0]  # ISO-3166 alpha-2
        name_en = parts[4]   # Country name
        
        countries[iso_code] = {
            'iso_code': iso_code,
            'name_en': name_en,
            'name_fa': name_en,  # Default to English, will update later
            'name_ar': name_en,  # Default to English, will update later
            'geoname_id': parts[16] if len(parts) > 16 else None
        }
    
    logger.info(f"Parsed {len(countries)} countries")
    return countries


def parse_alternate_names(zip_data: bytes, countries: dict, cities: dict) -> tuple[dict, dict]:
    """پارس alternate names و اضافه کردن نام‌های فارسی و عربی."""
    logger.info("Parsing alternate names...")
    
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        with zf.open('alternateNamesV2.txt') as f:
            line_count = 0
            for line in f:
                line_count += 1
                if line_count % 100000 == 0:
                    logger.info(f"Processed {line_count} alternate names...")
                
                try:
                    parts = line.decode('utf-8').strip().split('\t')
                    if len(parts) < 4:
                        continue
                    
                    geoname_id = parts[1]
                    lang = parts[2]
                    name = parts[3]
                    
                    # Update country names
                    for country_data in countries.values():
                        if country_data.get('geoname_id') == geoname_id:
                            if lang == 'fa':
                                country_data['name_fa'] = name
                            elif lang == 'ar':
                                country_data['name_ar'] = name
                    
                    # Update city names
                    if geoname_id in cities:
                        if lang == 'fa':
                            cities[geoname_id]['name_fa'] = name
                        elif lang == 'ar':
                            cities[geoname_id]['name_ar'] = name
                            
                except Exception as e:
                    continue
    
    logger.info(f"Processed alternate names")
    return countries, cities


def parse_cities_with_airports(zip_data: bytes) -> dict[str, dict]:
    """پارس allCountries.txt و استخراج شهرهایی که فرودگاه دارند."""
    logger.info("Parsing cities with airports...")
    cities = {}
    
    # Feature codes for airports
    # AIRP: airport, AIRF: airfield, AIRH: heliport, AIRQ: abandoned airfield, AIRT: airport terminal
    airport_codes = {'AIRP', 'AIRF'}
    
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        with zf.open('allCountries.txt') as f:
            line_count = 0
            for line in f:
                line_count += 1
                if line_count % 100000 == 0:
                    logger.info(f"Processed {line_count} lines...")
                
                try:
                    parts = line.decode('utf-8').strip().split('\t')
                    if len(parts) < 18:
                        continue
                    
                    feature_code = parts[7]
                    
                    # فقط فرودگاه‌ها
                    if feature_code not in airport_codes:
                        continue
                    
                    geoname_id = parts[0]
                    name_en = parts[1]
                    country_code = parts[8]
                    
                    # استخراج IATA code از alternatenames
                    alternate_names = parts[3].split(',') if len(parts[3]) > 0 else []
                    iata_code = None
                    for alt in alternate_names:
                        if len(alt) == 3 and alt.isupper() and alt.isalpha():
                            iata_code = alt
                            break
                    
                    # Skip if no IATA code
                    if not iata_code:
                        continue
                    
                    cities[geoname_id] = {
                        'geoname_id': geoname_id,
                        'name_en': name_en,
                        'name_fa': name_en,  # Default, will update later
                        'name_ar': name_en,  # Default, will update later
                        'airport_code': iata_code,
                        'country_code': country_code
                    }
                    
                except Exception as e:
                    continue
    
    logger.info(f"Found {len(cities)} cities with airports")
    return cities


async def populate_database(countries: dict, cities: dict):
    """ذخیره داده‌ها در دیتابیس."""
    logger.info("Starting database population...")
    
    async with get_async_session_context() as session:
        # Check if already populated
        result = await session.execute(select(Country))
        existing = result.scalars().first()
        if existing:
            logger.warning("Database already contains countries. Skipping population.")
            return
        
        # Insert countries
        logger.info("Inserting countries...")
        country_objects = []
        country_map = {}  # iso_code -> Country object
        
        for iso_code, data in countries.items():
            country = Country(
                name=data['name_en'],
                name_en=data['name_en'],
                name_fa=data['name_fa'],
                name_ar=data['name_ar'],
                iso_code=iso_code
            )
            country_objects.append(country)
            session.add(country)
        
        await session.flush()
        
        # Build map of iso_code to id
        for country in country_objects:
            country_map[country.iso_code] = country
        
        logger.info(f"Inserted {len(country_objects)} countries")
        
        # Insert cities
        logger.info("Inserting cities...")
        city_objects = []
        
        for geoname_id, data in cities.items():
            country_code = data['country_code']
            if country_code not in country_map:
                continue
            
            country = country_map[country_code]
            
            city = City(
                name=data['name_en'],
                name_en=data['name_en'],
                name_fa=data['name_fa'],
                name_ar=data['name_ar'],
                airport_code=data['airport_code'],
                country_id=country.id
            )
            city_objects.append(city)
            session.add(city)
            
            # Commit in batches
            if len(city_objects) % 100 == 0:
                await session.flush()
                logger.info(f"Inserted {len(city_objects)} cities so far...")
        
        await session.commit()
        logger.info(f"Inserted {len(city_objects)} cities")
        logger.info("Database population completed successfully!")


async def main():
    """تابع اصلی."""
    try:
        # 1. Download country info
        logger.info("Step 1: Downloading country information...")
        country_data = download_file(GEONAMES_COUNTRY_INFO)
        countries = parse_country_info(country_data)
        
        # 2. Download and parse cities with airports
        logger.info("Step 2: Downloading cities data...")
        cities_zip = download_file(GEONAMES_AIRPORTS)
        cities = parse_cities_with_airports(cities_zip)
        
        # 3. Download and parse alternate names (for Persian and Arabic)
        logger.info("Step 3: Downloading alternate names...")
        alt_names_zip = download_file(GEONAMES_ALTERNATE_NAMES)
        countries, cities = parse_alternate_names(alt_names_zip, countries, cities)
        
        # 4. Populate database
        logger.info("Step 4: Populating database...")
        await populate_database(countries, cities)
        
        logger.info("All done!")
        
    except Exception as e:
        logger.error(f"Error during population: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())


"""
Seed route prices for dynamic pricing algorithm.

This script populates the route_price table with base ticket prices
for common flight routes.

Usage:
    python scripts/seed_route_prices.py

Data is based on average flight prices from major booking sites.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings

# Create settings instance
settings = Settings()
from app.models.route_price import RoutePrice
from app.models.location import City

# Constants for price calculation
TICKET_PRICE_PERCENTAGE = 0.08  # 8% of ticket price
DEFAULT_LUGGAGE_KG = 23  # Standard luggage allowance


# Route data: (origin_city_name, destination_city_name, avg_ticket_price_usd)
ROUTE_DATA = [
    # Iran -> Middle East
    ("Tehran", "Dubai", 300),
    ("Tehran", "Abu Dhabi", 320),
    ("Tehran", "Doha", 350),
    ("Tehran", "Kuwait City", 280),
    ("Tehran", "Muscat", 340),
    ("Tehran", "Istanbul", 250),
    ("Tehran", "Ankara", 280),
    ("Tehran", "Beirut", 320),
    ("Tehran", "Baghdad", 200),
    ("Tehran", "Damascus", 250),
    ("Mashhad", "Dubai", 320),
    ("Shiraz", "Dubai", 290),
    ("Isfahan", "Dubai", 310),
    
    # Iran -> Europe
    ("Tehran", "London", 600),
    ("Tehran", "Paris", 550),
    ("Tehran", "Frankfurt", 450),
    ("Tehran", "Amsterdam", 500),
    ("Tehran", "Vienna", 420),
    ("Tehran", "Milan", 480),
    ("Tehran", "Rome", 500),
    ("Tehran", "Madrid", 580),
    ("Tehran", "Barcelona", 560),
    ("Tehran", "Munich", 460),
    ("Tehran", "Berlin", 470),
    ("Tehran", "Zurich", 520),
    ("Tehran", "Brussels", 510),
    ("Tehran", "Stockholm", 580),
    ("Tehran", "Oslo", 600),
    ("Tehran", "Copenhagen", 560),
    
    # Iran -> Asia
    ("Tehran", "Bangkok", 450),
    ("Tehran", "Kuala Lumpur", 500),
    ("Tehran", "Singapore", 550),
    ("Tehran", "Hong Kong", 600),
    ("Tehran", "Tokyo", 750),
    ("Tehran", "Seoul", 700),
    ("Tehran", "Beijing", 550),
    ("Tehran", "Shanghai", 580),
    ("Tehran", "Delhi", 350),
    ("Tehran", "Mumbai", 380),
    
    # Iran -> North America
    ("Tehran", "Toronto", 900),
    ("Tehran", "Vancouver", 950),
    ("Tehran", "Los Angeles", 1000),
    ("Tehran", "New York", 950),
    
    # Iran -> Australia
    ("Tehran", "Sydney", 1100),
    ("Tehran", "Melbourne", 1150),
    
    # Dubai Hub Routes
    ("Dubai", "London", 500),
    ("Dubai", "Paris", 480),
    ("Dubai", "Frankfurt", 400),
    ("Dubai", "New York", 800),
    ("Dubai", "Toronto", 850),
    ("Dubai", "Sydney", 900),
    ("Dubai", "Bangkok", 350),
    ("Dubai", "Singapore", 400),
    ("Dubai", "Mumbai", 200),
    ("Dubai", "Delhi", 220),
    
    # Istanbul Hub Routes
    ("Istanbul", "London", 250),
    ("Istanbul", "Paris", 230),
    ("Istanbul", "Frankfurt", 200),
    ("Istanbul", "Amsterdam", 220),
    ("Istanbul", "Berlin", 180),
    ("Istanbul", "New York", 650),
    ("Istanbul", "Dubai", 300),
    
    # Europe Internal
    ("London", "Paris", 120),
    ("London", "Amsterdam", 100),
    ("London", "Frankfurt", 130),
    ("Paris", "Rome", 100),
    ("Paris", "Barcelona", 90),
    ("Frankfurt", "Vienna", 80),
    ("Amsterdam", "Berlin", 90),
    
    # Asia Internal
    ("Bangkok", "Singapore", 150),
    ("Bangkok", "Kuala Lumpur", 100),
    ("Hong Kong", "Singapore", 250),
    ("Tokyo", "Seoul", 200),
    ("Delhi", "Mumbai", 80),
    ("Delhi", "Dubai", 250),
]


async def get_city_id_by_name(session: AsyncSession, city_name: str) -> int | None:
    """Get city ID by name (English)."""
    result = await session.execute(
        select(City.id).where(City.name_en == city_name)
    )
    city_id = result.scalar_one_or_none()
    return city_id


async def seed_route_prices():
    """Seed route prices into database."""
    # Create async engine
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql+psycopg://"):
        database_url = database_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Starting route price seeding...")
        print(f"Total routes to process: {len(ROUTE_DATA)}")
        
        added_count = 0
        skipped_count = 0
        not_found_count = 0
        
        for origin_name, dest_name, ticket_price in ROUTE_DATA:
            # Get city IDs
            origin_id = await get_city_id_by_name(session, origin_name)
            dest_id = await get_city_id_by_name(session, dest_name)
            
            if not origin_id:
                print(f"  ⚠️ City not found: {origin_name}")
                not_found_count += 1
                continue
            
            if not dest_id:
                print(f"  ⚠️ City not found: {dest_name}")
                not_found_count += 1
                continue
            
            # Check if route already exists
            existing = await session.execute(
                select(RoutePrice).where(
                    RoutePrice.origin_city_id == origin_id,
                    RoutePrice.destination_city_id == dest_id
                )
            )
            
            if existing.scalar_one_or_none():
                skipped_count += 1
                continue
            
            # Calculate suggested price per kg
            price_per_kg = (ticket_price * TICKET_PRICE_PERCENTAGE) / DEFAULT_LUGGAGE_KG
            
            # Create route price
            route = RoutePrice(
                origin_city_id=origin_id,
                destination_city_id=dest_id,
                base_ticket_price_usd=ticket_price,
                price_per_kg_suggested=round(price_per_kg, 2),
                last_updated=datetime.utcnow(),
                source="manual"
            )
            session.add(route)
            added_count += 1
            print(f"  ✓ Added: {origin_name} → {dest_name} (${ticket_price} ticket, ${price_per_kg:.2f}/kg)")
        
        await session.commit()
        
        print("\n" + "="*50)
        print("Seeding complete!")
        print(f"  Added: {added_count}")
        print(f"  Skipped (existing): {skipped_count}")
        print(f"  Cities not found: {not_found_count}")
        print("="*50)


if __name__ == "__main__":
    asyncio.run(seed_route_prices())


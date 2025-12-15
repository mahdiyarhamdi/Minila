"""RoutePrice repository for data access."""
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.route_price import RoutePrice
from app.models.card import Card
from app.schemas.price import BasePriceResult


# Constants for price estimation
DEFAULT_PRICE_PER_KG = 1.5  # USD fallback
TICKET_PRICE_PERCENTAGE = 0.08  # 8% of ticket price
DEFAULT_LUGGAGE_KG = 23  # Standard luggage allowance


async def get_route_price(
    db: AsyncSession,
    origin_city_id: int,
    destination_city_id: int
) -> Optional[RoutePrice]:
    """Get route price from database."""
    result = await db.execute(
        select(RoutePrice).where(
            RoutePrice.origin_city_id == origin_city_id,
            RoutePrice.destination_city_id == destination_city_id
        )
    )
    return result.scalar_one_or_none()


async def get_base_price(
    db: AsyncSession,
    origin_city_id: int,
    destination_city_id: int
) -> BasePriceResult:
    """
    Get base price with fallback logic:
    1. Direct route from database
    2. Reverse route from database
    3. Average of same-origin routes
    4. Default estimate
    """
    # Try direct route
    route = await get_route_price(db, origin_city_id, destination_city_id)
    if route:
        return BasePriceResult(
            price=route.price_per_kg_suggested,
            ticket_price=route.base_ticket_price_usd,
            source="database"
        )
    
    # Try reverse route
    reverse_route = await get_route_price(db, destination_city_id, origin_city_id)
    if reverse_route:
        return BasePriceResult(
            price=reverse_route.price_per_kg_suggested,
            ticket_price=reverse_route.base_ticket_price_usd,
            source="reverse"
        )
    
    # Try average of routes from same origin
    avg_result = await db.execute(
        select(func.avg(RoutePrice.price_per_kg_suggested)).where(
            RoutePrice.origin_city_id == origin_city_id
        )
    )
    avg_price = avg_result.scalar()
    
    if avg_price:
        return BasePriceResult(
            price=float(avg_price),
            ticket_price=None,
            source="estimate"
        )
    
    # Default fallback
    return BasePriceResult(
        price=DEFAULT_PRICE_PER_KG,
        ticket_price=None,
        source="estimate"
    )


async def get_route_statistics(
    db: AsyncSession,
    origin_city_id: int,
    destination_city_id: int,
    days: int = 30
) -> dict:
    """
    Get route statistics for the last N days.
    Returns count of cards on this route.
    """
    date_start = datetime.utcnow() - timedelta(days=days)
    
    # Count cards on this route
    result = await db.execute(
        select(func.count(Card.id)).where(
            Card.origin_city_id == origin_city_id,
            Card.destination_city_id == destination_city_id,
            Card.created_at >= date_start
        )
    )
    monthly_cards = result.scalar() or 0
    
    return {
        "monthly_cards": monthly_cards,
        "origin_city_id": origin_city_id,
        "destination_city_id": destination_city_id,
    }


async def get_supply_demand_counts(
    db: AsyncSession,
    origin_city_id: int,
    destination_city_id: int,
    travel_date: Optional[datetime] = None
) -> tuple[int, int]:
    """
    Count active travelers (supply) and senders (demand) on a route.
    Returns (travelers_count, senders_count).
    """
    if travel_date is None:
        travel_date = datetime.utcnow()
    
    date_start = travel_date - timedelta(days=7)
    date_end = travel_date + timedelta(days=7)
    
    # Count travelers (is_sender=False) with ticket in date range
    travelers_result = await db.execute(
        select(func.count(Card.id)).where(
            Card.is_sender == False,
            Card.origin_city_id == origin_city_id,
            Card.destination_city_id == destination_city_id,
            Card.ticket_date_time.isnot(None),
            Card.ticket_date_time >= date_start,
            Card.ticket_date_time <= date_end
        )
    )
    travelers = travelers_result.scalar() or 0
    
    # Count senders (is_sender=True) with time frame overlapping date range
    senders_result = await db.execute(
        select(func.count(Card.id)).where(
            Card.is_sender == True,
            Card.origin_city_id == origin_city_id,
            Card.destination_city_id == destination_city_id,
            or_(
                # Start time frame in range
                Card.start_time_frame.between(date_start, date_end),
                # End time frame in range
                Card.end_time_frame.between(date_start, date_end),
                # Range encompasses our date range
                (Card.start_time_frame <= date_start) & (Card.end_time_frame >= date_end)
            )
        )
    )
    senders = senders_result.scalar() or 0
    
    return travelers, senders


async def create_route_price(
    db: AsyncSession,
    origin_city_id: int,
    destination_city_id: int,
    base_ticket_price_usd: float,
    source: str = "manual"
) -> RoutePrice:
    """Create a new route price entry."""
    # Calculate suggested price per kg
    price_per_kg = (base_ticket_price_usd * TICKET_PRICE_PERCENTAGE) / DEFAULT_LUGGAGE_KG
    
    route = RoutePrice(
        origin_city_id=origin_city_id,
        destination_city_id=destination_city_id,
        base_ticket_price_usd=base_ticket_price_usd,
        price_per_kg_suggested=round(price_per_kg, 2),
        source=source,
        last_updated=datetime.utcnow()
    )
    
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return route


async def update_route_price(
    db: AsyncSession,
    route_id: int,
    base_ticket_price_usd: float,
    source: str = "manual"
) -> Optional[RoutePrice]:
    """Update an existing route price."""
    result = await db.execute(
        select(RoutePrice).where(RoutePrice.id == route_id)
    )
    route = result.scalar_one_or_none()
    
    if not route:
        return None
    
    route.base_ticket_price_usd = base_ticket_price_usd
    route.price_per_kg_suggested = round(
        (base_ticket_price_usd * TICKET_PRICE_PERCENTAGE) / DEFAULT_LUGGAGE_KG, 2
    )
    route.source = source
    route.last_updated = datetime.utcnow()
    
    await db.commit()
    await db.refresh(route)
    return route

"""CardView repository for tracking card impressions and clicks."""
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.card_view import CardView


async def record_view(
    db: AsyncSession,
    card_id: int,
    view_type: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> CardView:
    """Record a card view (impression or click).
    
    Args:
        db: Database session
        card_id: ID of the card being viewed
        view_type: 'impression' or 'click'
        user_id: Optional user ID (if authenticated)
        ip_address: Optional client IP address
        user_agent: Optional user agent string
        
    Returns:
        Created CardView record
    """
    card_view = CardView(
        card_id=card_id,
        view_type=view_type,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(card_view)
    await db.flush()
    await db.refresh(card_view)
    
    return card_view


async def get_stats(
    db: AsyncSession,
    card_id: int
) -> dict[str, int]:
    """Get view statistics for a card.
    
    Args:
        db: Database session
        card_id: ID of the card
        
    Returns:
        Dictionary with view_count and click_count
    """
    # Count impressions
    impression_query = select(func.count(CardView.id)).where(
        and_(
            CardView.card_id == card_id,
            CardView.view_type == 'impression'
        )
    )
    impression_result = await db.execute(impression_query)
    view_count = impression_result.scalar() or 0
    
    # Count clicks
    click_query = select(func.count(CardView.id)).where(
        and_(
            CardView.card_id == card_id,
            CardView.view_type == 'click'
        )
    )
    click_result = await db.execute(click_query)
    click_count = click_result.scalar() or 0
    
    return {
        "view_count": view_count,
        "click_count": click_count
    }


async def get_stats_batch(
    db: AsyncSession,
    card_ids: list[int]
) -> dict[int, dict[str, int]]:
    """Get view statistics for multiple cards efficiently.
    
    Args:
        db: Database session
        card_ids: List of card IDs
        
    Returns:
        Dictionary mapping card_id to {view_count, click_count}
    """
    if not card_ids:
        return {}
    
    # Query for all views in one go
    query = select(
        CardView.card_id,
        CardView.view_type,
        func.count(CardView.id).label('count')
    ).where(
        CardView.card_id.in_(card_ids)
    ).group_by(
        CardView.card_id,
        CardView.view_type
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Initialize result dict with zeros
    stats = {card_id: {"view_count": 0, "click_count": 0} for card_id in card_ids}
    
    # Populate with actual counts
    for row in rows:
        card_id = row.card_id
        view_type = row.view_type
        count = row.count
        
        if view_type == 'impression':
            stats[card_id]["view_count"] = count
        elif view_type == 'click':
            stats[card_id]["click_count"] = count
    
    return stats


async def check_recent_view(
    db: AsyncSession,
    card_id: int,
    view_type: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    minutes: int = 30
) -> bool:
    """Check if a recent view exists (to prevent duplicate counting).
    
    Args:
        db: Database session
        card_id: ID of the card
        view_type: 'impression' or 'click'
        user_id: Optional user ID
        ip_address: Optional IP address
        minutes: Time window in minutes
        
    Returns:
        True if recent view exists
    """
    from datetime import datetime, timedelta
    
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    
    conditions = [
        CardView.card_id == card_id,
        CardView.view_type == view_type,
        CardView.created_at >= cutoff
    ]
    
    # Check by user_id or ip_address
    if user_id:
        conditions.append(CardView.user_id == user_id)
    elif ip_address:
        conditions.append(CardView.ip_address == ip_address)
    else:
        # No identifier available
        return False
    
    query = select(func.count(CardView.id)).where(and_(*conditions))
    result = await db.execute(query)
    count = result.scalar() or 0
    
    return count > 0


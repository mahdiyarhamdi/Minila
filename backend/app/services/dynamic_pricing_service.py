"""
Dynamic Pricing Service - Snapp/Uber-like surge pricing algorithm.

This service calculates suggested prices based on multiple factors:
1. Base Price (from route data)
2. Route Factor (popularity/competition)
3. Season Factor (peak/off-peak)
4. Demand Factor (supply/demand ratio - surge pricing)
5. Urgency Factor (time until travel)
6. Weight Factor (bulk discounts)
7. Category Factor (product type)

Formula: final_price = base_price × route × season × demand × urgency × weight × category
"""
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import route_price_repo
from app.schemas.price import PriceSuggestionOut, PriceFactorBreakdown, BasePriceResult


class DynamicPricingService:
    """Dynamic pricing algorithm similar to Snapp/Uber surge pricing."""
    
    # Global price multiplier (to adjust overall price level)
    PRICE_MULTIPLIER = 2.5
    
    # Price bounds (USD per kg)
    MIN_PRICE_PER_KG = 1.0
    MAX_PRICE_PER_KG = 50.0
    
    # Confidence thresholds
    CONFIDENCE_THRESHOLD_HIGH = 0.8
    CONFIDENCE_THRESHOLD_MEDIUM = 0.5
    
    # Category factors
    CATEGORY_FACTORS = {
        "documents": 0.8,
        "clothes": 0.9,
        "books": 0.85,
        "cosmetics": 1.0,
        "electronics": 1.2,
        "jewelry": 1.25,
        "food": 1.3,
        "medicine": 1.25,
        "toys": 0.95,
        "general": 1.0,
    }
    
    async def calculate_price(
        self,
        db: AsyncSession,
        origin_city_id: int,
        destination_city_id: int,
        travel_date: Optional[datetime] = None,
        weight: Optional[float] = None,
        category_id: Optional[int] = None
    ) -> PriceSuggestionOut:
        """
        Calculate suggested price with all factors.
        
        Args:
            db: Database session
            origin_city_id: Origin city ID
            destination_city_id: Destination city ID
            travel_date: Optional travel date for seasonal/urgency factors
            weight: Optional weight for bulk discounts
            category_id: Optional product category ID
            
        Returns:
            PriceSuggestionOut with full breakdown
        """
        # Get base price
        base_price = await route_price_repo.get_base_price(
            db, origin_city_id, destination_city_id
        )
        
        # Calculate all factors
        factors = {
            "route": await self._get_route_factor(db, origin_city_id, destination_city_id),
            "season": self._get_season_factor(travel_date) if travel_date else 1.0,
            "demand": await self._get_demand_factor(db, origin_city_id, destination_city_id, travel_date),
            "urgency": self._get_urgency_factor(travel_date) if travel_date else 1.0,
            "weight": self._get_weight_factor(weight) if weight else 1.0,
            "category": await self._get_category_factor(db, category_id) if category_id else 1.0,
        }
        
        # Calculate final price
        multiplier = 1.0
        for factor_value in factors.values():
            multiplier *= factor_value
        
        final_price = base_price.price * multiplier
        
        # Apply global price multiplier (2.5x)
        final_price *= self.PRICE_MULTIPLIER
        
        # Apply bounds
        final_price = max(self.MIN_PRICE_PER_KG, min(self.MAX_PRICE_PER_KG, final_price))
        
        # Calculate confidence
        confidence = self._calculate_confidence(base_price, factors)
        
        # Calculate range (±15%)
        min_price = final_price * 0.85
        max_price = final_price * 1.15
        
        # Generate message
        message = self._generate_message(factors, base_price.source)
        
        return PriceSuggestionOut(
            suggested_price_per_kg=round(final_price, 2),
            currency="USD",
            min_price=round(min_price, 2),
            max_price=round(max_price, 2),
            confidence=confidence,
            base_ticket_price=base_price.ticket_price,
            source=base_price.source,
            factors=factors,
            breakdown=self._generate_breakdown(base_price.price, factors),
            message=message
        )
    
    async def _get_route_factor(
        self,
        db: AsyncSession,
        origin_city_id: int,
        destination_city_id: int
    ) -> float:
        """
        Adjust based on route popularity and competition.
        
        - Popular routes (>100 cards/month): 0.85 (high competition)
        - Normal routes (50-100 cards/month): 1.0
        - Less common (10-50 cards/month): 1.15
        - Rare routes (<10 cards/month): 1.3
        """
        stats = await route_price_repo.get_route_statistics(
            db, origin_city_id, destination_city_id
        )
        monthly_cards = stats["monthly_cards"]
        
        if monthly_cards > 100:
            return 0.85  # High competition
        elif monthly_cards > 50:
            return 1.0   # Normal
        elif monthly_cards > 10:
            return 1.15  # Less common
        else:
            return 1.3   # Rare route
    
    def _get_season_factor(self, travel_date: datetime) -> float:
        """
        Seasonal pricing based on travel patterns.
        
        Peak seasons:
        - Nowruz (March 15 - April 10): 1.4
        - Summer vacation (June - September): 1.25
        - Christmas/New Year (Dec 15 - Jan 10): 1.3
        
        Off-peak:
        - Winter (Nov-Feb except holidays): 0.9
        - Regular: 1.0
        """
        month = travel_date.month
        day = travel_date.day
        
        # Nowruz (Persian New Year)
        if (month == 3 and day >= 15) or (month == 4 and day <= 10):
            return 1.4
        
        # Summer vacation
        if 6 <= month <= 9:
            return 1.25
        
        # Christmas/New Year
        if (month == 12 and day >= 15) or (month == 1 and day <= 10):
            return 1.3
        
        # Winter off-peak (excluding holiday periods)
        if month in [11, 2] or (month == 12 and day < 15) or (month == 1 and day > 10):
            return 0.9
        
        return 1.0
    
    async def _get_demand_factor(
        self,
        db: AsyncSession,
        origin_city_id: int,
        destination_city_id: int,
        travel_date: Optional[datetime] = None
    ) -> float:
        """
        Supply/Demand ratio similar to Snapp surge pricing.
        
        Supply: Active traveler cards on this route
        Demand: Active sender cards on this route
        
        Ratio = Demand / Supply
        
        - Ratio < 0.5: 0.8 (oversupply)
        - Ratio 0.5-1.0: 0.9-1.0
        - Ratio 1.0-2.0: 1.0-1.3
        - Ratio 2.0-3.0: 1.3-1.6
        - Ratio > 3.0: 1.6-2.0 (high demand)
        """
        travelers, senders = await route_price_repo.get_supply_demand_counts(
            db, origin_city_id, destination_city_id, travel_date
        )
        
        # No supply case
        if travelers == 0:
            return 1.5  # Moderate surge (no data)
        
        ratio = senders / travelers
        
        if ratio < 0.5:
            return 0.8
        elif ratio < 1.0:
            # Linear interpolation: 0.5->0.9, 1.0->1.0
            return 0.9 + (ratio - 0.5) * 0.2
        elif ratio < 2.0:
            # Linear interpolation: 1.0->1.0, 2.0->1.3
            return 1.0 + (ratio - 1.0) * 0.3
        elif ratio < 3.0:
            # Linear interpolation: 2.0->1.3, 3.0->1.6
            return 1.3 + (ratio - 2.0) * 0.3
        else:
            # Cap at 2.0
            return min(2.0, 1.6 + (ratio - 3.0) * 0.1)
    
    def _get_urgency_factor(self, travel_date: datetime) -> float:
        """
        How soon is the travel date?
        
        - > 30 days: 1.0 (no rush)
        - 14-30 days: 1.05
        - 7-14 days: 1.1
        - 3-7 days: 1.2
        - 1-3 days: 1.35
        - < 24 hours: 1.5 (urgent)
        """
        now = datetime.utcnow()
        if travel_date.tzinfo:
            now = datetime.now(travel_date.tzinfo)
        
        days_until = (travel_date - now).days
        
        if days_until < 0:
            return 1.5  # Past date (urgent)
        elif days_until > 30:
            return 1.0
        elif days_until > 14:
            return 1.05
        elif days_until > 7:
            return 1.1
        elif days_until > 3:
            return 1.2
        elif days_until > 1:
            return 1.35
        else:
            return 1.5
    
    def _get_weight_factor(self, weight: float) -> float:
        """
        Discount for larger weights, premium for small packages.
        
        - < 1kg: 1.1 (small package premium)
        - 1-5kg: 1.0
        - 5-10kg: 0.98
        - 10-20kg: 0.95
        - > 20kg: 0.9 (bulk discount)
        """
        if weight < 1:
            return 1.1
        elif weight < 5:
            return 1.0
        elif weight < 10:
            return 0.98
        elif weight < 20:
            return 0.95
        else:
            return 0.9
    
    async def _get_category_factor(
        self,
        db: AsyncSession,
        category_id: int
    ) -> float:
        """
        Risk/handling based on product category.
        
        - Documents: 0.8 (easy to carry)
        - Clothes: 0.9
        - Electronics: 1.2 (valuable, fragile)
        - Food/Perishables: 1.3 (time-sensitive)
        - Medicine: 1.25 (sensitive)
        - General: 1.0
        """
        # For now, return default. In future, lookup category slug from DB
        # This would require ProductClassification to have a slug field
        return 1.0
    
    def _calculate_confidence(
        self,
        base_price: BasePriceResult,
        factors: dict[str, float]
    ) -> str:
        """
        Determine confidence level based on data quality.
        """
        score = 0.0
        
        # Base price from database vs estimate
        if base_price.source == "database":
            score += 0.4
        elif base_price.source == "reverse":
            score += 0.3
        else:
            score += 0.1
        
        # Demand factor reliability (not default 1.5)
        if factors["demand"] != 1.5:
            score += 0.3
        else:
            score += 0.1
        
        # Route factor reliability (not rare route default 1.3)
        if factors["route"] != 1.3:
            score += 0.2
        else:
            score += 0.1
        
        # Season factor always reliable
        score += 0.1
        
        if score >= self.CONFIDENCE_THRESHOLD_HIGH:
            return "high"
        elif score >= self.CONFIDENCE_THRESHOLD_MEDIUM:
            return "medium"
        else:
            return "low"
    
    def _generate_breakdown(
        self,
        base_price: float,
        factors: dict[str, float]
    ) -> list[PriceFactorBreakdown]:
        """Generate human-readable price breakdown."""
        breakdown = [
            PriceFactorBreakdown(
                label="Base price",
                value=round(base_price, 2),
                factor=1.0
            )
        ]
        
        current = base_price
        for name, factor in factors.items():
            if factor != 1.0:
                current *= factor
                breakdown.append(PriceFactorBreakdown(
                    label=self._factor_label(name, factor),
                    value=round(current, 2),
                    factor=round(factor, 2)
                ))
        
        return breakdown
    
    def _factor_label(self, name: str, factor: float) -> str:
        """Human-readable factor description."""
        labels = {
            "route": f"Route adjustment ({('competitive' if factor < 1 else 'less common')})",
            "season": f"Seasonal ({('peak' if factor > 1 else 'off-peak')})",
            "demand": f"Supply/Demand{(' surge' if factor > 1.2 else '')}",
            "urgency": f"Urgency{(' premium' if factor > 1 else '')}",
            "weight": f"Weight ({('discount' if factor < 1 else 'premium')})",
            "category": f"Category ({('handling' if factor > 1 else 'discount')})",
        }
        return labels.get(name, name)
    
    def _generate_message(
        self,
        factors: dict[str, float],
        source: str
    ) -> str:
        """Generate user-friendly explanation message."""
        messages = []
        
        # Season
        if factors["season"] > 1.2:
            messages.append("peak season")
        elif factors["season"] < 1.0:
            messages.append("off-peak season")
        
        # Demand
        if factors["demand"] > 1.3:
            messages.append("high demand")
        elif factors["demand"] < 0.9:
            messages.append("low demand")
        
        # Urgency
        if factors["urgency"] > 1.2:
            messages.append("urgent travel")
        
        # Route
        if factors["route"] < 0.9:
            messages.append("popular route")
        elif factors["route"] > 1.2:
            messages.append("rare route")
        
        if messages:
            return "Price adjusted for: " + ", ".join(messages)
        
        if source == "estimate":
            return "Estimated price (limited data for this route)"
        
        return "Standard pricing for this route"


# Singleton instance
dynamic_pricing_service = DynamicPricingService()

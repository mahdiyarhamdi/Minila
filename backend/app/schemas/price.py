"""Price suggestion schemas."""
from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PriceFactorBreakdown(BaseModel):
    """Single factor in price breakdown."""
    
    label: str = Field(..., description="Human-readable factor name")
    value: float = Field(..., description="Price after applying this factor")
    factor: float = Field(..., description="Multiplier value")


class PriceSuggestionOut(BaseModel):
    """Price suggestion response with full breakdown."""
    
    suggested_price_per_kg: float = Field(..., description="Final suggested price per kg")
    currency: str = Field(default="USD", description="Currency code")
    
    # Range for user flexibility
    min_price: float = Field(..., description="Minimum suggested price")
    max_price: float = Field(..., description="Maximum suggested price")
    
    # Confidence level
    confidence: Literal["high", "medium", "low"] = Field(..., description="Confidence level")
    
    # Source data
    base_ticket_price: Optional[float] = Field(None, description="Base ticket price if available")
    source: str = Field(..., description="Data source: database, estimate, reverse")
    
    # Factor breakdown for transparency
    factors: dict[str, float] = Field(..., description="All pricing factors")
    breakdown: list[PriceFactorBreakdown] = Field(..., description="Price breakdown steps")
    
    # User-friendly message
    message: str = Field(..., description="Explanation message")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "suggested_price_per_kg": 2.45,
                "currency": "USD",
                "min_price": 2.08,
                "max_price": 2.82,
                "confidence": "high",
                "base_ticket_price": 300,
                "source": "database",
                "factors": {
                    "route": 1.0,
                    "season": 1.25,
                    "demand": 1.15,
                    "urgency": 1.0,
                    "weight": 0.95,
                    "category": 1.0
                },
                "breakdown": [
                    {"label": "Base price", "value": 1.04, "factor": 1.0},
                    {"label": "Seasonal peak", "value": 1.30, "factor": 1.25},
                    {"label": "Supply/Demand surge", "value": 1.50, "factor": 1.15},
                    {"label": "Weight discount", "value": 1.42, "factor": 0.95}
                ],
                "message": "Summer peak season with moderate demand"
            }
        }
    )


class BasePriceResult(BaseModel):
    """Internal model for base price lookup result."""
    
    price: float
    ticket_price: Optional[float] = None
    source: str  # "database", "reverse", "estimate"

"""Unit tests for Dynamic Pricing Service."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.dynamic_pricing_service import DynamicPricingService
from app.schemas.price import BasePriceResult


class TestSeasonFactor:
    """Tests for seasonal pricing factors."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_nowruz_peak_march(self):
        """Nowruz (March 15-31) should have 1.4 factor."""
        date = datetime(2025, 3, 21)
        result = self.service._get_season_factor(date)
        assert result == 1.4
    
    def test_nowruz_peak_april(self):
        """Nowruz (April 1-10) should have 1.4 factor."""
        date = datetime(2025, 4, 5)
        result = self.service._get_season_factor(date)
        assert result == 1.4
    
    def test_summer_vacation(self):
        """Summer (June-September) should have 1.25 factor."""
        date = datetime(2025, 7, 15)
        result = self.service._get_season_factor(date)
        assert result == 1.25
    
    def test_christmas_peak(self):
        """Christmas (Dec 15 - Jan 10) should have 1.3 factor."""
        date = datetime(2025, 12, 25)
        result = self.service._get_season_factor(date)
        assert result == 1.3
    
    def test_new_year_peak(self):
        """New Year (Jan 1-10) should have 1.3 factor."""
        date = datetime(2025, 1, 5)
        result = self.service._get_season_factor(date)
        assert result == 1.3
    
    def test_winter_off_peak(self):
        """Winter off-peak should have 0.9 factor."""
        date = datetime(2025, 11, 15)
        result = self.service._get_season_factor(date)
        assert result == 0.9
    
    def test_regular_season(self):
        """Regular season should have 1.0 factor."""
        date = datetime(2025, 5, 15)
        result = self.service._get_season_factor(date)
        assert result == 1.0


class TestUrgencyFactor:
    """Tests for urgency pricing factors."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_no_rush_over_30_days(self):
        """Over 30 days should have 1.0 factor."""
        travel_date = datetime.utcnow() + timedelta(days=45)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.0
    
    def test_slight_urgency_14_to_30_days(self):
        """14-30 days should have 1.05 factor."""
        travel_date = datetime.utcnow() + timedelta(days=20)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.05
    
    def test_moderate_urgency_7_to_14_days(self):
        """7-14 days should have 1.1 factor."""
        travel_date = datetime.utcnow() + timedelta(days=10)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.1
    
    def test_urgent_3_to_7_days(self):
        """3-7 days should have 1.2 factor."""
        travel_date = datetime.utcnow() + timedelta(days=5)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.2
    
    def test_very_urgent_1_to_3_days(self):
        """1-3 days should have 1.35 factor."""
        travel_date = datetime.utcnow() + timedelta(days=2)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.35
    
    def test_extremely_urgent_less_than_24h(self):
        """Less than 24 hours should have 1.5 factor."""
        travel_date = datetime.utcnow() + timedelta(hours=12)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.5
    
    def test_past_date(self):
        """Past date should have 1.5 factor (max urgency)."""
        travel_date = datetime.utcnow() - timedelta(days=1)
        result = self.service._get_urgency_factor(travel_date)
        assert result == 1.5


class TestWeightFactor:
    """Tests for weight-based pricing factors."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_small_package_premium(self):
        """Less than 1kg should have 1.1 factor (premium)."""
        assert self.service._get_weight_factor(0.5) == 1.1
    
    def test_normal_weight(self):
        """1-5kg should have 1.0 factor."""
        assert self.service._get_weight_factor(3) == 1.0
    
    def test_medium_discount(self):
        """5-10kg should have 0.98 factor."""
        assert self.service._get_weight_factor(7) == 0.98
    
    def test_large_discount(self):
        """10-20kg should have 0.95 factor."""
        assert self.service._get_weight_factor(15) == 0.95
    
    def test_bulk_discount(self):
        """Over 20kg should have 0.9 factor."""
        assert self.service._get_weight_factor(25) == 0.9


class TestConfidenceCalculation:
    """Tests for confidence level calculation."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_high_confidence(self):
        """Database source with real demand data should be high confidence."""
        base_price = BasePriceResult(price=1.0, ticket_price=300, source="database")
        factors = {"demand": 1.2, "route": 1.0, "season": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        
        result = self.service._calculate_confidence(base_price, factors)
        assert result == "high"
    
    def test_medium_confidence(self):
        """Reverse route source should be medium confidence."""
        base_price = BasePriceResult(price=1.0, ticket_price=300, source="reverse")
        factors = {"demand": 1.5, "route": 1.0, "season": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        
        result = self.service._calculate_confidence(base_price, factors)
        assert result == "medium"
    
    def test_low_confidence(self):
        """Estimate source with default factors should be low confidence."""
        base_price = BasePriceResult(price=1.5, ticket_price=None, source="estimate")
        factors = {"demand": 1.5, "route": 1.3, "season": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        
        result = self.service._calculate_confidence(base_price, factors)
        assert result == "low"


class TestPriceBreakdown:
    """Tests for price breakdown generation."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_breakdown_includes_base(self):
        """Breakdown should always include base price."""
        factors = {"route": 1.0, "season": 1.0, "demand": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        breakdown = self.service._generate_breakdown(1.0, factors)
        
        assert len(breakdown) >= 1
        assert breakdown[0].label == "Base price"
        assert breakdown[0].factor == 1.0
    
    def test_breakdown_excludes_neutral_factors(self):
        """Factors equal to 1.0 should not appear in breakdown."""
        factors = {"route": 1.0, "season": 1.25, "demand": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        breakdown = self.service._generate_breakdown(1.0, factors)
        
        # Should have base + season only
        assert len(breakdown) == 2
        assert breakdown[1].label.startswith("Seasonal")
    
    def test_breakdown_includes_all_non_neutral(self):
        """All non-1.0 factors should appear in breakdown."""
        factors = {"route": 0.85, "season": 1.25, "demand": 1.3, "urgency": 1.1, "weight": 0.95, "category": 1.0}
        breakdown = self.service._generate_breakdown(1.0, factors)
        
        # Should have base + 5 factors
        assert len(breakdown) == 6
    
    def test_breakdown_values_cumulative(self):
        """Breakdown values should be cumulative."""
        factors = {"route": 1.0, "season": 1.2, "demand": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        base_price = 1.0
        breakdown = self.service._generate_breakdown(base_price, factors)
        
        assert breakdown[0].value == 1.0  # Base
        assert breakdown[1].value == 1.2  # After season


class TestFactorLabels:
    """Tests for human-readable factor labels."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_route_competitive(self):
        """Route factor < 1 should show competitive."""
        label = self.service._factor_label("route", 0.85)
        assert "competitive" in label.lower()
    
    def test_route_less_common(self):
        """Route factor > 1 should show less common."""
        label = self.service._factor_label("route", 1.2)
        assert "less common" in label.lower()
    
    def test_season_peak(self):
        """Season factor > 1 should show peak."""
        label = self.service._factor_label("season", 1.4)
        assert "peak" in label.lower()
    
    def test_season_off_peak(self):
        """Season factor < 1 should show off-peak."""
        label = self.service._factor_label("season", 0.9)
        assert "off-peak" in label.lower()
    
    def test_demand_surge(self):
        """Demand factor > 1.2 should show surge."""
        label = self.service._factor_label("demand", 1.5)
        assert "surge" in label.lower()
    
    def test_weight_discount(self):
        """Weight factor < 1 should show discount."""
        label = self.service._factor_label("weight", 0.9)
        assert "discount" in label.lower()
    
    def test_weight_premium(self):
        """Weight factor > 1 should show premium."""
        label = self.service._factor_label("weight", 1.1)
        assert "premium" in label.lower()


class TestMessageGeneration:
    """Tests for user-friendly message generation."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_peak_season_message(self):
        """Peak season should be mentioned in message."""
        factors = {"route": 1.0, "season": 1.4, "demand": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        message = self.service._generate_message(factors, "database")
        assert "peak season" in message.lower()
    
    def test_high_demand_message(self):
        """High demand should be mentioned in message."""
        factors = {"route": 1.0, "season": 1.0, "demand": 1.5, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        message = self.service._generate_message(factors, "database")
        assert "high demand" in message.lower()
    
    def test_urgent_travel_message(self):
        """Urgent travel should be mentioned in message."""
        factors = {"route": 1.0, "season": 1.0, "demand": 1.0, "urgency": 1.3, "weight": 1.0, "category": 1.0}
        message = self.service._generate_message(factors, "database")
        assert "urgent" in message.lower()
    
    def test_estimate_source_message(self):
        """Estimate source should be mentioned in message."""
        factors = {"route": 1.0, "season": 1.0, "demand": 1.0, "urgency": 1.0, "weight": 1.0, "category": 1.0}
        message = self.service._generate_message(factors, "estimate")
        assert "estimated" in message.lower() or "limited" in message.lower()


class TestPriceBounds:
    """Tests for price bounds enforcement."""
    
    def setup_method(self):
        self.service = DynamicPricingService()
    
    def test_min_price_enforced(self):
        """Price should not go below MIN_PRICE_PER_KG."""
        assert self.service.MIN_PRICE_PER_KG == 0.5
    
    def test_max_price_enforced(self):
        """Price should not go above MAX_PRICE_PER_KG."""
        assert self.service.MAX_PRICE_PER_KG == 20.0


@pytest.mark.asyncio
class TestCalculatePrice:
    """Integration tests for full price calculation."""
    
    async def test_calculate_price_minimal(self):
        """Price calculation with minimal inputs."""
        service = DynamicPricingService()
        
        # Mock the route price repo
        with patch('app.services.dynamic_pricing_service.route_price_repo') as mock_repo:
            mock_repo.get_base_price = AsyncMock(return_value=BasePriceResult(
                price=1.0, ticket_price=300, source="database"
            ))
            mock_repo.get_route_statistics = AsyncMock(return_value={"monthly_cards": 50})
            mock_repo.get_supply_demand_counts = AsyncMock(return_value=(10, 10))
            
            mock_db = MagicMock()
            
            result = await service.calculate_price(
                db=mock_db,
                origin_city_id=1,
                destination_city_id=10
            )
            
            assert result.suggested_price_per_kg > 0
            assert result.currency == "USD"
            assert result.confidence in ["high", "medium", "low"]
            assert len(result.factors) == 6
            assert len(result.breakdown) >= 1
    
    async def test_calculate_price_with_travel_date(self):
        """Price calculation with travel date."""
        service = DynamicPricingService()
        
        with patch('app.services.dynamic_pricing_service.route_price_repo') as mock_repo:
            mock_repo.get_base_price = AsyncMock(return_value=BasePriceResult(
                price=1.0, ticket_price=300, source="database"
            ))
            mock_repo.get_route_statistics = AsyncMock(return_value={"monthly_cards": 50})
            mock_repo.get_supply_demand_counts = AsyncMock(return_value=(10, 10))
            
            mock_db = MagicMock()
            travel_date = datetime(2025, 7, 15)  # Summer
            
            result = await service.calculate_price(
                db=mock_db,
                origin_city_id=1,
                destination_city_id=10,
                travel_date=travel_date
            )
            
            # Season factor should be 1.25 for summer
            assert result.factors["season"] == 1.25
    
    async def test_calculate_price_with_weight(self):
        """Price calculation with weight discount."""
        service = DynamicPricingService()
        
        with patch('app.services.dynamic_pricing_service.route_price_repo') as mock_repo:
            mock_repo.get_base_price = AsyncMock(return_value=BasePriceResult(
                price=1.0, ticket_price=300, source="database"
            ))
            mock_repo.get_route_statistics = AsyncMock(return_value={"monthly_cards": 50})
            mock_repo.get_supply_demand_counts = AsyncMock(return_value=(10, 10))
            
            mock_db = MagicMock()
            
            result = await service.calculate_price(
                db=mock_db,
                origin_city_id=1,
                destination_city_id=10,
                weight=25  # Bulk
            )
            
            # Weight factor should be 0.9 for bulk
            assert result.factors["weight"] == 0.9
    
    async def test_price_range_calculated(self):
        """Min and max price should be calculated."""
        service = DynamicPricingService()
        
        with patch('app.services.dynamic_pricing_service.route_price_repo') as mock_repo:
            mock_repo.get_base_price = AsyncMock(return_value=BasePriceResult(
                price=1.0, ticket_price=300, source="database"
            ))
            mock_repo.get_route_statistics = AsyncMock(return_value={"monthly_cards": 50})
            mock_repo.get_supply_demand_counts = AsyncMock(return_value=(10, 10))
            
            mock_db = MagicMock()
            
            result = await service.calculate_price(
                db=mock_db,
                origin_city_id=1,
                destination_city_id=10
            )
            
            # Range should be ±15%
            assert result.min_price < result.suggested_price_per_kg
            assert result.max_price > result.suggested_price_per_kg
            assert abs(result.min_price - result.suggested_price_per_kg * 0.85) < 0.01
            assert abs(result.max_price - result.suggested_price_per_kg * 1.15) < 0.01


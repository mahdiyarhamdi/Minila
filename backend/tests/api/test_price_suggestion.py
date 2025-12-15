"""API tests for price suggestion endpoint."""
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


@pytest.mark.asyncio
class TestPriceSuggestionEndpoint:
    """Tests for GET /api/v1/cards/price-suggestion/ endpoint."""
    
    async def test_get_suggestion_success(self, client: AsyncClient, test_db):
        """Should return price suggestion with valid inputs."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Required fields
        assert "suggested_price_per_kg" in data
        assert "currency" in data
        assert "min_price" in data
        assert "max_price" in data
        assert "confidence" in data
        assert "source" in data
        assert "factors" in data
        assert "breakdown" in data
        assert "message" in data
        
        # Value checks
        assert data["suggested_price_per_kg"] > 0
        assert data["currency"] == "USD"
        assert data["min_price"] < data["suggested_price_per_kg"]
        assert data["max_price"] > data["suggested_price_per_kg"]
        assert data["confidence"] in ["high", "medium", "low"]
    
    async def test_get_suggestion_with_date(self, client: AsyncClient, test_db):
        """Should apply season factor for travel date."""
        # Summer date
        summer_date = (datetime.now() + timedelta(days=30)).replace(month=7, day=15)
        
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10,
                "travel_date": summer_date.isoformat()
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Season factor should be 1.25 for summer
        assert data["factors"]["season"] == 1.25
    
    async def test_get_suggestion_with_weight(self, client: AsyncClient, test_db):
        """Should apply weight factor."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10,
                "weight": 25  # Bulk
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Weight factor should be 0.9 for bulk
        assert data["factors"]["weight"] == 0.9
    
    async def test_get_suggestion_small_package(self, client: AsyncClient, test_db):
        """Should apply premium for small packages."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10,
                "weight": 0.5  # Small
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Weight factor should be 1.1 for small
        assert data["factors"]["weight"] == 1.1
    
    async def test_get_suggestion_missing_origin(self, client: AsyncClient, test_db):
        """Should fail without origin_city_id."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "destination_city_id": 10
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_get_suggestion_missing_destination(self, client: AsyncClient, test_db):
        """Should fail without destination_city_id."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_get_suggestion_invalid_date_format(self, client: AsyncClient, test_db):
        """Should fail with invalid date format."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10,
                "travel_date": "not-a-date"
            }
        )
        
        assert response.status_code == 400
    
    async def test_get_suggestion_unknown_route(self, client: AsyncClient, test_db):
        """Should return estimate for unknown routes."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 99999,
                "destination_city_id": 99998
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be estimate with low confidence
        assert data["source"] == "estimate"
        assert data["confidence"] == "low"
    
    async def test_factors_breakdown_structure(self, client: AsyncClient, test_db):
        """Factors should have expected structure."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10
            }
        )
        
        assert response.status_code == 200
        factors = response.json()["factors"]
        
        # All factors should be present
        expected_factors = ["route", "season", "demand", "urgency", "weight", "category"]
        for factor in expected_factors:
            assert factor in factors
            assert isinstance(factors[factor], (int, float))
            assert factors[factor] > 0
    
    async def test_breakdown_structure(self, client: AsyncClient, test_db):
        """Breakdown should have expected structure."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10
            }
        )
        
        assert response.status_code == 200
        breakdown = response.json()["breakdown"]
        
        # Should have at least base price
        assert len(breakdown) >= 1
        
        # Each item should have label, value, factor
        for item in breakdown:
            assert "label" in item
            assert "value" in item
            assert "factor" in item
            assert isinstance(item["value"], (int, float))
            assert isinstance(item["factor"], (int, float))
    
    async def test_price_bounds(self, client: AsyncClient, test_db):
        """Price should be within bounds."""
        response = await client.get(
            "/api/v1/cards/price-suggestion/",
            params={
                "origin_city_id": 1,
                "destination_city_id": 10
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check bounds
        assert data["suggested_price_per_kg"] >= 0.5  # MIN_PRICE_PER_KG
        assert data["suggested_price_per_kg"] <= 20.0  # MAX_PRICE_PER_KG


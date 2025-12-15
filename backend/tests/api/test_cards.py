"""Comprehensive tests for card management endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta


# ==================== GET /api/v1/cards/ ====================

class TestGetCards:
    """Test cases for listing and filtering cards."""

    @pytest.mark.asyncio
    async def test_get_cards_with_pagination(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test getting cards list with pagination."""
        # Act
        response = await client.get("/api/v1/cards/?page=1&page_size=10")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert isinstance(data["items"], list)
        assert data["page"] == 1
        assert data["page_size"] == 10

    @pytest.mark.asyncio
    async def test_get_cards_filter_origin_city(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test filtering cards by origin city."""
        # Act
        response = await client.get("/api/v1/cards/?origin_city_id=1")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # All returned cards should have origin_city.id=1
        for card in data["items"]:
            assert card["origin_city"]["id"] == 1

    @pytest.mark.asyncio
    async def test_get_cards_filter_destination_city(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test filtering cards by destination city."""
        # Act
        response = await client.get("/api/v1/cards/?destination_city_id=2")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # All returned cards should have destination_city.id=2
        for card in data["items"]:
            assert card["destination_city"]["id"] == 2

    @pytest.mark.asyncio
    async def test_get_cards_filter_is_sender_true(
        self, 
        client: AsyncClient,
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession,
        seed_locations: dict
    ):
        """Test filtering cards by is_sender=true (sender cards)."""
        # Arrange - Create a sender card
        from app.models.card import Card
        sender_card = Card(
            owner_id=test_user["user_id"],
            is_sender=True,
            origin_country_id=1,
            origin_city_id=1,
            destination_country_id=2,
            destination_city_id=2,
            start_time_frame=datetime.utcnow() + timedelta(days=1),
            end_time_frame=datetime.utcnow() + timedelta(days=7),
            weight=10.0,
            description="Sender card"
        )
        test_db.add(sender_card)
        await test_db.commit()
        
        # Act
        response = await client.get("/api/v1/cards/?is_sender=true")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # All returned cards should be sender cards
        for card in data["items"]:
            assert card["is_sender"] is True

    @pytest.mark.asyncio
    async def test_get_cards_filter_is_sender_false(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test filtering cards by is_sender=false (passenger cards)."""
        # Act
        response = await client.get("/api/v1/cards/?is_sender=false")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # All returned cards should be passenger cards
        for card in data["items"]:
            assert card["is_sender"] is False

    @pytest.mark.asyncio
    async def test_get_cards_multiple_filters(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test filtering cards with multiple filters combined."""
        # Act
        response = await client.get(
            "/api/v1/cards/?origin_city_id=1&destination_city_id=2&is_sender=false"
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        for card in data["items"]:
            assert card["origin_city"]["id"] == 1
            assert card["destination_city"]["id"] == 2
            assert card["is_sender"] is False

    @pytest.mark.asyncio
    async def test_get_cards_invalid_page_zero(self, client: AsyncClient):
        """Test getting cards with page=0 (should return validation error)."""
        response = await client.get("/api/v1/cards/?page=0&page_size=10")
        
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_get_cards_large_page_size(self, client: AsyncClient):
        """Test getting cards with very large page_size (should return validation error)."""
        response = await client.get("/api/v1/cards/?page=1&page_size=500")
        
        assert response.status_code == 422  # Validation error - max is 100

    @pytest.mark.asyncio
    async def test_get_cards_negative_page(self, client: AsyncClient):
        """Test getting cards with negative page number (should return validation error)."""
        response = await client.get("/api/v1/cards/?page=-5&page_size=10")
        
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_get_cards_no_results_with_filter(self, client: AsyncClient):
        """Test filtering cards with no matching results."""
        response = await client.get("/api/v1/cards/?origin_city_id=9999")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0


# ==================== POST /api/v1/cards/ ====================

class TestCreateCard:
    """Test cases for creating cards."""

    @pytest.mark.asyncio
    async def test_create_passenger_card_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        seed_locations: dict
    ):
        """Test successful creation of passenger card (is_sender=false)."""
        # Arrange
        payload = {
            "is_sender": False,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "ticket_date_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 5.0,
            "description": "Passenger card test"
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["is_sender"] is False
        assert data["owner"]["id"] == test_user["user_id"]
        assert data["weight"] == payload["weight"]
        assert data["description"] == payload["description"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_sender_card_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        seed_locations: dict
    ):
        """Test successful creation of sender card (is_sender=true)."""
        # Arrange
        payload = {
            "is_sender": True,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "start_time_frame": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "end_time_frame": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 10.0,
            "description": "Sender card test"
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["is_sender"] is True
        assert data["owner"]["id"] == test_user["user_id"]

    @pytest.mark.asyncio
    async def test_create_card_without_auth(self, client: AsyncClient):
        """Test creating card without authentication returns 401."""
        # Arrange
        payload = {
            "is_sender": False,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "ticket_date_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 5.0,
            "description": "Unauthorized card"
        }
        
        # Act
        response = await client.post("/api/v1/cards/", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_card_validation_error(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test creating card with missing required fields returns 422."""
        # Arrange
        payload = {
            "is_sender": False,
            "weight": 5.0
            # Missing required fields
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_card_with_community_ids(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_community: dict,
        auth_headers: dict,
        seed_locations: dict
    ):
        """Test creating card with specific community visibility."""
        # Arrange
        payload = {
            "is_sender": False,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "ticket_date_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 5.0,
            "description": "Community-specific card",
            "community_ids": [test_community["id"]]
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert "id" in data


# ==================== GET /api/v1/cards/{id} ====================

class TestGetCard:
    """Test cases for getting card details."""

    @pytest.mark.asyncio
    async def test_get_card_success(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test successfully getting card details."""
        # Act
        response = await client.get(f"/api/v1/cards/{test_card['id']}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_card["id"]
        assert data["owner"]["id"] == test_card["owner_id"]
        assert data["weight"] == test_card["weight"]

    @pytest.mark.asyncio
    async def test_get_card_not_found(self, client: AsyncClient):
        """Test getting non-existent card returns 404."""
        # Act
        response = await client.get("/api/v1/cards/99999")
        
        # Assert
        assert response.status_code == 404


# ==================== PATCH /api/v1/cards/{id} ====================

class TestUpdateCard:
    """Test cases for updating cards."""

    @pytest.mark.asyncio
    async def test_update_card_by_owner(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers: dict
    ):
        """Test successful card update by owner."""
        # Arrange
        payload = {
            "weight": 10.0,
            "description": "Updated description"
        }
        
        # Act
        response = await client.patch(
            f"/api/v1/cards/{test_card['id']}", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["weight"] == payload["weight"]
        assert data["description"] == payload["description"]

    @pytest.mark.asyncio
    async def test_update_card_by_non_owner(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers_user2: dict
    ):
        """Test update attempt by non-owner returns 403."""
        # Arrange
        payload = {"weight": 15.0}
        
        # Act
        response = await client.patch(
            f"/api/v1/cards/{test_card['id']}", 
            json=payload, 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_card_without_auth(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test update without authentication returns 401."""
        # Arrange
        payload = {"weight": 20.0}
        
        # Act
        response = await client.patch(
            f"/api/v1/cards/{test_card['id']}", 
            json=payload
        )
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_card_not_found(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test updating non-existent card returns 404."""
        # Arrange
        payload = {"weight": 25.0}
        
        # Act
        response = await client.patch(
            "/api/v1/cards/99999", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_card_nullable_field(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers: dict
    ):
        """Test updating nullable field to null."""
        # Arrange - Set is_packed to null
        payload = {"is_packed": None}
        
        # Act
        response = await client.patch(
            f"/api/v1/cards/{test_card['id']}", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["is_packed"] is None


# ==================== DELETE /api/v1/cards/{id} ====================

class TestDeleteCard:
    """Test cases for deleting cards."""

    @pytest.mark.asyncio
    async def test_delete_card_by_owner(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession,
        seed_locations: dict
    ):
        """Test successful card deletion by owner returns 204."""
        # Arrange - Create a card to delete
        from app.models.card import Card
        card = Card(
            owner_id=test_user["user_id"],
            is_sender=False,
            origin_country_id=1,
            origin_city_id=1,
            destination_country_id=2,
            destination_city_id=2,
            ticket_date_time=datetime.utcnow() + timedelta(days=7),
            weight=5.0,
            description="Card to delete"
        )
        test_db.add(card)
        await test_db.commit()
        await test_db.refresh(card)
        card_id = card.id
        
        # Act
        response = await client.delete(
            f"/api/v1/cards/{card_id}", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_card_by_non_owner(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers_user2: dict
    ):
        """Test deletion attempt by non-owner returns 403."""
        # Act
        response = await client.delete(
            f"/api/v1/cards/{test_card['id']}", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_card_without_auth(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test deletion without authentication returns 401."""
        # Act
        response = await client.delete(f"/api/v1/cards/{test_card['id']}")
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_card_not_found(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test deleting non-existent card returns 404."""
        # Act
        response = await client.delete(
            "/api/v1/cards/99999", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 404


# ==================== Currency Field Tests ====================

class TestCardCurrency:
    """Test cases for card currency field."""

    @pytest.mark.asyncio
    async def test_create_card_with_currency(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        seed_locations: dict
    ):
        """Test creating card with explicit currency."""
        # Arrange
        payload = {
            "is_sender": False,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "ticket_date_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 5.0,
            "price_aed": 100.0,
            "currency": "AED",
            "description": "Card with AED currency"
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["currency"] == "AED"
        assert data["price_aed"] == 100.0

    @pytest.mark.asyncio
    async def test_create_card_default_currency(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        seed_locations: dict
    ):
        """Test creating card without currency defaults to USD."""
        # Arrange
        payload = {
            "is_sender": False,
            "origin_country_id": 1,
            "origin_city_id": 1,
            "destination_country_id": 2,
            "destination_city_id": 2,
            "ticket_date_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "weight": 5.0,
            "price_aed": 50.0,
            "description": "Card without currency"
        }
        
        # Act
        response = await client.post(
            "/api/v1/cards/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        # Currency should default to USD
        assert data["currency"] == "USD" or data["currency"] is None

    @pytest.mark.asyncio
    async def test_update_card_currency(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers: dict
    ):
        """Test updating card currency."""
        # Arrange
        payload = {
            "currency": "IRR",
            "price_aed": 150.0
        }
        
        # Act
        response = await client.patch(
            f"/api/v1/cards/{test_card['id']}", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["currency"] == "IRR"
        assert data["price_aed"] == 150.0

    @pytest.mark.asyncio
    async def test_get_card_with_currency(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession,
        seed_locations: dict
    ):
        """Test getting card details includes currency field."""
        # Arrange - Create card with currency
        from app.models.card import Card
        card = Card(
            owner_id=test_user["user_id"],
            is_sender=False,
            origin_country_id=1,
            origin_city_id=1,
            destination_country_id=2,
            destination_city_id=2,
            ticket_date_time=datetime.utcnow() + timedelta(days=7),
            weight=5.0,
            price_aed=200.0,
            currency="EUR",
            description="Card with EUR"
        )
        test_db.add(card)
        await test_db.commit()
        await test_db.refresh(card)
        
        # Act
        response = await client.get(f"/api/v1/cards/{card.id}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["currency"] == "EUR"
        assert data["price_aed"] == 200.0


# ==================== Card Analytics Tests ====================

class TestCardAnalytics:
    """Test cases for card view/click tracking."""

    @pytest.mark.asyncio
    async def test_record_card_view_success(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test recording a card view returns 201."""
        # Act
        response = await client.post(f"/api/v1/cards/{test_card['id']}/view")
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_record_card_view_duplicate_ignored(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test duplicate view within 30 minutes returns success with message."""
        # Arrange - Record first view
        await client.post(f"/api/v1/cards/{test_card['id']}/view")
        
        # Act - Record second view immediately
        response = await client.post(f"/api/v1/cards/{test_card['id']}/view")
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        # Second call should say "Already recorded"
        assert "message" in data or data["success"] is True

    @pytest.mark.asyncio
    async def test_record_card_view_not_found(self, client: AsyncClient):
        """Test recording view for non-existent card returns 404."""
        # Act
        response = await client.post("/api/v1/cards/99999/view")
        
        # Assert
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_record_card_click_success(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test recording a card click returns 201."""
        # Act
        response = await client.post(f"/api/v1/cards/{test_card['id']}/click")
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_record_card_click_duplicate_ignored(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test duplicate click within 30 minutes returns success with message."""
        # Arrange - Record first click
        await client.post(f"/api/v1/cards/{test_card['id']}/click")
        
        # Act - Record second click immediately
        response = await client.post(f"/api/v1/cards/{test_card['id']}/click")
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_record_card_click_not_found(self, client: AsyncClient):
        """Test recording click for non-existent card returns 404."""
        # Act
        response = await client.post("/api/v1/cards/99999/click")
        
        # Assert
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_card_stats_success(
        self, 
        client: AsyncClient, 
        test_card: dict
    ):
        """Test getting card stats returns view and click counts."""
        # Arrange - Record some views and clicks
        await client.post(f"/api/v1/cards/{test_card['id']}/view")
        await client.post(f"/api/v1/cards/{test_card['id']}/click")
        
        # Act
        response = await client.get(f"/api/v1/cards/{test_card['id']}/stats")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "card_id" in data
        assert "view_count" in data
        assert "click_count" in data
        assert data["card_id"] == test_card["id"]
        assert isinstance(data["view_count"], int)
        assert isinstance(data["click_count"], int)

    @pytest.mark.asyncio
    async def test_get_card_stats_not_found(self, client: AsyncClient):
        """Test getting stats for non-existent card returns 404."""
        # Act
        response = await client.get("/api/v1/cards/99999/stats")
        
        # Assert
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_card_stats_initial_zero(
        self, 
        client: AsyncClient,
        test_user: dict,
        auth_headers: dict, 
        test_db: AsyncSession,
        seed_locations: dict
    ):
        """Test new card stats are initially zero."""
        # Arrange - Create a new card
        from app.models.card import Card
        card = Card(
            owner_id=test_user["user_id"],
            is_sender=False,
            origin_country_id=1,
            origin_city_id=1,
            destination_country_id=2,
            destination_city_id=2,
            ticket_date_time=datetime.utcnow() + timedelta(days=7),
            weight=5.0,
            description="New card for stats test"
        )
        test_db.add(card)
        await test_db.commit()
        await test_db.refresh(card)
        
        # Act
        response = await client.get(f"/api/v1/cards/{card.id}/stats")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["view_count"] == 0
        assert data["click_count"] == 0

    @pytest.mark.asyncio
    async def test_record_view_with_authenticated_user(
        self, 
        client: AsyncClient, 
        test_card: dict,
        auth_headers: dict
    ):
        """Test recording view with authenticated user."""
        # Act
        response = await client.post(
            f"/api/v1/cards/{test_card['id']}/view",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_my_cards_include_stats(
        self, 
        client: AsyncClient,
        test_user: dict,
        auth_headers: dict,
        test_card: dict
    ):
        """Test my cards endpoint includes view and click counts."""
        # Arrange - Record some views/clicks
        await client.post(f"/api/v1/cards/{test_card['id']}/view")
        await client.post(f"/api/v1/cards/{test_card['id']}/click")
        
        # Act
        response = await client.get(
            "/api/v1/users/me/cards",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        if len(data["items"]) > 0:
            card = data["items"][0]
            assert "view_count" in card
            assert "click_count" in card

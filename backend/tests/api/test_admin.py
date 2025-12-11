"""تست‌های Admin API."""
import pytest
from httpx import AsyncClient


class TestAdminStats:
    """تست‌های endpoint آمار داشبورد."""

    async def test_get_stats_unauthorized(self, client: AsyncClient):
        """کاربر غیر احراز هویت نباید بتواند آمار را ببیند."""
        response = await client.get("/api/v1/admin/stats")
        assert response.status_code == 401

    async def test_get_stats_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """کاربر عادی نباید بتواند آمار را ببیند."""
        response = await client.get("/api/v1/admin/stats", headers=auth_headers)
        assert response.status_code == 403

    async def test_get_stats_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند آمار را ببیند."""
        response = await client.get("/api/v1/admin/stats", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # بررسی فیلدهای آمار
        assert "total_users" in data
        assert "active_users" in data
        assert "banned_users" in data
        assert "admin_users" in data
        assert "verified_users" in data
        assert "total_communities" in data
        assert "total_cards" in data
        assert "traveler_cards" in data
        assert "sender_cards" in data
        assert "total_messages" in data
        assert "pending_requests" in data
        assert "open_reports" in data
        assert "new_users_today" in data
        assert "new_users_week" in data
        assert "new_users_month" in data
        assert "new_cards_today" in data
        assert "new_cards_week" in data
        assert "new_cards_month" in data


class TestAdminUsersChart:
    """تست‌های endpoint نمودار کاربران."""

    async def test_get_users_chart_unauthorized(self, client: AsyncClient):
        """کاربر غیر احراز هویت نباید بتواند نمودار را ببیند."""
        response = await client.get("/api/v1/admin/stats/users-chart")
        assert response.status_code == 401

    async def test_get_users_chart_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند نمودار کاربران را ببیند."""
        response = await client.get(
            "/api/v1/admin/stats/users-chart?days=7",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "labels" in data
        assert "data" in data
        assert len(data["labels"]) == 7
        assert len(data["data"]) == 7


class TestAdminCardsChart:
    """تست‌های endpoint نمودار کارت‌ها."""

    async def test_get_cards_chart_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند نمودار کارت‌ها را ببیند."""
        response = await client.get(
            "/api/v1/admin/stats/cards-chart?days=30",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "labels" in data
        assert "data" in data
        assert len(data["labels"]) == 30
        assert len(data["data"]) == 30


class TestAdminUsers:
    """تست‌های مدیریت کاربران."""

    async def test_list_users_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند لیست کاربران را ببیند."""
        response = await client.get(
            "/api/v1/admin/users?page=1&page_size=10",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert isinstance(data["items"], list)

    async def test_list_users_with_filter(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند کاربران را فیلتر کند."""
        response = await client.get(
            "/api/v1/admin/users?page=1&page_size=10&status=active",
            headers=admin_auth_headers
        )
        assert response.status_code == 200

    async def test_get_user_detail_admin(
        self, client: AsyncClient, admin_auth_headers: dict, test_user: dict
    ):
        """ادمین باید بتواند جزئیات یک کاربر را ببیند."""
        response = await client.get(
            f"/api/v1/admin/users/{test_user['user_id']}",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user["user_id"]
        assert data["email"] == test_user["email"]

    async def test_ban_user_admin(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
        test_user: dict
    ):
        """ادمین باید بتواند کاربر را بن کند."""
        response = await client.put(
            f"/api/v1/admin/users/{test_user['user_id']}/ban",
            json={"is_active": False, "reason": "Test ban"},
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

    async def test_unban_user_admin(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
        test_user: dict
    ):
        """ادمین باید بتواند کاربر را آن‌بن کند."""
        response = await client.put(
            f"/api/v1/admin/users/{test_user['user_id']}/ban",
            json={"is_active": True},
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True


class TestAdminCommunities:
    """تست‌های مدیریت کامیونیتی‌ها."""

    async def test_list_communities_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند لیست کامیونیتی‌ها را ببیند."""
        response = await client.get(
            "/api/v1/admin/communities?page=1&page_size=10",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data


class TestAdminCards:
    """تست‌های مدیریت کارت‌ها."""

    async def test_list_cards_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند لیست کارت‌ها را ببیند."""
        response = await client.get(
            "/api/v1/admin/cards?page=1&page_size=10",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data


class TestAdminLogs:
    """تست‌های مشاهده لاگ‌ها."""

    async def test_list_logs_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند لاگ‌ها را ببیند."""
        response = await client.get(
            "/api/v1/admin/logs?page=1&page_size=10",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data

    async def test_list_logs_with_filter(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند لاگ‌ها را فیلتر کند."""
        response = await client.get(
            "/api/v1/admin/logs?page=1&page_size=10&event_type=login",
            headers=admin_auth_headers
        )
        assert response.status_code == 200


class TestAdminRecentActivities:
    """تست‌های رویدادهای اخیر."""

    async def test_get_recent_activities_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند رویدادهای اخیر را ببیند."""
        response = await client.get(
            "/api/v1/admin/stats/recent-activities?limit=10",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) <= 10


class TestAdminSettings:
    """تست‌های تنظیمات سیستم."""

    async def test_get_settings_admin(
        self, client: AsyncClient, admin_auth_headers: dict
    ):
        """ادمین باید بتواند تنظیمات را ببیند."""
        response = await client.get(
            "/api/v1/admin/settings",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "rate_limit_messages_per_day" in data
        assert "smtp_configured" in data


"""تست‌های API برای location endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import Country, City


class TestLocationAPI:
    """تست‌های location API."""
    
    @pytest.fixture
    async def setup_locations(self, test_db: AsyncSession):
        """ایجاد داده‌های تست برای location."""
        # ایجاد کشورها
        iran = Country(
            name="Iran",
            name_en="Iran",
            name_fa="ایران",
            name_ar="إيران",
            iso_code="IR"
        )
        uae = Country(
            name="United Arab Emirates",
            name_en="United Arab Emirates",
            name_fa="امارات متحده عربی",
            name_ar="الإمارات العربية المتحدة",
            iso_code="AE"
        )
        
        test_db.add_all([iran, uae])
        await test_db.flush()
        
        # ایجاد شهرها
        tehran = City(
            name="Tehran",
            name_en="Tehran",
            name_fa="تهران",
            name_ar="طهران",
            airport_code="IKA",
            country_id=iran.id
        )
        dubai = City(
            name="Dubai",
            name_en="Dubai",
            name_fa="دبی",
            name_ar="دبي",
            airport_code="DXB",
            country_id=uae.id
        )
        abu_dhabi = City(
            name="Abu Dhabi",
            name_en="Abu Dhabi",
            name_fa="ابوظبی",
            name_ar="أبو ظبي",
            airport_code="AUH",
            country_id=uae.id
        )
        
        test_db.add_all([tehran, dubai, abu_dhabi])
        await test_db.commit()
        
        return {
            'iran': iran,
            'uae': uae,
            'tehran': tehran,
            'dubai': dubai,
            'abu_dhabi': abu_dhabi
        }
    
    async def test_search_countries_english(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی کشورها با نام انگلیسی."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "Iran", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["name_en"] == "Iran" for c in data["items"])
    
    async def test_search_countries_persian(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی کشورها با نام فارسی."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "ایران", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["name_fa"] == "ایران" for c in data["items"])
    
    async def test_search_countries_arabic(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی کشورها با نام عربی."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "إيران", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["name_ar"] == "إيران" for c in data["items"])
    
    async def test_search_countries_iso_code(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی کشورها با کد ISO."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "IR", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["iso_code"] == "IR" for c in data["items"])
    
    async def test_search_cities_english(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی شهرها با نام انگلیسی."""
        uae_id = setup_locations['uae'].id
        
        response = await client.get(
            "/api/v1/locations/cities/search",
            params={"country_id": uae_id, "q": "Dubai", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["name_en"] == "Dubai" for c in data["items"])
    
    async def test_search_cities_persian(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی شهرها با نام فارسی."""
        iran_id = setup_locations['iran'].id
        
        response = await client.get(
            "/api/v1/locations/cities/search",
            params={"country_id": iran_id, "q": "تهران", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["name_fa"] == "تهران" for c in data["items"])
    
    async def test_search_cities_airport_code(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی شهرها با کد فرودگاه."""
        uae_id = setup_locations['uae'].id
        
        response = await client.get(
            "/api/v1/locations/cities/search",
            params={"country_id": uae_id, "q": "DXB", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(c["airport_code"] == "DXB" for c in data["items"])
    
    async def test_search_cities_invalid_country(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست جستجوی شهرها با کشور نامعتبر."""
        response = await client.get(
            "/api/v1/locations/cities/search",
            params={"country_id": 99999, "q": "test", "limit": 10}
        )
        
        assert response.status_code == 404
    
    async def test_get_all_countries(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت همه کشورها."""
        response = await client.get(
            "/api/v1/locations/countries",
            params={"limit": 250}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2
    
    async def test_get_country_by_id(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت اطلاعات یک کشور."""
        iran_id = setup_locations['iran'].id
        
        response = await client.get(f"/api/v1/locations/countries/{iran_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == iran_id
        assert data["name_en"] == "Iran"
        assert data["name_fa"] == "ایران"
        assert data["iso_code"] == "IR"
    
    async def test_get_country_not_found(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت کشور غیرموجود."""
        response = await client.get("/api/v1/locations/countries/99999")
        
        assert response.status_code == 404
    
    async def test_get_city_by_id(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت اطلاعات یک شهر."""
        tehran_id = setup_locations['tehran'].id
        
        response = await client.get(f"/api/v1/locations/cities/{tehran_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == tehran_id
        assert data["name_en"] == "Tehran"
        assert data["name_fa"] == "تهران"
        assert data["airport_code"] == "IKA"
    
    async def test_get_city_not_found(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت شهر غیرموجود."""
        response = await client.get("/api/v1/locations/cities/99999")
        
        assert response.status_code == 404
    
    async def test_get_cities_by_country(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت همه شهرهای یک کشور."""
        uae_id = setup_locations['uae'].id
        
        response = await client.get(
            f"/api/v1/locations/countries/{uae_id}/cities",
            params={"limit": 500}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2  # Dubai and Abu Dhabi
        assert len(data["items"]) >= 2
        assert all(c["country_id"] == uae_id for c in data["items"])
    
    async def test_get_cities_by_invalid_country(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست دریافت شهرهای کشور نامعتبر."""
        response = await client.get(
            "/api/v1/locations/countries/99999/cities",
            params={"limit": 500}
        )
        
        assert response.status_code == 404
    
    async def test_search_countries_limit(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست محدودیت تعداد نتایج جستجوی کشورها."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "a", "limit": 1}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 1
    
    async def test_search_cities_limit(
        self,
        client: AsyncClient,
        setup_locations: dict
    ):
        """تست محدودیت تعداد نتایج جستجوی شهرها."""
        uae_id = setup_locations['uae'].id
        
        response = await client.get(
            "/api/v1/locations/cities/search",
            params={"country_id": uae_id, "q": "a", "limit": 1}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 1


class TestLocationCurrency:
    """تست‌های currency_code برای کشورها."""
    
    @pytest.fixture
    async def setup_locations_with_currency(self, test_db: AsyncSession):
        """ایجاد کشورها با currency_code."""
        iran = Country(
            name="Iran",
            name_en="Iran",
            name_fa="ایران",
            name_ar="إيران",
            iso_code="IR",
            currency_code="IRR"
        )
        uae = Country(
            name="United Arab Emirates",
            name_en="United Arab Emirates",
            name_fa="امارات متحده عربی",
            name_ar="الإمارات العربية المتحدة",
            iso_code="AE",
            currency_code="AED"
        )
        usa = Country(
            name="United States",
            name_en="United States",
            name_fa="ایالات متحده",
            name_ar="الولايات المتحدة",
            iso_code="US",
            currency_code="USD"
        )
        
        test_db.add_all([iran, uae, usa])
        await test_db.commit()
        
        return {
            'iran': iran,
            'uae': uae,
            'usa': usa
        }
    
    async def test_country_includes_currency_code(
        self,
        client: AsyncClient,
        setup_locations_with_currency: dict
    ):
        """تست اینکه اطلاعات کشور شامل currency_code باشد."""
        iran = setup_locations_with_currency['iran']
        
        response = await client.get(f"/api/v1/locations/countries/{iran.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "currency_code" in data
        assert data["currency_code"] == "IRR"
    
    async def test_search_countries_includes_currency(
        self,
        client: AsyncClient,
        setup_locations_with_currency: dict
    ):
        """تست اینکه جستجوی کشورها currency_code را برگرداند."""
        response = await client.get(
            "/api/v1/locations/countries/search",
            params={"q": "Iran", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        
        iran = next((c for c in data["items"] if c["name_en"] == "Iran"), None)
        assert iran is not None
        assert "currency_code" in iran
        assert iran["currency_code"] == "IRR"
    
    async def test_all_countries_include_currency(
        self,
        client: AsyncClient,
        setup_locations_with_currency: dict
    ):
        """تست اینکه لیست همه کشورها currency_code داشته باشد."""
        response = await client.get(
            "/api/v1/locations/countries",
            params={"limit": 250}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # همه کشورها باید فیلد currency_code داشته باشند (حتی اگر None باشد)
        for country in data["items"]:
            assert "currency_code" in country


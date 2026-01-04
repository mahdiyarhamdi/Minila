"""Seed test data for development and demo purposes."""
import random
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.user import User
from ..models.community import Community
from ..models.membership import Membership
from ..models.card import Card, CardCommunity
from ..models.location import Country, City
from ..models.role import Role
from ..core.security import hash_password
from .logger import logger


# Test Users Data
TEST_USERS = [
    # English users
    {"email": "john.smith@example.com", "first_name": "John", "last_name": "Smith", "lang": "en"},
    {"email": "emily.johnson@example.com", "first_name": "Emily", "last_name": "Johnson", "lang": "en"},
    {"email": "michael.brown@example.com", "first_name": "Michael", "last_name": "Brown", "lang": "en"},
    {"email": "sarah.wilson@example.com", "first_name": "Sarah", "last_name": "Wilson", "lang": "en"},
    {"email": "david.lee@example.com", "first_name": "David", "last_name": "Lee", "lang": "en"},
    {"email": "jessica.taylor@example.com", "first_name": "Jessica", "last_name": "Taylor", "lang": "en"},
    {"email": "chris.anderson@example.com", "first_name": "Chris", "last_name": "Anderson", "lang": "en"},
    {"email": "amanda.martinez@example.com", "first_name": "Amanda", "last_name": "Martinez", "lang": "en"},
    # Arabic users
    {"email": "ahmed.hassan@example.com", "first_name": "أحمد", "last_name": "حسن", "lang": "ar"},
    {"email": "fatima.ali@example.com", "first_name": "فاطمة", "last_name": "علي", "lang": "ar"},
    {"email": "omar.mohamed@example.com", "first_name": "عمر", "last_name": "محمد", "lang": "ar"},
    {"email": "layla.ibrahim@example.com", "first_name": "ليلى", "last_name": "إبراهيم", "lang": "ar"},
    {"email": "khalid.ahmad@example.com", "first_name": "خالد", "last_name": "أحمد", "lang": "ar"},
    {"email": "nour.salem@example.com", "first_name": "نور", "last_name": "سالم", "lang": "ar"},
    {"email": "yasmin.rashid@example.com", "first_name": "ياسمين", "last_name": "راشد", "lang": "ar"},
    {"email": "tariq.mansour@example.com", "first_name": "طارق", "last_name": "منصور", "lang": "ar"},
]

# Test Communities Data
TEST_COMMUNITIES = [
    {
        "name": "Dubai Travelers Network",
        "slug": "dubai_travelers",
        "bio": "🌍 Welcome to Dubai Travelers Network!\n\nConnect with fellow travelers heading to or from Dubai. Share travel tips, find package delivery opportunities, and coordinate with trusted community members.\n\n✅ Share your travel dates\n✅ Find reliable travelers\n✅ Safe package coordination\n\nJoin us and make every trip count!"
    },
    {
        "name": "London-Gulf Express",
        "slug": "london_gulf",
        "bio": "🇬🇧🇦🇪 Connecting London and the Gulf Region!\n\nThe premier community for travelers between UK and Gulf countries. Whether you're sending important documents, gifts, or need something delivered urgently.\n\n📦 Regular travelers weekly\n💼 Business & personal deliveries\n🤝 Trusted community since 2023"
    },
    {
        "name": "شبكة المسافرين العرب",
        "slug": "arab_travelers",
        "bio": "🌟 أهلاً بكم في شبكة المسافرين العرب!\n\nمجتمع موثوق للمسافرين العرب حول العالم. نساعدكم في:\n\n✈️ التنسيق مع مسافرين موثوقين\n📦 إرسال واستلام الطرود بأمان\n🤝 بناء علاقات مع مسافرين من مختلف البلدان\n\nانضم إلينا اليوم!"
    },
    {
        "name": "USA-Middle East Connect",
        "slug": "usa_middleeast",
        "bio": "🇺🇸🌍 Bridging USA and Middle East!\n\nYour trusted network for package delivery between the United States and Middle Eastern countries.\n\n🎁 Send gifts to loved ones\n📄 Important document delivery\n💊 Medical supplies when needed\n⏰ Fast and reliable service\n\nJoin thousands of satisfied members!"
    },
    {
        "name": "European Senders Hub",
        "slug": "europe_senders",
        "bio": "🇪🇺 European Senders Hub - Your Gateway to Europe!\n\nConnecting senders and travelers across European cities. From Paris to Berlin, London to Rome.\n\n🚄 Weekly travelers on major routes\n📦 All package sizes welcome\n💯 Verified community members\n🔒 Secure coordination platform"
    },
    {
        "name": "مجتمع الخليج للشحن",
        "slug": "gulf_shipping",
        "bio": "🏆 مجتمع الخليج للشحن - الأفضل في المنطقة!\n\nنربط بين المسافرين والمرسلين في دول الخليج العربي:\n\n🇦🇪 الإمارات\n🇸🇦 السعودية\n🇶🇦 قطر\n🇰🇼 الكويت\n🇧🇭 البحرين\n🇴🇲 عُمان\n\n✨ خدمة موثوقة وسريعة\n💎 أعضاء مميزون"
    },
    {
        "name": "Asia Pacific Travelers",
        "slug": "asia_pacific",
        "bio": "🌏 Asia Pacific Travelers Community!\n\nConnecting travelers across the Asia Pacific region. From Tokyo to Sydney, Singapore to Mumbai.\n\n🎌 Cultural gift exchanges\n📱 Tech product deliveries\n🍜 Special food items\n👔 Business document courier\n\nYour trusted Asia-Pacific network!"
    },
    {
        "name": "رحلات الشرق الأوسط",
        "slug": "middle_east_trips",
        "bio": "✨ رحلات الشرق الأوسط - نصل العالم ببعضه!\n\nمجتمع للمسافرين بين دول الشرق الأوسط والعالم.\n\n🎁 هدايا للعائلة والأصدقاء\n📚 كتب ومستلزمات دراسية\n💼 مستندات عمل مهمة\n🏥 مستلزمات طبية عاجلة\n\nمسافرون يومياً - انضم الآن!"
    },
]

# Card descriptions templates
CARD_DESCRIPTIONS_TRAVELER_EN = [
    "Flying on {date}. Can carry up to {weight}kg. Prefer small to medium packages. Contact me for details!",
    "Business trip to {dest}. Happy to help deliver packages along the way. Professional and reliable.",
    "Regular traveler on this route. Available for package delivery. Reasonable rates.",
    "Traveling light, plenty of luggage space available. Can accommodate various package sizes.",
    "Frequent flyer between these cities. Trusted by many community members. Fast delivery guaranteed!",
]

CARD_DESCRIPTIONS_TRAVELER_AR = [
    "مسافر في {date}. يمكنني حمل حتى {weight} كجم. أفضل الطرود الصغيرة والمتوسطة. تواصلوا معي للتفاصيل!",
    "رحلة عمل إلى {dest}. سعيد بمساعدتكم في توصيل الطرود. موثوق ومحترف.",
    "مسافر منتظم على هذا الخط. متاح لتوصيل الطرود بأسعار معقولة.",
    "أسافر بحقائب خفيفة، مساحة كبيرة متاحة للطرود المختلفة.",
    "مسافر دائم بين هاتين المدينتين. موثوق من أعضاء المجتمع. توصيل سريع مضمون!",
]

CARD_DESCRIPTIONS_SENDER_EN = [
    "Need to send a gift package to family. Looking for a reliable traveler. Will pay {price}/kg.",
    "Important documents need delivery. Time-sensitive. Willing to pay premium for fast service.",
    "Sending personal items. Package is well-packed and ready. Flexible on dates.",
    "Medical supplies for family member. Urgent delivery needed. Thank you for your help!",
    "Electronics need careful handling. Looking for experienced traveler. Good payment offered.",
]

CARD_DESCRIPTIONS_SENDER_AR = [
    "أحتاج إرسال هدية للعائلة. أبحث عن مسافر موثوق. سأدفع {price} للكيلو.",
    "مستندات مهمة تحتاج توصيل عاجل. مستعد لدفع سعر مميز للخدمة السريعة.",
    "إرسال أغراض شخصية. الطرد معبأ وجاهز. مرن في المواعيد.",
    "مستلزمات طبية لأحد أفراد العائلة. توصيل عاجل مطلوب. شكراً لمساعدتكم!",
    "إلكترونيات تحتاج عناية خاصة. أبحث عن مسافر ذو خبرة. دفع جيد.",
]


async def get_or_create_cities(db: AsyncSession) -> dict:
    """Get existing cities or return empty if not found."""
    cities = {}
    
    # Try to get some common cities
    result = await db.execute(
        select(City).join(Country).limit(20)
    )
    city_list = result.scalars().all()
    
    for city in city_list:
        cities[city.id] = city
    
    return cities


async def get_owner_role(db: AsyncSession) -> Optional[Role]:
    """Get the owner role (highest level in community)."""
    result = await db.execute(
        select(Role).where(Role.name == "owner")
    )
    return result.scalar_one_or_none()


async def get_member_role(db: AsyncSession) -> Optional[Role]:
    """Get the member role."""
    result = await db.execute(
        select(Role).where(Role.name == "member")
    )
    return result.scalar_one_or_none()


async def seed_test_users(db: AsyncSession) -> list[User]:
    """Create test users."""
    created_users = []
    default_password = hash_password("Test@123")
    
    for user_data in TEST_USERS:
        # Check if user exists
        result = await db.execute(
            select(User).where(User.email == user_data["email"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            created_users.append(existing)
            continue
        
        user = User(
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            password=default_password,
            email_verified=True,
            is_active=True,
            preferred_language=user_data["lang"]
        )
        db.add(user)
        created_users.append(user)
        logger.info(f"Created test user: {user_data['email']}")
    
    await db.flush()
    return created_users


async def seed_test_communities(db: AsyncSession, owner: User) -> list[Community]:
    """Create test communities."""
    created_communities = []
    
    for comm_data in TEST_COMMUNITIES:
        # Check if community exists
        result = await db.execute(
            select(Community).where(Community.slug == comm_data["slug"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            created_communities.append(existing)
            continue
        
        community = Community(
            name=comm_data["name"],
            slug=comm_data["slug"],
            bio=comm_data["bio"],
            owner_id=owner.id
        )
        db.add(community)
        created_communities.append(community)
        logger.info(f"Created test community: {comm_data['name']}")
    
    await db.flush()
    return created_communities


async def add_admins_to_communities(
    db: AsyncSession, 
    communities: list[Community],
    owner_role: Role
) -> None:
    """Add all admin users as owners of all communities."""
    # Get all admin users
    result = await db.execute(
        select(User).where(User.is_admin == True)
    )
    admins = result.scalars().all()
    
    for admin in admins:
        for community in communities:
            # Check if membership exists
            result = await db.execute(
                select(Membership).where(
                    Membership.user_id == admin.id,
                    Membership.community_id == community.id
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update to owner role if not already
                if existing.role_id != owner_role.id:
                    existing.role_id = owner_role.id
                continue
            
            membership = Membership(
                user_id=admin.id,
                community_id=community.id,
                role_id=owner_role.id,
                is_active=True
            )
            db.add(membership)
            logger.info(f"Added admin {admin.email} as owner of community {community.name}")
    
    await db.flush()


async def add_users_to_communities(
    db: AsyncSession,
    users: list[User],
    communities: list[Community],
    member_role: Role
) -> None:
    """Add regular users to random communities."""
    for user in users:
        # Each user joins 2-4 random communities
        num_communities = random.randint(2, min(4, len(communities)))
        selected_communities = random.sample(communities, num_communities)
        
        for community in selected_communities:
            # Check if membership exists
            result = await db.execute(
                select(Membership).where(
                    Membership.user_id == user.id,
                    Membership.community_id == community.id
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                continue
            
            membership = Membership(
                user_id=user.id,
                community_id=community.id,
                role_id=member_role.id,
                is_active=True
            )
            db.add(membership)
    
    await db.flush()


async def seed_test_cards(
    db: AsyncSession,
    users: list[User],
    communities: list[Community],
    cities: dict
) -> list[Card]:
    """Create test cards."""
    created_cards = []
    
    if len(cities) < 2:
        logger.warning("Not enough cities to create cards")
        return created_cards
    
    city_ids = list(cities.keys())
    
    # Create 15-20 cards
    num_cards = random.randint(15, 20)
    
    for i in range(num_cards):
        user = random.choice(users)
        is_sender = random.choice([True, False])
        
        # Random origin and destination (different cities)
        origin_city_id = random.choice(city_ids)
        dest_city_id = random.choice([c for c in city_ids if c != origin_city_id])
        
        origin_city = cities[origin_city_id]
        dest_city = cities[dest_city_id]
        
        # Generate dates
        start_date = datetime.now() + timedelta(days=random.randint(1, 30))
        end_date = start_date + timedelta(days=random.randint(3, 14))
        
        # Select description based on language and type
        is_arabic = user.preferred_language == "ar"
        weight = random.randint(2, 15)
        price = random.randint(5, 25)
        
        if is_sender:
            templates = CARD_DESCRIPTIONS_SENDER_AR if is_arabic else CARD_DESCRIPTIONS_SENDER_EN
        else:
            templates = CARD_DESCRIPTIONS_TRAVELER_AR if is_arabic else CARD_DESCRIPTIONS_TRAVELER_EN
        
        description = random.choice(templates).format(
            date=start_date.strftime("%Y-%m-%d"),
            dest=dest_city.name if hasattr(dest_city, 'name') else "destination",
            weight=weight,
            price=price
        )
        
        card = Card(
            owner_id=user.id,
            is_sender=is_sender,
            origin_country_id=origin_city.country_id,
            origin_city_id=origin_city_id,
            destination_country_id=dest_city.country_id,
            destination_city_id=dest_city_id,
            start_time_frame=start_date if is_sender else None,
            end_time_frame=end_date if is_sender else None,
            ticket_date_time=start_date if not is_sender else None,
            weight=float(weight) if is_sender else float(random.randint(5, 20)),
            is_packed=random.choice([True, False]) if is_sender else None,
            price_per_kg=float(price),
            currency="USD",
            description=description
        )
        db.add(card)
        created_cards.append(card)
    
    await db.flush()
    
    # Associate cards with communities
    for card in created_cards:
        # Each card in 1-3 communities
        num_comms = random.randint(1, min(3, len(communities)))
        selected_comms = random.sample(communities, num_comms)
        
        for comm in selected_comms:
            card_comm = CardCommunity(
                card_id=card.id,
                community_id=comm.id
            )
            db.add(card_comm)
    
    await db.flush()
    logger.info(f"Created {len(created_cards)} test cards")
    
    return created_cards


async def seed_all_test_data(db: AsyncSession) -> dict:
    """Main function to seed all test data."""
    logger.info("🌱 Starting test data seeding...")
    
    result = {
        "users_created": 0,
        "communities_created": 0,
        "cards_created": 0,
        "memberships_created": 0
    }
    
    try:
        # Get roles
        owner_role = await get_owner_role(db)
        member_role = await get_member_role(db)
        
        if not owner_role or not member_role:
            logger.error("Roles not found. Please run migrations first.")
            return result
        
        # Get cities
        cities = await get_or_create_cities(db)
        if len(cities) < 2:
            logger.error("Not enough cities in database. Please seed location data first.")
            return result
        
        logger.info(f"Found {len(cities)} cities")
        
        # Get first admin as community owner
        admin_result = await db.execute(
            select(User).where(User.is_admin == True).limit(1)
        )
        owner = admin_result.scalar_one_or_none()
        
        if not owner:
            logger.error("No admin user found. Please create admin first.")
            return result
        
        # Seed users
        users = await seed_test_users(db)
        result["users_created"] = len([u for u in users if u.id is None or u.created_at is None])
        logger.info(f"✅ Users ready: {len(users)}")
        
        # Seed communities
        communities = await seed_test_communities(db, owner)
        result["communities_created"] = len(communities)
        logger.info(f"✅ Communities ready: {len(communities)}")
        
        # Add admins to all communities
        await add_admins_to_communities(db, communities, owner_role)
        logger.info("✅ Admins added to all communities as owners")
        
        # Add users to communities
        await add_users_to_communities(db, users, communities, member_role)
        logger.info("✅ Users added to communities")
        
        # Seed cards
        cards = await seed_test_cards(db, users, communities, cities)
        result["cards_created"] = len(cards)
        logger.info(f"✅ Cards created: {len(cards)}")
        
        await db.commit()
        logger.info("🎉 Test data seeding completed successfully!")
        
        return result
        
    except Exception as e:
        logger.error(f"Error seeding test data: {e}")
        await db.rollback()
        raise


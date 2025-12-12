"""
Script to seed world countries and major cities into the database.
Run with: python -m scripts.seed_locations
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models.location import Country, City
from app.core.config import get_settings

settings = get_settings()

# World countries data with ISO codes and currency codes
COUNTRIES = [
    # Middle East
    {"name": "Iran", "name_en": "Iran", "name_fa": "ایران", "name_ar": "إيران", "iso_code": "IR", "currency_code": "IRR"},
    {"name": "United Arab Emirates", "name_en": "United Arab Emirates", "name_fa": "امارات متحده عربی", "name_ar": "الإمارات العربية المتحدة", "iso_code": "AE", "currency_code": "AED"},
    {"name": "Turkey", "name_en": "Turkey", "name_fa": "ترکیه", "name_ar": "تركيا", "iso_code": "TR", "currency_code": "TRY"},
    {"name": "Saudi Arabia", "name_en": "Saudi Arabia", "name_fa": "عربستان سعودی", "name_ar": "المملكة العربية السعودية", "iso_code": "SA", "currency_code": "SAR"},
    {"name": "Qatar", "name_en": "Qatar", "name_fa": "قطر", "name_ar": "قطر", "iso_code": "QA", "currency_code": "QAR"},
    {"name": "Kuwait", "name_en": "Kuwait", "name_fa": "کویت", "name_ar": "الكويت", "iso_code": "KW", "currency_code": "KWD"},
    {"name": "Bahrain", "name_en": "Bahrain", "name_fa": "بحرین", "name_ar": "البحرين", "iso_code": "BH", "currency_code": "BHD"},
    {"name": "Oman", "name_en": "Oman", "name_fa": "عمان", "name_ar": "عمان", "iso_code": "OM", "currency_code": "OMR"},
    {"name": "Iraq", "name_en": "Iraq", "name_fa": "عراق", "name_ar": "العراق", "iso_code": "IQ", "currency_code": "IQD"},
    {"name": "Jordan", "name_en": "Jordan", "name_fa": "اردن", "name_ar": "الأردن", "iso_code": "JO", "currency_code": "JOD"},
    {"name": "Lebanon", "name_en": "Lebanon", "name_fa": "لبنان", "name_ar": "لبنان", "iso_code": "LB", "currency_code": "LBP"},
    {"name": "Syria", "name_en": "Syria", "name_fa": "سوریه", "name_ar": "سوريا", "iso_code": "SY", "currency_code": "SYP"},
    {"name": "Israel", "name_en": "Israel", "name_fa": "اسرائیل", "name_ar": "إسرائيل", "iso_code": "IL", "currency_code": "ILS"},
    {"name": "Palestine", "name_en": "Palestine", "name_fa": "فلسطین", "name_ar": "فلسطين", "iso_code": "PS", "currency_code": "ILS"},
    {"name": "Yemen", "name_en": "Yemen", "name_fa": "یمن", "name_ar": "اليمن", "iso_code": "YE", "currency_code": "YER"},
    
    # Europe
    {"name": "United Kingdom", "name_en": "United Kingdom", "name_fa": "بریتانیا", "name_ar": "المملكة المتحدة", "iso_code": "GB", "currency_code": "GBP"},
    {"name": "Germany", "name_en": "Germany", "name_fa": "آلمان", "name_ar": "ألمانيا", "iso_code": "DE", "currency_code": "EUR"},
    {"name": "France", "name_en": "France", "name_fa": "فرانسه", "name_ar": "فرنسا", "iso_code": "FR", "currency_code": "EUR"},
    {"name": "Italy", "name_en": "Italy", "name_fa": "ایتالیا", "name_ar": "إيطاليا", "iso_code": "IT", "currency_code": "EUR"},
    {"name": "Spain", "name_en": "Spain", "name_fa": "اسپانیا", "name_ar": "إسبانيا", "iso_code": "ES", "currency_code": "EUR"},
    {"name": "Netherlands", "name_en": "Netherlands", "name_fa": "هلند", "name_ar": "هولندا", "iso_code": "NL", "currency_code": "EUR"},
    {"name": "Belgium", "name_en": "Belgium", "name_fa": "بلژیک", "name_ar": "بلجيكا", "iso_code": "BE", "currency_code": "EUR"},
    {"name": "Switzerland", "name_en": "Switzerland", "name_fa": "سوئیس", "name_ar": "سويسرا", "iso_code": "CH", "currency_code": "CHF"},
    {"name": "Austria", "name_en": "Austria", "name_fa": "اتریش", "name_ar": "النمسا", "iso_code": "AT", "currency_code": "EUR"},
    {"name": "Sweden", "name_en": "Sweden", "name_fa": "سوئد", "name_ar": "السويد", "iso_code": "SE", "currency_code": "SEK"},
    {"name": "Norway", "name_en": "Norway", "name_fa": "نروژ", "name_ar": "النرويج", "iso_code": "NO", "currency_code": "NOK"},
    {"name": "Denmark", "name_en": "Denmark", "name_fa": "دانمارک", "name_ar": "الدنمارك", "iso_code": "DK", "currency_code": "DKK"},
    {"name": "Finland", "name_en": "Finland", "name_fa": "فنلاند", "name_ar": "فنلندا", "iso_code": "FI", "currency_code": "EUR"},
    {"name": "Poland", "name_en": "Poland", "name_fa": "لهستان", "name_ar": "بولندا", "iso_code": "PL", "currency_code": "PLN"},
    {"name": "Czech Republic", "name_en": "Czech Republic", "name_fa": "جمهوری چک", "name_ar": "التشيك", "iso_code": "CZ", "currency_code": "CZK"},
    {"name": "Hungary", "name_en": "Hungary", "name_fa": "مجارستان", "name_ar": "المجر", "iso_code": "HU", "currency_code": "HUF"},
    {"name": "Greece", "name_en": "Greece", "name_fa": "یونان", "name_ar": "اليونان", "iso_code": "GR", "currency_code": "EUR"},
    {"name": "Portugal", "name_en": "Portugal", "name_fa": "پرتغال", "name_ar": "البرتغال", "iso_code": "PT", "currency_code": "EUR"},
    {"name": "Ireland", "name_en": "Ireland", "name_fa": "ایرلند", "name_ar": "أيرلندا", "iso_code": "IE", "currency_code": "EUR"},
    {"name": "Romania", "name_en": "Romania", "name_fa": "رومانی", "name_ar": "رومانيا", "iso_code": "RO", "currency_code": "RON"},
    {"name": "Ukraine", "name_en": "Ukraine", "name_fa": "اوکراین", "name_ar": "أوكرانيا", "iso_code": "UA", "currency_code": "UAH"},
    {"name": "Russia", "name_en": "Russia", "name_fa": "روسیه", "name_ar": "روسيا", "iso_code": "RU", "currency_code": "RUB"},
    
    # North America
    {"name": "United States", "name_en": "United States", "name_fa": "آمریکا", "name_ar": "الولايات المتحدة", "iso_code": "US", "currency_code": "USD"},
    {"name": "Canada", "name_en": "Canada", "name_fa": "کانادا", "name_ar": "كندا", "iso_code": "CA", "currency_code": "CAD"},
    {"name": "Mexico", "name_en": "Mexico", "name_fa": "مکزیک", "name_ar": "المكسيك", "iso_code": "MX", "currency_code": "MXN"},
    
    # South America
    {"name": "Brazil", "name_en": "Brazil", "name_fa": "برزیل", "name_ar": "البرازيل", "iso_code": "BR", "currency_code": "BRL"},
    {"name": "Argentina", "name_en": "Argentina", "name_fa": "آرژانتین", "name_ar": "الأرجنتين", "iso_code": "AR", "currency_code": "ARS"},
    {"name": "Colombia", "name_en": "Colombia", "name_fa": "کلمبیا", "name_ar": "كولومبيا", "iso_code": "CO", "currency_code": "COP"},
    {"name": "Chile", "name_en": "Chile", "name_fa": "شیلی", "name_ar": "تشيلي", "iso_code": "CL", "currency_code": "CLP"},
    {"name": "Peru", "name_en": "Peru", "name_fa": "پرو", "name_ar": "بيرو", "iso_code": "PE", "currency_code": "PEN"},
    
    # Asia
    {"name": "China", "name_en": "China", "name_fa": "چین", "name_ar": "الصين", "iso_code": "CN", "currency_code": "CNY"},
    {"name": "Japan", "name_en": "Japan", "name_fa": "ژاپن", "name_ar": "اليابان", "iso_code": "JP", "currency_code": "JPY"},
    {"name": "South Korea", "name_en": "South Korea", "name_fa": "کره جنوبی", "name_ar": "كوريا الجنوبية", "iso_code": "KR", "currency_code": "KRW"},
    {"name": "India", "name_en": "India", "name_fa": "هند", "name_ar": "الهند", "iso_code": "IN", "currency_code": "INR"},
    {"name": "Pakistan", "name_en": "Pakistan", "name_fa": "پاکستان", "name_ar": "باكستان", "iso_code": "PK", "currency_code": "PKR"},
    {"name": "Bangladesh", "name_en": "Bangladesh", "name_fa": "بنگلادش", "name_ar": "بنغلاديش", "iso_code": "BD", "currency_code": "BDT"},
    {"name": "Indonesia", "name_en": "Indonesia", "name_fa": "اندونزی", "name_ar": "إندونيسيا", "iso_code": "ID", "currency_code": "IDR"},
    {"name": "Malaysia", "name_en": "Malaysia", "name_fa": "مالزی", "name_ar": "ماليزيا", "iso_code": "MY", "currency_code": "MYR"},
    {"name": "Singapore", "name_en": "Singapore", "name_fa": "سنگاپور", "name_ar": "سنغافورة", "iso_code": "SG", "currency_code": "SGD"},
    {"name": "Thailand", "name_en": "Thailand", "name_fa": "تایلند", "name_ar": "تايلاند", "iso_code": "TH", "currency_code": "THB"},
    {"name": "Vietnam", "name_en": "Vietnam", "name_fa": "ویتنام", "name_ar": "فيتنام", "iso_code": "VN", "currency_code": "VND"},
    {"name": "Philippines", "name_en": "Philippines", "name_fa": "فیلیپین", "name_ar": "الفلبين", "iso_code": "PH", "currency_code": "PHP"},
    {"name": "Afghanistan", "name_en": "Afghanistan", "name_fa": "افغانستان", "name_ar": "أفغانستان", "iso_code": "AF", "currency_code": "AFN"},
    {"name": "Kazakhstan", "name_en": "Kazakhstan", "name_fa": "قزاقستان", "name_ar": "كازاخستان", "iso_code": "KZ", "currency_code": "KZT"},
    {"name": "Uzbekistan", "name_en": "Uzbekistan", "name_fa": "ازبکستان", "name_ar": "أوزبكستان", "iso_code": "UZ", "currency_code": "UZS"},
    {"name": "Tajikistan", "name_en": "Tajikistan", "name_fa": "تاجیکستان", "name_ar": "طاجيكستان", "iso_code": "TJ", "currency_code": "TJS"},
    {"name": "Turkmenistan", "name_en": "Turkmenistan", "name_fa": "ترکمنستان", "name_ar": "تركمانستان", "iso_code": "TM", "currency_code": "TMT"},
    {"name": "Azerbaijan", "name_en": "Azerbaijan", "name_fa": "آذربایجان", "name_ar": "أذربيجان", "iso_code": "AZ", "currency_code": "AZN"},
    {"name": "Georgia", "name_en": "Georgia", "name_fa": "گرجستان", "name_ar": "جورجيا", "iso_code": "GE", "currency_code": "GEL"},
    {"name": "Armenia", "name_en": "Armenia", "name_fa": "ارمنستان", "name_ar": "أرمينيا", "iso_code": "AM", "currency_code": "AMD"},
    
    # Africa
    {"name": "Egypt", "name_en": "Egypt", "name_fa": "مصر", "name_ar": "مصر", "iso_code": "EG", "currency_code": "EGP"},
    {"name": "South Africa", "name_en": "South Africa", "name_fa": "آفریقای جنوبی", "name_ar": "جنوب أفريقيا", "iso_code": "ZA", "currency_code": "ZAR"},
    {"name": "Morocco", "name_en": "Morocco", "name_fa": "مراکش", "name_ar": "المغرب", "iso_code": "MA", "currency_code": "MAD"},
    {"name": "Tunisia", "name_en": "Tunisia", "name_fa": "تونس", "name_ar": "تونس", "iso_code": "TN", "currency_code": "TND"},
    {"name": "Algeria", "name_en": "Algeria", "name_fa": "الجزایر", "name_ar": "الجزائر", "iso_code": "DZ", "currency_code": "DZD"},
    {"name": "Nigeria", "name_en": "Nigeria", "name_fa": "نیجریه", "name_ar": "نيجيريا", "iso_code": "NG", "currency_code": "NGN"},
    {"name": "Kenya", "name_en": "Kenya", "name_fa": "کنیا", "name_ar": "كينيا", "iso_code": "KE", "currency_code": "KES"},
    {"name": "Ethiopia", "name_en": "Ethiopia", "name_fa": "اتیوپی", "name_ar": "إثيوبيا", "iso_code": "ET", "currency_code": "ETB"},
    {"name": "Ghana", "name_en": "Ghana", "name_fa": "غنا", "name_ar": "غانا", "iso_code": "GH", "currency_code": "GHS"},
    {"name": "Libya", "name_en": "Libya", "name_fa": "لیبی", "name_ar": "ليبيا", "iso_code": "LY", "currency_code": "LYD"},
    {"name": "Sudan", "name_en": "Sudan", "name_fa": "سودان", "name_ar": "السودان", "iso_code": "SD", "currency_code": "SDG"},
    
    # Oceania
    {"name": "Australia", "name_en": "Australia", "name_fa": "استرالیا", "name_ar": "أستراليا", "iso_code": "AU", "currency_code": "AUD"},
    {"name": "New Zealand", "name_en": "New Zealand", "name_fa": "نیوزیلند", "name_ar": "نيوزيلندا", "iso_code": "NZ", "currency_code": "NZD"},
]

# Major cities data by country ISO code
CITIES = {
    # Iran
    "IR": [
        {"name": "Tehran", "name_en": "Tehran", "name_fa": "تهران", "name_ar": "طهران", "airport_code": "IKA"},
        {"name": "Mashhad", "name_en": "Mashhad", "name_fa": "مشهد", "name_ar": "مشهد", "airport_code": "MHD"},
        {"name": "Isfahan", "name_en": "Isfahan", "name_fa": "اصفهان", "name_ar": "أصفهان", "airport_code": "IFN"},
        {"name": "Shiraz", "name_en": "Shiraz", "name_fa": "شیراز", "name_ar": "شيراز", "airport_code": "SYZ"},
        {"name": "Tabriz", "name_en": "Tabriz", "name_fa": "تبریز", "name_ar": "تبريز", "airport_code": "TBZ"},
        {"name": "Karaj", "name_en": "Karaj", "name_fa": "کرج", "name_ar": "كرج", "airport_code": None},
        {"name": "Ahvaz", "name_en": "Ahvaz", "name_fa": "اهواز", "name_ar": "الأهواز", "airport_code": "AWZ"},
        {"name": "Qom", "name_en": "Qom", "name_fa": "قم", "name_ar": "قم", "airport_code": None},
        {"name": "Kerman", "name_en": "Kerman", "name_fa": "کرمان", "name_ar": "كرمان", "airport_code": "KER"},
        {"name": "Urmia", "name_en": "Urmia", "name_fa": "ارومیه", "name_ar": "أرومية", "airport_code": "OMH"},
        {"name": "Rasht", "name_en": "Rasht", "name_fa": "رشت", "name_ar": "رشت", "airport_code": "RAS"},
        {"name": "Yazd", "name_en": "Yazd", "name_fa": "یزد", "name_ar": "يزد", "airport_code": "AZD"},
        {"name": "Hamadan", "name_en": "Hamadan", "name_fa": "همدان", "name_ar": "همدان", "airport_code": "HDM"},
        {"name": "Arak", "name_en": "Arak", "name_fa": "اراک", "name_ar": "أراك", "airport_code": None},
        {"name": "Bandar Abbas", "name_en": "Bandar Abbas", "name_fa": "بندرعباس", "name_ar": "بندر عباس", "airport_code": "BND"},
        {"name": "Kish Island", "name_en": "Kish Island", "name_fa": "کیش", "name_ar": "جزيرة كيش", "airport_code": "KIH"},
        {"name": "Qeshm", "name_en": "Qeshm", "name_fa": "قشم", "name_ar": "قشم", "airport_code": "GSM"},
    ],
    
    # UAE
    "AE": [
        {"name": "Dubai", "name_en": "Dubai", "name_fa": "دبی", "name_ar": "دبي", "airport_code": "DXB"},
        {"name": "Abu Dhabi", "name_en": "Abu Dhabi", "name_fa": "ابوظبی", "name_ar": "أبو ظبي", "airport_code": "AUH"},
        {"name": "Sharjah", "name_en": "Sharjah", "name_fa": "شارجه", "name_ar": "الشارقة", "airport_code": "SHJ"},
        {"name": "Ajman", "name_en": "Ajman", "name_fa": "عجمان", "name_ar": "عجمان", "airport_code": None},
        {"name": "Ras Al Khaimah", "name_en": "Ras Al Khaimah", "name_fa": "راس الخیمه", "name_ar": "رأس الخيمة", "airport_code": "RKT"},
        {"name": "Fujairah", "name_en": "Fujairah", "name_fa": "فجیره", "name_ar": "الفجيرة", "airport_code": "FJR"},
        {"name": "Al Ain", "name_en": "Al Ain", "name_fa": "العین", "name_ar": "العين", "airport_code": "AAN"},
    ],
    
    # Turkey
    "TR": [
        {"name": "Istanbul", "name_en": "Istanbul", "name_fa": "استانبول", "name_ar": "إسطنبول", "airport_code": "IST"},
        {"name": "Ankara", "name_en": "Ankara", "name_fa": "آنکارا", "name_ar": "أنقرة", "airport_code": "ESB"},
        {"name": "Izmir", "name_en": "Izmir", "name_fa": "ازمیر", "name_ar": "إزمير", "airport_code": "ADB"},
        {"name": "Antalya", "name_en": "Antalya", "name_fa": "آنتالیا", "name_ar": "أنطاليا", "airport_code": "AYT"},
        {"name": "Bursa", "name_en": "Bursa", "name_fa": "بورسا", "name_ar": "بورصة", "airport_code": None},
        {"name": "Adana", "name_en": "Adana", "name_fa": "آدانا", "name_ar": "أضنة", "airport_code": "ADA"},
        {"name": "Konya", "name_en": "Konya", "name_fa": "قونیه", "name_ar": "قونية", "airport_code": "KYA"},
        {"name": "Trabzon", "name_en": "Trabzon", "name_fa": "ترابزون", "name_ar": "طرابزون", "airport_code": "TZX"},
    ],
    
    # Saudi Arabia
    "SA": [
        {"name": "Riyadh", "name_en": "Riyadh", "name_fa": "ریاض", "name_ar": "الرياض", "airport_code": "RUH"},
        {"name": "Jeddah", "name_en": "Jeddah", "name_fa": "جده", "name_ar": "جدة", "airport_code": "JED"},
        {"name": "Mecca", "name_en": "Mecca", "name_fa": "مکه", "name_ar": "مكة المكرمة", "airport_code": None},
        {"name": "Medina", "name_en": "Medina", "name_fa": "مدینه", "name_ar": "المدينة المنورة", "airport_code": "MED"},
        {"name": "Dammam", "name_en": "Dammam", "name_fa": "دمام", "name_ar": "الدمام", "airport_code": "DMM"},
        {"name": "Khobar", "name_en": "Khobar", "name_fa": "الخبر", "name_ar": "الخبر", "airport_code": None},
    ],
    
    # Qatar
    "QA": [
        {"name": "Doha", "name_en": "Doha", "name_fa": "دوحه", "name_ar": "الدوحة", "airport_code": "DOH"},
    ],
    
    # Kuwait
    "KW": [
        {"name": "Kuwait City", "name_en": "Kuwait City", "name_fa": "شهر کویت", "name_ar": "مدينة الكويت", "airport_code": "KWI"},
    ],
    
    # Bahrain
    "BH": [
        {"name": "Manama", "name_en": "Manama", "name_fa": "منامه", "name_ar": "المنامة", "airport_code": "BAH"},
    ],
    
    # Oman
    "OM": [
        {"name": "Muscat", "name_en": "Muscat", "name_fa": "مسقط", "name_ar": "مسقط", "airport_code": "MCT"},
        {"name": "Salalah", "name_en": "Salalah", "name_fa": "صلاله", "name_ar": "صلالة", "airport_code": "SLL"},
    ],
    
    # Iraq
    "IQ": [
        {"name": "Baghdad", "name_en": "Baghdad", "name_fa": "بغداد", "name_ar": "بغداد", "airport_code": "BGW"},
        {"name": "Basra", "name_en": "Basra", "name_fa": "بصره", "name_ar": "البصرة", "airport_code": "BSR"},
        {"name": "Erbil", "name_en": "Erbil", "name_fa": "اربیل", "name_ar": "أربيل", "airport_code": "EBL"},
        {"name": "Sulaymaniyah", "name_en": "Sulaymaniyah", "name_fa": "سلیمانیه", "name_ar": "السليمانية", "airport_code": "ISU"},
        {"name": "Najaf", "name_en": "Najaf", "name_fa": "نجف", "name_ar": "النجف", "airport_code": "NJF"},
        {"name": "Karbala", "name_en": "Karbala", "name_fa": "کربلا", "name_ar": "كربلاء", "airport_code": None},
    ],
    
    # Jordan
    "JO": [
        {"name": "Amman", "name_en": "Amman", "name_fa": "عمان", "name_ar": "عمان", "airport_code": "AMM"},
        {"name": "Aqaba", "name_en": "Aqaba", "name_fa": "عقبه", "name_ar": "العقبة", "airport_code": "AQJ"},
    ],
    
    # Lebanon
    "LB": [
        {"name": "Beirut", "name_en": "Beirut", "name_fa": "بیروت", "name_ar": "بيروت", "airport_code": "BEY"},
    ],
    
    # UK
    "GB": [
        {"name": "London", "name_en": "London", "name_fa": "لندن", "name_ar": "لندن", "airport_code": "LHR"},
        {"name": "Manchester", "name_en": "Manchester", "name_fa": "منچستر", "name_ar": "مانشستر", "airport_code": "MAN"},
        {"name": "Birmingham", "name_en": "Birmingham", "name_fa": "برمینگام", "name_ar": "برمنغهام", "airport_code": "BHX"},
        {"name": "Edinburgh", "name_en": "Edinburgh", "name_fa": "ادینبرگ", "name_ar": "إدنبرة", "airport_code": "EDI"},
        {"name": "Glasgow", "name_en": "Glasgow", "name_fa": "گلاسکو", "name_ar": "غلاسكو", "airport_code": "GLA"},
    ],
    
    # Germany
    "DE": [
        {"name": "Berlin", "name_en": "Berlin", "name_fa": "برلین", "name_ar": "برلين", "airport_code": "BER"},
        {"name": "Munich", "name_en": "Munich", "name_fa": "مونیخ", "name_ar": "ميونخ", "airport_code": "MUC"},
        {"name": "Frankfurt", "name_en": "Frankfurt", "name_fa": "فرانکفورت", "name_ar": "فرانكفورت", "airport_code": "FRA"},
        {"name": "Hamburg", "name_en": "Hamburg", "name_fa": "هامبورگ", "name_ar": "هامبورغ", "airport_code": "HAM"},
        {"name": "Cologne", "name_en": "Cologne", "name_fa": "کلن", "name_ar": "كولونيا", "airport_code": "CGN"},
        {"name": "Dusseldorf", "name_en": "Dusseldorf", "name_fa": "دوسلدورف", "name_ar": "دوسلدورف", "airport_code": "DUS"},
        {"name": "Stuttgart", "name_en": "Stuttgart", "name_fa": "اشتوتگارت", "name_ar": "شتوتغارت", "airport_code": "STR"},
    ],
    
    # France
    "FR": [
        {"name": "Paris", "name_en": "Paris", "name_fa": "پاریس", "name_ar": "باريس", "airport_code": "CDG"},
        {"name": "Marseille", "name_en": "Marseille", "name_fa": "مارسی", "name_ar": "مارسيليا", "airport_code": "MRS"},
        {"name": "Lyon", "name_en": "Lyon", "name_fa": "لیون", "name_ar": "ليون", "airport_code": "LYS"},
        {"name": "Nice", "name_en": "Nice", "name_fa": "نیس", "name_ar": "نيس", "airport_code": "NCE"},
        {"name": "Toulouse", "name_en": "Toulouse", "name_fa": "تولوز", "name_ar": "تولوز", "airport_code": "TLS"},
    ],
    
    # Italy
    "IT": [
        {"name": "Rome", "name_en": "Rome", "name_fa": "رم", "name_ar": "روما", "airport_code": "FCO"},
        {"name": "Milan", "name_en": "Milan", "name_fa": "میلان", "name_ar": "ميلان", "airport_code": "MXP"},
        {"name": "Venice", "name_en": "Venice", "name_fa": "ونیز", "name_ar": "البندقية", "airport_code": "VCE"},
        {"name": "Florence", "name_en": "Florence", "name_fa": "فلورانس", "name_ar": "فلورنسا", "airport_code": "FLR"},
        {"name": "Naples", "name_en": "Naples", "name_fa": "ناپل", "name_ar": "نابولي", "airport_code": "NAP"},
    ],
    
    # Spain
    "ES": [
        {"name": "Madrid", "name_en": "Madrid", "name_fa": "مادرید", "name_ar": "مدريد", "airport_code": "MAD"},
        {"name": "Barcelona", "name_en": "Barcelona", "name_fa": "بارسلونا", "name_ar": "برشلونة", "airport_code": "BCN"},
        {"name": "Valencia", "name_en": "Valencia", "name_fa": "والنسیا", "name_ar": "بلنسية", "airport_code": "VLC"},
        {"name": "Seville", "name_en": "Seville", "name_fa": "سویا", "name_ar": "إشبيلية", "airport_code": "SVQ"},
        {"name": "Malaga", "name_en": "Malaga", "name_fa": "مالاگا", "name_ar": "مالقة", "airport_code": "AGP"},
    ],
    
    # Netherlands
    "NL": [
        {"name": "Amsterdam", "name_en": "Amsterdam", "name_fa": "آمستردام", "name_ar": "أمستردام", "airport_code": "AMS"},
        {"name": "Rotterdam", "name_en": "Rotterdam", "name_fa": "روتردام", "name_ar": "روتردام", "airport_code": "RTM"},
        {"name": "The Hague", "name_en": "The Hague", "name_fa": "لاهه", "name_ar": "لاهاي", "airport_code": None},
    ],
    
    # USA
    "US": [
        {"name": "New York", "name_en": "New York", "name_fa": "نیویورک", "name_ar": "نيويورك", "airport_code": "JFK"},
        {"name": "Los Angeles", "name_en": "Los Angeles", "name_fa": "لس آنجلس", "name_ar": "لوس أنجلوس", "airport_code": "LAX"},
        {"name": "Chicago", "name_en": "Chicago", "name_fa": "شیکاگو", "name_ar": "شيكاغو", "airport_code": "ORD"},
        {"name": "Houston", "name_en": "Houston", "name_fa": "هیوستون", "name_ar": "هيوستن", "airport_code": "IAH"},
        {"name": "Miami", "name_en": "Miami", "name_fa": "میامی", "name_ar": "ميامي", "airport_code": "MIA"},
        {"name": "San Francisco", "name_en": "San Francisco", "name_fa": "سان فرانسیسکو", "name_ar": "سان فرانسيسكو", "airport_code": "SFO"},
        {"name": "Las Vegas", "name_en": "Las Vegas", "name_fa": "لاس وگاس", "name_ar": "لاس فيغاس", "airport_code": "LAS"},
        {"name": "Seattle", "name_en": "Seattle", "name_fa": "سیاتل", "name_ar": "سياتل", "airport_code": "SEA"},
        {"name": "Boston", "name_en": "Boston", "name_fa": "بوستون", "name_ar": "بوسطن", "airport_code": "BOS"},
        {"name": "Dallas", "name_en": "Dallas", "name_fa": "دالاس", "name_ar": "دالاس", "airport_code": "DFW"},
        {"name": "Atlanta", "name_en": "Atlanta", "name_fa": "آتلانتا", "name_ar": "أتلانتا", "airport_code": "ATL"},
        {"name": "Washington DC", "name_en": "Washington DC", "name_fa": "واشنگتن", "name_ar": "واشنطن", "airport_code": "IAD"},
    ],
    
    # Canada
    "CA": [
        {"name": "Toronto", "name_en": "Toronto", "name_fa": "تورنتو", "name_ar": "تورنتو", "airport_code": "YYZ"},
        {"name": "Vancouver", "name_en": "Vancouver", "name_fa": "ونکوور", "name_ar": "فانكوفر", "airport_code": "YVR"},
        {"name": "Montreal", "name_en": "Montreal", "name_fa": "مونترال", "name_ar": "مونتريال", "airport_code": "YUL"},
        {"name": "Calgary", "name_en": "Calgary", "name_fa": "کلگری", "name_ar": "كالغاري", "airport_code": "YYC"},
        {"name": "Ottawa", "name_en": "Ottawa", "name_fa": "اتاوا", "name_ar": "أوتاوا", "airport_code": "YOW"},
    ],
    
    # China
    "CN": [
        {"name": "Beijing", "name_en": "Beijing", "name_fa": "پکن", "name_ar": "بكين", "airport_code": "PEK"},
        {"name": "Shanghai", "name_en": "Shanghai", "name_fa": "شانگهای", "name_ar": "شنغهاي", "airport_code": "PVG"},
        {"name": "Guangzhou", "name_en": "Guangzhou", "name_fa": "گوانگژو", "name_ar": "قوانغتشو", "airport_code": "CAN"},
        {"name": "Shenzhen", "name_en": "Shenzhen", "name_fa": "شنژن", "name_ar": "شنتشن", "airport_code": "SZX"},
        {"name": "Hong Kong", "name_en": "Hong Kong", "name_fa": "هنگ کنگ", "name_ar": "هونغ كونغ", "airport_code": "HKG"},
        {"name": "Chengdu", "name_en": "Chengdu", "name_fa": "چنگدو", "name_ar": "تشنغدو", "airport_code": "CTU"},
    ],
    
    # Japan
    "JP": [
        {"name": "Tokyo", "name_en": "Tokyo", "name_fa": "توکیو", "name_ar": "طوكيو", "airport_code": "NRT"},
        {"name": "Osaka", "name_en": "Osaka", "name_fa": "اوساکا", "name_ar": "أوساكا", "airport_code": "KIX"},
        {"name": "Kyoto", "name_en": "Kyoto", "name_fa": "کیوتو", "name_ar": "كيوتو", "airport_code": None},
        {"name": "Nagoya", "name_en": "Nagoya", "name_fa": "ناگویا", "name_ar": "ناغويا", "airport_code": "NGO"},
        {"name": "Fukuoka", "name_en": "Fukuoka", "name_fa": "فوکوئوکا", "name_ar": "فوكوكا", "airport_code": "FUK"},
    ],
    
    # South Korea
    "KR": [
        {"name": "Seoul", "name_en": "Seoul", "name_fa": "سئول", "name_ar": "سيول", "airport_code": "ICN"},
        {"name": "Busan", "name_en": "Busan", "name_fa": "بوسان", "name_ar": "بوسان", "airport_code": "PUS"},
        {"name": "Incheon", "name_en": "Incheon", "name_fa": "اینچئون", "name_ar": "إنتشون", "airport_code": "ICN"},
    ],
    
    # India
    "IN": [
        {"name": "New Delhi", "name_en": "New Delhi", "name_fa": "دهلی نو", "name_ar": "نيودلهي", "airport_code": "DEL"},
        {"name": "Mumbai", "name_en": "Mumbai", "name_fa": "بمبئی", "name_ar": "مومباي", "airport_code": "BOM"},
        {"name": "Bangalore", "name_en": "Bangalore", "name_fa": "بنگلور", "name_ar": "بنغالور", "airport_code": "BLR"},
        {"name": "Chennai", "name_en": "Chennai", "name_fa": "چنای", "name_ar": "تشيناي", "airport_code": "MAA"},
        {"name": "Kolkata", "name_en": "Kolkata", "name_fa": "کلکته", "name_ar": "كولكاتا", "airport_code": "CCU"},
        {"name": "Hyderabad", "name_en": "Hyderabad", "name_fa": "حیدرآباد", "name_ar": "حيدر آباد", "airport_code": "HYD"},
    ],
    
    # Australia
    "AU": [
        {"name": "Sydney", "name_en": "Sydney", "name_fa": "سیدنی", "name_ar": "سيدني", "airport_code": "SYD"},
        {"name": "Melbourne", "name_en": "Melbourne", "name_fa": "ملبورن", "name_ar": "ملبورن", "airport_code": "MEL"},
        {"name": "Brisbane", "name_en": "Brisbane", "name_fa": "بریزبن", "name_ar": "بريزبان", "airport_code": "BNE"},
        {"name": "Perth", "name_en": "Perth", "name_fa": "پرث", "name_ar": "بيرث", "airport_code": "PER"},
        {"name": "Adelaide", "name_en": "Adelaide", "name_fa": "آدلاید", "name_ar": "أديلايد", "airport_code": "ADL"},
    ],
    
    # Singapore
    "SG": [
        {"name": "Singapore", "name_en": "Singapore", "name_fa": "سنگاپور", "name_ar": "سنغافورة", "airport_code": "SIN"},
    ],
    
    # Malaysia
    "MY": [
        {"name": "Kuala Lumpur", "name_en": "Kuala Lumpur", "name_fa": "کوالالامپور", "name_ar": "كوالا لمبور", "airport_code": "KUL"},
        {"name": "Penang", "name_en": "Penang", "name_fa": "پنانگ", "name_ar": "بينانغ", "airport_code": "PEN"},
    ],
    
    # Thailand
    "TH": [
        {"name": "Bangkok", "name_en": "Bangkok", "name_fa": "بانکوک", "name_ar": "بانكوك", "airport_code": "BKK"},
        {"name": "Phuket", "name_en": "Phuket", "name_fa": "پوکت", "name_ar": "فوكيت", "airport_code": "HKT"},
        {"name": "Chiang Mai", "name_en": "Chiang Mai", "name_fa": "چیانگ مای", "name_ar": "شيانغ ماي", "airport_code": "CNX"},
    ],
    
    # Egypt
    "EG": [
        {"name": "Cairo", "name_en": "Cairo", "name_fa": "قاهره", "name_ar": "القاهرة", "airport_code": "CAI"},
        {"name": "Alexandria", "name_en": "Alexandria", "name_fa": "اسکندریه", "name_ar": "الإسكندرية", "airport_code": "HBE"},
        {"name": "Sharm El Sheikh", "name_en": "Sharm El Sheikh", "name_fa": "شرم الشیخ", "name_ar": "شرم الشيخ", "airport_code": "SSH"},
    ],
    
    # Brazil
    "BR": [
        {"name": "Sao Paulo", "name_en": "Sao Paulo", "name_fa": "سائوپائولو", "name_ar": "ساو باولو", "airport_code": "GRU"},
        {"name": "Rio de Janeiro", "name_en": "Rio de Janeiro", "name_fa": "ریو دو ژانیرو", "name_ar": "ريو دي جانيرو", "airport_code": "GIG"},
        {"name": "Brasilia", "name_en": "Brasilia", "name_fa": "برازیلیا", "name_ar": "برازيليا", "airport_code": "BSB"},
    ],
    
    # Russia
    "RU": [
        {"name": "Moscow", "name_en": "Moscow", "name_fa": "مسکو", "name_ar": "موسكو", "airport_code": "SVO"},
        {"name": "Saint Petersburg", "name_en": "Saint Petersburg", "name_fa": "سنت پترزبورگ", "name_ar": "سانت بطرسبرغ", "airport_code": "LED"},
    ],
    
    # Switzerland
    "CH": [
        {"name": "Zurich", "name_en": "Zurich", "name_fa": "زوریخ", "name_ar": "زيورخ", "airport_code": "ZRH"},
        {"name": "Geneva", "name_en": "Geneva", "name_fa": "ژنو", "name_ar": "جنيف", "airport_code": "GVA"},
        {"name": "Bern", "name_en": "Bern", "name_fa": "برن", "name_ar": "برن", "airport_code": "BRN"},
    ],
    
    # Austria
    "AT": [
        {"name": "Vienna", "name_en": "Vienna", "name_fa": "وین", "name_ar": "فيينا", "airport_code": "VIE"},
        {"name": "Salzburg", "name_en": "Salzburg", "name_fa": "سالزبورگ", "name_ar": "سالزبورغ", "airport_code": "SZG"},
    ],
    
    # Greece
    "GR": [
        {"name": "Athens", "name_en": "Athens", "name_fa": "آتن", "name_ar": "أثينا", "airport_code": "ATH"},
        {"name": "Thessaloniki", "name_en": "Thessaloniki", "name_fa": "تسالونیکی", "name_ar": "سالونيك", "airport_code": "SKG"},
    ],
    
    # Sweden
    "SE": [
        {"name": "Stockholm", "name_en": "Stockholm", "name_fa": "استکهلم", "name_ar": "ستوكهولم", "airport_code": "ARN"},
        {"name": "Gothenburg", "name_en": "Gothenburg", "name_fa": "گوتنبرگ", "name_ar": "غوتنبرغ", "airport_code": "GOT"},
    ],
    
    # Norway
    "NO": [
        {"name": "Oslo", "name_en": "Oslo", "name_fa": "اسلو", "name_ar": "أوسلو", "airport_code": "OSL"},
        {"name": "Bergen", "name_en": "Bergen", "name_fa": "برگن", "name_ar": "بيرغن", "airport_code": "BGO"},
    ],
    
    # Denmark
    "DK": [
        {"name": "Copenhagen", "name_en": "Copenhagen", "name_fa": "کپنهاگ", "name_ar": "كوبنهاغن", "airport_code": "CPH"},
    ],
    
    # Poland
    "PL": [
        {"name": "Warsaw", "name_en": "Warsaw", "name_fa": "ورشو", "name_ar": "وارسو", "airport_code": "WAW"},
        {"name": "Krakow", "name_en": "Krakow", "name_fa": "کراکوف", "name_ar": "كراكوف", "airport_code": "KRK"},
    ],
    
    # Czech Republic
    "CZ": [
        {"name": "Prague", "name_en": "Prague", "name_fa": "پراگ", "name_ar": "براغ", "airport_code": "PRG"},
    ],
    
    # Hungary
    "HU": [
        {"name": "Budapest", "name_en": "Budapest", "name_fa": "بوداپست", "name_ar": "بودابست", "airport_code": "BUD"},
    ],
    
    # Portugal
    "PT": [
        {"name": "Lisbon", "name_en": "Lisbon", "name_fa": "لیسبون", "name_ar": "لشبونة", "airport_code": "LIS"},
        {"name": "Porto", "name_en": "Porto", "name_fa": "پورتو", "name_ar": "بورتو", "airport_code": "OPO"},
    ],
    
    # Belgium
    "BE": [
        {"name": "Brussels", "name_en": "Brussels", "name_fa": "بروکسل", "name_ar": "بروكسل", "airport_code": "BRU"},
        {"name": "Antwerp", "name_en": "Antwerp", "name_fa": "آنتورپ", "name_ar": "أنتويرب", "airport_code": "ANR"},
    ],
    
    # Ireland
    "IE": [
        {"name": "Dublin", "name_en": "Dublin", "name_fa": "دوبلین", "name_ar": "دبلن", "airport_code": "DUB"},
    ],
    
    # South Africa
    "ZA": [
        {"name": "Johannesburg", "name_en": "Johannesburg", "name_fa": "ژوهانسبورگ", "name_ar": "جوهانسبرغ", "airport_code": "JNB"},
        {"name": "Cape Town", "name_en": "Cape Town", "name_fa": "کیپ تاون", "name_ar": "كيب تاون", "airport_code": "CPT"},
    ],
    
    # New Zealand
    "NZ": [
        {"name": "Auckland", "name_en": "Auckland", "name_fa": "اوکلند", "name_ar": "أوكلاند", "airport_code": "AKL"},
        {"name": "Wellington", "name_en": "Wellington", "name_fa": "ولینگتون", "name_ar": "ويلينغتون", "airport_code": "WLG"},
    ],
    
    # Mexico
    "MX": [
        {"name": "Mexico City", "name_en": "Mexico City", "name_fa": "مکزیکو سیتی", "name_ar": "مكسيكو سيتي", "airport_code": "MEX"},
        {"name": "Cancun", "name_en": "Cancun", "name_fa": "کانکون", "name_ar": "كانكون", "airport_code": "CUN"},
        {"name": "Guadalajara", "name_en": "Guadalajara", "name_fa": "گوادالاخارا", "name_ar": "غوادالاخارا", "airport_code": "GDL"},
    ],
    
    # Argentina
    "AR": [
        {"name": "Buenos Aires", "name_en": "Buenos Aires", "name_fa": "بوئنوس آیرس", "name_ar": "بوينس آيرس", "airport_code": "EZE"},
    ],
    
    # Colombia
    "CO": [
        {"name": "Bogota", "name_en": "Bogota", "name_fa": "بوگوتا", "name_ar": "بوغوتا", "airport_code": "BOG"},
        {"name": "Medellin", "name_en": "Medellin", "name_fa": "مدلین", "name_ar": "ميديلين", "airport_code": "MDE"},
    ],
    
    # Chile
    "CL": [
        {"name": "Santiago", "name_en": "Santiago", "name_fa": "سانتیاگو", "name_ar": "سانتياغو", "airport_code": "SCL"},
    ],
    
    # Indonesia
    "ID": [
        {"name": "Jakarta", "name_en": "Jakarta", "name_fa": "جاکارتا", "name_ar": "جاكرتا", "airport_code": "CGK"},
        {"name": "Bali", "name_en": "Bali", "name_fa": "بالی", "name_ar": "بالي", "airport_code": "DPS"},
    ],
    
    # Philippines
    "PH": [
        {"name": "Manila", "name_en": "Manila", "name_fa": "مانیل", "name_ar": "مانيلا", "airport_code": "MNL"},
        {"name": "Cebu", "name_en": "Cebu", "name_fa": "سبو", "name_ar": "سيبو", "airport_code": "CEB"},
    ],
    
    # Vietnam
    "VN": [
        {"name": "Ho Chi Minh City", "name_en": "Ho Chi Minh City", "name_fa": "هوشی‌مین", "name_ar": "مدينة هو تشي منه", "airport_code": "SGN"},
        {"name": "Hanoi", "name_en": "Hanoi", "name_fa": "هانوی", "name_ar": "هانوي", "airport_code": "HAN"},
    ],
    
    # Pakistan
    "PK": [
        {"name": "Karachi", "name_en": "Karachi", "name_fa": "کراچی", "name_ar": "كراتشي", "airport_code": "KHI"},
        {"name": "Lahore", "name_en": "Lahore", "name_fa": "لاهور", "name_ar": "لاهور", "airport_code": "LHE"},
        {"name": "Islamabad", "name_en": "Islamabad", "name_fa": "اسلام آباد", "name_ar": "إسلام آباد", "airport_code": "ISB"},
    ],
    
    # Afghanistan
    "AF": [
        {"name": "Kabul", "name_en": "Kabul", "name_fa": "کابل", "name_ar": "كابل", "airport_code": "KBL"},
        {"name": "Herat", "name_en": "Herat", "name_fa": "هرات", "name_ar": "هرات", "airport_code": "HEA"},
        {"name": "Mazar-i-Sharif", "name_en": "Mazar-i-Sharif", "name_fa": "مزار شریف", "name_ar": "مزار شريف", "airport_code": "MZR"},
    ],
    
    # Georgia
    "GE": [
        {"name": "Tbilisi", "name_en": "Tbilisi", "name_fa": "تفلیس", "name_ar": "تبليسي", "airport_code": "TBS"},
        {"name": "Batumi", "name_en": "Batumi", "name_fa": "باتومی", "name_ar": "باتومي", "airport_code": "BUS"},
    ],
    
    # Azerbaijan
    "AZ": [
        {"name": "Baku", "name_en": "Baku", "name_fa": "باکو", "name_ar": "باكو", "airport_code": "GYD"},
    ],
    
    # Armenia
    "AM": [
        {"name": "Yerevan", "name_en": "Yerevan", "name_fa": "ایروان", "name_ar": "يريفان", "airport_code": "EVN"},
    ],
}


async def seed_locations():
    """Seed countries and cities into the database."""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True
    )
    
    # Create async session
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        print("Starting location seeding...")
        
        # Check if countries already exist
        result = await session.execute(select(Country).limit(1))
        existing = result.scalar_one_or_none()
        
        if existing:
            print("Countries already exist in database. Skipping seed.")
            return
        
        # Create countries and store their IDs
        country_ids = {}
        
        for country_data in COUNTRIES:
            country = Country(**country_data)
            session.add(country)
            await session.flush()
            country_ids[country_data["iso_code"]] = country.id
            print(f"Added country: {country_data['name_en']}")
        
        # Create cities
        for iso_code, cities in CITIES.items():
            if iso_code not in country_ids:
                print(f"Warning: Country with ISO code {iso_code} not found, skipping cities")
                continue
            
            country_id = country_ids[iso_code]
            for city_data in cities:
                city = City(
                    country_id=country_id,
                    **city_data
                )
                session.add(city)
                print(f"Added city: {city_data['name_en']}")
        
        await session.commit()
        print(f"\nSeeding complete!")
        print(f"Total countries: {len(COUNTRIES)}")
        print(f"Total cities: {sum(len(cities) for cities in CITIES.values())}")


if __name__ == "__main__":
    asyncio.run(seed_locations())


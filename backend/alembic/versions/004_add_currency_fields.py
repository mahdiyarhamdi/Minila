"""add currency fields to country and card

Revision ID: 004
Revises: 003
Create Date: 2025-11-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

# ISO country code to currency code mapping for common countries
CURRENCY_MAPPING = {
    'IR': 'IRR',  # Iran - Iranian Rial
    'AE': 'AED',  # UAE - UAE Dirham
    'US': 'USD',  # USA - US Dollar
    'TR': 'TRY',  # Turkey - Turkish Lira
    'DE': 'EUR',  # Germany - Euro
    'FR': 'EUR',  # France - Euro
    'IT': 'EUR',  # Italy - Euro
    'ES': 'EUR',  # Spain - Euro
    'NL': 'EUR',  # Netherlands - Euro
    'GB': 'GBP',  # UK - British Pound
    'CA': 'CAD',  # Canada - Canadian Dollar
    'AU': 'AUD',  # Australia - Australian Dollar
    'JP': 'JPY',  # Japan - Japanese Yen
    'CN': 'CNY',  # China - Chinese Yuan
    'IN': 'INR',  # India - Indian Rupee
    'PK': 'PKR',  # Pakistan - Pakistani Rupee
    'AF': 'AFN',  # Afghanistan - Afghani
    'IQ': 'IQD',  # Iraq - Iraqi Dinar
    'SA': 'SAR',  # Saudi Arabia - Saudi Riyal
    'QA': 'QAR',  # Qatar - Qatari Riyal
    'KW': 'KWD',  # Kuwait - Kuwaiti Dinar
    'OM': 'OMR',  # Oman - Omani Rial
    'BH': 'BHD',  # Bahrain - Bahraini Dinar
    'EG': 'EGP',  # Egypt - Egyptian Pound
    'MY': 'MYR',  # Malaysia - Malaysian Ringgit
    'SG': 'SGD',  # Singapore - Singapore Dollar
    'TH': 'THB',  # Thailand - Thai Baht
    'RU': 'RUB',  # Russia - Russian Ruble
    'SE': 'SEK',  # Sweden - Swedish Krona
    'NO': 'NOK',  # Norway - Norwegian Krone
    'DK': 'DKK',  # Denmark - Danish Krone
    'CH': 'CHF',  # Switzerland - Swiss Franc
    'PL': 'PLN',  # Poland - Polish Zloty
    'CZ': 'CZK',  # Czech Republic - Czech Koruna
    'HU': 'HUF',  # Hungary - Hungarian Forint
    'BR': 'BRL',  # Brazil - Brazilian Real
    'MX': 'MXN',  # Mexico - Mexican Peso
    'AR': 'ARS',  # Argentina - Argentine Peso
    'KR': 'KRW',  # South Korea - South Korean Won
    'NZ': 'NZD',  # New Zealand - New Zealand Dollar
    'ZA': 'ZAR',  # South Africa - South African Rand
    'AZ': 'AZN',  # Azerbaijan - Azerbaijani Manat
    'GE': 'GEL',  # Georgia - Georgian Lari
    'AM': 'AMD',  # Armenia - Armenian Dram
}


def upgrade() -> None:
    # Add currency_code column to country table
    op.add_column(
        'country',
        sa.Column('currency_code', sa.String(3), nullable=True)
    )
    
    # Add currency column to card table with default USD
    op.add_column(
        'card',
        sa.Column('currency', sa.String(3), nullable=True, server_default='USD',
                  comment='واحد پول (ISO 4217)')
    )
    
    # Update existing countries with their currency codes
    connection = op.get_bind()
    for iso_code, currency_code in CURRENCY_MAPPING.items():
        connection.execute(
            sa.text(
                "UPDATE country SET currency_code = :currency_code WHERE iso_code = :iso_code"
            ),
            {"currency_code": currency_code, "iso_code": iso_code}
        )


def downgrade() -> None:
    # Remove columns
    op.drop_column('card', 'currency')
    op.drop_column('country', 'currency_code')




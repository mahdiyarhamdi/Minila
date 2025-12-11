import {
  getCurrencyByCountryCode,
  getCurrencyByCode,
  getCurrencyOptions,
  getCurrencyName,
  getCommonCurrencyOptions,
  formatPrice,
  formatPriceWithName,
  COUNTRY_CURRENCY_MAP,
  USD_CURRENCY,
} from '@/utils/currency'

describe('Currency Utilities', () => {
  describe('getCurrencyByCountryCode', () => {
    it('returns currency for valid ISO code', () => {
      const result = getCurrencyByCountryCode('IR')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('IRR')
      expect(result?.nameFa).toBe('ریال ایران')
    })

    it('returns null for invalid ISO code', () => {
      const result = getCurrencyByCountryCode('XX')
      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      const result = getCurrencyByCountryCode(undefined)
      expect(result).toBeNull()
    })

    it('handles lowercase ISO codes', () => {
      const result = getCurrencyByCountryCode('ir')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('IRR')
    })

    it('returns AED for UAE', () => {
      const result = getCurrencyByCountryCode('AE')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('AED')
      expect(result?.nameFa).toBe('درهم امارات')
    })
  })

  describe('getCurrencyByCode', () => {
    it('returns USD currency info', () => {
      const result = getCurrencyByCode('USD')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('USD')
      expect(result?.symbol).toBe('$')
    })

    it('returns currency for valid code', () => {
      const result = getCurrencyByCode('EUR')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('EUR')
      expect(result?.symbol).toBe('€')
    })

    it('returns null for invalid code', () => {
      const result = getCurrencyByCode('XXX')
      expect(result).toBeNull()
    })

    it('handles lowercase currency codes', () => {
      const result = getCurrencyByCode('usd')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('USD')
    })
  })

  describe('getCurrencyName', () => {
    it('returns English name for en locale', () => {
      const result = getCurrencyName(USD_CURRENCY, 'en')
      expect(result).toBe('US Dollar')
    })

    it('returns Persian name for fa locale', () => {
      const result = getCurrencyName(USD_CURRENCY, 'fa')
      expect(result).toBe('دلار آمریکا')
    })

    it('returns Arabic name for ar locale', () => {
      const result = getCurrencyName(USD_CURRENCY, 'ar')
      expect(result).toBe('دولار أمريكي')
    })

    it('defaults to English when no locale specified', () => {
      const result = getCurrencyName(USD_CURRENCY)
      expect(result).toBe('US Dollar')
    })
  })

  describe('getCurrencyOptions', () => {
    it('returns USD by default when no countries specified', () => {
      const options = getCurrencyOptions()
      expect(options).toHaveLength(1)
      expect(options[0].value).toBe('USD')
    })

    it('includes origin country currency', () => {
      const options = getCurrencyOptions('IR')
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('USD')
      expect(options[1].value).toBe('IRR')
    })

    it('includes destination country currency', () => {
      const options = getCurrencyOptions(undefined, 'AE')
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('USD')
      expect(options[1].value).toBe('AED')
    })

    it('includes both origin and destination currencies', () => {
      const options = getCurrencyOptions('IR', 'AE')
      expect(options).toHaveLength(3)
      expect(options[0].value).toBe('USD')
      expect(options[1].value).toBe('IRR')
      expect(options[2].value).toBe('AED')
    })

    it('does not duplicate currencies', () => {
      // If origin and destination are in same currency zone (e.g., Eurozone)
      const options = getCurrencyOptions('DE', 'FR') // Both use EUR
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('USD')
      expect(options[1].value).toBe('EUR')
    })

    it('does not duplicate USD', () => {
      const options = getCurrencyOptions('US')
      expect(options).toHaveLength(1)
      expect(options[0].value).toBe('USD')
    })

    it('returns labels in Persian for fa locale', () => {
      const options = getCurrencyOptions('IR', undefined, undefined, 'fa')
      const irrOption = options.find((o) => o.value === 'IRR')
      expect(irrOption?.label).toContain('ریال ایران')
      expect(irrOption?.label).toContain('IRR')
    })

    it('returns labels in English for en locale', () => {
      const options = getCurrencyOptions('IR', undefined, undefined, 'en')
      const irrOption = options.find((o) => o.value === 'IRR')
      expect(irrOption?.label).toContain('Iranian Rial')
      expect(irrOption?.label).toContain('IRR')
    })

    it('returns labels in Arabic for ar locale', () => {
      const options = getCurrencyOptions('IR', undefined, undefined, 'ar')
      const irrOption = options.find((o) => o.value === 'IRR')
      expect(irrOption?.label).toContain('ريال إيراني')
      expect(irrOption?.label).toContain('IRR')
    })

    it('includes current currency when editing', () => {
      const options = getCurrencyOptions(undefined, undefined, 'EUR')
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('USD')
      expect(options[1].value).toBe('EUR')
    })
  })

  describe('getCommonCurrencyOptions', () => {
    it('returns common currency options', () => {
      const options = getCommonCurrencyOptions()
      expect(options.length).toBeGreaterThan(0)
      expect(options.some(o => o.value === 'USD')).toBe(true)
      expect(options.some(o => o.value === 'EUR')).toBe(true)
      expect(options.some(o => o.value === 'AED')).toBe(true)
    })

    it('returns labels in English for en locale', () => {
      const options = getCommonCurrencyOptions('en')
      const usdOption = options.find(o => o.value === 'USD')
      expect(usdOption?.label).toContain('US Dollar')
    })

    it('returns labels in Persian for fa locale', () => {
      const options = getCommonCurrencyOptions('fa')
      const usdOption = options.find(o => o.value === 'USD')
      expect(usdOption?.label).toContain('دلار آمریکا')
    })

    it('returns labels in Arabic for ar locale', () => {
      const options = getCommonCurrencyOptions('ar')
      const usdOption = options.find(o => o.value === 'USD')
      expect(usdOption?.label).toContain('دولار أمريكي')
    })
  })

  describe('formatPrice', () => {
    it('formats price with USD symbol', () => {
      const result = formatPrice(100, 'USD')
      expect(result).toContain('$')
    })

    it('formats price with default currency when not specified', () => {
      const result = formatPrice(100)
      expect(result).toContain('$')
    })

    it('formats price with given currency symbol', () => {
      const result = formatPrice(100, 'EUR')
      expect(result).toContain('€')
    })

    it('handles unknown currency code', () => {
      const result = formatPrice(100, 'XXX')
      expect(result).toContain('100')
      expect(result).toContain('XXX')
    })

    it('uses Persian number format for fa locale', () => {
      const result = formatPrice(1234, 'USD', 'fa')
      expect(result).toContain('$')
    })

    it('uses English number format for en locale', () => {
      const result = formatPrice(1234, 'USD', 'en')
      expect(result).toContain('$')
    })
  })

  describe('formatPriceWithName', () => {
    it('formats price with currency name in English', () => {
      const result = formatPriceWithName(100, 'USD', 'en')
      expect(result).toContain('100')
      expect(result).toContain('US Dollar')
    })

    it('formats price with currency name in Persian', () => {
      const result = formatPriceWithName(100, 'USD', 'fa')
      expect(result).toContain('دلار آمریکا')
    })

    it('formats price with currency name in Arabic', () => {
      const result = formatPriceWithName(100, 'USD', 'ar')
      expect(result).toContain('دولار أمريكي')
    })

    it('handles unknown currency code', () => {
      const result = formatPriceWithName(100, 'XXX', 'en')
      expect(result).toContain('100')
      expect(result).toContain('XXX')
    })
  })

  describe('COUNTRY_CURRENCY_MAP', () => {
    it('has entries for common countries', () => {
      expect(COUNTRY_CURRENCY_MAP['IR']).toBeDefined()
      expect(COUNTRY_CURRENCY_MAP['AE']).toBeDefined()
      expect(COUNTRY_CURRENCY_MAP['US']).toBeDefined()
      expect(COUNTRY_CURRENCY_MAP['GB']).toBeDefined()
      expect(COUNTRY_CURRENCY_MAP['TR']).toBeDefined()
    })

    it('has correct structure for each entry', () => {
      const iran = COUNTRY_CURRENCY_MAP['IR']
      expect(iran.code).toBe('IRR')
      expect(iran.name).toBeDefined()
      expect(iran.nameFa).toBeDefined()
      expect(iran.nameAr).toBeDefined()
      expect(iran.symbol).toBeDefined()
    })

    it('has Arabic names for all currencies', () => {
      Object.values(COUNTRY_CURRENCY_MAP).forEach(currency => {
        expect(currency.nameAr).toBeDefined()
        expect(currency.nameAr.length).toBeGreaterThan(0)
      })
    })
  })

  describe('USD_CURRENCY', () => {
    it('has correct values', () => {
      expect(USD_CURRENCY.code).toBe('USD')
      expect(USD_CURRENCY.name).toBe('US Dollar')
      expect(USD_CURRENCY.nameFa).toBe('دلار آمریکا')
      expect(USD_CURRENCY.nameAr).toBe('دولار أمريكي')
      expect(USD_CURRENCY.symbol).toBe('$')
    })
  })
})

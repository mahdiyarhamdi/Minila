/**
 * Currency mapping and utilities
 */

export interface CurrencyInfo {
  code: string
  name: string
  nameFa: string
  symbol: string
}

/**
 * Mapping of ISO country codes to currency information
 */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  IR: { code: 'IRR', name: 'Iranian Rial', nameFa: 'ریال ایران', symbol: '﷼' },
  AE: { code: 'AED', name: 'UAE Dirham', nameFa: 'درهم امارات', symbol: 'د.إ' },
  US: { code: 'USD', name: 'US Dollar', nameFa: 'دلار آمریکا', symbol: '$' },
  TR: { code: 'TRY', name: 'Turkish Lira', nameFa: 'لیر ترکیه', symbol: '₺' },
  DE: { code: 'EUR', name: 'Euro', nameFa: 'یورو', symbol: '€' },
  FR: { code: 'EUR', name: 'Euro', nameFa: 'یورو', symbol: '€' },
  IT: { code: 'EUR', name: 'Euro', nameFa: 'یورو', symbol: '€' },
  ES: { code: 'EUR', name: 'Euro', nameFa: 'یورو', symbol: '€' },
  NL: { code: 'EUR', name: 'Euro', nameFa: 'یورو', symbol: '€' },
  GB: { code: 'GBP', name: 'British Pound', nameFa: 'پوند انگلیس', symbol: '£' },
  CA: { code: 'CAD', name: 'Canadian Dollar', nameFa: 'دلار کانادا', symbol: '$' },
  AU: { code: 'AUD', name: 'Australian Dollar', nameFa: 'دلار استرالیا', symbol: '$' },
  JP: { code: 'JPY', name: 'Japanese Yen', nameFa: 'ین ژاپن', symbol: '¥' },
  CN: { code: 'CNY', name: 'Chinese Yuan', nameFa: 'یوان چین', symbol: '¥' },
  IN: { code: 'INR', name: 'Indian Rupee', nameFa: 'روپیه هند', symbol: '₹' },
  PK: { code: 'PKR', name: 'Pakistani Rupee', nameFa: 'روپیه پاکستان', symbol: '₨' },
  AF: { code: 'AFN', name: 'Afghani', nameFa: 'افغانی', symbol: '؋' },
  IQ: { code: 'IQD', name: 'Iraqi Dinar', nameFa: 'دینار عراق', symbol: 'ع.د' },
  SA: { code: 'SAR', name: 'Saudi Riyal', nameFa: 'ریال سعودی', symbol: '﷼' },
  QA: { code: 'QAR', name: 'Qatari Riyal', nameFa: 'ریال قطر', symbol: '﷼' },
  KW: { code: 'KWD', name: 'Kuwaiti Dinar', nameFa: 'دینار کویت', symbol: 'د.ك' },
  OM: { code: 'OMR', name: 'Omani Rial', nameFa: 'ریال عمان', symbol: '﷼' },
  BH: { code: 'BHD', name: 'Bahraini Dinar', nameFa: 'دینار بحرین', symbol: '.د.ب' },
  EG: { code: 'EGP', name: 'Egyptian Pound', nameFa: 'پوند مصر', symbol: '£' },
  MY: { code: 'MYR', name: 'Malaysian Ringgit', nameFa: 'رینگیت مالزی', symbol: 'RM' },
  SG: { code: 'SGD', name: 'Singapore Dollar', nameFa: 'دلار سنگاپور', symbol: '$' },
  TH: { code: 'THB', name: 'Thai Baht', nameFa: 'بات تایلند', symbol: '฿' },
  RU: { code: 'RUB', name: 'Russian Ruble', nameFa: 'روبل روسیه', symbol: '₽' },
  SE: { code: 'SEK', name: 'Swedish Krona', nameFa: 'کرون سوئد', symbol: 'kr' },
  NO: { code: 'NOK', name: 'Norwegian Krone', nameFa: 'کرون نروژ', symbol: 'kr' },
  DK: { code: 'DKK', name: 'Danish Krone', nameFa: 'کرون دانمارک', symbol: 'kr' },
  CH: { code: 'CHF', name: 'Swiss Franc', nameFa: 'فرانک سوئیس', symbol: 'CHF' },
  PL: { code: 'PLN', name: 'Polish Zloty', nameFa: 'زلوتی لهستان', symbol: 'zł' },
  CZ: { code: 'CZK', name: 'Czech Koruna', nameFa: 'کرون چک', symbol: 'Kč' },
  HU: { code: 'HUF', name: 'Hungarian Forint', nameFa: 'فورینت مجارستان', symbol: 'Ft' },
  BR: { code: 'BRL', name: 'Brazilian Real', nameFa: 'رئال برزیل', symbol: 'R$' },
  MX: { code: 'MXN', name: 'Mexican Peso', nameFa: 'پزوی مکزیک', symbol: '$' },
  AR: { code: 'ARS', name: 'Argentine Peso', nameFa: 'پزوی آرژانتین', symbol: '$' },
  KR: { code: 'KRW', name: 'South Korean Won', nameFa: 'وون کره جنوبی', symbol: '₩' },
  NZ: { code: 'NZD', name: 'New Zealand Dollar', nameFa: 'دلار نیوزیلند', symbol: '$' },
  ZA: { code: 'ZAR', name: 'South African Rand', nameFa: 'رند آفریقای جنوبی', symbol: 'R' },
  AZ: { code: 'AZN', name: 'Azerbaijani Manat', nameFa: 'منات آذربایجان', symbol: '₼' },
  GE: { code: 'GEL', name: 'Georgian Lari', nameFa: 'لاری گرجستان', symbol: '₾' },
  AM: { code: 'AMD', name: 'Armenian Dram', nameFa: 'درام ارمنستان', symbol: '֏' },
}

/**
 * Default USD currency info
 */
export const USD_CURRENCY: CurrencyInfo = {
  code: 'USD',
  name: 'US Dollar',
  nameFa: 'دلار آمریکا',
  symbol: '$',
}

/**
 * Get currency info by country ISO code
 */
export function getCurrencyByCountryCode(isoCode?: string): CurrencyInfo | null {
  if (!isoCode) return null
  return COUNTRY_CURRENCY_MAP[isoCode.toUpperCase()] || null
}

/**
 * Get currency info by currency code
 */
export function getCurrencyByCode(currencyCode: string): CurrencyInfo | null {
  if (!currencyCode) return null
  const upperCode = currencyCode.toUpperCase()
  
  if (upperCode === 'USD') return USD_CURRENCY
  
  for (const currency of Object.values(COUNTRY_CURRENCY_MAP)) {
    if (currency.code === upperCode) {
      return currency
    }
  }
  return null
}

export interface CurrencyOption {
  value: string
  label: string
}

/**
 * Get currency options for dropdown based on origin and destination countries
 * Always includes USD as default, plus unique currencies from origin and destination
 * If currentCurrency is provided, ensures it's in the options list
 */
export function getCurrencyOptions(
  originIsoCode?: string,
  destinationIsoCode?: string,
  currentCurrency?: string
): CurrencyOption[] {
  const options: CurrencyOption[] = [
    { value: 'USD', label: `${USD_CURRENCY.nameFa} (${USD_CURRENCY.code})` },
  ]
  
  const addedCodes = new Set(['USD'])
  
  // Add current currency first (if editing and it's different from USD)
  if (currentCurrency && currentCurrency !== 'USD') {
    const currencyInfo = getCurrencyByCode(currentCurrency)
    if (currencyInfo && !addedCodes.has(currencyInfo.code)) {
      options.push({
        value: currencyInfo.code,
        label: `${currencyInfo.nameFa} (${currencyInfo.code})`,
      })
      addedCodes.add(currencyInfo.code)
    } else if (!currencyInfo) {
      // اگر در لیست نبود، باز هم اضافه کن با کد خالص
      options.push({
        value: currentCurrency,
        label: currentCurrency,
      })
      addedCodes.add(currentCurrency)
    }
  }
  
  // Add origin country currency
  if (originIsoCode) {
    const originCurrency = getCurrencyByCountryCode(originIsoCode)
    if (originCurrency && !addedCodes.has(originCurrency.code)) {
      options.push({
        value: originCurrency.code,
        label: `${originCurrency.nameFa} (${originCurrency.code})`,
      })
      addedCodes.add(originCurrency.code)
    }
  }
  
  // Add destination country currency
  if (destinationIsoCode) {
    const destCurrency = getCurrencyByCountryCode(destinationIsoCode)
    if (destCurrency && !addedCodes.has(destCurrency.code)) {
      options.push({
        value: destCurrency.code,
        label: `${destCurrency.nameFa} (${destCurrency.code})`,
      })
      addedCodes.add(destCurrency.code)
    }
  }
  
  return options
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currencyCode?: string): string {
  const currency = currencyCode ? getCurrencyByCode(currencyCode) : USD_CURRENCY
  if (!currency) {
    return `${amount} ${currencyCode || 'USD'}`
  }
  return `${amount.toLocaleString('fa-IR')} ${currency.symbol}`
}


/**
 * Currency mapping and utilities with multilingual support
 */

export interface CurrencyInfo {
  code: string
  name: string
  nameFa: string
  nameAr: string
  symbol: string
}

/**
 * Mapping of ISO country codes to currency information
 */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  IR: { code: 'IRR', name: 'Iranian Rial', nameFa: 'ریال ایران', nameAr: 'ريال إيراني', symbol: '﷼' },
  AE: { code: 'AED', name: 'UAE Dirham', nameFa: 'درهم امارات', nameAr: 'درهم إماراتي', symbol: 'د.إ' },
  US: { code: 'USD', name: 'US Dollar', nameFa: 'دلار آمریکا', nameAr: 'دولار أمريكي', symbol: '$' },
  TR: { code: 'TRY', name: 'Turkish Lira', nameFa: 'لیر ترکیه', nameAr: 'ليرة تركية', symbol: '₺' },
  DE: { code: 'EUR', name: 'Euro', nameFa: 'یورو', nameAr: 'يورو', symbol: '€' },
  FR: { code: 'EUR', name: 'Euro', nameFa: 'یورو', nameAr: 'يورو', symbol: '€' },
  IT: { code: 'EUR', name: 'Euro', nameFa: 'یورو', nameAr: 'يورو', symbol: '€' },
  ES: { code: 'EUR', name: 'Euro', nameFa: 'یورو', nameAr: 'يورو', symbol: '€' },
  NL: { code: 'EUR', name: 'Euro', nameFa: 'یورو', nameAr: 'يورو', symbol: '€' },
  GB: { code: 'GBP', name: 'British Pound', nameFa: 'پوند انگلیس', nameAr: 'جنيه إسترليني', symbol: '£' },
  CA: { code: 'CAD', name: 'Canadian Dollar', nameFa: 'دلار کانادا', nameAr: 'دولار كندي', symbol: '$' },
  AU: { code: 'AUD', name: 'Australian Dollar', nameFa: 'دلار استرالیا', nameAr: 'دولار أسترالي', symbol: '$' },
  JP: { code: 'JPY', name: 'Japanese Yen', nameFa: 'ین ژاپن', nameAr: 'ين ياباني', symbol: '¥' },
  CN: { code: 'CNY', name: 'Chinese Yuan', nameFa: 'یوان چین', nameAr: 'يوان صيني', symbol: '¥' },
  IN: { code: 'INR', name: 'Indian Rupee', nameFa: 'روپیه هند', nameAr: 'روبية هندية', symbol: '₹' },
  PK: { code: 'PKR', name: 'Pakistani Rupee', nameFa: 'روپیه پاکستان', nameAr: 'روبية باكستانية', symbol: '₨' },
  AF: { code: 'AFN', name: 'Afghani', nameFa: 'افغانی', nameAr: 'أفغاني', symbol: '؋' },
  IQ: { code: 'IQD', name: 'Iraqi Dinar', nameFa: 'دینار عراق', nameAr: 'دينار عراقي', symbol: 'ع.د' },
  SA: { code: 'SAR', name: 'Saudi Riyal', nameFa: 'ریال سعودی', nameAr: 'ريال سعودي', symbol: '﷼' },
  QA: { code: 'QAR', name: 'Qatari Riyal', nameFa: 'ریال قطر', nameAr: 'ريال قطري', symbol: '﷼' },
  KW: { code: 'KWD', name: 'Kuwaiti Dinar', nameFa: 'دینار کویت', nameAr: 'دينار كويتي', symbol: 'د.ك' },
  OM: { code: 'OMR', name: 'Omani Rial', nameFa: 'ریال عمان', nameAr: 'ريال عماني', symbol: '﷼' },
  BH: { code: 'BHD', name: 'Bahraini Dinar', nameFa: 'دینار بحرین', nameAr: 'دينار بحريني', symbol: '.د.ب' },
  EG: { code: 'EGP', name: 'Egyptian Pound', nameFa: 'پوند مصر', nameAr: 'جنيه مصري', symbol: '£' },
  MY: { code: 'MYR', name: 'Malaysian Ringgit', nameFa: 'رینگیت مالزی', nameAr: 'رينغيت ماليزي', symbol: 'RM' },
  SG: { code: 'SGD', name: 'Singapore Dollar', nameFa: 'دلار سنگاپور', nameAr: 'دولار سنغافوري', symbol: '$' },
  TH: { code: 'THB', name: 'Thai Baht', nameFa: 'بات تایلند', nameAr: 'بات تايلاندي', symbol: '฿' },
  RU: { code: 'RUB', name: 'Russian Ruble', nameFa: 'روبل روسیه', nameAr: 'روبل روسي', symbol: '₽' },
  SE: { code: 'SEK', name: 'Swedish Krona', nameFa: 'کرون سوئد', nameAr: 'كرونة سويدية', symbol: 'kr' },
  NO: { code: 'NOK', name: 'Norwegian Krone', nameFa: 'کرون نروژ', nameAr: 'كرونة نرويجية', symbol: 'kr' },
  DK: { code: 'DKK', name: 'Danish Krone', nameFa: 'کرون دانمارک', nameAr: 'كرونة دنماركية', symbol: 'kr' },
  CH: { code: 'CHF', name: 'Swiss Franc', nameFa: 'فرانک سوئیس', nameAr: 'فرنك سويسري', symbol: 'CHF' },
  PL: { code: 'PLN', name: 'Polish Zloty', nameFa: 'زلوتی لهستان', nameAr: 'زلوتي بولندي', symbol: 'zł' },
  CZ: { code: 'CZK', name: 'Czech Koruna', nameFa: 'کرون چک', nameAr: 'كرونة تشيكية', symbol: 'Kč' },
  HU: { code: 'HUF', name: 'Hungarian Forint', nameFa: 'فورینت مجارستان', nameAr: 'فورنت مجري', symbol: 'Ft' },
  BR: { code: 'BRL', name: 'Brazilian Real', nameFa: 'رئال برزیل', nameAr: 'ريال برازيلي', symbol: 'R$' },
  MX: { code: 'MXN', name: 'Mexican Peso', nameFa: 'پزوی مکزیک', nameAr: 'بيزو مكسيكي', symbol: '$' },
  AR: { code: 'ARS', name: 'Argentine Peso', nameFa: 'پزوی آرژانتین', nameAr: 'بيزو أرجنتيني', symbol: '$' },
  KR: { code: 'KRW', name: 'South Korean Won', nameFa: 'وون کره جنوبی', nameAr: 'وون كوري جنوبي', symbol: '₩' },
  NZ: { code: 'NZD', name: 'New Zealand Dollar', nameFa: 'دلار نیوزیلند', nameAr: 'دولار نيوزيلندي', symbol: '$' },
  ZA: { code: 'ZAR', name: 'South African Rand', nameFa: 'رند آفریقای جنوبی', nameAr: 'راند جنوب أفريقي', symbol: 'R' },
  AZ: { code: 'AZN', name: 'Azerbaijani Manat', nameFa: 'منات آذربایجان', nameAr: 'مانات أذربيجاني', symbol: '₼' },
  GE: { code: 'GEL', name: 'Georgian Lari', nameFa: 'لاری گرجستان', nameAr: 'لاري جورجي', symbol: '₾' },
  AM: { code: 'AMD', name: 'Armenian Dram', nameFa: 'درام ارمنستان', nameAr: 'درام أرميني', symbol: '֏' },
}

/**
 * Default USD currency info
 */
export const USD_CURRENCY: CurrencyInfo = {
  code: 'USD',
  name: 'US Dollar',
  nameFa: 'دلار آمریکا',
  nameAr: 'دولار أمريكي',
  symbol: '$',
}

export type SupportedLanguage = 'en' | 'fa' | 'ar'

/**
 * Get currency name based on language
 */
export function getCurrencyName(currency: CurrencyInfo, language: SupportedLanguage = 'en'): string {
  switch (language) {
    case 'fa':
      return currency.nameFa
    case 'ar':
      return currency.nameAr
    case 'en':
    default:
      return currency.name
  }
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
  currentCurrency?: string,
  language: SupportedLanguage = 'en'
): CurrencyOption[] {
  const usdName = getCurrencyName(USD_CURRENCY, language)
  const options: CurrencyOption[] = [
    { value: 'USD', label: `${usdName} (${USD_CURRENCY.code})` },
  ]
  
  const addedCodes = new Set(['USD'])
  
  // Add current currency first (if editing and it's different from USD)
  if (currentCurrency && currentCurrency !== 'USD') {
    const currencyInfo = getCurrencyByCode(currentCurrency)
    if (currencyInfo && !addedCodes.has(currencyInfo.code)) {
      options.push({
        value: currencyInfo.code,
        label: `${getCurrencyName(currencyInfo, language)} (${currencyInfo.code})`,
      })
      addedCodes.add(currencyInfo.code)
    } else if (!currencyInfo) {
      // If not in list, add with raw code
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
        label: `${getCurrencyName(originCurrency, language)} (${originCurrency.code})`,
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
        label: `${getCurrencyName(destCurrency, language)} (${destCurrency.code})`,
      })
      addedCodes.add(destCurrency.code)
    }
  }
  
  return options
}

/**
 * Get common currency options for filter/select components
 */
export function getCommonCurrencyOptions(language: SupportedLanguage = 'en'): CurrencyOption[] {
  const commonCurrencies = ['USD', 'EUR', 'AED', 'IRR', 'TRY', 'GBP', 'CAD']
  
  return commonCurrencies.map(code => {
    const currency = getCurrencyByCode(code)
    if (!currency) return { value: code, label: code }
    return {
      value: currency.code,
      label: `${getCurrencyName(currency, language)} (${currency.code})`,
    }
  })
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currencyCode?: string, language: SupportedLanguage = 'en'): string {
  const currency = currencyCode ? getCurrencyByCode(currencyCode) : USD_CURRENCY
  if (!currency) {
    return `${amount} ${currencyCode || 'USD'}`
  }
  
  // Use localized number formatting based on language
  const locale = language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US'
  return `${amount.toLocaleString(locale)} ${currency.symbol}`
}

/**
 * Format price with currency name
 */
export function formatPriceWithName(amount: number, currencyCode?: string, language: SupportedLanguage = 'en'): string {
  const currency = currencyCode ? getCurrencyByCode(currencyCode) : USD_CURRENCY
  if (!currency) {
    return `${amount} ${currencyCode || 'USD'}`
  }
  
  // Use localized number formatting based on language
  const locale = language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US'
  return `${amount.toLocaleString(locale)} ${getCurrencyName(currency, language)}`
}

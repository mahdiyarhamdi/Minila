/**
 * تایپ‌های مربوط به مکان‌ها (کشورها و شهرها)
 */

export interface Country {
  id: number
  name: string
  name_en: string
  name_fa: string
  name_ar: string
  iso_code?: string
  currency_code?: string
}

export interface City {
  id: number
  name: string
  name_en: string
  name_fa: string
  name_ar: string
  airport_code?: string
  country_id: number
}

export interface CityWithCountry extends City {
  country: Country
}

export interface LocationSearchResult<T> {
  items: T[]
  total: number
}

export interface CountrySearchResult extends LocationSearchResult<Country> {}

export interface CitySearchResult extends LocationSearchResult<City> {}


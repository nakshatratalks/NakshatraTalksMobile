/**
 * Horoscope Types
 * Type definitions for Daily Horoscope API
 * Based on NakshatraTalks Astrology API v1
 */

// Valid zodiac sign IDs
export type ZodiacSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

// Zodiac sign information
export interface ZodiacSign {
  id: ZodiacSignId;
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  dateRange: string;
}

// Daily horoscope prediction from API
export interface HoroscopeContent {
  general: string;
  love: string;
  career: string;
  health: string;
}

// Daily horoscope response (matches actual API response)
export interface DailyHoroscope {
  sign: ZodiacSignId;
  date: string; // YYYY-MM-DD format
  day: string;
  horoscope: HoroscopeContent;
  luckyNumber: number;
  luckyColor: string;
  compatibility: string;
}

// Horoscope category for UI display
export type HoroscopeCategory = 'overall' | 'love' | 'career' | 'health' | 'finance';

// Horoscope category info for UI
export interface HoroscopeCategoryInfo {
  id: HoroscopeCategory;
  name: string;
  icon: string;
}

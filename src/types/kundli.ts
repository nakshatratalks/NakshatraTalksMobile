/**
 * Kundli Data Types
 * Type definitions for Kundli and Kundli Matching features
 * Based on NakshatraTalks Astrology API v1
 */

// ===============================
// Common Types
// ===============================

// Birth place location data
export interface BirthPlace {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  state?: string;
  country?: string;
  distance?: number; // Only returned from reverse geocode
}

// Gender type
export type Gender = 'male' | 'female' | 'other';

// ===============================
// Kundli Types
// ===============================

// Saved Kundli profile (API response)
export interface SavedKundli {
  id: string;
  name: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD format
  timeOfBirth: string; // HH:mm format
  birthPlace: BirthPlace;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Kundli input for generation
export interface KundliInput {
  name: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD format
  timeOfBirth: string; // HH:mm format
  birthPlace: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

// Kundli wizard form data (local state)
export interface KundliWizardData {
  name: string;
  gender: Gender | null;
  dateOfBirth: Date | null;
  timeOfBirth: Date | null;
  birthPlace: BirthPlace | null;
}

// Planetary position
export interface PlanetPosition {
  id: string;
  name: string;
  sign: string;
  signLord: string;
  nakshatra: string;
  nakshatraLord: string;
  house: number;
  degree: number;
  isRetrograde: boolean;
  isCombust: boolean;
}

// House information
export interface House {
  house: number;
  sign: string;
  signLord: string;
  planets: string[];
}

// Dosha information
export interface Dosha {
  hasDosha: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  description: string;
  remedies: string[];
}

// Kaal Sarpa Dosha (extends Dosha)
export interface KalasarpaDosha extends Dosha {
  type: string | null;
}

// Sade Sati information
export interface SadheSati {
  isActive: boolean;
  phase: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string;
}

// Dasha period
export interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  subPeriods?: DashaPeriod[];
}

// Yoga (auspicious combinations)
export interface Yoga {
  name: string;
  description: string;
  effects: string;
  strength: 'weak' | 'moderate' | 'strong';
}

// Birth details
export interface BirthDetails {
  nakshatra: string;
  nakshatraPada: number;
  rasi: string;
  tithi: string;
  yoga: string;
  karana: string;
  sunSign: string;
  moonSign: string;
  ascendant: string;
}

// Chart data with SVG URLs
export interface ChartData {
  chartType: string;
  chartName: string;
  svgUrl: string;
  svgUrlNorth: string;
  houses: {
    number: number;
    sign: string;
    planets: string[];
  }[];
}

// Yoga information from API
export interface YogaInfo {
  name: string;
  hasYoga: boolean;
  description: string;
  effects?: string;
  strength?: 'weak' | 'moderate' | 'strong';
  planets?: string[];
}

// Mantra with details
export interface MantraInfo {
  mantra: string;
  planet?: string;
  repetitions?: number;
  timing?: string;
}

// Charity recommendation
export interface CharityInfo {
  item: string;
  day: string;
  recipient?: string;
}

// Fasting recommendation
export interface FastingInfo {
  day: string;
  description?: string;
}

// Full Kundli report data (API response) - matches backend structure
export interface KundliReport {
  kundliId: string;
  basicInfo: {
    nakshatra: {
      name: string;
      lord: string;
      pada: number;
      deity?: string;
      symbol?: string;
      ganam?: string;
      nadi?: string;
      animal?: string;
      syllables?: string[];
    };
    rasi: {
      name: string;
      lord: string;
      element?: string;
    };
    lagna: {
      name: string;
      lord: string;
      degree?: number;
    };
    tithi?: {
      name: string;
      paksha?: string;
    };
    yoga?: {
      name: string;
    };
    karana?: {
      name: string;
    };
    sunSign?: string;
    moonSign?: string;
  };
  planets: {
    id?: string;
    name: string;
    sign: string;
    signLord?: string;
    degree: number;
    degreeFormatted?: string;
    isRetrograde: boolean;
    isCombust?: boolean;
    isExalted?: boolean;
    isDebilitated?: boolean;
    house: number;
    nakshatra: string;
    nakshatraLord?: string;
    nakshatraPada: number;
  }[];
  yogas?: YogaInfo[];
  doshas: {
    mangalDosha: {
      hasDosha: boolean;
      severity: string;
      type?: string;
      description: string;
      remedies: string[];
      affectedHouses?: number[];
      exceptions?: string[];
    };
    kaalSarpDosha: {
      hasDosha: boolean;
      type: string;
      severity: string;
      description: string;
      remedies: string[];
    };
    sadeSati: {
      isActive: boolean;
      phase: string;
      description?: string;
      startDate: string | null;
      endDate: string | null;
      saturnSign?: string;
      moonSign?: string;
      currentTransit?: {
        sign: string;
        isRetrograde: boolean;
        startDate: string;
        endDate: string;
      };
    };
  };
  dasha: {
    current: {
      mahadasha: {
        planet: string;
        startDate: string;
        endDate: string;
        yearsRemaining?: number;
        totalYears?: number;
      };
      antardasha: {
        planet: string;
        startDate: string;
        endDate: string;
        monthsRemaining?: number;
      };
      pratyantardasha?: {
        planet: string;
        startDate: string;
        endDate: string;
        daysRemaining?: number;
      };
    };
    timeline: {
      planet: string;
      startDate: string;
      endDate: string;
      durationYears?: number;
      isCurrent?: boolean;
    }[];
  };
  remedies: {
    gemstone: {
      name: string;
      planet?: string;
      finger: string;
      hand?: string;
      metal: string;
      weight?: string;
      day?: string;
      time?: string;
      mantra?: string;
    };
    luckyColors: string[];
    luckyNumbers: number[];
    luckyDays: string[];
    luckyDirection?: string;
    mantras: (string | MantraInfo)[];
    charities?: (string | CharityInfo)[];
    fasting?: FastingInfo;
    rudrakshas?: string[];
    yantras?: string[];
  };
  predictions: {
    general: string;
    career?: string;
    love?: string;
    health?: string;
    finance?: string;
    family?: string;
    education?: string;
  };
  charts?: {
    rasiChart?: ChartData;
    navamsaChart?: ChartData;
    dasamsaChart?: ChartData;
    saptamsaChart?: ChartData;
  };
}

// Legacy types for backward compatibility
export interface NakshatraDetails {
  name: string;
  lord: string;
  pada: number;
}

export interface DoshaInfo {
  hasDosha: boolean;
  severity: 'none' | 'mild' | 'severe';
  description: string;
  remedies: string[];
}

// Simplified planet for UI display
export interface PlanetDisplayInfo {
  name: string;
  sign: string;
  degree: number;
  isRetrograde: boolean;
  house: number;
}

// Enhanced Nakshatra details for UI
export interface EnhancedNakshatraDetails extends NakshatraDetails {
  deity?: string;
  symbol?: string;
  ganam?: string;
  nadi?: string;
  animal?: string;
  syllables?: string[];
}

// Enhanced planet display info
export interface EnhancedPlanetDisplayInfo extends PlanetDisplayInfo {
  id?: string;
  signLord?: string;
  degreeFormatted?: string;
  nakshatra?: string;
  nakshatraLord?: string;
  nakshatraPada?: number;
  isCombust?: boolean;
  isExalted?: boolean;
  isDebilitated?: boolean;
}

// Enhanced Dasha period
export interface EnhancedDashaPeriod extends DashaPeriod {
  yearsRemaining?: number;
  totalYears?: number;
  monthsRemaining?: number;
  daysRemaining?: number;
  durationYears?: number;
  isCurrent?: boolean;
}

// Enhanced Sade Sati info
export interface EnhancedSadeSati {
  isActive: boolean;
  phase: string;
  description?: string;
  startDate: string;
  endDate: string;
  saturnSign?: string;
  moonSign?: string;
  currentTransit?: {
    sign: string;
    isRetrograde: boolean;
    startDate: string;
    endDate: string;
  };
}

// Enhanced remedies
export interface EnhancedRemedies {
  gemstone: {
    name: string;
    planet?: string;
    finger: string;
    hand?: string;
    metal: string;
    weight?: string;
    day?: string;
    time?: string;
    mantra?: string;
  };
  luckyColors: string[];
  luckyNumbers: number[];
  luckyDays: string[];
  luckyDirection?: string;
  mantras: (string | MantraInfo)[];
  charities?: (string | CharityInfo)[];
  fasting?: FastingInfo;
  rudrakshas?: string[];
  yantras?: string[];
}

// Enhanced predictions
export interface EnhancedPredictions {
  general: string;
  career?: string;
  love?: string;
  health?: string;
  finance?: string;
  family?: string;
  education?: string;
}

export interface KundliReportData {
  nakshatra: EnhancedNakshatraDetails;
  rasi: { name: string; lord: string; element?: string };
  lagna: { name: string; lord: string; degree?: number };
  tithi?: { name: string; paksha?: string };
  yoga?: { name: string };
  karana?: { name: string };
  sunSign?: string;
  moonSign?: string;
  planets: EnhancedPlanetDisplayInfo[];
  yogas?: YogaInfo[];
  charts?: {
    rasiChart?: ChartData;
    navamsaChart?: ChartData;
    dasamsaChart?: ChartData;
    saptamsaChart?: ChartData;
  };
  mangalDosha: DoshaInfo & { type?: string; affectedHouses?: number[]; exceptions?: string[] };
  kaalSarpDosha: DoshaInfo & { type: string };
  sadeSati: EnhancedSadeSati;
  currentDasha: {
    mahadasha: EnhancedDashaPeriod;
    antardasha: EnhancedDashaPeriod;
    pratyantardasha?: EnhancedDashaPeriod;
  };
  dashaPeriods: EnhancedDashaPeriod[];
  remedies: EnhancedRemedies;
  predictions: EnhancedPredictions;
}

// ===============================
// Kundli Matching Types
// ===============================

// Matching person details
export interface MatchingPerson {
  name: string;
  gender?: Gender; // Optional, typically 'male' for boy and 'female' for girl
  dateOfBirth: string; // YYYY-MM-DD format
  timeOfBirth: string; // HH:mm format
  birthPlace: BirthPlace;
}

// Saved Kundli Matching report
export interface SavedMatching {
  id: string;
  boy: MatchingPerson;
  girl: MatchingPerson;
  score: number;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

// Matching input for generation
export interface MatchingInput {
  boy: MatchingPerson;
  girl: MatchingPerson;
}

// Ashtakoot Guna detail
export interface AshtakootGuna {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  obtainedPoints: number;
  boyAttribute: string;
  girlAttribute: string;
  verdict: 'excellent' | 'good' | 'average' | 'below_average';
}

// Matching verdict
export interface MatchingVerdict {
  rating: 'excellent' | 'good' | 'average' | 'below_average';
  description: string;
  recommendation: string;
}

// Dosha analysis in matching
export interface MatchingDoshaAnalysis {
  present: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  description: string;
  remedies?: string[];
}

// Full Matching report data (API response) - matches backend structure
export interface MatchingReport {
  matchingId: string;
  boy: {
    name: string;
    nakshatra: string;
    rasi: string;
    nakshatraLord: string;
  };
  girl: {
    name: string;
    nakshatra: string;
    rasi: string;
    nakshatraLord: string;
  };
  totalScore: number;
  maxScore: number;
  verdict: {
    rating: 'excellent' | 'good' | 'average' | 'below_average';
    description: string;
    recommendation: string;
  };
  ashtakootGunas: {
    id: string;
    name: string;
    description: string;
    maxPoints: number;
    obtainedPoints: number;
    boyAttribute: string;
    girlAttribute: string;
    verdict: string;
  }[];
  doshaAnalysis: {
    mangalDosha: {
      boyHasDosha: boolean;
      girlHasDosha: boolean;
      cancellation: string | null;
      status: string;
    };
    nadiDosha: {
      present: boolean;
      description: string;
    };
  };
  summary: string;
  recommendations: string[];
}

// Legacy types for backward compatibility
export interface GunaDetail {
  name: string;
  boyValue: string;
  girlValue: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface MatchingResult {
  totalScore: number;
  maxScore: number;
  gunaDetails: GunaDetail[];
  verdict: {
    score: number;
    description: string;
    recommendation: 'excellent' | 'good' | 'average' | 'below_average';
  };
}

// ===============================
// List/Pagination Types
// ===============================

export interface KundliListParams {
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MatchingListParams {
  search?: string;
  page?: number;
  limit?: number;
}

// ===============================
// Wizard Types
// ===============================

export type KundliWizardStep = 'name' | 'gender' | 'dob' | 'time' | 'location';

export type ChartStyle = 'south_indian' | 'north_indian';

/**
 * Kundli Data Types
 * Type definitions for Kundli and Kundli Matching features
 */

// Birth place location data
export interface BirthPlace {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Saved Kundli profile
export interface SavedKundli {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string; // ISO date string
  timeOfBirth: string; // HH:mm format
  birthPlace: BirthPlace;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Kundli wizard form data
export interface KundliWizardData {
  name: string;
  gender: 'male' | 'female' | 'other' | null;
  dateOfBirth: Date | null;
  timeOfBirth: Date | null;
  birthPlace: BirthPlace | null;
}

// Saved Kundli Matching report
export interface SavedMatching {
  id: string;
  boy: Omit<SavedKundli, 'id'>;
  girl: Omit<SavedKundli, 'id'>;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

// Planetary position
export interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  isRetrograde: boolean;
  house: number;
}

// Nakshatra details
export interface NakshatraDetails {
  name: string;
  lord: string;
  pada: number;
}

// Dosha information
export interface DoshaInfo {
  hasDosha: boolean;
  severity: 'none' | 'mild' | 'severe';
  description: string;
  remedies: string[];
}

// Dasha period
export interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
}

// Full Kundli report data
export interface KundliReportData {
  // Basic Info
  nakshatra: NakshatraDetails;
  rasi: { name: string; lord: string };
  lagna: { name: string; lord: string };

  // Planetary Positions
  planets: PlanetPosition[];

  // Doshas
  mangalDosha: DoshaInfo;
  kaalSarpDosha: DoshaInfo & { type: string };
  sadeSati: {
    isActive: boolean;
    phase: string;
    startDate: string;
    endDate: string;
  };

  // Dasha
  currentDasha: {
    mahadasha: DashaPeriod;
    antardasha: DashaPeriod;
  };
  dashaPeriods: DashaPeriod[];

  // Remedies
  remedies: {
    gemstone: { name: string; finger: string; metal: string };
    luckyColors: string[];
    luckyNumbers: number[];
    luckyDays: string[];
    mantras: string[];
  };

  // General prediction
  generalPrediction: string;
}

// Guna detail for matching
export interface GunaDetail {
  name: string;
  boyValue: string;
  girlValue: string;
  score: number;
  maxScore: number;
  description: string;
}

// Kundli matching result
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

// Wizard step type
export type KundliWizardStep = 'name' | 'gender' | 'dob' | 'time' | 'location';

// Chart style preference
export type ChartStyle = 'south_indian' | 'north_indian';

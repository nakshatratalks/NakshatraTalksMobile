/**
 * Zodiac Sign Constants
 * Contains all 12 zodiac signs with their properties
 */

import { ImageSourcePropType } from 'react-native';

export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  dateRange: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: '♈',
    dateRange: 'Mar 21 - Apr 19',
    element: 'fire',
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    dateRange: 'Apr 20 - May 20',
    element: 'earth',
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    dateRange: 'May 21 - Jun 20',
    element: 'air',
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    dateRange: 'Jun 21 - Jul 22',
    element: 'water',
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '♌',
    dateRange: 'Jul 23 - Aug 22',
    element: 'fire',
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    dateRange: 'Aug 23 - Sep 22',
    element: 'earth',
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: '♎',
    dateRange: 'Sep 23 - Oct 22',
    element: 'air',
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    dateRange: 'Oct 23 - Nov 21',
    element: 'water',
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    dateRange: 'Nov 22 - Dec 21',
    element: 'fire',
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    dateRange: 'Dec 22 - Jan 19',
    element: 'earth',
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    dateRange: 'Jan 20 - Feb 18',
    element: 'air',
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    dateRange: 'Feb 19 - Mar 20',
    element: 'water',
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
  },
];

/**
 * Get zodiac sign from birth date
 */
export const getZodiacFromDate = (date: Date): ZodiacSign => {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  for (const sign of ZODIAC_SIGNS) {
    // Handle Capricorn which spans year boundary
    if (sign.id === 'capricorn') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return sign;
      }
    } else {
      if (
        (month === sign.startMonth && day >= sign.startDay) ||
        (month === sign.endMonth && day <= sign.endDay)
      ) {
        return sign;
      }
    }
  }

  // Default to Aries if no match (shouldn't happen)
  return ZODIAC_SIGNS[0];
};

/**
 * Get current period's zodiac sign
 */
export const getCurrentZodiac = (): ZodiacSign => {
  return getZodiacFromDate(new Date());
};

/**
 * Zodiac sign images - Optimized WebP format
 * Compressed from ~10MB to ~118KB total (99% smaller)
 */
export const ZODIAC_IMAGES: Record<string, ImageSourcePropType> = {
  aries: require('../../assets/images/zodiac-signs/Aries.webp'),
  taurus: require('../../assets/images/zodiac-signs/Taurus.webp'),
  gemini: require('../../assets/images/zodiac-signs/Gemini.webp'),
  cancer: require('../../assets/images/zodiac-signs/Cancer.webp'),
  leo: require('../../assets/images/zodiac-signs/Leo.webp'),
  virgo: require('../../assets/images/zodiac-signs/Virgo.webp'),
  libra: require('../../assets/images/zodiac-signs/Libra.webp'),
  scorpio: require('../../assets/images/zodiac-signs/Scorpio.webp'),
  sagittarius: require('../../assets/images/zodiac-signs/Sagittarius.webp'),
  capricorn: require('../../assets/images/zodiac-signs/Capricorn.webp'),
  aquarius: require('../../assets/images/zodiac-signs/Aquarius.webp'),
  pisces: require('../../assets/images/zodiac-signs/Pisces.webp'),
};

/**
 * Element colors for zodiac signs
 */
export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#FF6B6B',
  earth: '#8B7355',
  air: '#87CEEB',
  water: '#4169E1',
};

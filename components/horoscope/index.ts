/**
 * Horoscope Components Index
 */

// Main carousel components
export { ZodiacCarousel } from './ZodiacCarousel';
export { ZodiacCarouselItem } from './ZodiacCarouselItem';
export { CarouselDebugOverlay } from './CarouselDebugOverlay';

// Modal and content components
export { ZodiacGridModal } from './ZodiacGridModal';
export { HoroscopeTabSwitcher, type HoroscopeDay } from './HoroscopeTabSwitcher';
export { HoroscopeCategoryCard, type HoroscopeCategory } from './HoroscopeCategoryCard';

// Configuration and types
export {
  CAROUSEL_CONFIG,
  getItemWidth,
  getCarouselPadding,
  getCarouselWidth,
  getCarouselHeight,
  type SelectionChangeReason,
  type ActiveChangeEvent,
} from './constants/carouselConfig';

// Hooks
export { useCenterDetection, type CenterDetectionConfig, type CenterDetectionResult } from './hooks/useCenterDetection';
export { useCarouselItemAnimation } from './hooks/useCarouselAnimations';

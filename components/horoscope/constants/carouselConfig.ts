/**
 * Zodiac Carousel Configuration
 * All values derived from Figma design specifications
 * All calculations are dynamic based on device screen size
 */

export const CAROUSEL_CONFIG = {
  // Item sizes (exact from Figma - base values)
  CENTER_ITEM_SIZE: 138,      // Center zodiac image size
  SIDE_ITEM_SIZE: 100,        // Side zodiac image size

  // Scale ratio (calculated from Figma)
  SIDE_SCALE: 100 / 138,      // 0.725 (exact ratio)

  // Opacity values (from Figma)
  CENTER_OPACITY: 1.0,        // Full opacity for center
  SIDE_OPACITY: 0.5,          // 50% for sides

  // Vertical offset (from Figma: sides at y=303, center at y=334)
  SIDE_TRANSLATE_Y: -31,      // Sides elevated by 31px

  // Colors (from Figma)
  CENTER_BG_COLOR: '#2930A6',          // Blue background for center
  SIDE_BG_COLOR: 'transparent',        // No background for sides

  // Animation
  SPRING_CONFIG: {
    damping: 20,
    stiffness: 150,
    mass: 0.8,
  },

  // Scroll behavior
  SCROLL_DURATION: 400,
  ACTIVE_OFFSET_X: 20,        // Gesture threshold
  FAIL_OFFSET_Y: 10,          // Prevent vertical scroll interference

  // Center Detection Configuration
  CENTER_DETECTION: {
    // Detection mode: 'viewportCenter' computes center x-coordinate of viewport
    MODE: 'viewportCenter' as const,

    // Debounce interval (ms) to reduce jitter during rapid scrolling
    UPDATE_DEBOUNCE_MS: 80,

    // Hysteresis threshold (px) - minimum distance change before switching active card
    HYSTERESIS_PX: 15,

    // Snap behavior
    SNAP_ON_RELEASE: true,
    SNAP_ANIMATION_DURATION_MS: 350,

    // Keyboard navigation
    ENABLE_KEYBOARD: true,

    // Automatically read reduced motion preference from OS
    REDUCED_MOTION: 'auto' as const,
  },

  // Active card visual enhancements
  ACTIVE_CARD: {
    SCALE_BOOST: 1.0,           // Active card scale (no additional boost, already 1.0)
    SHADOW_ELEVATION: 8,        // Shadow elevation for active card
    SHADOW_COLOR: '#2930A6',    // Shadow color matching brand
    SHADOW_OPACITY: 0.25,       // Shadow opacity
    SHADOW_RADIUS: 12,          // Shadow blur radius
    GLOW_INTENSITY: 0.15,       // Border glow intensity for active card
  },

  // Detail panel animation
  DETAIL_PANEL: {
    FADE_DURATION_MS: 200,      // Fade transition duration
    SLIDE_OFFSET: 20,           // Slide distance in pixels
  },
} as const;

/**
 * Selection change reason types
 */
export type SelectionChangeReason = 'scroll' | 'snap' | 'click' | 'keyboard' | 'programmatic';

/**
 * Active change callback type
 */
export interface ActiveChangeEvent<T = unknown> {
  activeIndex: number;
  activeCardData: T;
  previousIndex: number;
  reason: SelectionChangeReason;
}

/**
 * Dynamic Layout Calculations (Screen Size Based)
 */

/**
 * Calculate item width for carousel
 * Each item takes 1/3 of screen width to show 3 items
 */
export const getItemWidth = (screenWidth: number): number => {
  return screenWidth / 3;
};

/**
 * Calculate horizontal padding to center the carousel items
 * This ensures the center item is perfectly centered on screen
 * Formula: (screenWidth - itemWidth) / 2
 *
 * Example for 390px screen:
 * - itemWidth = 390 / 3 = 130px
 * - padding = (390 - 130) / 2 = 130px
 * This centers the active item perfectly
 */
export const getCarouselPadding = (screenWidth: number): number => {
  const itemWidth = getItemWidth(screenWidth);
  return (screenWidth - itemWidth) / 2;
};

/**
 * Calculate carousel container width
 * This ensures proper rendering space for all items
 */
export const getCarouselWidth = (screenWidth: number): number => {
  return screenWidth;
};

/**
 * Calculate item height dynamically
 * Provides enough space for center item + elevation offset
 */
export const getCarouselHeight = (scale: number = 1): number => {
  return CAROUSEL_CONFIG.CENTER_ITEM_SIZE * 1.5 * scale;
};

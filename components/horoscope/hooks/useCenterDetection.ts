/**
 * useCenterDetection Hook
 * Implements continuous center-based card detection with debounce and hysteresis
 * Updates the active card based on which card's center is closest to viewport center
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import {
  CAROUSEL_CONFIG,
  SelectionChangeReason,
  ActiveChangeEvent,
} from '../constants/carouselConfig';

export interface CenterDetectionConfig {
  /** Number of items in the carousel */
  itemCount: number;
  /** Width of each item */
  itemWidth: number;
  /** Callback when active card changes */
  onActiveChange?: <T>(event: ActiveChangeEvent<T>) => void;
  /** Custom debounce time (ms) */
  debounceMs?: number;
  /** Custom hysteresis threshold (px) */
  hysteresisPx?: number;
  /** Whether carousel is looped */
  loop?: boolean;
  /** Get item data by index */
  getItemData?: (index: number) => unknown;
}

export interface CenterDetectionResult {
  /** Current active index (shared value for animations) */
  activeIndex: SharedValue<number>;
  /** Current active index (state for React) */
  currentActiveIndex: number;
  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
  /** Handle scroll progress updates from carousel */
  handleProgressChange: (progress: number) => void;
  /** Handle snap completion */
  handleSnapComplete: (index: number) => void;
  /** Handle item click/tap */
  handleItemClick: (index: number) => void;
  /** Handle keyboard navigation */
  handleKeyboardNavigation: (direction: 'left' | 'right' | 'home' | 'end') => number;
  /** Force update active index programmatically */
  setActiveIndex: (index: number, reason?: SelectionChangeReason) => void;
}

export const useCenterDetection = (config: CenterDetectionConfig): CenterDetectionResult => {
  const {
    itemCount,
    itemWidth,
    onActiveChange,
    debounceMs = CAROUSEL_CONFIG.CENTER_DETECTION.UPDATE_DEBOUNCE_MS,
    hysteresisPx = CAROUSEL_CONFIG.CENTER_DETECTION.HYSTERESIS_PX,
    loop = true,
    getItemData = (index: number) => ({ index }),
  } = config;

  // Shared values for animation thread
  const activeIndex = useSharedValue(0);
  const lastNotifiedIndex = useRef(-1);
  const lastUpdateTime = useRef(0);
  const currentActiveIndexRef = useRef(0);
  const lastScrollPosition = useRef(0);
  const reducedMotionRef = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      if (CAROUSEL_CONFIG.CENTER_DETECTION.REDUCED_MOTION === 'auto') {
        const isReducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        reducedMotionRef.current = isReducedMotionEnabled;
      }
    };

    checkReducedMotion();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        if (CAROUSEL_CONFIG.CENTER_DETECTION.REDUCED_MOTION === 'auto') {
          reducedMotionRef.current = isEnabled;
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Notify active change to callback
   */
  const notifyActiveChange = useCallback(
    (newIndex: number, reason: SelectionChangeReason) => {
      // Skip if same index was already notified
      if (newIndex === lastNotifiedIndex.current) return;

      const previousIndex = lastNotifiedIndex.current;
      lastNotifiedIndex.current = newIndex;
      currentActiveIndexRef.current = newIndex;

      if (onActiveChange) {
        const event: ActiveChangeEvent = {
          activeIndex: newIndex,
          activeCardData: getItemData(newIndex),
          previousIndex: previousIndex >= 0 ? previousIndex : newIndex,
          reason,
        };
        onActiveChange(event);
      }
    },
    [onActiveChange, getItemData]
  );

  /**
   * Calculate nearest center index from scroll progress
   * Progress represents how many items have scrolled (0 = first item centered)
   */
  const calculateCenterIndex = useCallback(
    (progress: number): number => {
      // For a loop carousel, progress can be any number
      // We need to find which item index is closest to center
      let roundedProgress = Math.round(progress);

      if (loop) {
        // Normalize to valid index range
        roundedProgress = ((roundedProgress % itemCount) + itemCount) % itemCount;
      } else {
        // Clamp to valid range
        roundedProgress = Math.max(0, Math.min(itemCount - 1, roundedProgress));
      }

      return roundedProgress;
    },
    [itemCount, loop]
  );

  /**
   * Handle scroll progress changes with debounce and hysteresis
   */
  const handleProgressChange = useCallback(
    (progress: number) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;

      // Calculate distance from last position for hysteresis
      const progressDelta = Math.abs(progress - lastScrollPosition.current);
      const pixelDelta = progressDelta * itemWidth;

      // Apply debounce
      if (timeSinceLastUpdate < debounceMs) {
        return;
      }

      // Apply hysteresis - only update if moved beyond threshold
      if (pixelDelta < hysteresisPx && lastNotifiedIndex.current >= 0) {
        return;
      }

      const newIndex = calculateCenterIndex(progress);

      if (newIndex !== currentActiveIndexRef.current) {
        lastUpdateTime.current = now;
        lastScrollPosition.current = progress;
        activeIndex.value = newIndex;
        notifyActiveChange(newIndex, 'scroll');
      }
    },
    [itemWidth, debounceMs, hysteresisPx, calculateCenterIndex, activeIndex, notifyActiveChange]
  );

  /**
   * Handle snap completion - final selection after scroll settles
   */
  const handleSnapComplete = useCallback(
    (index: number) => {
      activeIndex.value = index;
      lastScrollPosition.current = index;
      notifyActiveChange(index, 'snap');
    },
    [activeIndex, notifyActiveChange]
  );

  /**
   * Handle item click/tap - instant selection
   */
  const handleItemClick = useCallback(
    (index: number) => {
      activeIndex.value = index;
      lastScrollPosition.current = index;
      notifyActiveChange(index, 'click');
    },
    [activeIndex, notifyActiveChange]
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyboardNavigation = useCallback(
    (direction: 'left' | 'right' | 'home' | 'end'): number => {
      let newIndex = currentActiveIndexRef.current;

      switch (direction) {
        case 'left':
          newIndex = loop
            ? (newIndex - 1 + itemCount) % itemCount
            : Math.max(0, newIndex - 1);
          break;
        case 'right':
          newIndex = loop
            ? (newIndex + 1) % itemCount
            : Math.min(itemCount - 1, newIndex + 1);
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = itemCount - 1;
          break;
      }

      activeIndex.value = newIndex;
      lastScrollPosition.current = newIndex;
      notifyActiveChange(newIndex, 'keyboard');

      return newIndex;
    },
    [itemCount, loop, activeIndex, notifyActiveChange]
  );

  /**
   * Programmatically set active index
   */
  const setActiveIndex = useCallback(
    (index: number, reason: SelectionChangeReason = 'programmatic') => {
      const validIndex = loop
        ? ((index % itemCount) + itemCount) % itemCount
        : Math.max(0, Math.min(itemCount - 1, index));

      activeIndex.value = validIndex;
      lastScrollPosition.current = validIndex;
      notifyActiveChange(validIndex, reason);
    },
    [itemCount, loop, activeIndex, notifyActiveChange]
  );

  return {
    activeIndex,
    currentActiveIndex: currentActiveIndexRef.current,
    reducedMotion: reducedMotionRef.current,
    handleProgressChange,
    handleSnapComplete,
    handleItemClick,
    handleKeyboardNavigation,
    setActiveIndex,
  };
};

export default useCenterDetection;

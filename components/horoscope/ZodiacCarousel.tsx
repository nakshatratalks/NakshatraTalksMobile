/**
 * ZodiacCarousel - Main carousel container
 * Manages carousel state and coordinates child components
 * Implements center-based card detection with continuous tracking
 *
 * Features:
 * - Center detection: Active card is always the one closest to viewport center
 * - Debounce/hysteresis: Prevents jittery updates during rapid scrolling
 * - Snap on release: Smoothly centers the active card when user stops scrolling
 * - Keyboard navigation: Arrow keys, Home/End support
 * - Accessibility: ARIA attributes, screen reader announcements
 * - onActiveChange callback: Reports selection changes with reason
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ZODIAC_SIGNS, ZodiacSign } from '../../src/constants/zodiac';
import { ZodiacCarouselItem } from './ZodiacCarouselItem';
import {
  CAROUSEL_CONFIG,
  getItemWidth,
  getCarouselPadding,
  getCarouselWidth,
  getCarouselHeight,
  SelectionChangeReason,
  ActiveChangeEvent,
} from './constants/carouselConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ZodiacCarouselProps {
  /** Currently selected sign ID */
  selectedSign: string;
  /** Callback when sign selection changes */
  onSignChange: (sign: ZodiacSign) => void;
  /** Responsive scale factor */
  scale?: number;
  /** Enhanced callback with detailed event info */
  onActiveChange?: (event: ActiveChangeEvent<ZodiacSign>) => void;
  /** Enable debug overlay */
  debugMode?: boolean;
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
}

export const ZodiacCarousel: React.FC<ZodiacCarouselProps> = ({
  selectedSign,
  onSignChange,
  scale = 1,
  onActiveChange,
  debugMode = false,
  enableKeyboard = CAROUSEL_CONFIG.CENTER_DETECTION.ENABLE_KEYBOARD,
}) => {
  // Refs
  const carouselRef = useRef<ICarouselInstance>(null);
  const lastIndexRef = useRef(-1);
  const isTapScrollRef = useRef(false);
  const isExternalUpdateRef = useRef(false); // Track if update came from external source (grid modal)

  // State for active index tracking
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Animated values for smooth transitions
  const nameOpacity = useSharedValue(1);
  const nameTranslateY = useSharedValue(0);

  // Dynamic layout calculations based on screen size
  const itemWidth = getItemWidth(SCREEN_WIDTH);
  const carouselPadding = getCarouselPadding(SCREEN_WIDTH);
  const carouselWidth = getCarouselWidth(SCREEN_WIDTH);
  const carouselHeight = getCarouselHeight(scale);

  // Find selected index from prop
  const selectedIndex = useMemo(
    () => ZODIAC_SIGNS.findIndex((s) => s.id === selectedSign),
    [selectedSign]
  );

  // Get current active sign data
  const activeSignData = useMemo(
    () => ZODIAC_SIGNS[activeIndex] || ZODIAC_SIGNS[0],
    [activeIndex]
  );

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isEnabled);
    };
    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => subscription.remove();
  }, []);

  /**
   * Calculate shortest path direction in a looped carousel
   * Returns true if going forward is shorter, false if backward is shorter
   */
  const getShortestPathDirection = useCallback((from: number, to: number): 'forward' | 'backward' => {
    const totalItems = ZODIAC_SIGNS.length;
    const forwardDistance = (to - from + totalItems) % totalItems;
    const backwardDistance = (from - to + totalItems) % totalItems;
    return forwardDistance <= backwardDistance ? 'forward' : 'backward';
  }, []);

  /**
   * Scroll carousel to index using shortest path
   * Handles external updates (from grid modal) vs internal updates (swipe/tap)
   */
  const scrollToIndex = useCallback((targetIndex: number, animated: boolean = true) => {
    if (!carouselRef.current) return;

    const currentIndex = lastIndexRef.current >= 0 ? lastIndexRef.current : activeIndex;

    if (currentIndex === targetIndex) return;

    // For the carousel library, scrollTo with index handles looping automatically
    // The library finds the shortest path in a loop
    carouselRef.current.scrollTo({ index: targetIndex, animated });
  }, [activeIndex]);

  // Handle external selection changes (from grid modal or parent)
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex !== lastIndexRef.current) {
      // This is an external update - scroll the carousel
      isExternalUpdateRef.current = true;

      const animated = !reducedMotion;
      scrollToIndex(selectedIndex, animated);

      // Update internal state
      setActiveIndex(selectedIndex);
      lastIndexRef.current = selectedIndex;
    }
  }, [selectedIndex, reducedMotion, scrollToIndex]);

  /**
   * Notify active change with full event details
   */
  const notifyActiveChange = useCallback(
    (newIndex: number, reason: SelectionChangeReason) => {
      const previousIndex = lastIndexRef.current;

      // Update internal tracking
      lastIndexRef.current = newIndex;
      setActiveIndex(newIndex);

      // Animate name transition
      const duration = reducedMotion ? 0 : CAROUSEL_CONFIG.DETAIL_PANEL.FADE_DURATION_MS;
      nameOpacity.value = withTiming(0, { duration: duration / 2 }, () => {
        nameOpacity.value = withTiming(1, { duration: duration / 2 });
      });
      nameTranslateY.value = withTiming(-CAROUSEL_CONFIG.DETAIL_PANEL.SLIDE_OFFSET,
        { duration: duration / 2 }, () => {
          nameTranslateY.value = 0;
          nameTranslateY.value = withTiming(0, { duration: duration / 2 });
        }
      );

      // Call basic callback
      onSignChange(ZODIAC_SIGNS[newIndex]);

      // Call enhanced callback if provided
      if (onActiveChange) {
        onActiveChange({
          activeIndex: newIndex,
          activeCardData: ZODIAC_SIGNS[newIndex],
          previousIndex: previousIndex >= 0 ? previousIndex : newIndex,
          reason,
        });
      }

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        `${ZODIAC_SIGNS[newIndex].name} selected, ${newIndex + 1} of ${ZODIAC_SIGNS.length}`
      );
    },
    [onSignChange, onActiveChange, reducedMotion, nameOpacity, nameTranslateY]
  );


  /**
   * Handle snap to item - fires when carousel settles on an item
   * This is the ONLY place where selection changes (snap-only mode)
   */
  const handleSnapToItem = useCallback(
    (index: number) => {
      // If this snap was triggered by an external update (grid modal),
      // skip notification since parent already knows
      if (isExternalUpdateRef.current) {
        isExternalUpdateRef.current = false;
        lastIndexRef.current = index;
        setActiveIndex(index);

        // Still provide haptic feedback for external selection
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Call onActiveChange with 'programmatic' reason for external updates
        if (onActiveChange) {
          onActiveChange({
            activeIndex: index,
            activeCardData: ZODIAC_SIGNS[index],
            previousIndex: lastIndexRef.current,
            reason: 'programmatic',
          });
        }
        return;
      }

      if (index !== lastIndexRef.current) {
        // Rich haptic only for swipe gestures (not taps)
        if (!isTapScrollRef.current) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        notifyActiveChange(index, isTapScrollRef.current ? 'click' : 'snap');
        isTapScrollRef.current = false;
      }
    },
    [notifyActiveChange, onActiveChange]
  );

  /**
   * Handle item press - scroll to selected item
   * Medium haptic handled in item component
   */
  const handleItemPress = useCallback((index: number) => {
    if (index !== lastIndexRef.current) {
      isTapScrollRef.current = true;

      const animated = !reducedMotion;
      carouselRef.current?.scrollTo({ index, animated });

      // If reduced motion, immediately update
      if (reducedMotion) {
        notifyActiveChange(index, 'click');
      }
    }
  }, [reducedMotion, notifyActiveChange]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyboardNavigation = useCallback(
    (direction: 'left' | 'right' | 'home' | 'end') => {
      if (!enableKeyboard) return;

      const itemCount = ZODIAC_SIGNS.length;
      let newIndex = activeIndex;

      switch (direction) {
        case 'left':
          newIndex = (activeIndex - 1 + itemCount) % itemCount;
          break;
        case 'right':
          newIndex = (activeIndex + 1) % itemCount;
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = itemCount - 1;
          break;
      }

      if (newIndex !== activeIndex) {
        isTapScrollRef.current = true;
        const animated = !reducedMotion;
        carouselRef.current?.scrollTo({ index: newIndex, animated });

        if (reducedMotion) {
          notifyActiveChange(newIndex, 'keyboard');
        }
      }
    },
    [enableKeyboard, activeIndex, reducedMotion, notifyActiveChange]
  );

  /**
   * Animated style for sign name with smooth transition
   */
  const nameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  /**
   * Render individual carousel item with accessibility props
   */
  const renderItem = useCallback(
    ({
      item,
      index,
      animationValue,
    }: {
      item: ZodiacSign;
      index: number;
      animationValue: SharedValue<number>;
    }) => (
      <ZodiacCarouselItem
        item={item}
        animationValue={animationValue}
        onPress={() => handleItemPress(index)}
        scale={scale}
        isActive={index === activeIndex}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.dateRange}`}
        accessibilityState={{ selected: index === activeIndex }}
        accessibilityHint={index === activeIndex ? 'Currently selected' : 'Double tap to select'}
      />
    ),
    [handleItemPress, scale, activeIndex]
  );

  // Calculate snap animation duration based on reduced motion
  const snapDuration = reducedMotion
    ? 0
    : CAROUSEL_CONFIG.CENTER_DETECTION.SNAP_ANIMATION_DURATION_MS;

  return (
    <View
      style={styles.container}
      accessibilityRole="adjustable"
      accessibilityLabel={`Zodiac sign carousel, ${activeSignData.name} selected`}
      accessibilityHint="Swipe left or right to change sign"
      accessibilityActions={[
        { name: 'increment', label: 'Next sign' },
        { name: 'decrement', label: 'Previous sign' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'increment':
            handleKeyboardNavigation('right');
            break;
          case 'decrement':
            handleKeyboardNavigation('left');
            break;
        }
      }}
    >
      {/* Debug overlay for center detection */}
      {debugMode && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugCenterLine} />
          <Text style={styles.debugText}>
            Active: {activeIndex}
          </Text>
        </View>
      )}

      {/* Carousel with symmetric padding for perfect centering */}
      <View
        style={[styles.carouselWrapper, { width: carouselWidth }]}
        accessibilityRole="list"
      >
        <Carousel
          ref={carouselRef}
          data={ZODIAC_SIGNS}
          renderItem={renderItem}
          width={itemWidth}
          height={carouselHeight}
          style={{
            width: carouselWidth,
            paddingHorizontal: carouselPadding,
          }}
          loop
          defaultIndex={selectedIndex >= 0 ? selectedIndex : 0}
          onSnapToItem={handleSnapToItem}
          scrollAnimationDuration={snapDuration || CAROUSEL_CONFIG.SCROLL_DURATION}
          // @ts-expect-error - Library type definitions may not include panGestureHandlerProps
          panGestureHandlerProps={{
            activeOffsetX: [
              -CAROUSEL_CONFIG.ACTIVE_OFFSET_X,
              CAROUSEL_CONFIG.ACTIVE_OFFSET_X,
            ],
            failOffsetY: [
              -CAROUSEL_CONFIG.FAIL_OFFSET_Y,
              CAROUSEL_CONFIG.FAIL_OFFSET_Y,
            ],
          }}
        />
      </View>

      {/* Zodiac sign name with animated transition */}
      <Animated.View style={[styles.nameContainer, { marginTop: 4 * scale }, nameAnimatedStyle]}>
        <Text
          style={[styles.signName, { fontSize: 16 * scale }]}
          accessibilityRole="text"
          accessibilityLabel={`Selected sign: ${activeSignData.name}`}
        >
          {activeSignData.name}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  carouselWrapper: {
    // Width applied inline based on screen size
    // No overflow hidden - ensures all 3 cards are visible
  },
  nameContainer: {
    alignItems: 'center',
  },
  signName: {
    fontFamily: 'LibreBodoni_700Bold',
    color: '#000000',
    textAlign: 'center',
  },
  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  debugCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    marginLeft: -1,
  },
  debugText: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#FF0000',
    fontFamily: 'monospace',
  },
});

export default ZodiacCarousel;

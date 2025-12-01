/**
 * ZodiacCarouselItem - Pure presentation component
 * Renders individual zodiac sign in carousel with animations
 *
 * Features:
 * - Center-based active state with enhanced visuals
 * - Smooth scale, opacity, and shadow animations
 * - GPU-friendly transforms (no layout thrashing)
 * - Accessibility support with proper ARIA attributes
 */

import React from 'react';
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ZodiacSign, ZODIAC_IMAGES } from '../../src/constants/zodiac';
import { useCarouselItemAnimation } from './hooks/useCarouselAnimations';
import { CAROUSEL_CONFIG } from './constants/carouselConfig';

interface ZodiacCarouselItemProps {
  /** Zodiac sign data */
  item: ZodiacSign;
  /** Animation value from carousel (-1 to 1, 0 = center) */
  animationValue: SharedValue<number>;
  /** Press handler */
  onPress: () => void;
  /** Responsive scale factor */
  scale: number;
  /** Whether this item is the active (center) card */
  isActive?: boolean;
  /** Accessibility role */
  accessibilityRole?: AccessibilityRole;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility state */
  accessibilityState?: AccessibilityState;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export const ZodiacCarouselItem = React.memo<ZodiacCarouselItemProps>(
  ({
    item,
    animationValue,
    onPress,
    scale,
    isActive = false,
    accessibilityRole = 'button',
    accessibilityLabel,
    accessibilityState,
    accessibilityHint,
  }) => {
    const { transformStyle, backgroundStyle } = useCarouselItemAnimation(animationValue);

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    };

    const size = CAROUSEL_CONFIG.CENTER_ITEM_SIZE * scale;

    // Determine platform outside of worklet
    const isIOS = Platform.OS === 'ios';

    /**
     * Enhanced shadow style for active card
     * Uses GPU-friendly properties for smooth animation
     * Platform check is done outside worklet since Platform.select isn't available in UI thread
     */
    const shadowAnimatedStyle = useAnimatedStyle(() => {
      // Shadow intensity based on distance from center
      const shadowOpacity = interpolate(
        Math.abs(animationValue.value),
        [0, 0.5, 1],
        [
          CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_OPACITY,
          CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_OPACITY * 0.3,
          0,
        ],
        Extrapolation.CLAMP
      );

      const shadowRadius = interpolate(
        Math.abs(animationValue.value),
        [0, 0.5, 1],
        [
          CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_RADIUS,
          CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_RADIUS * 0.5,
          0,
        ],
        Extrapolation.CLAMP
      );

      const elevation = interpolate(
        Math.abs(animationValue.value),
        [0, 0.5, 1],
        [CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_ELEVATION, 4, 0],
        Extrapolation.CLAMP
      );

      // Glow border width for active state
      const borderWidth = interpolate(
        Math.abs(animationValue.value),
        [0, 0.3, 1],
        [2, 1, 0],
        Extrapolation.CLAMP
      );

      // Return platform-specific styles (platform check done outside worklet)
      if (isIOS) {
        return {
          shadowColor: CAROUSEL_CONFIG.ACTIVE_CARD.SHADOW_COLOR,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: withSpring(shadowOpacity, CAROUSEL_CONFIG.SPRING_CONFIG),
          shadowRadius: withSpring(shadowRadius, CAROUSEL_CONFIG.SPRING_CONFIG),
          borderWidth: withSpring(borderWidth, CAROUSEL_CONFIG.SPRING_CONFIG),
          borderColor: `rgba(41, 48, 166, ${CAROUSEL_CONFIG.ACTIVE_CARD.GLOW_INTENSITY})`,
        };
      } else {
        return {
          elevation: withSpring(elevation, CAROUSEL_CONFIG.SPRING_CONFIG),
          borderWidth: withSpring(borderWidth, CAROUSEL_CONFIG.SPRING_CONFIG),
          borderColor: `rgba(41, 48, 166, ${CAROUSEL_CONFIG.ACTIVE_CARD.GLOW_INTENSITY})`,
        };
      }
    });

    /**
     * Press scale animation
     */
    const pressAnimatedStyle = useAnimatedStyle(() => {
      // Slight press effect - less pronounced for non-center items
      const pressScale = isActive ? 1.0 : 0.98;

      return {
        transform: [{ scale: pressScale }],
      };
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.container}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || `${item.name}, ${item.dateRange}`}
        accessibilityState={accessibilityState || { selected: isActive }}
        accessibilityHint={accessibilityHint}
      >
        <Animated.View style={[styles.content, transformStyle, pressAnimatedStyle]}>
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              backgroundStyle,
              shadowAnimatedStyle,
            ]}
          >
            <Image
              source={ZODIAC_IMAGES[item.id]}
              style={[styles.image, { width: size, height: size }]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

ZodiacCarouselItem.displayName = 'ZodiacCarouselItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    // Overflow visible to show shadow
    overflow: 'visible',
  },
  image: {},
});

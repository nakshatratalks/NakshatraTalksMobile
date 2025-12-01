/**
 * Custom hook for carousel item animations
 * Separates animation logic from component rendering
 */

import {
  useAnimatedStyle,
  interpolate,
  withSpring,
  interpolateColor,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { CAROUSEL_CONFIG } from '../constants/carouselConfig';

export const useCarouselItemAnimation = (animationValue: SharedValue<number>) => {
  // Transform animation (scale + translateY + opacity)
  const transformStyle = useAnimatedStyle(() => {
    const scale = withSpring(
      interpolate(
        animationValue.value,
        [-1, 0, 1],
        [CAROUSEL_CONFIG.SIDE_SCALE, 1, CAROUSEL_CONFIG.SIDE_SCALE],
        Extrapolation.CLAMP
      ),
      CAROUSEL_CONFIG.SPRING_CONFIG
    );

    const translateY = withSpring(
      interpolate(
        animationValue.value,
        [-1, 0, 1],
        [CAROUSEL_CONFIG.SIDE_TRANSLATE_Y, 0, CAROUSEL_CONFIG.SIDE_TRANSLATE_Y],
        Extrapolation.CLAMP
      ),
      CAROUSEL_CONFIG.SPRING_CONFIG
    );

    const opacity = withSpring(
      interpolate(
        animationValue.value,
        [-1, 0, 1],
        [CAROUSEL_CONFIG.SIDE_OPACITY, CAROUSEL_CONFIG.CENTER_OPACITY, CAROUSEL_CONFIG.SIDE_OPACITY],
        Extrapolation.CLAMP
      ),
      CAROUSEL_CONFIG.SPRING_CONFIG
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  // Background color animation
  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animationValue.value,
      [-1, 0, 1],
      [CAROUSEL_CONFIG.SIDE_BG_COLOR, CAROUSEL_CONFIG.CENTER_BG_COLOR, CAROUSEL_CONFIG.SIDE_BG_COLOR]
    );

    return { backgroundColor };
  });

  return { transformStyle, backgroundStyle };
};

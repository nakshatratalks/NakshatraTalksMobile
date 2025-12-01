/**
 * ShimmerEffect Component
 * Simple pulsing skeleton placeholder
 * Performance-optimized: Single shared animation
 */

import React from 'react';
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface ShimmerEffectProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
}

// Shared animation value for all shimmer effects
let sharedAnimation: Animated.Value | null = null;
let animationStarted = false;

const getSharedAnimation = () => {
  if (!sharedAnimation) {
    sharedAnimation = new Animated.Value(0.4);
  }
  if (!animationStarted) {
    animationStarted = true;
    Animated.loop(
      Animated.sequence([
        Animated.timing(sharedAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sharedAnimation, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }
  return sharedAnimation;
};

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width,
  height,
  borderRadius = 8
}) => {
  const opacity = getSharedAnimation();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: width as DimensionValue,
          height: height as DimensionValue,
          borderRadius,
          opacity,
        } as ViewStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
  },
});

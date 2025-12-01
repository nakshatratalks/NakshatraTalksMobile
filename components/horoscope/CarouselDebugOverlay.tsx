/**
 * CarouselDebugOverlay - Development tool for debugging center detection
 *
 * Features:
 * - Shows viewport center line (red vertical line)
 * - Displays card center markers
 * - Shows real-time active index and scroll progress
 * - Logs selection decisions and distances
 *
 * Usage:
 * Enable debug mode on ZodiacCarousel:
 * <ZodiacCarousel debugMode={true} ... />
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselDebugOverlayProps {
  /** Current scroll progress shared value */
  scrollProgress: SharedValue<number>;
  /** Number of items in carousel */
  itemCount: number;
  /** Width of each item */
  itemWidth: number;
  /** Current active index */
  activeIndex: number;
  /** Whether debug mode is enabled */
  enabled?: boolean;
}

export const CarouselDebugOverlay: React.FC<CarouselDebugOverlayProps> = ({
  scrollProgress,
  itemCount,
  itemWidth,
  activeIndex,
  enabled = false,
}) => {
  if (!enabled) return null;

  /**
   * Animated text showing current progress
   */
  const progressText = useDerivedValue(() => {
    return `Progress: ${scrollProgress.value.toFixed(3)}`;
  });

  /**
   * Calculate distance from each card center to viewport center
   */
  const distances = useDerivedValue(() => {
    const viewportCenter = SCREEN_WIDTH / 2;
    const currentProgress = scrollProgress.value;

    // For each item, calculate its center position
    const distanceArray: number[] = [];
    for (let i = 0; i < itemCount; i++) {
      // Distance from current scroll position to this item
      const distanceToItem = Math.abs(currentProgress - i);
      // Handle loop wrap-around
      const wrappedDistance = Math.min(distanceToItem, itemCount - distanceToItem);
      distanceArray.push(wrappedDistance);
    }

    return distanceArray;
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Viewport center line */}
      <View style={styles.centerLine} />

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Active: {activeIndex}</Text>
        <ProgressText scrollProgress={scrollProgress} />
        <Text style={styles.infoText}>Items: {itemCount}</Text>
        <Text style={styles.infoText}>Width: {itemWidth.toFixed(0)}px</Text>
      </View>

      {/* Card markers */}
      <View style={styles.markerContainer}>
        {Array.from({ length: Math.min(5, itemCount) }).map((_, i) => {
          // Show markers for visible cards (-2 to +2 from center)
          const offset = i - 2;
          return (
            <CardMarker
              key={i}
              offset={offset}
              itemWidth={itemWidth}
              isActive={i === 2} // Center marker
            />
          );
        })}
      </View>
    </View>
  );
};

/**
 * Animated progress text component
 */
const ProgressText: React.FC<{ scrollProgress: SharedValue<number> }> = ({
  scrollProgress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {};
  });

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedProgressValue scrollProgress={scrollProgress} />
    </Animated.View>
  );
};

const AnimatedProgressValue: React.FC<{ scrollProgress: SharedValue<number> }> = ({
  scrollProgress,
}) => {
  // Using a derived value to create a text representation
  const derivedProgress = useDerivedValue(() => {
    return scrollProgress.value.toFixed(3);
  });

  // Note: In React Native, we can't directly animate text content
  // So we update on each frame via the parent component's re-render
  return (
    <Text style={styles.infoText}>
      Scroll: {scrollProgress.value.toFixed(3)}
    </Text>
  );
};

/**
 * Individual card center marker
 */
interface CardMarkerProps {
  offset: number;
  itemWidth: number;
  isActive: boolean;
}

const CardMarker: React.FC<CardMarkerProps> = ({ offset, itemWidth, isActive }) => {
  const centerX = SCREEN_WIDTH / 2 + offset * itemWidth;

  return (
    <View
      style={[
        styles.cardMarker,
        {
          left: centerX - 3,
          backgroundColor: isActive ? '#00FF00' : '#FFFF00',
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  infoPanel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  markerContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 0,
  },
  cardMarker: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: -3,
  },
});

export default CarouselDebugOverlay;

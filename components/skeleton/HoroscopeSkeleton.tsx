/**
 * HoroscopeSkeleton Component
 * Loading skeleton for Daily Horoscope screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerEffect } from './ShimmerEffect';

interface HoroscopeSkeletonProps {
  scale?: number;
}

export const HoroscopeContentSkeleton: React.FC<HoroscopeSkeletonProps> = ({
  scale = 1,
}) => {
  return (
    <View style={styles.container}>
      {/* Category Title Skeleton */}
      <ShimmerEffect
        width={80 * scale}
        height={20 * scale}
        borderRadius={4}
      />

      {/* Content Lines */}
      <View style={{ marginTop: 16 * scale }}>
        <ShimmerEffect
          width="100%"
          height={14 * scale}
          borderRadius={4}
        />
        <View style={{ height: 8 * scale }} />
        <ShimmerEffect
          width="100%"
          height={14 * scale}
          borderRadius={4}
        />
        <View style={{ height: 8 * scale }} />
        <ShimmerEffect
          width="90%"
          height={14 * scale}
          borderRadius={4}
        />
        <View style={{ height: 8 * scale }} />
        <ShimmerEffect
          width="75%"
          height={14 * scale}
          borderRadius={4}
        />
      </View>

      {/* Separator */}
      <View style={[styles.separator, { marginTop: 24 * scale }]}>
        <ShimmerEffect
          width="50%"
          height={1}
          borderRadius={0}
        />
      </View>
    </View>
  );
};

export const ZodiacCarouselSkeleton: React.FC<HoroscopeSkeletonProps> = ({
  scale = 1,
}) => {
  return (
    <View style={styles.carouselContainer}>
      {/* Three zodiac circles */}
      <View style={styles.carouselRow}>
        <View style={[styles.zodiacItemSmall, { width: 70 * scale, height: 70 * scale }]}>
          <ShimmerEffect
            width={70 * scale}
            height={70 * scale}
            borderRadius={35 * scale}
          />
        </View>
        <View style={[styles.zodiacItemLarge, { width: 100 * scale, height: 100 * scale }]}>
          <ShimmerEffect
            width={100 * scale}
            height={100 * scale}
            borderRadius={50 * scale}
          />
        </View>
        <View style={[styles.zodiacItemSmall, { width: 70 * scale, height: 70 * scale }]}>
          <ShimmerEffect
            width={70 * scale}
            height={70 * scale}
            borderRadius={35 * scale}
          />
        </View>
      </View>

      {/* Sign name */}
      <View style={{ marginTop: 16 * scale, alignItems: 'center' }}>
        <ShimmerEffect
          width={80 * scale}
          height={22 * scale}
          borderRadius={4}
        />
      </View>
    </View>
  );
};

export const FullHoroscopeSkeleton: React.FC<HoroscopeSkeletonProps> = ({
  scale = 1,
}) => {
  return (
    <View style={styles.fullContainer}>
      {/* Tab Switcher Skeleton */}
      <View style={[styles.tabSwitcherSkeleton, { marginBottom: 20 * scale }]}>
        <ShimmerEffect
          width={300 * scale}
          height={46 * scale}
          borderRadius={23 * scale}
        />
      </View>

      {/* Zodiac Carousel Skeleton */}
      <ZodiacCarouselSkeleton scale={scale} />

      {/* Date Badge Skeleton */}
      <View style={[styles.dateBadgeSkeleton, { marginTop: 20 * scale }]}>
        <ShimmerEffect
          width={140 * scale}
          height={40 * scale}
          borderRadius={4}
        />
      </View>

      {/* Content Card Skeleton */}
      <View style={[styles.contentCard, { marginTop: 24 * scale }]}>
        {[0, 1, 2, 3].map((index) => (
          <HoroscopeContentSkeleton key={index} scale={scale} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  separator: {
    alignItems: 'center',
  },
  carouselContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  zodiacItemSmall: {
    opacity: 0.5,
  },
  zodiacItemLarge: {
    // Center item is larger
  },
  fullContainer: {
    flex: 1,
  },
  tabSwitcherSkeleton: {
    alignItems: 'center',
  },
  dateBadgeSkeleton: {
    alignItems: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 8,
  },
});

export default FullHoroscopeSkeleton;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText } from './index';

interface TopRatedCardSkeletonProps {
  scale?: number;
}

export const TopRatedCardSkeleton: React.FC<TopRatedCardSkeletonProps> = ({ scale = 1 }) => {
  return (
    <View
      style={[
        styles.card,
        {
          height: 140 * scale,
          borderRadius: 20 * scale,
          padding: 12 * scale,
          marginBottom: 16 * scale,
        },
      ]}
    >
      <View style={styles.cardInner}>
        {/* Image Skeleton */}
        <SkeletonBox
          width={115 * scale}
          height={115 * scale}
          borderRadius={16 * scale}
        />

        {/* Info Section */}
        <View style={[styles.infoSection, { marginLeft: 12 * scale }]}>
          {/* Name */}
          <SkeletonText width="70%" height={17 * scale} style={{ marginBottom: 8 * scale }} />

          {/* Rating Row */}
          <View style={[styles.ratingRow, { marginTop: 6 * scale }]}>
            <SkeletonBox width={16 * scale} height={16 * scale} borderRadius={2 * scale} style={{ marginRight: 4 * scale }} />
            <SkeletonText width={30 * scale} height={13 * scale} style={{ marginRight: 8 * scale }} />
            <SkeletonText width={50 * scale} height={13 * scale} />
          </View>

          {/* Price Row */}
          <View style={[styles.priceRow, { marginTop: 4 * scale }]}>
            <SkeletonText width={80 * scale} height={13 * scale} />
          </View>
        </View>

        {/* Chat Button */}
        <SkeletonBox
          width={60 * scale}
          height={36 * scale}
          borderRadius={12 * scale}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

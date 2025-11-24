import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonText } from './index';

interface AstrologerCardSkeletonProps {
  scale?: number;
}

export const AstrologerCardSkeleton: React.FC<AstrologerCardSkeletonProps> = ({ scale = 1 }) => {
  return (
    <View
      style={[
        styles.card,
        {
          height: 151 * scale,
          borderRadius: 16 * scale,
          padding: 12 * scale,
          marginBottom: 16 * scale,
        },
      ]}
    >
      <View style={styles.cardInner}>
        {/* Profile Image Skeleton */}
        <View style={[styles.imageContainer, {
          width: 93 * scale,
          height: 89 * scale,
          borderRadius: 46.5 * scale
        }]}>
          <SkeletonCircle size={93 * scale} />
        </View>

        {/* Astrologer Info Skeleton */}
        <View style={styles.infoSection}>
          {/* Name */}
          <SkeletonText width="70%" height={18 * scale} style={{ marginBottom: 8 * scale }} />

          {/* Specialization */}
          <SkeletonText width="85%" height={10 * scale} style={{ marginBottom: 6 * scale }} />

          {/* Languages */}
          <SkeletonText width="60%" height={10 * scale} style={{ marginBottom: 6 * scale }} />

          {/* Experience */}
          <SkeletonText width="50%" height={10 * scale} style={{ marginBottom: 8 * scale }} />

          {/* Rating Stars */}
          <View style={[styles.ratingRow, { marginBottom: 6 * scale }]}>
            {[1, 2, 3, 4, 5].map((index) => (
              <SkeletonBox
                key={index}
                width={16 * scale}
                height={16 * scale}
                borderRadius={2 * scale}
                style={{ marginRight: 2 * scale }}
              />
            ))}
          </View>

          {/* Orders */}
          <SkeletonText width="40%" height={10 * scale} />
        </View>

        {/* Right Section - Price & Button */}
        <View style={styles.rightSection}>
          {/* Price */}
          <SkeletonText width={60 * scale} height={12 * scale} style={{ marginBottom: 50 * scale }} />

          {/* Chat Button */}
          <SkeletonBox
            width={66 * scale}
            height={32 * scale}
            borderRadius={16 * scale}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    overflow: 'hidden',
  },
  infoSection: {
    flex: 1,
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
});

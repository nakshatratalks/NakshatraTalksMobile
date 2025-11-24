import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText } from './index';

interface LiveSessionCardSkeletonProps {
  scale?: number;
  isLast?: boolean;
}

export const LiveSessionCardSkeleton: React.FC<LiveSessionCardSkeletonProps> = ({
  scale = 1,
  isLast = false
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          width: 114 * scale,
          height: 164 * scale,
          borderRadius: 20 * scale,
          marginRight: isLast ? 0 : 8 * scale,
        },
      ]}
    >
      {/* Main Image Skeleton */}
      <SkeletonBox
        width={114 * scale}
        height={164 * scale}
        borderRadius={20 * scale}
      />

      {/* Live Badge Skeleton */}
      <View
        style={[
          styles.liveBadge,
          {
            top: 8 * scale,
            left: 8 * scale,
            paddingHorizontal: 8 * scale,
            paddingVertical: 4 * scale,
            borderRadius: 12 * scale,
          },
        ]}
      >
        <SkeletonText width={40 * scale} height={8 * scale} />
      </View>

      {/* Name Skeleton at Bottom */}
      <View
        style={[
          styles.nameContainer,
          {
            bottom: 8 * scale,
            left: 6 * scale,
            right: 6 * scale,
          },
        ]}
      >
        <SkeletonText width="80%" height={16 * scale} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  liveBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nameContainer: {
    position: 'absolute',
  },
});

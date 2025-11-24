import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText } from './index';

interface LiveSessionListSkeletonProps {
  scale?: number;
  count?: number;
}

export const LiveSessionListSkeleton: React.FC<LiveSessionListSkeletonProps> = ({
  scale = 1,
  count = 3
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              height: 120 * scale,
              borderRadius: 16 * scale,
              padding: 12 * scale,
              marginBottom: index < count - 1 ? 16 * scale : 0,
            },
          ]}
        >
          <View style={styles.cardInner}>
            {/* Thumbnail */}
            <SkeletonBox
              width={96 * scale}
              height={96 * scale}
              borderRadius={12 * scale}
            />

            {/* Info Section */}
            <View style={[styles.infoSection, { marginLeft: 12 * scale }]}>
              {/* Title */}
              <SkeletonText width="80%" height={16 * scale} style={{ marginBottom: 8 * scale }} />

              {/* Astrologer Name */}
              <SkeletonText width="60%" height={14 * scale} style={{ marginBottom: 8 * scale }} />

              {/* Viewers Count */}
              <View style={[styles.viewersRow, { marginTop: 8 * scale }]}>
                <SkeletonBox width={16 * scale} height={16 * scale} borderRadius={2 * scale} style={{ marginRight: 6 * scale }} />
                <SkeletonText width={60 * scale} height={12 * scale} />
              </View>

              {/* Live Badge */}
              <View style={[styles.liveBadge, { marginTop: 8 * scale }]}>
                <SkeletonBox width={50 * scale} height={24 * scale} borderRadius={12 * scale} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardInner: {
    flexDirection: 'row',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  viewersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    alignSelf: 'flex-start',
  },
});

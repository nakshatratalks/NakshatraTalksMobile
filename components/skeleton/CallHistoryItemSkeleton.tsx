/**
 * CallHistoryItemSkeleton
 * Skeleton loading placeholder for call history list items
 * Matches the layout of actual call items with shimmer effect
 * Includes duration display area
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText } from './index';

interface CallHistoryItemSkeletonProps {
  scale?: number;
}

export const CallHistoryItemSkeleton: React.FC<CallHistoryItemSkeletonProps> = ({
  scale = 1,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.itemRow, { paddingVertical: 8 * scale }]}>
        {/* Left Section - Avatar */}
        <View
          style={[
            styles.leftSection,
            { paddingLeft: 17 * scale, paddingRight: 15 * scale },
          ]}
        >
          <SkeletonCircle size={60 * scale} />
        </View>

        {/* Center Section - Name */}
        <View style={styles.centerSection}>
          <SkeletonText width="65%" height={20 * scale} />
        </View>

        {/* Duration Section */}
        <View style={[styles.durationSection, { marginRight: 12 * scale }]}>
          <SkeletonText width={50 * scale} height={12 * scale} />
          <View style={{ height: 4 * scale }} />
          <SkeletonText width={40 * scale} height={14 * scale} />
        </View>

        {/* Right Section - Date/Time */}
        <View style={[styles.rightSection, { paddingRight: 17 * scale }]}>
          <SkeletonText width={60 * scale} height={12 * scale} />
          <View style={{ height: 4 * scale }} />
          <SkeletonText width={45 * scale} height={12 * scale} />
        </View>
      </View>

      {/* Separator */}
      <View style={[styles.separatorContainer, { paddingHorizontal: 17 * scale }]}>
        <View style={styles.separator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leftSection: {
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  durationSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  separatorContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(35, 35, 35, 0.05)',
    width: '100%',
  },
});

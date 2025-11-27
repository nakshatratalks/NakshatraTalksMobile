/**
 * ChatHistoryItemSkeleton
 * Skeleton loading placeholder for chat history list items
 * Matches the layout of actual chat items with shimmer effect
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText } from './index';

interface ChatHistoryItemSkeletonProps {
  scale?: number;
}

export const ChatHistoryItemSkeleton: React.FC<ChatHistoryItemSkeletonProps> = ({
  scale = 1
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.itemRow, { paddingVertical: 8 * scale }]}>
        {/* Left Section - Avatar */}
        <View style={[styles.leftSection, { paddingLeft: 17 * scale, paddingRight: 15 * scale }]}>
          <SkeletonCircle size={60 * scale} />
        </View>

        {/* Center Section - Name */}
        <View style={styles.centerSection}>
          <SkeletonText
            width="65%"
            height={20 * scale}
          />
        </View>

        {/* Right Section - Timestamp */}
        <View style={[styles.rightSection, { paddingRight: 17 * scale }]}>
          <SkeletonText
            width={50 * scale}
            height={14 * scale}
          />
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

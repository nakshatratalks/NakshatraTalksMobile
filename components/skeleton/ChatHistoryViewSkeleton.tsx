/**
 * ChatHistoryViewSkeleton
 * Skeleton loading placeholder for chat history view screen
 * Shows message bubble placeholders with shimmer effect
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonText } from './index';

interface ChatHistoryViewSkeletonProps {
  scale?: number;
}

export const ChatHistoryViewSkeleton: React.FC<ChatHistoryViewSkeletonProps> = ({
  scale = 1
}) => {
  // Alternating message bubbles (left/right) to simulate a conversation
  const messageBubbles = [
    { isUser: false, width: '70%' },
    { isUser: false, width: '50%' },
    { isUser: true, width: '60%' },
    { isUser: false, width: '80%' },
    { isUser: true, width: '45%' },
    { isUser: true, width: '65%' },
    { isUser: false, width: '55%' },
  ];

  return (
    <View style={styles.container}>
      {/* Date Separator Skeleton */}
      <View style={[styles.dateSeparator, { marginVertical: 16 * scale }]}>
        <SkeletonBox
          width={80 * scale}
          height={24 * scale}
          borderRadius={12 * scale}
        />
      </View>

      {/* Message Bubbles Skeleton */}
      {messageBubbles.map((bubble, index) => (
        <View
          key={index}
          style={[
            styles.messageRow,
            bubble.isUser ? styles.userRow : styles.astrologerRow,
            { marginBottom: 8 * scale },
          ]}
        >
          <View
            style={[
              styles.bubble,
              bubble.isUser ? styles.userBubble : styles.astrologerBubble,
              {
                width: bubble.width as any,
                borderRadius: 16 * scale,
                padding: 12 * scale,
              },
            ]}
          >
            <SkeletonText
              width="100%"
              height={14 * scale}
              style={{ marginBottom: 6 * scale }}
            />
            <SkeletonText
              width="70%"
              height={14 * scale}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    width: '100%',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  astrologerRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    minWidth: 100,
  },
  userBubble: {
    backgroundColor: 'rgba(0, 132, 255, 0.15)',
  },
  astrologerBubble: {
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';
import { ChatMessage } from '../../src/types/api.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  showTimestamp?: boolean;
  isConsecutive?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  showTimestamp = true,
  isConsecutive = false,
}) => {
  const { scale } = useResponsiveLayout();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '--:--';
    }

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Determine border radius based on consecutive messages
  const getBorderRadius = () => {
    if (isUser) {
      return {
        borderTopLeftRadius: 20 * scale,
        borderTopRightRadius: isConsecutive ? 8 * scale : 20 * scale,
        borderBottomLeftRadius: 20 * scale,
        borderBottomRightRadius: 20 * scale,
      };
    } else {
      return {
        borderTopLeftRadius: isConsecutive ? 8 * scale : 20 * scale,
        borderTopRightRadius: 20 * scale,
        borderBottomLeftRadius: 20 * scale,
        borderBottomRightRadius: 20 * scale,
      };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginBottom: isConsecutive ? 2 * scale : 8 * scale,
          paddingHorizontal: 8 * scale,
        },
      ]}
    >
      <View
        style={[
          styles.bubbleContainer,
          {
            alignItems: isUser ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          },
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? '#0084FF' : '#FEF3C7',
              paddingHorizontal: 12 * scale,
              paddingVertical: 8 * scale,
              ...getBorderRadius(),
              borderWidth: isUser ? 0 : 1,
              borderColor: isUser ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                fontSize: 15 * scale,
                color: isUser ? '#FFFFFF' : '#000000',
                lineHeight: 20 * scale,
              },
            ]}
          >
            {message.message}
          </Text>
          {showTimestamp && (
            <Text
              style={[
                styles.timestampInBubble,
                {
                  fontSize: 11 * scale,
                  marginTop: 4 * scale,
                  color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                },
              ]}
            >
              {formatTime(message.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bubbleContainer: {
    flexDirection: 'column',
  },
  bubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontFamily: 'Lexend_400Regular',
  },
  timestampInBubble: {
    fontFamily: 'Lexend_400Regular',
    color: 'rgba(0, 0, 0, 0.45)',
    alignSelf: 'flex-end',
  },
});

export default MessageBubble;

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';

const TypingIndicator: React.FC = () => {
  const { scale } = useResponsiveLayout();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      createAnimation(dot1Anim, 0),
      createAnimation(dot2Anim, 150),
      createAnimation(dot3Anim, 300),
    ]);

    animations.start();

    return () => animations.stop();
  }, []);

  const getDotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4 * scale],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, { marginBottom: 8 * scale }]}>
      <View
        style={[
          styles.bubble,
          {
            paddingHorizontal: 16 * scale,
            paddingVertical: 12 * scale,
            borderTopLeftRadius: 8 * scale,
            borderTopRightRadius: 20 * scale,
            borderBottomLeftRadius: 20 * scale,
            borderBottomRightRadius: 20 * scale,
          },
        ]}
      >
        <View style={[styles.dotsContainer, { gap: 4 * scale }]}>
          <Animated.View
            style={[
              styles.dot,
              {
                width: 8 * scale,
                height: 8 * scale,
                borderRadius: 4 * scale,
              },
              getDotStyle(dot1Anim),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                width: 8 * scale,
                height: 8 * scale,
                borderRadius: 4 * scale,
              },
              getDotStyle(dot2Anim),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                width: 8 * scale,
                height: 8 * scale,
                borderRadius: 4 * scale,
              },
              getDotStyle(dot3Anim),
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: 'rgba(250, 204, 21, 0.5)',
    shadowColor: 'rgba(35, 35, 35, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

export default TypingIndicator;

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerEffectProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width,
  height,
  borderRadius = 8
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
  },
  shimmerWrapper: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '200%',
    height: '100%',
  },
});

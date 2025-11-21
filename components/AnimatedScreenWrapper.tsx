import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Simple Screen Wrapper (Without Reanimated)
 * Provides a clean container for screens without complex animations
 */
const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default AnimatedScreenWrapper;

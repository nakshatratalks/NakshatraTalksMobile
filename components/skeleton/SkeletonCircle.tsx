import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerEffect } from './ShimmerEffect';

interface SkeletonCircleProps {
  size: number;
  style?: any;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size, style }) => {
  return (
    <View style={[styles.container, style]}>
      <ShimmerEffect width={size} height={size} borderRadius={size / 2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

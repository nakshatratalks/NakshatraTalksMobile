import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerEffect } from './ShimmerEffect';

interface SkeletonBoxProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  borderRadius = 8,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <ShimmerEffect width={width} height={height} borderRadius={borderRadius} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

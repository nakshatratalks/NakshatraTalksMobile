import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerEffect } from './ShimmerEffect';

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
  style?: any;
  lines?: number;
  spacing?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  height = 16,
  style,
  lines = 1,
  spacing = 8
}) => {
  if (lines === 1) {
    return (
      <View style={[styles.container, style]}>
        <ShimmerEffect width={width} height={height} borderRadius={4} />
      </View>
    );
  }

  return (
    <View style={[styles.multiLineContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <View key={index} style={{ marginBottom: index < lines - 1 ? spacing : 0 }}>
          <ShimmerEffect
            width={index === lines - 1 ? '70%' : '100%'}
            height={height}
            borderRadius={4}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  multiLineContainer: {
    width: '100%',
  },
});

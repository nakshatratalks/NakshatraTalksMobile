/**
 * WizardProgressBar Component
 * Shows progress through the 5-step Kundli wizard
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  scale?: number;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  totalSteps,
  scale = 1,
}) => {
  return (
    <View style={[styles.container, { height: 4 * scale, marginBottom: 24 * scale }]}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                marginRight: index < totalSteps - 1 ? 4 * scale : 0,
                borderRadius: 2 * scale,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.segmentFill,
                {
                  backgroundColor: isCompleted || isCurrent ? '#2930A6' : '#E0E0E0',
                  borderRadius: 2 * scale,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  segment: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  segmentFill: {
    flex: 1,
  },
});

export default WizardProgressBar;

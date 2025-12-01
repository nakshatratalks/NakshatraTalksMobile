/**
 * HoroscopeTabSwitcher Component
 * Today | Tomorrow | Yesterday segmented control
 * Styled to match WalletScreen filter tabs
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type HoroscopeDay = 'today' | 'tomorrow' | 'yesterday';

interface HoroscopeTabSwitcherProps {
  activeTab: HoroscopeDay;
  onTabChange: (tab: HoroscopeDay) => void;
  scale?: number;
}

const TABS: { key: HoroscopeDay; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'yesterday', label: 'Yesterday' },
];

const TabItem = ({
  tab,
  isActive,
  onPress,
  scale,
}: {
  tab: typeof TABS[0];
  isActive: boolean;
  onPress: () => void;
  scale: number;
}) => {
  const scaleValue = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleValue.value = withSpring(0.96, {}, () => {
      scaleValue.value = withSpring(1);
    });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.tabWrapper}
    >
      <Animated.View
        style={[
          styles.tab,
          animatedStyle,
          isActive && styles.tabActive,
          {
            paddingVertical: 10 * scale,
            paddingHorizontal: 12 * scale,
            borderRadius: 22 * scale,
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            isActive && styles.tabTextActive,
            { fontSize: 13 * scale },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const HoroscopeTabSwitcher: React.FC<HoroscopeTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  scale = 1,
}) => {
  return (
    <View style={[styles.container, {
      borderRadius: 25 * scale,
      padding: 4 * scale,
    }]}>
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => onTabChange(tab.key)}
          scale={scale}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    alignSelf: 'center',
    // Uniform shadow like WalletScreen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  tabActive: {
    backgroundColor: '#2930A6',
  },
  tabText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

export default HoroscopeTabSwitcher;

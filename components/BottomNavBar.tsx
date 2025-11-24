/**
 * BottomNavBar Component
 * Unified bottom navigation bar for consistent navigation across all screens
 */

import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Home, MessageSquare, Phone, UserCircle2, Video } from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';

interface BottomNavBarProps {
  activeTab: number;
  navigation: any;
  fadeAnim?: Animated.Value;
}

/**
 * NavItem Component
 * Individual navigation item with animation
 */
const NavItem = ({ icon: Icon, isActive, onPress, scale }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Icon
          size={24 * scale}
          color={isActive ? '#2930A6' : '#666658'}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * BottomNavBar Component
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  navigation,
  fadeAnim,
}) => {
  const { scale } = useResponsiveLayout();

  // Navigation handlers for each tab
  const handleHomePress = () => {
    if (activeTab !== 0) {
      navigation.navigate('Home');
    }
  };

  const handleChatPress = () => {
    if (activeTab !== 1) {
      navigation.navigate('BrowseChat');
    }
  };

  const handleLiveSessionPress = () => {
    if (activeTab !== 2) {
      navigation.navigate('LiveSession');
    }
  };

  const handleCallPress = () => {
    if (activeTab !== 3) {
      navigation.navigate('BrowseCall');
    }
  };

  const handleProfilePress = () => {
    if (activeTab !== 4) {
      navigation.navigate('Profile');
    }
  };

  const animatedStyle = fadeAnim
    ? [
        styles.bottomNav,
        {
          opacity: fadeAnim,
          height: 61 * scale,
          borderRadius: 50 * scale,
          paddingHorizontal: 48 * scale,
          bottom: 12 * scale,
        },
      ]
    : [
        styles.bottomNav,
        {
          height: 61 * scale,
          borderRadius: 50 * scale,
          paddingHorizontal: 48 * scale,
          bottom: 12 * scale,
        },
      ];

  return (
    <Animated.View style={animatedStyle}>
      <NavItem
        icon={Home}
        isActive={activeTab === 0}
        onPress={handleHomePress}
        scale={scale}
      />
      <NavItem
        icon={MessageSquare}
        isActive={activeTab === 1}
        onPress={handleChatPress}
        scale={scale}
      />
      <NavItem
        icon={Video}
        isActive={activeTab === 2}
        onPress={handleLiveSessionPress}
        scale={scale}
      />
      <NavItem
        icon={Phone}
        isActive={activeTab === 3}
        onPress={handleCallPress}
        scale={scale}
      />
      <NavItem
        icon={UserCircle2}
        isActive={activeTab === 4}
        onPress={handleProfilePress}
        scale={scale}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 15,
    right: 15,
    backgroundColor: '#FFCF0D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

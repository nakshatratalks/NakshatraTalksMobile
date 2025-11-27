/**
 * BottomNavBar Component
 * Design: Premium Glassmorphic Dock with "Spotlight" Active State
 *
 * Features:
 * - Frosted Glass Background (BlurView)
 * - Optical Spacing (Justify Space Between)
 * - "Spotlight" Active Indicator (Yellow Circle expands behind icon)
 * - Subtle Blue Border for Definition
 * - INSTANT tab switching (50ms indicator animation)
 * - Auto-detects active tab from navigation state
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Home, MessageSquare, Phone, UserCircle2, Video } from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

// --- CONSTANTS ---
const BAR_WIDTH_PERCENTAGE = 0.92; // Occupy 92% of screen width
const BAR_HEIGHT_BASE = 68; // Taller for better touch targets
const ICON_SIZE = 24;

interface BottomNavBarProps {
  activeTab?: number; // Optional - will auto-detect from navigation state
  navigation: any;
  fadeAnim?: any;
}

// Tab route names mapped to indices
const TAB_ROUTES = ['Home', 'BrowseChat', 'LiveSession', 'BrowseCall', 'Profile'];
const ROUTE_TO_INDEX: { [key: string]: number } = {
  Home: 0,
  BrowseChat: 1,
  LiveSession: 2,
  BrowseCall: 3,
  Profile: 4,
};

// --- ANIMATION CONFIG ---
const SPRING_CONFIG = {
  mass: 1,
  damping: 15,
  stiffness: 120,
};

const BOUNCE_CONFIG = {
  mass: 0.5,
  damping: 12,
  stiffness: 200,
};

/**
 * Individual Navigation Item
 */
const NavItem = memo(({
  icon: Icon,
  isActive,
  onPress,
  label,
}: {
  icon: any;
  isActive: boolean;
  onPress: () => void;
  label: string;
}) => {
  const scale = useSharedValue(1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  // Sync animation with active state - INSTANT (50ms)
  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, {
      duration: 50, // Super fast for instant feel
    });
  }, [isActive]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.85, {
      damping: 20,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, BOUNCE_CONFIG);
  };

  // Dynamic Styles
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: interpolate(activeProgress.value, [0, 1], [0, -1], Extrapolation.CLAMP) } // Subtle lift
      ],
      // Fade opacity slightly when inactive
      opacity: interpolate(activeProgress.value, [0, 1], [0.5, 1]),
    };
  });

  const backgroundPillStyle = useAnimatedStyle(() => {
    return {
      opacity: activeProgress.value,
      transform: [
        { scale: interpolate(activeProgress.value, [0, 1], [0.5, 1]) }
      ],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.navItemContainer}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Generous touch target
    >
      <View style={styles.iconWrapper}>
        {/* The "Spotlight" Background Circle (Brand Yellow) */}
        <Animated.View style={[styles.activeBackground, backgroundPillStyle]} />
        
        {/* The Icon */}
        <Animated.View style={animatedIconStyle}>
          <Icon
            size={ICON_SIZE}
            // Use nearly black for active (contrast on yellow), grey for inactive
            color={isActive ? '#1A1A1A' : '#555555'} 
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
});

/**
 * Main Bottom Bar Component
 * Auto-detects active tab from navigation state for instant response
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab: propActiveTab,
  navigation,
  fadeAnim,
}) => {
  const insets = useSafeAreaInsets();
  const { scale } = useResponsiveLayout();

  // Auto-detect active tab from navigation state
  const currentRouteName = useNavigationState((state) => {
    if (!state) return 'Home';
    // Handle nested navigators (MainTabs contains our tab screens)
    const route = state.routes[state.index];
    if (route.state) {
      // Inside tab navigator
      const nestedRoute = route.state.routes[route.state.index || 0];
      return nestedRoute?.name || 'Home';
    }
    return route.name;
  });

  // Use navigation state for active tab, fallback to prop
  const activeTab = propActiveTab ?? (ROUTE_TO_INDEX[currentRouteName] ?? 0);

  // Dynamic Layout Calculation
  const navContainerWidth = Math.min(screenWidth * BAR_WIDTH_PERCENTAGE, 450);
  const bottomMargin = Platform.OS === 'ios' ? insets.bottom + 4 : 24;
  const barHeight = BAR_HEIGHT_BASE * scale;

  const handleNav = (screen: string, index: number) => {
    // Navigate to nested tab screen inside MainTabs
    // This works from both inside and outside the tab navigator
    navigation.navigate('MainTabs', { screen });
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomMargin }]}>
      <Animated.View 
        style={[
          styles.containerShadow, 
          { opacity: fadeAnim || 1 }
        ]}
      >
        <BlurView
          intensity={80}
          tint="light" // Use 'systemMaterial' on iOS 13+ if prefer native look
          style={[
            styles.blurContainer,
            {
              width: navContainerWidth,
              height: barHeight,
              borderRadius: barHeight / 2,
            },
          ]}
        >
          <View style={styles.innerRow}>
            <NavItem
              icon={Home}
              isActive={activeTab === 0}
              onPress={() => handleNav('Home', 0)}
              label="Home"
            />
            <NavItem
              icon={MessageSquare}
              isActive={activeTab === 1}
              onPress={() => handleNav('BrowseChat', 1)}
              label="Chat"
            />
            <NavItem
              icon={Video}
              isActive={activeTab === 2}
              onPress={() => handleNav('LiveSession', 2)}
              label="Live"
            />
            <NavItem
              icon={Phone}
              isActive={activeTab === 3}
              onPress={() => handleNav('BrowseCall', 3)}
              label="Call"
            />
            <NavItem
              icon={UserCircle2}
              isActive={activeTab === 4}
              onPress={() => handleNav('Profile', 4)}
              label="Profile"
            />
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 9999, // Ensure it floats above everything
  },
  containerShadow: {
    // Premium Drop Shadow for Depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  blurContainer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // Glassy Base
    
    // --- The Premium Border ---
    borderWidth: 1.2,
    borderColor: 'rgba(41, 48, 166, 0.15)', // Subtle Deep Blue Border
    // --------------------------
  },
  innerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // CRITICAL: Even spacing
    paddingHorizontal: 16, // Breathing room on edges
  },
  navItemContainer: {
    flex: 1, // Divide space equally
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBackground: {
    position: 'absolute',
    width: 44, // Slightly smaller than wrapper
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFCF0D', // Brand Yellow Highlights
  },
});
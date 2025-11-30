import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Lexend_500Medium, Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import { useAuth } from '../src/contexts/AuthContext';
import {
  Home,
  MessageSquare,
  Phone,
  Wallet,
  Headphones,
  Settings,
  User,
  LogOut,
  X,
} from 'lucide-react-native';

// Import Nakshatra star pattern
import DecorativeBg from '../assets/icons/decorative-bg.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  onPress: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose, navigation }) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useAuth();

  const [fontsLoaded] = useFonts({
    Lexend_500Medium,
    Lexend_600SemiBold,
    Poppins_500Medium,
  });

  useEffect(() => {
    if (visible) {
      // Set status bar to light when sidebar opens (dark sidebar background)
      setStatusBarStyle('light');

      // Smooth slide in and fade in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Set status bar back to dark when sidebar closes
      setStatusBarStyle('dark');

      // Smooth slide out and fade out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onPress: () => {
        onClose();
        navigation?.navigate('MainTabs', { screen: 'Home' });
      },
    },
    {
      id: 'chat',
      label: 'Chat with Astrologer',
      icon: MessageSquare,
      onPress: () => {
        onClose();
        navigation?.navigate('MainTabs', { screen: 'BrowseChat' });
      },
    },
    {
      id: 'call',
      label: 'Call with Astrologer',
      icon: Phone,
      onPress: () => {
        onClose();
        navigation?.navigate('MainTabs', { screen: 'BrowseCall' });
      },
    },
    {
      id: 'wallet',
      label: 'My wallet',
      icon: Wallet,
      onPress: () => {
        onClose();
        navigation?.navigate('Wallet');
      },
    },
    {
      id: 'history',
      label: 'Service History',
      icon: Headphones,
      onPress: () => {
        onClose();
        navigation?.navigate('ChatHistory');
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onPress: () => {
        console.log('Navigate to Settings');
        onClose();
      },
    },
    {
      id: 'profile',
      label: 'My profile',
      icon: User,
      onPress: () => {
        onClose();
        navigation?.navigate('MainTabs', { screen: 'Profile' });
      },
    },
    {
      id: 'support',
      label: 'Customer support',
      icon: Headphones,
      onPress: () => {
        console.log('Navigate to Customer Support');
        onClose();
      },
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      onPress: handleLogout,
    },
  ];

  if (!visible) {
    return null;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Force light status bar icons when sidebar is visible */}
      <StatusBar style="light" />

      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left']}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={item.id}
                item={item}
                index={index}
                visible={visible}
              />
            ))}
          </View>
        </SafeAreaView>

        {/* Nakshatra Star Pattern Background - positioned at bottom-left corner */}
        <View style={styles.decorativeBackground}>
          <DecorativeBg
            width={SIDEBAR_WIDTH * 1.2}
            height={SIDEBAR_WIDTH * 1.2}
            style={styles.nakshatraPattern}
          />
        </View>
      </Animated.View>
    </View>
  );
};

// Individual Menu Item Component with stagger animation
interface MenuItemProps {
  item: MenuItem;
  index: number;
  visible: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, index, visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Stagger animation for menu items
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-20);
    }
  }, [visible, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const Icon = item.icon;

  return (
    <Animated.View
      style={[
        styles.menuItemContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuItem}
        onPress={item.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.iconContainer}>
          <Icon size={20} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#000000',
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  decorativeBackground: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    zIndex: 0,
    overflow: 'hidden',
  },
  nakshatraPattern: {
    opacity: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 20 : 20,
    left: 19,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 60 : 60,
    paddingLeft: 16,
    paddingRight: 16,
    zIndex: 1,
  },
  menuItemContainer: {
    marginBottom: 39,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    width: 21,
    height: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  menuLabel: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0,
  },
});

export default Sidebar;

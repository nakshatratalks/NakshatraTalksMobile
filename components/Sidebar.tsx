import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Lexend_500Medium, Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import { useAuth } from '../src/contexts/AuthContext';

// Import SVG icons from Figma design
import HomeIcon from '../assets/icons/home.svg';
import CallIcon from '../assets/icons/call.svg';
import WalletIcon from '../assets/icons/wallet.svg';
import ServiceHistoryIcon from '../assets/icons/service-history.svg';
import SettingsIcon from '../assets/icons/settings.svg';
import LogoutIcon from '../assets/icons/logout.svg';
import CloseIcon from '../assets/icons/close.svg';
import MessageStrokeIcon from '../assets/icons/message-stroke.svg';
import UserRectangleIcon from '../assets/icons/user-rectangle.svg';
import DecorativeBg from '../assets/icons/decorative-bg.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  onPress: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useAuth();

  const [fontsLoaded] = useFonts({
    Lexend_500Medium,
    Lexend_600SemiBold,
    Poppins_500Medium,
  });

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
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
      icon: HomeIcon,
      onPress: () => {
        console.log('Navigate to Home');
        onClose();
      },
    },
    {
      id: 'chat',
      label: 'Chat with Astrologer',
      icon: MessageStrokeIcon,
      onPress: () => {
        console.log('Navigate to Chat');
        onClose();
      },
    },
    {
      id: 'call',
      label: 'Call with Astrologer',
      icon: CallIcon,
      onPress: () => {
        console.log('Navigate to Call');
        onClose();
      },
    },
    {
      id: 'wallet',
      label: 'My wallet',
      icon: WalletIcon,
      onPress: () => {
        console.log('Navigate to Wallet');
        onClose();
      },
    },
    {
      id: 'history',
      label: 'Service History',
      icon: ServiceHistoryIcon,
      onPress: () => {
        console.log('Navigate to Service History');
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      onPress: () => {
        console.log('Navigate to Settings');
        onClose();
      },
    },
    {
      id: 'profile',
      label: 'My profile',
      icon: UserRectangleIcon,
      onPress: () => {
        console.log('Navigate to Profile');
        onClose();
      },
    },
    {
      id: 'support',
      label: 'Customer support',
      icon: ServiceHistoryIcon,
      onPress: () => {
        console.log('Navigate to Customer Support');
        onClose();
      },
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogoutIcon,
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
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
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
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left']}>
          {/* Decorative Background Pattern from Figma */}
          <View style={styles.decorativeBackground}>
            <DecorativeBg
              width="100%"
              height="100%"
              preserveAspectRatio="xMinYMax slice"
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseIcon width={26} height={26} />
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
          <Icon width={20} height={20} fill="#FFFFFF" />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  decorativeBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 53 : 53,
    left: 19,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 128 : 128,
    paddingLeft: 16,
    paddingRight: 16,
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

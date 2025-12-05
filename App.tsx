/**
 * Main App Component
 * Handles navigation and authentication flow
 * Uses Tab Navigator for main screens (instant switching) + Stack for details
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppDataProvider } from './src/contexts/AppDataContext';
import { ConfirmationModalProvider, ActionSheetProvider } from './src/utils/notificationService';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import HomeScreen from './screens/HomeScreen';
import BrowseChatScreen from './screens/BrowseChatScreen';
import BrowseCallScreen from './screens/BrowseCallScreen';
import ChatInterfaceScreen from './screens/ChatInterfaceScreen';
import LiveSessionScreen from './screens/LiveSessionScreen';
import ProfileScreen from './screens/ProfileScreen';
import AstrologerDetailsScreen from './screens/AstrologerDetailsScreen';
import ChatHistoryScreen from './screens/ChatHistoryScreen';
import ChatHistoryViewScreen from './screens/ChatHistoryViewScreen';
import CallHistoryScreen from './screens/CallHistoryScreen';
import CallScreen from './screens/CallScreen';
import WalletScreen from './screens/WalletScreen';
import RechargeScreen from './screens/RechargeScreen';

// Feature Screens - Horoscope & Kundli
import DailyHoroscopeScreen from './screens/DailyHoroscopeScreen';
import KundliDashboardScreen from './screens/KundliDashboardScreen';
import KundliGenerationScreen from './screens/KundliGenerationScreen';
import KundliReportScreen from './screens/KundliReportScreen';
import KundliMatchingDashboardScreen from './screens/KundliMatchingDashboardScreen';
import KundliMatchingInputScreen from './screens/KundliMatchingInputScreen';
import KundliMatchingReportScreen from './screens/KundliMatchingReportScreen';

// Create Navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime in v4)
    },
  },
});

/**
 * Animated Splash Screen Component
 * Displays logo with fade-in and scale animation
 * Minimum 3 second display time
 */
const AnimatedSplashScreen = ({ onAnimationComplete }: { onAnimationComplete: () => void }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    // Start animation sequence
    // 1. Fade in and scale up (0-800ms)
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    // 2. Hold for remaining time to reach 3 seconds total
    // 3. Fade out (2500-3000ms)
    fadeOut.value = withDelay(
      2500,
      withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  return (
    <Animated.View style={[styles.splashContainer, containerAnimatedStyle]}>
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('./assets/images/logo.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

/**
 * Main Tab Navigator
 * Contains the 5 main screens that stay mounted for instant switching
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar, using custom BottomNavBar
        lazy: false, // Load all screens immediately for instant access
      }}
      // No animation between tabs - instant switching
      backBehavior="none"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="BrowseChat" component={BrowseChatScreen} />
      <Tab.Screen name="LiveSession" component={LiveSessionScreen} />
      <Tab.Screen name="BrowseCall" component={BrowseCallScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

/**
 * Navigation Component
 * Handles authenticated and unauthenticated flows
 * Uses Tab Navigator for main screens + Stack for detail screens
 */
const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2930a6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right', // Native iOS push with parallax effect
          animationDuration: 200, // Faster, premium feel (default ~350ms)
          gestureEnabled: true, // Enable swipe-to-go-back gesture
          gestureDirection: 'horizontal',
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreenWrapper} />
          </>
        ) : (
          // Authenticated: Tab Navigator + Detail Screens in Stack
          <>
            {/* Main Tabs - stays mounted, instant switching */}
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{
                animation: 'none', // No animation for initial load
              }}
            />
            {/* Detail Screens - push on top of tabs with native animation */}
            <Stack.Screen
              name="ChatInterface"
              component={ChatInterfaceScreen}
            />
            <Stack.Screen
              name="AstrologerDetails"
              component={AstrologerDetailsScreen}
            />
            <Stack.Screen
              name="ChatHistory"
              component={ChatHistoryScreen}
            />
            <Stack.Screen
              name="ChatHistoryView"
              component={ChatHistoryViewScreen}
            />
            <Stack.Screen
              name="CallHistory"
              component={CallHistoryScreen}
            />
            <Stack.Screen
              name="CallScreen"
              component={CallScreen}
              options={{
                gestureEnabled: false, // Disable swipe back during call
              }}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
            />
            <Stack.Screen
              name="Recharge"
              component={RechargeScreen}
            />
            {/* Feature Screens - Horoscope & Kundli */}
            <Stack.Screen
              name="DailyHoroscope"
              component={DailyHoroscopeScreen}
            />
            <Stack.Screen
              name="KundliDashboard"
              component={KundliDashboardScreen}
            />
            <Stack.Screen
              name="KundliGeneration"
              component={KundliGenerationScreen}
            />
            <Stack.Screen
              name="KundliReport"
              component={KundliReportScreen}
            />
            <Stack.Screen
              name="KundliMatchingDashboard"
              component={KundliMatchingDashboardScreen}
            />
            <Stack.Screen
              name="KundliMatchingInput"
              component={KundliMatchingInputScreen}
            />
            <Stack.Screen
              name="KundliMatchingReport"
              component={KundliMatchingReportScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * SignIn Screen Wrapper
 * Handles navigation after successful login
 */
const SignInScreenWrapper = ({ navigation }: any) => {
  return <SignInScreen onSuccess={() => {
    // Navigation will automatically update due to isAuthenticated change
    // No need to navigate manually
  }} />;
};

/**
 * Main App Component
 */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Hide the native splash screen once our custom one is ready
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
      setAppIsReady(true);
    };
    hideSplash();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppDataProvider>
            <NotifierWrapper>
              <ConfirmationModalProvider>
                <ActionSheetProvider>
                  {showSplash ? (
                    <AnimatedSplashScreen onAnimationComplete={handleSplashComplete} />
                  ) : (
                    <Navigation />
                  )}
                </ActionSheetProvider>
              </ConfirmationModalProvider>
            </NotifierWrapper>
          </AppDataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7 * 0.24, // Maintain aspect ratio (77/322 ≈ 0.24)
    maxWidth: 322,
    maxHeight: 77,
  },
});

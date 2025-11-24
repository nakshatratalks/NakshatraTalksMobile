/**
 * Main App Component
 * Handles navigation and authentication flow
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ConfirmationModalProvider } from './src/utils/notificationService';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import HomeScreen from './screens/HomeScreen';
import BrowseChatScreen from './screens/BrowseChatScreen';
import BrowseCallScreen from './screens/BrowseCallScreen';
import ChatInterfaceScreen from './screens/ChatInterfaceScreen';
import LiveSessionScreen from './screens/LiveSessionScreen';

// Create Navigator
const Stack = createNativeStackNavigator();

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
 * Navigation Component
 * Handles authenticated and unauthenticated flows
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
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreenWrapper} />
          </>
        ) : (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="BrowseChat"
              component={BrowseChatScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="BrowseCall"
              component={BrowseCallScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
              }}
            />
            <Stack.Screen
              name="ChatInterface"
              component={ChatInterfaceScreen}
              options={{
                animation: 'slide_from_right',
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="LiveSession"
              component={LiveSessionScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
                presentation: 'fullScreenModal',
              }}
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotifierWrapper>
            <ConfirmationModalProvider>
              <Navigation />
            </ConfirmationModalProvider>
          </NotifierWrapper>
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
});

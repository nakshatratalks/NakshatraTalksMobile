import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import { Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import {
  Search,
  SlidersHorizontal,
  User,
  Bell,
  IndianRupee,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useHomeData } from '../src/hooks/useHomeData';
import { useAuth } from '../src/contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LiveSessionCardSkeleton, TopRatedCardSkeleton } from '../components/skeleton';
import { FeedbackForm } from '../components/FeedbackForm';

const { width: screenWidth } = Dimensions.get('window');

// AnimatedEntrance Component - DISABLED for instant loading
// Screens now stay mounted via Tab Navigator, so entrance animations are not needed
interface AnimatedEntranceProps {
  children: React.ReactNode;
  from?: { opacity?: number; translateY?: number; translateX?: number };
  delay?: number;
  damping?: number;
  stiffness?: number;
}

const AnimatedEntrance = ({ children }: AnimatedEntranceProps) => {
  // Simply render children without animation for instant display
  return <>{children}</>;
};

// Mock data for top rated astrologers (fallback if API fails)
const topRatedAstrologers = [
  {
    id: 1,
    name: 'Chandradev',
    rating: 5.0,
    calls: '2K',
    price: 27,
    image: require('../assets/images/chandradev.png'),
  },
  {
    id: 2,
    name: 'Sanjeevi',
    rating: 4.8,
    calls: '1K',
    price: 27,
    image: require('../assets/images/sanjeevi.png'),
  },
  {
    id: 3,
    name: 'Adhitiya',
    rating: 4.6,
    calls: '2K',
    price: 27,
    image: require('../assets/images/astrologer1.png'),
  },
];

const HomeScreen = ({ navigation }: any) => {
  // API Data Hook
  const {
    userProfile,
    liveSessions: apiLiveSessions,
    topRatedAstrologers: apiTopRatedAstrologers,
    categories,
    banners,
    loading: dataLoading,
    error: dataError,
    refetch,
  } = useHomeData();

  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Animation values - Reanimated
  // Initialize to final values (no entrance animation - screens stay mounted)
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);
  const screenScale = useSharedValue(1);
  const screenTranslateX = useSharedValue(0);
  const contentOpacityAnim = useSharedValue(1);
  const scaleAnim = useSharedValue(1);
  const searchBorderAnim = useSharedValue(0);

  // Scroll tracking for compact header
  const scrollY = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const pullDistance = useSharedValue(0);

  // Use API data or fallback to mock data for top rated only (live sessions from API only)
  const displayLiveSessions = apiLiveSessions || [];
  const displayTopRatedAstrologers = apiTopRatedAstrologers.length > 0 ? apiTopRatedAstrologers : topRatedAstrologers;

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    OpenSans_400Regular,
    Poppins_500Medium,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  const { cardWidth, scale } = useResponsiveLayout();

  // Initialize values immediately - no entrance animation needed
  // Screens stay mounted via Tab Navigator for instant access
  useEffect(() => {
    if (fontsLoaded) {
      // Set to final values immediately
      fadeAnim.value = 1;
      slideAnim.value = 0;
      scaleAnim.value = 1;
    }
  }, [fontsLoaded]);

  // Set status bar based on sidebar state when HomeScreen is focused
  // Only set dark if sidebar is NOT open, to avoid overriding sidebar's light status bar
  useFocusEffect(
    useCallback(() => {
      if (!sidebarVisible) {
        setStatusBarStyle('dark');
      }
    }, [sidebarVisible])
  );

  // Search focus animation with haptics
  const handleSearchFocus = () => {
    setSearchFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchBorderAnim.value = withTiming(1, { duration: 200 });
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    searchBorderAnim.value = withTiming(0, { duration: 200 });
  };

  // 3D Sidebar animation effect with content fade - Reanimated
  // Note: Status bar is managed by the Sidebar component itself
  useEffect(() => {
    const SIDEBAR_WIDTH = screenWidth * 0.75;
    if (sidebarVisible) {
      screenScale.value = withTiming(0.85, {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      screenTranslateX.value = withTiming(SIDEBAR_WIDTH * 0.8, {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      contentOpacityAnim.value = withTiming(0.3, {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      screenScale.value = withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      screenTranslateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      contentOpacityAnim.value = withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [sidebarVisible]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Animated styles
  const mainContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: screenScale.value },
        { translateX: screenTranslateX.value },
      ],
      opacity: contentOpacityAnim.value,
      borderRadius: sidebarVisible ? 30 : 0,
    };
  });

  const scrollViewStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const searchContainerStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(searchBorderAnim.value, [0, 1], [1, 2]),
      borderColor: interpolateColor(
        searchBorderAnim.value,
        [0, 1],
        ['#2930A6', '#FFCF0D']
      ),
      shadowOpacity: interpolate(searchBorderAnim.value, [0, 1], [0.1, 0.3]),
    };
  });

  // Scroll handler for compact header
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  // Compact header animated styles based on scroll
  const profileCircleStyle = useAnimatedStyle(() => {
    const size = interpolate(scrollY.value, [0, 80], [48 * scale, 36 * scale], 'clamp');
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
    };
  });

  const heyTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 40], [1, 0], 'clamp'),
      height: interpolate(scrollY.value, [0, 40], [20 * scale, 0], 'clamp'),
      marginBottom: interpolate(scrollY.value, [0, 40], [2 * scale, 0], 'clamp'),
    };
  });

  const nameTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(scrollY.value, [0, 80], [15 * scale, 16 * scale], 'clamp'),
    };
  });

  const greetingContainerStyle = useAnimatedStyle(() => {
    return {
      flexDirection: scrollY.value > 40 ? 'row' : 'column',
      alignItems: scrollY.value > 40 ? 'center' : 'flex-start',
    };
  });

  const headerPaddingStyle = useAnimatedStyle(() => {
    return {
      paddingTop: interpolate(scrollY.value, [0, 80], [12, 8], 'clamp'),
      paddingBottom: interpolate(scrollY.value, [0, 80], [12, 8], 'clamp'),
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 60], [1, 0], 'clamp'),
      transform: [
        { scale: interpolate(scrollY.value, [0, 60], [1, 0.9], 'clamp') },
      ],
      height: interpolate(scrollY.value, [0, 60], [60 * scale, 0], 'clamp'),
      marginBottom: interpolate(scrollY.value, [0, 60], [8 * scale, 0], 'clamp'),
    };
  });

  // Search bar sticky behavior - becomes sticky when hitting header
  const searchBarStyle = useAnimatedStyle(() => {
    const shouldStick = scrollY.value > 100;
    return {
      position: shouldStick ? 'absolute' as const : 'relative' as const,
      top: shouldStick ? 0 : undefined,
      left: shouldStick ? 0 : undefined,
      right: shouldStick ? 0 : undefined,
      zIndex: shouldStick ? 1000 : 1,
      backgroundColor: '#FFFFFF',
    };
  });

  // Custom pull-to-refresh indicator style
  const refreshIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(pullDistance.value, [0, 100], [0, 360])}deg` },
      ],
      opacity: interpolate(pullDistance.value, [0, 50], [0, 1], 'clamp'),
    };
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Animated.View style={[
        styles.mainContainer,
        mainContainerStyle,
        {
          overflow: 'hidden',
        }
      ]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed status bar - always dark icons on light background */}
        <StatusBar style="dark" backgroundColor="#FFFFFF" />

        {/* Glassmorphism Header - Compact on scroll */}
        <BlurView
          intensity={95}
          tint="light"
          style={styles.headerBlur}
        >
          <Animated.View style={[styles.header, {
            paddingHorizontal: 20 * scale,
          }, headerStyle, headerPaddingStyle]}>
            <TouchableOpacity
              style={styles.headerLeft}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.profileCircle, profileCircleStyle]}>
                {userProfile?.profileImage ? (
                  <Image
                    source={{ uri: userProfile.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <User size={20 * scale} color="#2930A6" />
                )}
              </Animated.View>
              <Animated.View style={[styles.greetingContainer, greetingContainerStyle]}>
                <Animated.Text style={[styles.heyText, { fontSize: 14 * scale }, heyTextStyle]}>Hey</Animated.Text>
                <Animated.Text style={[styles.nameText, nameTextStyle]} numberOfLines={1}>
                  {userProfile?.name || user?.name || 'Guest'}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <AnimatedButton
                style={[styles.walletButton, {
                  height: 30 * scale,
                  borderRadius: 15 * scale,
                  paddingHorizontal: 12 * scale
                }]}
                onPress={() => navigation.navigate('Wallet')}
              >
                <IndianRupee size={16 * scale} color="#FFFFFF" />
                <Text style={[styles.walletText, { fontSize: 14 * scale }]}>
                  {userProfile?.walletBalance?.toFixed(2) || '0.00'}
                </Text>
              </AnimatedButton>

              <AnimatedButton style={[styles.bellButton, { width: 26 * scale, height: 26 * scale }]}>
                <Bell size={22 * scale} color="#595959" />
              </AnimatedButton>
            </View>
          </Animated.View>
        </BlurView>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.ScrollView
            ref={scrollRef as any}
            style={[styles.container, scrollViewStyle]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FFCF0D"
                colors={['#FFCF0D', '#2930A6']}
                progressBackgroundColor="#FFFFFF"
                progressViewOffset={Platform.OS === 'ios' ? 100 : 80}
              />
            }
          >
            {/* Spacer to account for absolute positioned header */}
            {/* Header height: paddingTop (50 iOS/24 Android) + content (~60) + paddingBottom (4) */}
            <View style={{ height: Platform.OS === 'ios' ? 70 * scale : 70 * scale }} />

            {/* Logo - Animated to collapse on scroll */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={require('../assets/images/logo.png')}
                style={[styles.logo, { width: 260 * scale, height: 60 * scale }]}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Search Bar - Positioned after logo */}
            <Animated.View
              style={[
                styles.searchContainer,
                searchContainerStyle,
                {
                  marginHorizontal: 20 * scale,
                  marginBottom: 20 * scale,
                  height: 46 * scale,
                  borderRadius: 23 * scale,
                  paddingHorizontal: 16 * scale,
                },
              ]}
            >
              <View style={styles.searchLeft}>
                <Search size={20 * scale} color={searchFocused ? '#FFCF0D' : '#2930A6'} />
                <TextInput
                  style={[styles.searchInput, { fontSize: 13 * scale }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search astrologers..."
                  placeholderTextColor="#2930A6"
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <SlidersHorizontal size={18 * scale} color="#2930A6" />
              </TouchableOpacity>
            </Animated.View>

            {/* Category Icons */}
        <View style={[styles.categoriesRow, {
          marginHorizontal: 20 * scale,
          marginBottom: 30 * scale
        }]}>
          <CategoryIcon
            iconImage={require('../assets/images/icon-horoscope.png')}
            label="Daily Horoscope"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-kundli.png')}
            label="Kundli"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-kundli-matching.png')}
            label="Kundli Matching"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-chat-category.png')}
            label="Chat"
            scale={scale}
          />
        </View>

        {/* CTA Banner - Dynamic from API */}
        {(banners && banners.length > 0 ? banners : [{
          id: 'default',
          title: 'Talk to astrologer and\nclear your doubts',
          subtitle: 'Open up to the thing that matters among the people',
          buttonText: 'Chat Now',
          buttonAction: '/chat',
          backgroundColor: null,
          image: null,
          order: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]).slice(0, 1).map((banner) => (
          <View
            key={banner.id}
            style={[styles.ctaBanner, {
              marginHorizontal: 20 * scale,
              marginBottom: 30 * scale,
              height: 115 * scale,
              borderRadius: 16 * scale,
              padding: 16 * scale,
              backgroundColor: banner.backgroundColor || 'rgba(255, 255, 255, 0.5)',
            }]}
          >
            <View style={styles.ctaContent}>
              <Text style={[styles.ctaTitle, { fontSize: 17 * scale, lineHeight: 20 * scale }]}>
                {banner.title}
              </Text>
              {banner.subtitle && (
                <Text style={[styles.ctaSubtitle, { fontSize: 10 * scale, marginTop: 6 * scale }]}>
                  {banner.subtitle}
                </Text>
              )}
              {banner.buttonText && (
                <AnimatedButton
                  style={[styles.chatNowButton, {
                    marginTop: 8 * scale,
                    height: 28 * scale,
                    paddingHorizontal: 16 * scale,
                    borderRadius: 10 * scale
                  }]}
                  onPress={() => console.log('Banner action:', banner.buttonAction)}
                >
                  <Text style={[styles.chatNowText, { fontSize: 14 * scale }]}>
                    {banner.buttonText}
                  </Text>
                </AnimatedButton>
              )}
            </View>
            {banner.image ? (
              <View style={[styles.bannerImage, { width: 193 * scale, height: 115 * scale }]}>
                <Image
                  source={{ uri: banner.image }}
                  style={[{ width: 193 * scale, height: 115 * scale }]}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.bannerImage, { width: 193 * scale, height: 115 * scale }]}>
                <Image
                  source={require('../assets/images/banner-decoration.png')}
                  style={[{ width: 193 * scale, height: 115 * scale }]}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        ))}

        {/* Live Sessions Section - Shows astrologers currently streaming live */}
        {(dataLoading && displayLiveSessions.length === 0) ? (
          <View style={[styles.section, { marginBottom: 30 * scale }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 * scale, marginBottom: 16 * scale }]}>
              <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Live Astrologers</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 * scale }}
            >
              {[1, 2, 3, 4].map((index) => (
                <LiveSessionCardSkeleton
                  key={index}
                  scale={scale}
                  isLast={index === 4}
                />
              ))}
            </ScrollView>
          </View>
        ) : displayLiveSessions.length > 0 ? (
          <View style={[styles.section, { marginBottom: 30 * scale }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 * scale, marginBottom: 16 * scale }]}>
              <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Live Astrologers</Text>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => navigation.navigate('LiveSession')}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAll, { fontSize: 14 * scale }]}>View All</Text>
                <ChevronRight size={14 * scale} color="#2930A6" />
              </TouchableOpacity>
            </View>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 * scale }}
              snapToInterval={122 * scale}
              decelerationRate="fast"
            >
              {displayLiveSessions.map((session, index) => (
                <AnimatedEntrance
                  key={session.id}
                  from={{ opacity: 0, translateY: 30 }}
                  delay={300 + index * 100}
                  damping={7}
                  stiffness={40}
                >
                  <LiveSessionCard
                    session={session}
                    index={index}
                    scale={scale}
                    isLast={index === displayLiveSessions.length - 1}
                    navigation={navigation}
                  />
                </AnimatedEntrance>
              ))}
            </Animated.ScrollView>
          </View>
        ) : null}

        {/* Top Rated Astrologers Section */}
        <View style={[styles.section, { marginBottom: 30 * scale, paddingHorizontal: 20 * scale }]}>
          <View style={[styles.sectionHeader, { marginBottom: 16 * scale }]}>
            <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Top Rated Astrologers</Text>
            <TouchableOpacity activeOpacity={0.6} style={styles.viewAllButton}>
              <Text style={[styles.viewAll, { fontSize: 14 * scale }]}>View All</Text>
              <ChevronRight size={14 * scale} color="#2930A6" />
            </TouchableOpacity>
          </View>

          {(dataLoading && displayTopRatedAstrologers.length === 0) ? (
            <>
              {[1, 2, 3].map((index) => (
                <TopRatedCardSkeleton
                  key={index}
                  scale={scale}
                />
              ))}
            </>
          ) : (
            displayTopRatedAstrologers.map((astrologer, index) => (
              <AnimatedEntrance
                key={astrologer.id}
                from={{ opacity: 0, translateX: 50 }}
                delay={500 + index * 150}
                damping={7}
                stiffness={40}
              >
                <TopRatedCard
                  astrologer={astrologer}
                  index={index}
                  scale={scale}
                  isLast={index === topRatedAstrologers.length - 1}
                  navigation={navigation}
                />
              </AnimatedEntrance>
            ))
          )}
        </View>

        {/* Feedback Form Section */}
        <View style={{ marginHorizontal: 20 * scale, marginBottom: 100 * scale }}>
          <FeedbackForm scale={scale} />
        </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Navigation */}
        <BottomNavBar
          activeTab={activeTab}
          navigation={navigation}
        />
      </SafeAreaView>
      </Animated.View>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />
    </>
  );
};

// Live Session Card Component with soft glow effect - Reanimated
const LiveSessionCard = ({ session, index, scale, isLast, navigation }: any) => {
  const scaleValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  // Pulsing glow animation
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleValue.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, {
      damping: 3,
      stiffness: 40,
    });
  };

  const handlePress = () => {
    navigation.navigate('LiveSession', { sessionId: session.id });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: glowOpacity.value,
      shadowRadius: interpolate(glowOpacity.value, [0.4, 0.7], [8, 16]),
    };
  });

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.liveAstrologerCard,
          animatedStyle,
          glowStyle,
          {
            width: 114 * scale,
            height: 164 * scale,
            borderRadius: 20 * scale,
            marginRight: isLast ? 0 : 8 * scale,
          },
        ]}
      >
        <Image
          source={
            session.thumbnailUrl
              ? { uri: session.thumbnailUrl }
              : session.astrologerImage
              ? { uri: session.astrologerImage }
              : require('../assets/images/astrologer3.jpg')
          }
          style={styles.liveAstrologerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.liveAstrologerGradient}
        />
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { fontSize: 8 * scale }]}>LIVE</Text>
        </View>
        <Text style={[styles.liveAstrologerName, { fontSize: 16 * scale, paddingHorizontal: 6 * scale }]} numberOfLines={1}>
          {session.astrologerName}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Top Rated Card Component with enhanced design - Reanimated
const TopRatedCard = ({ astrologer, index, scale, isLast, navigation }: any) => {
  const scaleValue = useSharedValue(1);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleValue.value = withSpring(0.98);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, {
      damping: 3,
      stiffness: 40,
    });
  };

  const handlePress = () => {
    navigation.navigate('AstrologerDetails', { astrologerId: astrologer.id });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.topRatedCard,
        animatedStyle,
        {
          height: 140 * scale,
          borderRadius: 20 * scale,
          padding: 12 * scale,
          marginBottom: isLast ? 0 : 16 * scale,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.topRatedCardInner}
      >
        <View style={[styles.astrologerImageContainer, {
          width: 115 * scale,
          height: 115 * scale,
          borderRadius: 16 * scale
        }]}>
          <Image
            source={typeof astrologer.image === 'string' ? { uri: astrologer.image } : astrologer.image}
            style={styles.topRatedImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.astrologerInfo}>
          <Text
            style={[styles.astrologerName, { fontSize: 17 * scale }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {astrologer.name}
          </Text>
          <View style={[styles.ratingRow, { marginTop: 6 * scale }]}>
            <Star size={16 * scale} fill="#FFCF0D" color="#FFCF0D" />
            <Text style={[styles.ratingText, { fontSize: 13 * scale }]}>{astrologer.rating}</Text>
            <Text style={[styles.callsText, { fontSize: 13 * scale }]}>{astrologer.totalCalls || astrologer.calls} calls</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 4 * scale }]}>
            <IndianRupee size={12 * scale} color="#000000" />
            <Text style={[styles.priceText, { fontSize: 13 * scale }]}>{astrologer.pricePerMinute || astrologer.price}/minute</Text>
          </View>
        </View>

        <AnimatedButton
          style={[styles.chatButton, {
            paddingHorizontal: 16 * scale,
            paddingVertical: 10 * scale,
            borderRadius: 12 * scale
          }]}
        >
          <Text style={[styles.chatButtonText, { fontSize: 13 * scale }]}>Chat</Text>
        </AnimatedButton>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Button Component with scale effect - Reanimated
const AnimatedButton = ({ children, onPress, style }: any) => {
  const scaleValue = useSharedValue(1);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleValue.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, {
      damping: 3,
      stiffness: 40,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Category Icon Component - Enhanced Micro-interactions
const CategoryIcon = ({ iconImage, label, scale }: any) => {
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const brightnessValue = useSharedValue(0);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Ripple effect
    rippleScale.value = 0;
    rippleOpacity.value = 0.3;
    rippleScale.value = withTiming(1.5, { duration: 300 });
    rippleOpacity.value = withTiming(0, { duration: 300 });

    // Scale and wobble
    scaleValue.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1.05, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // Wobble rotation
    rotateValue.value = withSequence(
      withTiming(8, { duration: 100 }),
      withTiming(-4, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Brightness boost
    brightnessValue.value = withTiming(1, { duration: 100 });
  };

  const onPressOut = () => {
    brightnessValue.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scaleValue.value },
        { rotate: `${rotateValue.value}deg` },
      ],
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        brightnessValue.value,
        [0, 1],
        ['#FFFFFF', '#FFFEF5']
      ),
    };
  });

  return (
    <TouchableOpacity
      style={[styles.categoryButton, { width: 74 * scale }]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <View style={styles.categoryIconWrapper}>
        {/* Ripple Effect */}
        <Animated.View style={[
          styles.rippleEffect,
          rippleStyle,
          {
            width: 74 * scale,
            height: 74 * scale,
            borderRadius: 16 * scale,
          }
        ]} />

        <Animated.View style={[
          styles.categoryIconCircle,
          animatedStyle,
          backgroundStyle,
          {
            width: 74 * scale,
            height: 74 * scale,
            borderRadius: 16 * scale,
          }
        ]}>
          <Image
            source={iconImage}
            style={{ width: 42 * scale, height: 42 * scale }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <Text style={[styles.categoryLabel, { fontSize: 10 * scale, marginTop: 8 * scale }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(41, 48, 166, 0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 120,
  },
  heyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    overflow: 'hidden',
    color: '#595959',
  },
  nameText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: '#595959',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletButton: {
    backgroundColor: '#2930A6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  walletText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bellButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 283,
    height: 68,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#2930A6',
    flex: 1,
    paddingVertical: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryButton: {
    alignItems: 'center',
  },
  categoryIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 207, 13, 0.4)',
  },
  categoryIconCircle: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFCF0D',
  },
  categoryLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 3,
    borderColor: '#FFCF0D',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 17,
    color: '#371B34',
  },
  ctaSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#371B34',
  },
  chatNowButton: {
    backgroundColor: '#2930A6',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatNowText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bannerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  section: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#000000',
  },
  viewAll: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#2930A6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    minHeight: 44,
  },
  liveAstrologerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    // Soft yellow glow effect
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 207, 13, 0.6)',
  },
  liveAstrologerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  liveAstrologerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveAstrologerName: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  topRatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(41, 48, 166, 0.08)',
  },
  topRatedCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  astrologerImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topRatedImage: {
    width: '100%',
    height: '100%',
  },
  astrologerInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 17,
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#333333',
    marginLeft: 2,
  },
  callsText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#333333',
  },
  chatButton: {
    backgroundColor: '#2930A6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  chatButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  feedbackSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(41, 48, 166, 0.08)',
  },
  feedbackHeader: {
    alignItems: 'center',
  },
  feedbackHeaderLine: {
    backgroundColor: '#FFCF0D',
  },
  feedbackTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  feedbackSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
  feedbackForm: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#333333',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#1a1a1a',
  },
  textAreaContainer: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Floating Label Input Styles - Enhanced Premium Design
  floatingInputGroup: {
    width: '100%',
    position: 'relative',
  },
  inputGlowEffect: {
    position: 'absolute',
    backgroundColor: '#2930A6',
    zIndex: -1,
  },
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingInputContent: {
    flex: 1,
    position: 'relative',
    height: '100%',
    justifyContent: 'center',
  },
  labelCenterWrapper: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  labelBackground: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    zIndex: -1,
  },
  floatingLabelCentered: {
    fontFamily: 'Lexend_500Medium',
    color: '#888888',
    letterSpacing: 0.2,
  },
  floatingLabelWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  floatingInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  floatingTextAreaContainer: {
    backgroundColor: '#FAFAFA',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  floatingLabelTextArea: {
    position: 'absolute',
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  floatingTextArea: {
    fontFamily: 'Lexend_400Regular',
    color: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  // Premium Animated Floating Label Styles
  floatingLabelAnimated: {
    position: 'absolute',
    left: 0,
    fontFamily: 'Lexend_500Medium',
    color: '#888888',
    letterSpacing: 0.2,
  },
  floatingInputAnimated: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    color: '#1a1a1a',
    paddingVertical: 0,
    height: '100%',
  },
  floatingLabelTextAreaAnimated: {
    fontFamily: 'Lexend_500Medium',
    color: '#888888',
    letterSpacing: 0.2,
  },
  gradientSubmitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default HomeScreen;

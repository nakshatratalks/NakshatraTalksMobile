/**
 * DailyHoroscopeScreen
 * Displays daily horoscope predictions based on zodiac sign
 * Performance-optimized: FlatList, no shadows, optimized images
 *
 * Features:
 * - Center-based carousel selection
 * - Animated detail panel transitions
 * - Smooth fade/slide when changing signs
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Grid3X3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ZodiacCarousel,
  ZodiacGridModal,
  HoroscopeTabSwitcher,
  HoroscopeCategoryCard,
  HoroscopeDay,
} from '../components/horoscope';
import { HoroscopeContentSkeleton } from '../components/skeleton/HoroscopeSkeleton';
import { BottomNavBar } from '../components/BottomNavBar';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useAuth } from '../src/contexts/AuthContext';
import {
  ZODIAC_SIGNS,
  ZodiacSign,
  getZodiacFromDate,
  getCurrentZodiac,
} from '../src/constants/zodiac';
import {
  CAROUSEL_CONFIG,
  ActiveChangeEvent,
  SelectionChangeReason,
} from '../components/horoscope/constants/carouselConfig';

// Storage key for user's zodiac preference
const ZODIAC_PREF_KEY = '@horoscope_selected_zodiac';

// Horoscope categories for FlatList
const CATEGORIES = ['general', 'love', 'career', 'health'] as const;

// Mock horoscope data (will be replaced with API)
const getMockHoroscope = (sign: string, _day: HoroscopeDay) => {
  return {
    general: `The sun in ${sign} brings intense focus, while passionate energy drives determination. Endurance helps navigate challenges without giving up. Moon enhances emotional depth and focus, encouraging deep reflection. Venus fosters warmth with loved ones, making moments of affection and appreciation central to the day.`,
    love: `Your passion is ignited as celestial energies urge you to dive deep into fervent interests. The Moon enhances your focus, allowing you to enjoy deep expression with your partner. Be aware of any indecision that may arise in your relationship. Tune into your lover's needs and desires to maintain harmony and balance in your connection.`,
    career: `A steady approach benefits your professional efforts, with the Sun encouraging persistence in handling important tasks. The Moon enhances emotional depth and focus, supporting thoughtful decision-making in work or studies. Maintaining balance and cultivating positive relationships will enhance productivity and ensure consistent progress in career responsibilities.`,
    health: `Focus on blood purification and managing your well-being today. Emphasize sensitivity and self-care. Support your body with healthy foods like barley, magnesium, protein, and vitamin C. Be mindful of cravings for sweets and occasional laziness that may challenge your routine. Stay hydrated and active.`,
  };
};

const DailyHoroscopeScreen = ({ navigation }: any) => {
  const { scale } = useResponsiveLayout();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // State
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>(getCurrentZodiac());
  const [activeDay, setActiveDay] = useState<HoroscopeDay>('today');
  const [showGridModal, setShowGridModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [horoscopeData, setHoroscopeData] = useState<Record<string, string> | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Track last selection reason for analytics/logging
  const lastSelectionReasonRef = useRef<SelectionChangeReason>('programmatic');

  // Animated values for content transitions
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const contentKey = useSharedValue(0); // For triggering re-renders

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isEnabled);
    };
    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => subscription.remove();
  }, []);

  // Calculate date based on selected day
  const selectedDate = useMemo(() => {
    const date = new Date();
    if (activeDay === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (activeDay === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }
    return date;
  }, [activeDay]);

  // Format date for display
  const formattedDate = useMemo(() => {
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
    return `${day}-${month}-${year}`;
  }, [selectedDate]);

  // Load user's saved zodiac preference
  useEffect(() => {
    const loadZodiacPreference = async () => {
      try {
        const savedSign = await AsyncStorage.getItem(ZODIAC_PREF_KEY);
        if (savedSign) {
          const sign = ZODIAC_SIGNS.find(s => s.id === savedSign);
          if (sign) {
            setSelectedSign(sign);
            return;
          }
        }

        if (user?.dateOfBirth) {
          const birthDate = new Date(user.dateOfBirth);
          const calculatedSign = getZodiacFromDate(birthDate);
          setSelectedSign(calculatedSign);
          return;
        }

        setSelectedSign(getCurrentZodiac());
      } catch (error) {
        console.error('Error loading zodiac preference:', error);
      }
    };

    loadZodiacPreference();
  }, [user?.dateOfBirth]);

  // Fetch horoscope data
  const fetchHoroscope = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = getMockHoroscope(selectedSign.name, activeDay);
      setHoroscopeData(data);
    } catch (error) {
      console.error('Error fetching horoscope:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSign.id, activeDay]);

  // Fetch on mount and when sign/day changes
  useEffect(() => {
    fetchHoroscope();
  }, [fetchHoroscope]);

  /**
   * Animate content transition when sign changes
   */
  const animateContentTransition = useCallback((direction: 'left' | 'right' | 'none' = 'none') => {
    if (reducedMotion) return;

    const duration = CAROUSEL_CONFIG.DETAIL_PANEL.FADE_DURATION_MS;
    const slideOffset = CAROUSEL_CONFIG.DETAIL_PANEL.SLIDE_OFFSET;

    // Determine slide direction based on navigation
    const startOffset = direction === 'left' ? slideOffset : direction === 'right' ? -slideOffset : 0;
    const endOffset = direction === 'left' ? -slideOffset : direction === 'right' ? slideOffset : 0;

    // Fade out and slide
    contentOpacity.value = withTiming(0, {
      duration: duration / 2,
      easing: Easing.out(Easing.ease),
    });
    contentTranslateX.value = withTiming(endOffset, {
      duration: duration / 2,
      easing: Easing.out(Easing.ease),
    });

    // After half duration, reset position and fade in
    setTimeout(() => {
      contentTranslateX.value = startOffset;
      contentOpacity.value = withTiming(1, {
        duration: duration / 2,
        easing: Easing.in(Easing.ease),
      });
      contentTranslateX.value = withTiming(0, {
        duration: duration / 2,
        easing: Easing.in(Easing.ease),
      });
    }, duration / 2);
  }, [reducedMotion, contentOpacity, contentTranslateX]);

  // Handle sign change
  const handleSignChange = useCallback(async (sign: ZodiacSign) => {
    const previousIndex = ZODIAC_SIGNS.findIndex(s => s.id === selectedSign.id);
    const newIndex = ZODIAC_SIGNS.findIndex(s => s.id === sign.id);

    // Determine animation direction
    const direction = newIndex > previousIndex ? 'left' : newIndex < previousIndex ? 'right' : 'none';

    // Trigger content animation
    animateContentTransition(direction);

    setSelectedSign(sign);
    try {
      await AsyncStorage.setItem(ZODIAC_PREF_KEY, sign.id);
    } catch (error) {
      console.error('Error saving zodiac preference:', error);
    }
  }, [selectedSign, animateContentTransition]);

  /**
   * Enhanced callback for carousel selection changes
   * Provides detailed event info including reason for change
   */
  const handleActiveChange = useCallback((event: ActiveChangeEvent<ZodiacSign>) => {
    const { activeIndex, activeCardData, previousIndex, reason } = event;

    // Track selection reason for analytics
    lastSelectionReasonRef.current = reason;

    // Log for debugging (can be sent to analytics)
    if (__DEV__) {
      console.log(`[Carousel] Selection changed:`, {
        from: previousIndex,
        to: activeIndex,
        sign: activeCardData.name,
        reason,
      });
    }

    // Different behavior based on reason
    switch (reason) {
      case 'scroll':
        // During active scrolling - content updates via handleSignChange
        break;
      case 'snap':
        // Final snap - good time for any cleanup or final updates
        break;
      case 'click':
        // User tapped a card - immediate selection
        break;
      case 'keyboard':
        // Keyboard navigation - ensure focus management
        break;
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchHoroscope();
    setRefreshing(false);
  }, [fetchHoroscope]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle view all press
  const handleViewAllPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowGridModal(true);
  }, []);

  // Yellow header height (covers status bar + header + subtitle)
  const yellowHeaderHeight = 150 * scale + statusBarHeight;

  // FlatList data
  const listData = useMemo(() => {
    if (loading) {
      return CATEGORIES.map((cat, idx) => ({ id: `skeleton-${idx}`, type: 'skeleton' as const }));
    }
    if (!horoscopeData) {
      return [{ id: 'error', type: 'error' as const }];
    }
    return CATEGORIES.map((cat, idx) => ({
      id: cat,
      type: 'content' as const,
      category: cat,
      content: horoscopeData[cat],
      isLast: idx === CATEGORIES.length - 1,
    }));
  }, [loading, horoscopeData]);

  // Render FlatList item
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item.type === 'skeleton') {
      return <HoroscopeContentSkeleton scale={scale} />;
    }
    if (item.type === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load horoscope</Text>
        </View>
      );
    }
    return (
      <HoroscopeCategoryCard
        category={item.category}
        content={item.content}
        index={index}
        scale={scale}
        isLast={item.isLast}
      />
    );
  }, [scale]);

  // Key extractor
  const keyExtractor = useCallback((item: any) => item.id, []);

  // List header component (content card container start)
  const ListHeaderComponent = useCallback(() => (
    <View style={styles.listHeaderSpacer} />
  ), []);

  // List footer component (bottom spacing)
  const ListFooterComponent = useCallback(() => (
    <View style={{ height: 100 * scale }} />
  ), [scale]);

  /**
   * Animated style for content transitions
   * GPU-friendly: only uses transform and opacity
   */
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Yellow Background - Extends behind status bar */}
      <View style={[
        styles.headerBackground,
        {
          height: yellowHeaderHeight,
          borderBottomLeftRadius: 28 * scale,
          borderBottomRightRadius: 28 * scale,
        }
      ]} />

      {/* Content with safe area padding */}
      <View style={[styles.mainContent, { paddingTop: statusBarHeight }]}>

        {/* ===== STICKY HEADER SECTION ===== */}
        <View style={styles.stickyHeader}>
          {/* Header Row - On Yellow */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24 * scale} color="#333333" />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>
              Daily Horoscope
            </Text>

            <View style={styles.headerRight} />
          </View>

          {/* Subtitle - On Yellow */}
          <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
            Select your sign and view your horoscope
          </Text>

          {/* White content area */}
          <View style={[styles.whiteContentArea, { marginTop: 16 * scale }]}>
            {/* Tab Switcher */}
            <View style={[styles.tabContainer, { paddingTop: 16 * scale }]}>
              <HoroscopeTabSwitcher
                activeTab={activeDay}
                onTabChange={setActiveDay}
                scale={scale}
              />
            </View>

            {/* View All + Date Row */}
            <View style={[styles.infoRow, { marginTop: 14 * scale, paddingHorizontal: 20 * scale }]}>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewAllPress}
                activeOpacity={0.7}
              >
                <Grid3X3 size={15 * scale} color="#2930A6" />
                <Text style={[styles.viewAllText, { fontSize: 13 * scale }]}>View All</Text>
              </TouchableOpacity>

              <View style={[styles.dateBadge, {
                paddingHorizontal: 10 * scale,
                paddingVertical: 5 * scale,
                borderRadius: 4 * scale,
              }]}>
                <Text style={[styles.dateBadgeText, { fontSize: 11 * scale }]}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {/* Zodiac Carousel - selection updates on snap only */}
            <View style={[styles.carouselContainer, { marginTop: 4 * scale }]}>
              <ZodiacCarousel
                selectedSign={selectedSign.id}
                onSignChange={handleSignChange}
                onActiveChange={handleActiveChange}
                scale={scale}
                enableKeyboard={true}
                debugMode={false}
              />
            </View>
          </View>
        </View>

        {/* ===== SCROLLABLE CONTENT - Animated FlatList ===== */}
        <Animated.View style={[styles.flatListWrapper, contentAnimatedStyle]}>
          <FlatList
            data={listData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={4}
            windowSize={5}
            initialNumToRender={4}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2930A6"
                colors={['#2930A6']}
              />
            }
            CellRendererComponent={({ children, style, ...props }) => (
              <View style={[style, styles.contentCard]} {...props}>
                {children}
              </View>
            )}
          />
        </Animated.View>

        {/* Bottom Navigation */}
        <BottomNavBar navigation={navigation} />

        {/* Zodiac Grid Modal */}
        <ZodiacGridModal
          visible={showGridModal}
          selectedSign={selectedSign.id}
          onClose={() => setShowGridModal(false)}
          onSelectSign={handleSignChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFCF0D',
    zIndex: 0,
  },
  stickyHeader: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  subtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 2,
  },
  whiteContentArea: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 8,
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderBottomWidth: 0,
  },
  tabContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#2930A6',
    marginLeft: 5,
  },
  dateBadge: {
    backgroundColor: '#2930A6',
  },
  dateBadgeText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  carouselContainer: {
    // Carousel handles its own padding
  },
  flatListWrapper: {
    flex: 1,
    // Ensures animated transforms don't clip content
    overflow: 'visible',
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  listHeaderSpacer: {
    height: 12,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#888888',
  },
});

export default DailyHoroscopeScreen;

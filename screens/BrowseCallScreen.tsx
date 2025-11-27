import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
import {
  Search,
  SlidersHorizontal,
  User,
  Bell,
  IndianRupee,
  Home,
  MessageSquare,
  Phone,
  UserCircle2,
  Star,
  Video,
  Grid,
  Sparkles,
  Heart,
  Moon,
  Zap,
  Users,
  BarChart,
  Compass,
  BookOpen,
  Crown,
  BadgeCheck,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useBrowseCallData } from '../src/hooks/useBrowseCallData';
import { useAuth } from '../src/contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { BottomNavBar } from '../components/BottomNavBar';
import { Astrologer } from '../src/types/api.types';
import { AstrologerCardSkeleton } from '../components/skeleton';

const { width: screenWidth } = Dimensions.get('window');

// Icon mapping for specializations
const getSpecializationIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('vedic') || lowerName.includes('jyotish')) return Moon;
  if (lowerName.includes('tarot')) return Sparkles;
  if (lowerName.includes('numerology')) return BarChart;
  if (lowerName.includes('palmistry') || lowerName.includes('palm')) return Users;
  if (lowerName.includes('vastu')) return Compass;
  if (lowerName.includes('kundli') || lowerName.includes('horoscope')) return BookOpen;
  if (lowerName.includes('psychic') || lowerName.includes('spiritual')) return Zap;
  if (lowerName.includes('marriage') || lowerName.includes('relationship')) return Heart;
  if (lowerName.includes('career')) return Crown;
  return Sparkles; // default
};

const BrowseCallScreen = ({ navigation }: any) => {
  const {
    userProfile,
    astrologers,
    specializations,
    selectedSpecialization,
    searchQuery,
    loading: dataLoading,
    error: dataError,
    refetch,
    setSearchQuery,
    setSelectedSpecialization,
  } = useBrowseCallData();

  const { user } = useAuth();

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(3); // Call tab active (index 3)
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Animation values - Initialize to final values (no entrance animation - screens stay mounted)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  // Stagger animation values for cards - Initialize to 1 (no entrance animation)
  const cardsAnim = useRef(astrologers.map(() => new Animated.Value(1))).current;

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const { cardWidth, scale } = useResponsiveLayout();

  // Set status bar based on sidebar state when screen is focused
  // Only set dark if sidebar is NOT open, to avoid overriding sidebar's light status bar
  useFocusEffect(
    useCallback(() => {
      if (!sidebarVisible) {
        setStatusBarStyle('dark');
      }
    }, [sidebarVisible])
  );

  // No mount animation needed - screens stay mounted via Tab Navigator
  // All animation values are already initialized to their final state

  // Search focus animation
  const handleSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // 3D Sidebar animation effect with content fade
  // Note: Status bar is managed by the Sidebar component itself
  useEffect(() => {
    const SIDEBAR_WIDTH = screenWidth * 0.75;
    if (sidebarVisible) {
      Animated.parallel([
        Animated.timing(screenScale, {
          toValue: 0.85,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: SIDEBAR_WIDTH * 0.8,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacityAnim, {
          toValue: 0.3,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(screenScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Animated.View style={[
        styles.mainContainer,
        {
          transform: [
            { scale: screenScale },
            { translateX: screenTranslateX },
          ],
          opacity: contentOpacityAnim,
          borderRadius: sidebarVisible ? 30 : 0,
          overflow: 'hidden',
        }
      ]}>
        <StatusBar style={sidebarVisible ? "light" : "dark"} translucent backgroundColor="transparent" />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Sticky Header and Filter Section */}
          <Animated.View style={[styles.stickyHeader, {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }]}>
            {/* Yellow Background Header - Ends right after search bar */}
            <View style={[styles.yellowHeader, { paddingTop: 50 * scale, paddingBottom: 12 * scale }]}>
              {/* Header Section */}
              <View style={[styles.header, {
                paddingHorizontal: 20 * scale,
                paddingTop: 20 * scale,
                marginBottom: 24 * scale,
              }]}>
                <TouchableOpacity
                  style={styles.headerLeft}
                  onPress={() => setSidebarVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.profileCircle, { width: 56 * scale, height: 56 * scale }]}>
                    {userProfile?.profileImage ? (
                      <Image
                        source={{ uri: userProfile.profileImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <User size={28 * scale} color="#2930A6" />
                    )}
                  </View>
                  <View style={styles.greetingContainer}>
                    <Text style={[styles.heyText, { fontSize: 16 * scale }]}>Hey</Text>
                    <Text style={[styles.nameText, { fontSize: 16 * scale }]}>
                      {userProfile?.name || user?.name || 'Guest'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.headerRight}>
                  <AnimatedButton
                    style={[styles.walletButton, {
                      height: 32 * scale,
                      borderRadius: 20 * scale,
                      paddingHorizontal: 14 * scale
                    }]}
                  >
                    <IndianRupee size={18 * scale} color="#FFFFFF" />
                    <Text style={[styles.walletText, { fontSize: 16 * scale }]}>
                      {userProfile?.walletBalance?.toFixed(2) || '0.00'}
                    </Text>
                  </AnimatedButton>

                  <AnimatedButton style={[styles.bellButton, { width: 32 * scale, height: 32 * scale }]}>
                    <Bell size={24 * scale} color="#2930A6" />
                  </AnimatedButton>
                </View>
              </View>

              {/* Search Bar - At the end of yellow area */}
              <Animated.View
                style={[
                  styles.searchContainer,
                  {
                    marginHorizontal: 20 * scale,
                    marginBottom: 12 * scale,
                    height: 48 * scale,
                    borderRadius: 100 * scale,
                    paddingHorizontal: 16 * scale,
                    borderWidth: searchBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                    borderColor: searchBorderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#595959', '#2930A6'],
                    }),
                  },
                ]}
              >
                <View style={styles.searchLeft}>
                  <Search size={20 * scale} color={searchFocused ? '#2930A6' : '#595959'} />
                  <TextInput
                    style={[styles.searchInput, { fontSize: 12 * scale }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search"
                    placeholderTextColor="#595959"
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                  />
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                  <SlidersHorizontal size={18 * scale} color="#595959" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Filter Chips - White Background with proper padding */}
            <View style={[styles.filterContainer, {
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 5 * scale,
              paddingTop: 20 * scale,
              paddingBottom: 20 * scale,
            }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 5 * scale,
                  paddingVertical: 4 * scale
                }}
              >
                <FilterChip
                  label="Filter"
                  icon={SlidersHorizontal}
                  isActive={false}
                  isFilterButton={true}
                  onPress={() => console.log('Show filter modal')}
                  scale={scale}
                />
                <View style={[styles.filterDivider, { marginHorizontal: 8 * scale }]}>
                  <View style={styles.filterDividerLine} />
                </View>
                <FilterChip
                  label="All"
                  icon={Grid}
                  isActive={selectedSpecialization === null}
                  onPress={() => setSelectedSpecialization(null)}
                  scale={scale}
                />
                {specializations.slice(0, 5).map((spec) => (
                  <FilterChip
                    key={spec.id}
                    label={spec.name}
                    icon={getSpecializationIcon(spec.name)}
                    isActive={selectedSpecialization === spec.name}
                    onPress={() => setSelectedSpecialization(spec.name)}
                    scale={scale}
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Scrollable Cards Area - White Background */}
          <Animated.ScrollView
            style={[styles.scrollableContent, {
              backgroundColor: '#FFFFFF',
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2930a6"
                colors={['#2930a6']}
              />
            }
          >
            {/* Astrologers List */}
            <View style={[styles.astrologersContainer, {
              paddingHorizontal: 18 * scale,
              paddingTop: 20 * scale,
              paddingBottom: 100 * scale
            }]}>
              {dataLoading && astrologers.length === 0 ? (
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <AstrologerCardSkeleton
                      key={index}
                      scale={scale}
                    />
                  ))}
                </>
              ) : astrologers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Sparkles size={48 * scale} color="#FFCF0D" />
                  <Text style={[styles.emptyText, { fontSize: 16 * scale, marginTop: 16 * scale }]}>
                    No astrologers found
                  </Text>
                  <Text style={[styles.emptySubtext, { fontSize: 12 * scale, marginTop: 8 * scale }]}>
                    Try adjusting your search or filters
                  </Text>
                </View>
              ) : (
                <>
                  {astrologers.map((astrologer, index) => (
                    <AstrologerCard
                      key={astrologer.id}
                      astrologer={astrologer}
                      index={index}
                      scale={scale}
                      animValue={cardsAnim[index] || new Animated.Value(1)}
                      isLast={index === astrologers.length - 1}
                      navigation={navigation}
                    />
                  ))}
                </>
              )}
            </View>
          </Animated.ScrollView>

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
      />
    </>
  );
};

// Astrologer Card Component
const AstrologerCard = ({ astrologer, index, scale, animValue, isLast, navigation }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate('AstrologerDetails', { astrologerId: astrologer.id });
  };

  return (
    <Animated.View
      style={[
        styles.astrologerCard,
        {
          height: 151 * scale,
          borderRadius: 16 * scale,
          padding: 12 * scale,
          marginBottom: isLast ? 0 : 16 * scale,
          opacity: animValue,
          transform: [
            { scale: scaleValue },
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.astrologerCardInner}
      >
        {/* Profile Image */}
        <View style={[styles.astrologerImageContainer, {
          width: 93 * scale,
          height: 89 * scale,
          borderRadius: 46.5 * scale
        }]}>
          <Image
            source={typeof astrologer.image === 'string' ? { uri: astrologer.image } : astrologer.image}
            style={styles.astrologerImage}
            resizeMode="cover"
          />
        </View>

        {/* Astrologer Info */}
        <View style={styles.astrologerInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.astrologerName, { fontSize: 18 * scale }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {astrologer.name}
            </Text>
            {/* Verified Badge - Instagram style on right */}
            {astrologer.isAvailable && (
              <View style={[styles.verifiedBadgeRight, {
                width: 20 * scale,
                height: 20 * scale,
                borderRadius: 10 * scale,
                marginLeft: 6 * scale,
                transform: [{ rotate: '12deg' }, { scaleX: 0.95 }]
              }]}>
                <BadgeCheck
                  size={20 * scale}
                  fill="#10B981"
                  color="#FFFFFF"
                  strokeWidth={2}
                />
              </View>
            )}
          </View>
          <Text style={[styles.specializationText, { fontSize: 10 * scale, marginTop: 4 * scale }]}>
            {astrologer.specialization.join(', ')}
          </Text>
          <Text style={[styles.languagesText, { fontSize: 10 * scale, marginTop: 4 * scale }]}>
            {astrologer.languages.join(', ')}
          </Text>
          <Text style={[styles.experienceText, { fontSize: 10 * scale, marginTop: 4 * scale }]}>
            Exp - {astrologer.experience} Years
          </Text>

          {/* Rating and Price Row */}
          <View style={[styles.bottomRow, { marginTop: 8 * scale }]}>
            {/* Rating Stars */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16 * scale}
                  fill={star <= Math.floor(astrologer.rating) ? '#FFCF0D' : 'transparent'}
                  color="#FFCF0D"
                  strokeWidth={1}
                />
              ))}
            </View>
          </View>
          <Text style={[styles.ordersText, { fontSize: 10 * scale, marginTop: 4 * scale }]}>
            {astrologer.totalCalls} orders
          </Text>
        </View>

        {/* Right Side - Price & Call Button */}
        <View style={styles.rightSection}>
          <View style={[styles.priceRow, { marginTop: 50 * scale }]}>
            <IndianRupee size={12 * scale} color="#2930A6" />
            <Text style={[styles.priceText, { fontSize: 10 * scale }]}>
              {astrologer.callPricePerMinute || astrologer.pricePerMinute}/min
            </Text>
          </View>
          <AnimatedButton
            style={[styles.callButton, {
              marginTop: 10 * scale,
              paddingHorizontal: 20 * scale,
              paddingVertical: 8 * scale,
              borderRadius: 25 * scale
            }]}
            onPress={() => console.log('Call with', astrologer.name)}
          >
            <Text style={[styles.callButtonText, { fontSize: 18 * scale }]}>Call</Text>
          </AnimatedButton>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Filter Chip Component
const FilterChip = ({ label, icon: Icon, isActive, isFilterButton, onPress, scale }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.filterChip,
          {
            height: 38 * scale,
            borderRadius: 20 * scale,
            paddingHorizontal: 20 * scale,
            backgroundColor: isFilterButton ? '#FFCF0D' : isActive ? '#2930A6' : 'rgba(41, 48, 166, 0.3)',
            marginRight: 8 * scale,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {Icon && <Icon size={20 * scale} color={isFilterButton ? '#2930A6' : '#FFFFFF'} />}
        <Text
          style={[
            styles.filterChipText,
            {
              fontSize: 16 * scale,
              color: isFilterButton ? '#2930A6' : '#FFFFFF',
              marginLeft: Icon ? 8 * scale : 0,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Button Component with scale effect
const AnimatedButton = ({ children, onPress, style }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
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
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
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
  stickyHeader: {
    zIndex: 10,
  },
  scrollableContent: {
    flex: 1,
  },
  yellowHeader: {
    backgroundColor: '#FFCF0D',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  heyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
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
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  walletText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bellButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#595959',
    flex: 1,
    paddingVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterDivider: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDividerLine: {
    width: 2,
    height: 14,
    backgroundColor: '#000000',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterChipText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 16,
  },
  astrologersContainer: {
    width: '100%',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  emptySubtext: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#666666',
  },
  astrologerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.08)',
  },
  astrologerCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  astrologerImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 46.5,
    overflow: 'visible',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFCF0D',
  },
  astrologerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 46.5,
  },
  verifiedBadge: {
    position: 'absolute',
  },
  astrologerInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.54,
    flexShrink: 1,
  },
  verifiedBadgeRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  specializationText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#595959',
    letterSpacing: -0.3,
  },
  languagesText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#595959',
    letterSpacing: -0.3,
  },
  experienceText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#595959',
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ordersText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#000000',
    letterSpacing: -0.3,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#2930A6',
    letterSpacing: -0.3,
  },
  callButton: {
    backgroundColor: '#2930A6',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  callButtonText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.54,
  },
});

export default BrowseCallScreen;

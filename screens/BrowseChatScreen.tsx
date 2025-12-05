import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  interpolateColor,
  Extrapolation,
  useAnimatedScrollHandler,
  runOnJS,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import NotificationService from '../src/utils/notificationService';
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
  History,
  Grid,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useBrowseChatData } from '../src/hooks/useBrowseChatData';
import { useAuth } from '../src/contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { BottomNavBar } from '../components/BottomNavBar';
import InsufficientBalanceModal from '../components/chat/InsufficientBalanceModal';
import { Astrologer } from '../src/types/api.types';
import { chatService } from '../src/services';
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

// Helper to handle image sources safely
const getImageSource = (image: string | number | null | undefined): ImageSourcePropType | undefined => {
  if (!image) return undefined;
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image as ImageSourcePropType;
};

const BrowseChatScreen = ({ navigation }: any) => {
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
  } = useBrowseChatData();

  const { user } = useAuth();

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // Chat tab active
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loadingAstrologerId, setLoadingAstrologerId] = useState<string | null>(null);
  const [insufficientBalanceData, setInsufficientBalanceData] = useState({
    visible: false,
    astrologer: null as Astrologer | null,
    shortfall: 0,
    minimumRequired: 0,
    currentBalance: 0,
    pricePerMinute: 0,
  });

  // Reanimated Shared Values
  const scrollY = useSharedValue(0);
  const searchBorderAnim = useSharedValue(0);
  const screenScale = useSharedValue(1);
  const screenTranslateX = useSharedValue(0);
  const contentOpacityAnim = useSharedValue(1);

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
  useFocusEffect(
    useCallback(() => {
      if (!sidebarVisible) {
        setStatusBarStyle('dark');
      }
    }, [sidebarVisible])
  );

  // Search focus animation
  const handleSearchFocus = () => {
    setSearchFocused(true);
    searchBorderAnim.value = withTiming(1, { duration: 200 });
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    searchBorderAnim.value = withTiming(0, { duration: 200 });
  };

  // 3D Sidebar animation effect
  useEffect(() => {
    const SIDEBAR_WIDTH = screenWidth * 0.75;
    if (sidebarVisible) {
      screenScale.value = withTiming(0.85, { duration: 350 });
      screenTranslateX.value = withTiming(SIDEBAR_WIDTH * 0.8, { duration: 350 });
      contentOpacityAnim.value = withTiming(0.3, { duration: 350 });
    } else {
      screenScale.value = withTiming(1, { duration: 300 });
      screenTranslateX.value = withTiming(0, { duration: 300 });
      contentOpacityAnim.value = withTiming(1, { duration: 300 });
    }
  }, [sidebarVisible]);

  // Scroll Handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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

  // Handle start chat with balance validation
  const handleStartChat = async (astrologer: Astrologer) => {
    try {
      setLoadingAstrologerId(astrologer.id);

      // Step 1: Validate balance
      const validationData = await chatService.validateBalance(astrologer.id);

      // Step 2: Handle insufficient balance
      if (!validationData.canStartChat) {
        setInsufficientBalanceData({
          visible: true,
          astrologer: astrologer,
          shortfall: validationData.shortfall || 0,
          minimumRequired: validationData.minimumRequired || 0,
          currentBalance: validationData.currentBalance || 0,
          pricePerMinute: validationData.pricePerMinute || astrologer.pricePerMinute,
        });
        return;
      }

      // Step 3: Start session
      const session = await chatService.startSession({
        astrologerId: astrologer.id,
        sessionType: 'chat',
      });

      // Step 4: Navigate to chat interface
      navigation.navigate('ChatInterface', {
        session: session,
        astrologer: astrologer,
      });
    } catch (error: any) {
      console.error('Error starting chat:', error);

      // Handle specific error for insufficient balance
      if (error.response?.data?.error?.code === 'INSUFFICIENT_BALANCE') {
        setInsufficientBalanceData({
          visible: true,
          astrologer: astrologer,
          shortfall: error.response.data.data?.shortfall || 0,
          minimumRequired: error.response.data.data?.minimumRequired || 0,
          currentBalance: error.response.data.data?.currentBalance || 0,
          pricePerMinute: error.response.data.data?.pricePerMinute || astrologer.pricePerMinute,
        });
      } else {
        NotificationService.error(
          error.response?.data?.error?.message || 'Failed to start chat. Please try again.',
          'Error'
        );
      }
    } finally {
      setLoadingAstrologerId(null);
    }
  };

  // Animated Styles
  const mainContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: screenScale.value },
        { translateX: screenTranslateX.value },
      ],
      opacity: contentOpacityAnim.value,
      borderRadius: sidebarVisible ? 30 : 0,
      overflow: 'hidden',
    };
  });

  // Header Animation
  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 100], [0, -50], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 50], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 100], [200 * scale, 120 * scale], Extrapolation.CLAMP);
    return { height };
  });

  const searchContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 100], [0, -40], Extrapolation.CLAMP);
    const width = interpolate(scrollY.value, [0, 100], [screenWidth - 40 * scale, screenWidth - 100 * scale], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }],
      width,
      borderWidth: interpolate(searchBorderAnim.value, [0, 1], [1, 2]),
      borderColor: interpolateColor(
        searchBorderAnim.value,
        [0, 1],
        ['#595959', '#2930A6']
      ),
    };
  });

  if (!fontsLoaded) {
    return null;
  }

  const renderItem = ({ item, index }: { item: Astrologer; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <AstrologerCard
        astrologer={item}
        index={index}
        scale={scale}
        onStartChat={handleStartChat}
        loadingAstrologerId={loadingAstrologerId}
        navigation={navigation}
      />
    </Animated.View>
  );

  return (
    <>
      <Animated.View style={[styles.mainContainer, mainContainerStyle]}>
        <StatusBar style={sidebarVisible ? "light" : "dark"} translucent backgroundColor="transparent" />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>

          {/* Header Background */}
          <Animated.View style={[styles.yellowHeader, stickyHeaderStyle]}>
            <Animated.View style={[styles.headerContent, headerStyle]}>
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
                  onPress={() => navigation.navigate('Wallet')}
                >
                  <IndianRupee size={18 * scale} color="#FFFFFF" />
                  <Text style={[styles.walletText, { fontSize: 16 * scale }]}>
                    {userProfile?.walletBalance?.toFixed(2) || '0.00'}
                  </Text>
                </AnimatedButton>

                <AnimatedButton
                  style={[styles.bellButton, { width: 32 * scale, height: 32 * scale }]}
                  onPress={() => navigation.navigate('ChatHistory')}
                >
                  <History size={24 * scale} color="#2930A6" strokeWidth={2} />
                </AnimatedButton>
              </View>
            </Animated.View>

            {/* Search Bar */}
            <Animated.View
              style={[
                styles.searchContainer,
                searchContainerStyle,
                {
                  height: 48 * scale,
                  borderRadius: 100 * scale,
                  paddingHorizontal: 16 * scale,
                  position: 'absolute',
                  bottom: 20 * scale,
                  left: 20 * scale,
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
          </Animated.View>

          {/* Filter Chips */}
          <View style={[styles.filterContainer, { paddingVertical: 10 * scale }]}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 'all', name: 'All' }, ...specializations]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20 * scale }}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.name}
                  icon={item.id === 'all' ? Grid : getSpecializationIcon(item.name)}
                  isActive={selectedSpecialization === (item.id === 'all' ? null : item.name)}
                  onPress={() => setSelectedSpecialization(item.id === 'all' ? null : item.name)}
                  scale={scale}
                />
              )}
            />
          </View>

          {/* Main Content */}
          <Animated.FlatList
            data={astrologers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 18 * scale,
              paddingBottom: 100 * scale,
              paddingTop: 10 * scale,
            }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2930a6"
                colors={['#2930a6']}
              />
            }
            ListEmptyComponent={
              dataLoading ? (
                <View>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <AstrologerCardSkeleton key={index} scale={scale} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Sparkles size={48 * scale} color="#FFCF0D" />
                  <Text style={[styles.emptyText, { fontSize: 16 * scale, marginTop: 16 * scale }]}>
                    No astrologers found
                  </Text>
                  <Text style={[styles.emptySubtext, { fontSize: 12 * scale, marginTop: 8 * scale }]}>
                    Try adjusting your search or filters
                  </Text>
                </View>
              )
            }
          />

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

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        visible={insufficientBalanceData.visible}
        shortfall={insufficientBalanceData.shortfall}
        minimumRequired={insufficientBalanceData.minimumRequired}
        currentBalance={insufficientBalanceData.currentBalance}
        pricePerMinute={insufficientBalanceData.pricePerMinute}
        onRecharge={() => {
          setInsufficientBalanceData({ ...insufficientBalanceData, visible: false });
          NotificationService.info('Wallet recharge screen will be implemented soon.', 'Recharge');
        }}
        onCancel={() => {
          setInsufficientBalanceData({ ...insufficientBalanceData, visible: false });
        }}
      />
    </>
  );
};

// Astrologer Card Component
const AstrologerCard = ({
  astrologer,
  scale,
  onStartChat,
  loadingAstrologerId,
  navigation
}: any) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const onPressIn = () => {
    scaleValue.value = withSpring(0.98);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const handlePress = () => {
    navigation.navigate('AstrologerDetails', { astrologerId: astrologer.id });
  };

  return (
    <Animated.View style={[styles.astrologerCard, animatedStyle, { marginBottom: 16 * scale }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.astrologerCardInner, { padding: 12 * scale, borderRadius: 16 * scale }]}
      >
        {/* Profile Image */}
        <View style={[styles.astrologerImageContainer, {
          width: 93 * scale,
          height: 89 * scale,
          borderRadius: 46.5 * scale
        }]}>
          <Image
            source={getImageSource(astrologer.image)}
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

          {/* Rating */}
          <View style={[styles.bottomRow, { marginTop: 8 * scale }]}>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <View key={star} style={{ marginRight: 2 }}>
                  <Sparkles
                    size={12 * scale}
                    fill={star <= Math.floor(astrologer.rating) ? '#FFCF0D' : 'transparent'}
                    color={star <= Math.floor(astrologer.rating) ? '#FFCF0D' : '#E0E0E0'}
                  />
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.ordersText, { fontSize: 10 * scale, marginTop: 4 * scale }]}>
            {astrologer.totalCalls} orders
          </Text>
        </View>

        {/* Right Side */}
        <View style={styles.rightSection}>
          <View style={[styles.priceRow, { marginTop: 50 * scale }]}>
            <IndianRupee size={12 * scale} color="#2930A6" />
            <Text style={[styles.priceText, { fontSize: 10 * scale }]}>
              {astrologer.chatPricePerMinute || astrologer.pricePerMinute}/min
            </Text>
          </View>
          <AnimatedButton
            style={[styles.chatButton, {
              marginTop: 10 * scale,
              paddingHorizontal: 20 * scale,
              paddingVertical: 8 * scale,
              borderRadius: 25 * scale
            }]}
            onPress={() => onStartChat(astrologer)}
          >
            {loadingAstrologerId === astrologer.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.chatButtonText, { fontSize: 14 * scale }]}>Chat</Text>
            )}
          </AnimatedButton>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Filter Chip Component
const FilterChip = ({ label, icon: Icon, isActive, onPress, scale }: any) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      backgroundColor: withTiming(isActive ? '#2930A6' : '#FFFFFF', { duration: 200 }),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(isActive ? '#FFFFFF' : '#595959', { duration: 200 }),
    };
  });

  const onPressIn = () => {
    scaleValue.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1);
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
          animatedStyle,
          {
            height: 38 * scale,
            borderRadius: 20 * scale,
            paddingHorizontal: 16 * scale,
            marginRight: 8 * scale,
            borderWidth: 1,
            borderColor: isActive ? '#2930A6' : '#E0E0E0',
          },
        ]}
      >
        {Icon && <Icon size={16 * scale} color={isActive ? '#FFFFFF' : '#595959'} />}
        <Animated.Text
          style={[
            styles.filterChipText,
            textStyle,
            {
              fontSize: 14 * scale,
              marginLeft: Icon ? 8 * scale : 0,
              fontFamily: 'Lexend_500Medium',
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Button Component
const AnimatedButton = ({ children, onPress, style }: any) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const onPressIn = () => {
    scaleValue.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1);
  };

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

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  yellowHeader: {
    backgroundColor: '#FFCF0D',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  heyText: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
  },
  nameText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2930A6',
    justifyContent: 'center',
  },
  walletText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  bellButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
    paddingVertical: 0,
  },
  filterContainer: {
    backgroundColor: '#F5F5F5',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontFamily: 'Lexend_500Medium',
  },
  astrologerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  astrologerCardInner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  astrologerImageContainer: {
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFCF0D',
    overflow: 'hidden',
  },
  astrologerImage: {
    width: '100%',
    height: '100%',
  },
  astrologerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#000000',
    flexShrink: 1,
  },
  verifiedBadgeRight: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specializationText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  languagesText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  experienceText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordersText: {
    fontFamily: 'Lexend_300Light',
    color: '#000000',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontFamily: 'Lexend_500Medium',
    color: '#2930A6',
    marginLeft: 2,
  },
  chatButton: {
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  emptySubtext: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
});

export default BrowseChatScreen;

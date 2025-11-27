/**
 * Call History Screen
 * Displays list of previous call sessions with astrologers
 * Features: Skeleton loading, staggered animations, touch feedback, duration display
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  RefreshControl,
  FlatList,
  Easing,
  Modal,
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
  ChevronLeft,
  Phone,
  X,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useCallHistoryData, CallHistoryItem } from '../src/hooks/useCallHistoryData';
import { BottomNavBar } from '../components/BottomNavBar';
import { CallHistoryItemSkeleton } from '../components/skeleton';

// Animated Call Item Component with touch feedback
const AnimatedCallItem = ({
  item,
  index,
  isLast,
  scale,
  onPress,
  formatDateTime,
  formatDuration,
  getInitials,
  animatedValue,
}: {
  item: CallHistoryItem;
  index: number;
  isLast: boolean;
  scale: number;
  onPress: (item: CallHistoryItem) => void;
  formatDateTime: (timestamp: string) => { date: string; time: string };
  formatDuration: (seconds: number | null) => string;
  getInitials: (name: string) => string;
  animatedValue: Animated.Value;
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const { date, time } = formatDateTime(item.callTime);

  return (
    <Animated.View
      style={[
        styles.callItemContainer,
        {
          opacity: animatedValue,
          transform: [
            { scale: pressAnim },
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.callItem, { paddingVertical: 8 * scale }]}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Left Section - Avatar */}
        <View style={[styles.leftSection, { paddingLeft: 17 * scale, paddingRight: 15 * scale }]}>
          <View style={styles.avatarContainer}>
            {item.astrologerImage ? (
              <Image
                source={{ uri: item.astrologerImage }}
                style={[styles.avatar, { width: 60 * scale, height: 60 * scale }]}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { width: 60 * scale, height: 60 * scale }]}>
                <Text style={[styles.avatarInitial, { fontSize: 26 * scale }]}>
                  {getInitials(item.astrologerName)}
                </Text>
              </View>
            )}
            {/* Online indicator */}
            {item.isOnline && (
              <View
                style={[
                  styles.onlineIndicator,
                  {
                    width: 10 * scale,
                    height: 10 * scale,
                    right: 0,
                    bottom: 0,
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Center Section - Name */}
        <View style={styles.centerSection}>
          <Text
            style={[styles.astrologerName, { fontSize: 20 * scale }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.astrologerName}
          </Text>
        </View>

        {/* Duration Section */}
        <View style={[styles.durationSection, { marginRight: 12 * scale }]}>
          <Text style={[styles.durationLabel, { fontSize: 12 * scale }]}>Duration</Text>
          <Text style={[styles.durationValue, { fontSize: 14 * scale }]}>
            {formatDuration(item.duration)}
          </Text>
        </View>

        {/* Right Section - Date/Time */}
        <View style={[styles.rightSection, { paddingRight: 17 * scale }]}>
          <Text style={[styles.dateText, { fontSize: 12 * scale }]}>{date}</Text>
          <Text style={[styles.timeText, { fontSize: 12 * scale }]}>{time}</Text>
        </View>
      </TouchableOpacity>

      {/* Separator */}
      {!isLast && (
        <View style={[styles.separatorContainer, { paddingHorizontal: 17 * scale }]}>
          <View style={styles.separator} />
        </View>
      )}
    </Animated.View>
  );
};

// Call Details Modal Component
const CallDetailsModal = ({
  visible,
  item,
  onClose,
  scale,
  formatDateTime,
  formatDuration,
}: {
  visible: boolean;
  item: CallHistoryItem | null;
  onClose: () => void;
  scale: number;
  formatDateTime: (timestamp: string) => { date: string; time: string };
  formatDuration: (seconds: number | null) => string;
}) => {
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!item) return null;

  const { date, time } = formatDateTime(item.callTime);
  const endDateTime = item.endTime ? formatDateTime(item.endTime) : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalBackdrop, { opacity: backdropOpacityAnim }]}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              padding: 20 * scale,
              borderRadius: 20 * scale,
              opacity: modalOpacityAnim,
              transform: [{ scale: modalScaleAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.modalCloseButton, { top: 16 * scale, right: 16 * scale }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24 * scale} color="#595959" />
          </TouchableOpacity>

          {/* Avatar and Name */}
          <View style={[styles.modalHeader, { marginBottom: 20 * scale }]}>
            {item.astrologerImage ? (
              <Image
                source={{ uri: item.astrologerImage }}
                style={[
                  styles.modalAvatar,
                  { width: 80 * scale, height: 80 * scale, borderRadius: 40 * scale },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.modalAvatarPlaceholder,
                  { width: 80 * scale, height: 80 * scale, borderRadius: 40 * scale },
                ]}
              >
                <Text style={[styles.modalAvatarInitial, { fontSize: 32 * scale }]}>
                  {item.astrologerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.modalAstrologerName, { fontSize: 22 * scale, marginTop: 12 * scale }]}>
              {item.astrologerName}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  paddingHorizontal: 12 * scale,
                  paddingVertical: 4 * scale,
                  borderRadius: 12 * scale,
                  marginTop: 8 * scale,
                  backgroundColor:
                    item.sessionStatus === 'completed'
                      ? 'rgba(40, 167, 69, 0.1)'
                      : item.sessionStatus === 'cancelled'
                      ? 'rgba(220, 53, 69, 0.1)'
                      : 'rgba(255, 193, 7, 0.1)',
                },
              ]}
            >
              {item.sessionStatus === 'completed' ? (
                <CheckCircle2 size={14 * scale} color="#28A745" />
              ) : item.sessionStatus === 'cancelled' ? (
                <XCircle size={14 * scale} color="#DC3545" />
              ) : (
                <Phone size={14 * scale} color="#FFC107" />
              )}
              <Text
                style={[
                  styles.statusText,
                  {
                    fontSize: 12 * scale,
                    marginLeft: 4 * scale,
                    color:
                      item.sessionStatus === 'completed'
                        ? '#28A745'
                        : item.sessionStatus === 'cancelled'
                        ? '#DC3545'
                        : '#FFC107',
                  },
                ]}
              >
                {item.sessionStatus.charAt(0).toUpperCase() + item.sessionStatus.slice(1)}
              </Text>
            </View>
          </View>

          {/* Call Details Card */}
          <View
            style={[
              styles.detailsCard,
              { padding: 16 * scale, borderRadius: 12 * scale },
            ]}
          >
            {/* Date */}
            <View style={[styles.detailRow, { marginBottom: 12 * scale }]}>
              <View style={styles.detailIconContainer}>
                <Calendar size={18 * scale} color="#595959" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Date</Text>
                <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>{date}</Text>
              </View>
            </View>

            {/* Time */}
            <View style={[styles.detailRow, { marginBottom: 12 * scale }]}>
              <View style={styles.detailIconContainer}>
                <Clock size={18 * scale} color="#595959" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Time</Text>
                <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                  {time}
                  {endDateTime ? ` - ${endDateTime.time}` : ''}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View style={[styles.detailRow, { marginBottom: 12 * scale }]}>
              <View style={styles.detailIconContainer}>
                <Phone size={18 * scale} color="#595959" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Duration</Text>
                <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            </View>

            {/* Cost */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <IndianRupee size={18 * scale} color="#2930A6" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Total Cost</Text>
                <Text
                  style={[styles.detailValueBold, { fontSize: 14 * scale, color: '#2930A6' }]}
                >
                  {item.totalCost?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          </View>

          {/* Rate Info */}
          <Text
            style={[
              styles.rateInfoText,
              { fontSize: 11 * scale, marginTop: 12 * scale },
            ]}
          >
            Rate: {item.pricePerMinute}/min
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const CallHistoryScreen = ({ navigation }: any) => {
  const {
    callHistory,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useCallHistoryData();

  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Screen entrance animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;

  // Animation values for list items (staggered entrance)
  const itemAnimations = useRef<Animated.Value[]>([]).current;

  // Search animation
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const { scale } = useResponsiveLayout();

  // Screen entrance animation on mount
  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(screenFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  // Staggered list animation when data loads
  useEffect(() => {
    if (callHistory.length > 0 && isFirstLoad && !loading) {
      // Create animation values for each item
      const newAnimations = callHistory.map(() => new Animated.Value(0));
      itemAnimations.length = 0;
      itemAnimations.push(...newAnimations);

      // Stagger the animations
      const staggeredAnimations = newAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 50, // 50ms stagger
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );

      Animated.stagger(50, staggeredAnimations).start();
      setIsFirstLoad(false);
    }
  }, [callHistory, loading, isFirstLoad]);

  // Set status bar style when screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, [])
  );

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

  // Handle back navigation with animation
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle call item press - show details modal
  const handleCallPress = (item: CallHistoryItem) => {
    setSelectedCall(item);
    setModalVisible(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCall(null), 200);
  };

  // Format date and time for display
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;

    return {
      date: `${day}/${month}/${year}`,
      time: `${hour12}:${minutes} ${ampm}`,
    };
  };

  // Format duration in mm:ss format
  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds === 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Render skeleton loading
  const renderSkeletonLoading = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <CallHistoryItemSkeleton key={index} scale={scale} />
      ))}
    </View>
  );

  // Render call list item with animation
  const renderCallItem = ({ item, index }: { item: CallHistoryItem; index: number }) => {
    const isLast = index === callHistory.length - 1;
    const animValue = itemAnimations[index] || new Animated.Value(1);

    return (
      <AnimatedCallItem
        item={item}
        index={index}
        isLast={isLast}
        scale={scale}
        onPress={handleCallPress}
        formatDateTime={formatDateTime}
        formatDuration={formatDuration}
        getInitials={getInitials}
        animatedValue={animValue}
      />
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Animated.View style={[styles.mainContainer, { opacity: screenFadeAnim }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Yellow Header Section */}
        <Animated.View
          style={[
            styles.yellowHeader,
            {
              paddingTop: 50 * scale,
              transform: [{ translateY: headerSlideAnim }],
            },
          ]}
        >
          {/* Header with Back Button and Title */}
          <View
            style={[
              styles.header,
              {
                paddingHorizontal: 17 * scale,
                paddingTop: 34 * scale,
                marginBottom: 24 * scale,
              },
            ]}
          >
            {/* Left Section - Back Button */}
            <TouchableOpacity
              style={[styles.backButton, { width: 51 * scale, height: 45 * scale }]}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <View style={[styles.backIconContainer, { width: 24 * scale, height: 24 * scale }]}>
                <ChevronLeft size={24 * scale} color="#595959" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Center Section - Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>Call History</Text>
            </View>

            {/* Right Section - Spacer for balance */}
            <View style={{ width: 51 * scale }} />
          </View>

          {/* Search Bar */}
          <Animated.View
            style={[
              styles.searchContainer,
              {
                marginHorizontal: 30 * scale,
                marginBottom: 24 * scale,
                height: 48 * scale,
                borderRadius: 100 * scale,
                paddingHorizontal: 16 * scale,
                borderWidth: searchBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
                borderColor: searchBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#404040', '#2930A6'],
                }),
              },
            ]}
          >
            <View style={styles.searchLeft}>
              <Search size={20 * scale} color={searchFocused ? '#2930A6' : '#404040'} />
              <TextInput
                style={[styles.searchInput, { fontSize: 12 * scale }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor="#404040"
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <SlidersHorizontal size={18 * scale} color="#404040" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Call List or Skeleton */}
        {loading && callHistory.length === 0 ? (
          renderSkeletonLoading()
        ) : (
          <FlatList
            data={callHistory}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            style={styles.callList}
            contentContainerStyle={[styles.callListContent, { paddingBottom: 100 * scale }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2930A6"
                colors={['#2930A6']}
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Phone size={48 * scale} color="#FFCF0D" />
                  <Text style={[styles.emptyText, { fontSize: 16 * scale, marginTop: 16 * scale }]}>
                    No call history yet
                  </Text>
                  <Text
                    style={[styles.emptySubtext, { fontSize: 12 * scale, marginTop: 8 * scale }]}
                  >
                    Start calling astrologers to see your history here
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={3} navigation={navigation} />

        {/* Call Details Modal */}
        <CallDetailsModal
          visible={modalVisible}
          item={selectedCall}
          onClose={handleCloseModal}
          scale={scale}
          formatDateTime={formatDateTime}
          formatDuration={formatDuration}
        />
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  yellowHeader: {
    backgroundColor: '#FFCF0D',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20,
    color: '#595959',
    letterSpacing: -0.3,
    textAlign: 'center',
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
    color: '#404040',
    flex: 1,
    paddingVertical: 8,
    letterSpacing: 0.6,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  callList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  callListContent: {
    paddingTop: 16,
  },
  callItemContainer: {
    width: '100%',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leftSection: {
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(35, 35, 35, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 26,
    color: 'rgba(35, 35, 35, 0.5)',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5D7FF2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  astrologerName: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 20,
    color: '#232323',
    textTransform: 'capitalize',
    lineHeight: 20,
  },
  durationSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  durationLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#000000',
    textTransform: 'capitalize',
    fontWeight: '300',
  },
  durationValue: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#000000',
    fontWeight: '300',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#000000',
    textAlign: 'right',
    fontWeight: '300',
  },
  timeText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#000000',
    textAlign: 'right',
    fontWeight: '300',
  },
  separatorContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(35, 35, 35, 0.05)',
    width: '100%',
  },
  emptyContainer: {
    paddingVertical: 60,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    zIndex: 10,
  },
  modalHeader: {
    alignItems: 'center',
  },
  modalAvatar: {
    borderWidth: 3,
    borderColor: '#FFCF0D',
  },
  modalAvatarPlaceholder: {
    backgroundColor: 'rgba(35, 35, 35, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFCF0D',
  },
  modalAvatarInitial: {
    fontFamily: 'Lexend_600SemiBold',
    color: 'rgba(35, 35, 35, 0.5)',
  },
  modalAstrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#232323',
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Lexend_500Medium',
    textTransform: 'capitalize',
  },
  detailsCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  detailValue: {
    fontFamily: 'Lexend_500Medium',
    color: '#232323',
  },
  detailValueBold: {
    fontFamily: 'Lexend_600SemiBold',
  },
  rateInfoText: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    textAlign: 'center',
  },
});

export default CallHistoryScreen;

/**
 * Chat History Screen
 * Displays list of previous chat sessions with astrologers
 * Features: Skeleton loading, staggered animations, touch feedback
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
  MessageSquare,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useChatHistoryData, ChatHistoryItem } from '../src/hooks/useChatHistoryData';
import { BottomNavBar } from '../components/BottomNavBar';
import { ChatHistoryItemSkeleton } from '../components/skeleton';

// Animated Chat Item Component with touch feedback
const AnimatedChatItem = ({
  item,
  index,
  isLast,
  scale,
  onPress,
  formatTimestamp,
  getInitials,
  animatedValue,
}: {
  item: ChatHistoryItem;
  index: number;
  isLast: boolean;
  scale: number;
  onPress: (item: ChatHistoryItem) => void;
  formatTimestamp: (timestamp: string) => string;
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

  return (
    <Animated.View
      style={[
        styles.chatItemContainer,
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
        style={[styles.chatItem, { paddingVertical: 8 * scale }]}
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
              <View style={[styles.onlineIndicator, {
                width: 10 * scale,
                height: 10 * scale,
                right: 0,
                bottom: 0,
              }]} />
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

        {/* Right Section - Timestamp */}
        <View style={[styles.rightSection, { paddingRight: 17 * scale }]}>
          <Text style={[styles.timestamp, { fontSize: 14 * scale }]}>
            {formatTimestamp(item.lastMessageTime)}
          </Text>
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

const ChatHistoryScreen = ({ navigation }: any) => {
  const {
    chatHistory,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useChatHistoryData();

  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
    if (chatHistory.length > 0 && isFirstLoad && !loading) {
      // Create animation values for each item
      const newAnimations = chatHistory.map(() => new Animated.Value(0));
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
  }, [chatHistory, loading, isFirstLoad]);

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

  // Handle chat item press - navigate to chat history view
  const handleChatPress = (item: ChatHistoryItem) => {
    navigation.navigate('ChatHistoryView', {
      sessionId: item.sessionId,
      astrologerName: item.astrologerName,
      astrologerImage: item.astrologerImage,
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Render skeleton loading
  const renderSkeletonLoading = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <ChatHistoryItemSkeleton key={index} scale={scale} />
      ))}
    </View>
  );

  // Render chat list item with animation
  const renderChatItem = ({ item, index }: { item: ChatHistoryItem; index: number }) => {
    const isLast = index === chatHistory.length - 1;
    const animValue = itemAnimations[index] || new Animated.Value(1);

    return (
      <AnimatedChatItem
        item={item}
        index={index}
        isLast={isLast}
        scale={scale}
        onPress={handleChatPress}
        formatTimestamp={formatTimestamp}
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
          <View style={[styles.header, {
            paddingHorizontal: 17 * scale,
            paddingTop: 34 * scale,
            marginBottom: 24 * scale,
          }]}>
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
              <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>
                Chat History
              </Text>
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

        {/* Chat List or Skeleton */}
        {loading && chatHistory.length === 0 ? (
          renderSkeletonLoading()
        ) : (
          <FlatList
            data={chatHistory}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={[styles.chatListContent, { paddingBottom: 100 * scale }]}
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
                  <MessageSquare size={48 * scale} color="#FFCF0D" />
                  <Text style={[styles.emptyText, { fontSize: 16 * scale, marginTop: 16 * scale }]}>
                    No chat history yet
                  </Text>
                  <Text style={[styles.emptySubtext, { fontSize: 12 * scale, marginTop: 8 * scale }]}>
                    Start chatting with astrologers to see your history here
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Bottom Navigation */}
        <BottomNavBar
          activeTab={1}
          navigation={navigation}
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
  chatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatListContent: {
    paddingTop: 16,
  },
  chatItemContainer: {
    width: '100%',
  },
  chatItem: {
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
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontFamily: 'Lexend_400Regular',
    fontWeight: '300',
    fontSize: 14,
    color: '#000000',
    textAlign: 'right',
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
});

export default ChatHistoryScreen;

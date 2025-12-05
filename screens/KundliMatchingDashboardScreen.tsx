/**
 * KundliMatchingDashboardScreen
 * Displays list of saved Kundli Matching reports
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import { ChevronLeft, Search, ChevronRight, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useSavedMatchings } from '../src/hooks/useKundliStorage';
import { SavedMatching } from '../src/types/kundli';
import { matchingService } from '../src/services/matching.service';

// Get initials from name
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Get score color
const getScoreColor = (score: number): string => {
  if (score >= 25) return '#22C55E';
  if (score >= 18) return '#F59E0B';
  return '#EF4444';
};

// Matching Card Component
const MatchingCard = React.memo(({
  matching,
  index,
  scale,
  onPress,
}: {
  matching: SavedMatching;
  index: number;
  scale: number;
  onPress: () => void;
}) => {
  const score = matching.score || 0;
  const scoreColor = getScoreColor(score);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.matchingCard, {
          padding: 16 * scale,
          borderRadius: 16 * scale,
          marginBottom: 12 * scale,
        }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Avatars with Heart */}
          <View style={styles.avatarsContainer}>
            <View style={[styles.avatarCircle, {
              width: 36 * scale,
              height: 36 * scale,
              borderRadius: 18 * scale,
            }]}>
              <Text style={[styles.avatarText, { fontSize: 14 * scale }]}>
                {getInitials(matching.boy.name)}
              </Text>
            </View>
            <View style={[styles.heartBadge, {
              width: 24 * scale,
              height: 24 * scale,
              borderRadius: 12 * scale,
              marginHorizontal: -8 * scale,
            }]}>
              <Heart size={12 * scale} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <View style={[styles.avatarCircle, styles.avatarPink, {
              width: 36 * scale,
              height: 36 * scale,
              borderRadius: 18 * scale,
            }]}>
              <Text style={[styles.avatarText, { fontSize: 14 * scale }]}>
                {getInitials(matching.girl.name)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <Text style={[styles.cardName, { fontSize: 16 * scale }]} numberOfLines={1}>
              {matching.boy.name} & {matching.girl.name}
            </Text>
            <Text style={[styles.cardDate, { fontSize: 12 * scale }]} numberOfLines={1}>
              Created: {new Date(matching.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Score Badge */}
          {score > 0 && (
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20', paddingHorizontal: 10 * scale, paddingVertical: 4 * scale, borderRadius: 12 * scale }]}>
              <Text style={[styles.scoreText, { fontSize: 12 * scale, color: scoreColor }]}>
                {score}/36
              </Text>
            </View>
          )}

          <ChevronRight size={20 * scale} color="#888888" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Skeleton Card
const SkeletonCard = ({ scale }: { scale: number }) => (
  <View style={[styles.matchingCard, {
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 12 * scale,
  }]}>
    <View style={styles.cardContent}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ShimmerEffect width={36 * scale} height={36 * scale} borderRadius={18 * scale} />
        <ShimmerEffect width={36 * scale} height={36 * scale} borderRadius={18 * scale} />
      </View>
      <View style={[styles.cardDetails, { marginLeft: 12 * scale }]}>
        <ShimmerEffect width={140 * scale} height={18 * scale} borderRadius={4} />
        <View style={{ height: 6 * scale }} />
        <ShimmerEffect width={100 * scale} height={14 * scale} borderRadius={4} />
      </View>
    </View>
  </View>
);

// Empty State
const EmptyState = ({ scale, onCreatePress }: { scale: number; onCreatePress: () => void }) => (
  <Animated.View
    entering={FadeIn.delay(300).duration(400)}
    style={styles.emptyContainer}
  >
    <View style={[styles.emptyIcon, { width: 80 * scale, height: 80 * scale, borderRadius: 40 * scale }]}>
      <Heart size={40 * scale} color="#2930A6" />
    </View>
    <Text style={[styles.emptyTitle, { fontSize: 18 * scale, marginTop: 20 * scale }]}>
      No Matching Reports Yet
    </Text>
    <Text style={[styles.emptySubtitle, { fontSize: 14 * scale }]}>
      Create your first Kundli matching report to check compatibility
    </Text>
    <TouchableOpacity
      style={[styles.emptyButton, {
        paddingVertical: 12 * scale,
        paddingHorizontal: 24 * scale,
        borderRadius: 12 * scale,
        marginTop: 20 * scale,
      }]}
      onPress={onCreatePress}
      activeOpacity={0.8}
    >
      <Text style={[styles.emptyButtonText, { fontSize: 14 * scale }]}>
        Create Report
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

const KundliMatchingDashboardScreen = ({ navigation }: any) => {
  const { scale } = useResponsiveLayout();
  const { matchings: localMatchings, loading: localLoading, searchMatchings, refetch: refetchLocal } = useSavedMatchings();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (covers status bar + header + subtitle area)
  const yellowHeaderHeight = 150 * scale + statusBarHeight;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [apiMatchings, setApiMatchings] = useState<SavedMatching[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Combined loading state
  const loading = localLoading || apiLoading;

  // Fetch matchings from API
  const fetchFromApi = useCallback(async () => {
    try {
      const { data } = await matchingService.list({ limit: 50 });
      setApiMatchings(data);
    } catch (error) {
      console.warn('Failed to fetch matchings from API:', error);
      // Keep using local data if API fails
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  // Merge API and local matchings, removing duplicates by id
  const allMatchings = useMemo(() => {
    const matchingMap = new Map<string, SavedMatching>();

    // Add local matchings first
    localMatchings.forEach(m => matchingMap.set(m.id, m));

    // API matchings take priority (update existing or add new)
    apiMatchings.forEach(m => matchingMap.set(m.id, m));

    // Convert to array and sort by creation date (newest first)
    return Array.from(matchingMap.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [localMatchings, apiMatchings]);

  // Filtered matchings based on search
  const filteredMatchings = useMemo(() => {
    if (!searchQuery.trim()) return allMatchings;
    const query = searchQuery.toLowerCase();
    return allMatchings.filter(m =>
      m.boy.name.toLowerCase().includes(query) ||
      m.girl.name.toLowerCase().includes(query)
    );
  }, [allMatchings, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Refresh both API and local data
    await Promise.all([
      fetchFromApi(),
      refetchLocal(),
    ]);
    setRefreshing(false);
  }, [fetchFromApi, refetchLocal]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleCreateNew = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('KundliMatchingInput');
  }, [navigation]);

  const handleCardPress = useCallback((matching: SavedMatching) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('KundliMatchingReport', { matchingId: matching.id, matchingData: matching });
  }, [navigation]);

  const renderMatchingCard = useCallback(({ item, index }: { item: SavedMatching; index: number }) => (
    <MatchingCard
      matching={item}
      index={index}
      scale={scale}
      onPress={() => handleCardPress(item)}
    />
  ), [scale, handleCardPress]);

  const keyExtractor = useCallback((item: SavedMatching) => item.id, []);

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
              Kundli Matching
            </Text>

            <View style={styles.headerRight} />
          </View>

          {/* Subtitle - On Yellow */}
          <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
            View and manage your saved reports
          </Text>

          {/* White content area */}
          <View style={[styles.whiteContentArea, { marginTop: 16 * scale }]}>
            {/* Search Bar */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={[styles.searchContainer, {
                marginHorizontal: 20 * scale,
                marginTop: 16 * scale,
                height: 48 * scale,
                borderRadius: 24 * scale,
                paddingHorizontal: 16 * scale,
              }]}
            >
              <Search size={20 * scale} color="#888888" />
              <TextInput
                style={[styles.searchInput, { fontSize: 14 * scale, marginLeft: 10 * scale }]}
                placeholder="Search"
                placeholderTextColor="#888888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Animated.View>
          </View>
        </View>

        {/* ===== SCROLLABLE CONTENT ===== */}
        <View style={[styles.content, { paddingHorizontal: 20 * scale }]}>
          {loading ? (
            <View style={{ marginTop: 20 * scale }}>
              {[0, 1, 2].map((index) => (
                <SkeletonCard key={index} scale={scale} />
              ))}
            </View>
          ) : filteredMatchings.length === 0 && !searchQuery ? (
            <EmptyState scale={scale} onCreatePress={handleCreateNew} />
          ) : (
            <FlatList
              data={filteredMatchings}
              renderItem={renderMatchingCard}
              keyExtractor={keyExtractor}
              contentContainerStyle={{ paddingTop: 20 * scale, paddingBottom: 200 * scale }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#FFCF0D"
                  colors={['#FFCF0D', '#2930A6']}
                />
              }
              ListEmptyComponent={
                <Text style={[styles.noResults, { fontSize: 14 * scale }]}>
                  No results found for "{searchQuery}"
                </Text>
              }
            />
          )}
        </View>

        {/* Create New Button */}
        {!loading && (allMatchings.length > 0 || searchQuery) && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={[styles.createButtonContainer, { paddingHorizontal: 20 * scale }]}
          >
            <TouchableOpacity
              style={[styles.createButton, {
                height: 56 * scale,
                borderRadius: 28 * scale,
              }]}
              onPress={handleCreateNew}
              activeOpacity={0.8}
            >
              <Text style={[styles.createButtonText, { fontSize: 16 * scale }]}>
                Create New Report
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom Navigation */}
        <BottomNavBar navigation={navigation} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  matchingCard: {
    backgroundColor: '#FFFFFF',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPink: {
    backgroundColor: '#E91E8C',
  },
  avatarText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  heartBadge: {
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  cardDate: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  scoreBadge: {
    marginRight: 8,
  },
  scoreText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    backgroundColor: 'rgba(41, 48, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#2930A6',
  },
  emptyButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  noResults: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 40,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  createButton: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default KundliMatchingDashboardScreen;

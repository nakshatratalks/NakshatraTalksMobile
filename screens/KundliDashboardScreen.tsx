/**
 * KundliDashboardScreen
 * Displays list of saved Kundli reports with search and create new option
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  RefreshControl,
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
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Search, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useSavedKundlis } from '../src/hooks/useKundliStorage';
import { SavedKundli } from '../src/types/kundli';

// Format date for display
const formatDate = (dateString: string, timeString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}, ${timeString}`;
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Kundli Card Component
const KundliCard = React.memo(({
  kundli,
  index,
  scale,
  onPress,
}: {
  kundli: SavedKundli;
  index: number;
  scale: number;
  onPress: () => void;
}) => {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.kundliCard, {
          padding: 16 * scale,
          borderRadius: 16 * scale,
          marginBottom: 12 * scale,
        }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Avatar Circle */}
          <View style={[styles.avatarCircle, {
            width: 44 * scale,
            height: 44 * scale,
            borderRadius: 22 * scale,
          }]}>
            <Text style={[styles.avatarText, { fontSize: 16 * scale }]}>
              {getInitials(kundli.name)}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <Text style={[styles.cardName, { fontSize: 16 * scale }]} numberOfLines={1}>
              {kundli.name}
            </Text>
            <Text style={[styles.cardDate, { fontSize: 12 * scale }]} numberOfLines={1}>
              {formatDate(kundli.dateOfBirth, kundli.timeOfBirth)}
            </Text>
            <Text style={[styles.cardLocation, { fontSize: 12 * scale }]} numberOfLines={1}>
              {kundli.birthPlace.name}
            </Text>
          </View>

          {/* Chevron */}
          <ChevronRight size={20 * scale} color="#888888" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Skeleton Card Component
const SkeletonCard = ({ scale }: { scale: number }) => (
  <View style={[styles.kundliCard, {
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 12 * scale,
  }]}>
    <View style={styles.cardContent}>
      <ShimmerEffect
        width={44 * scale}
        height={44 * scale}
        borderRadius={22 * scale}
      />
      <View style={[styles.cardDetails, { marginLeft: 12 * scale }]}>
        <ShimmerEffect width={120 * scale} height={18 * scale} borderRadius={4} />
        <View style={{ height: 6 * scale }} />
        <ShimmerEffect width={180 * scale} height={14 * scale} borderRadius={4} />
        <View style={{ height: 4 * scale }} />
        <ShimmerEffect width={140 * scale} height={14 * scale} borderRadius={4} />
      </View>
    </View>
  </View>
);

// Empty State Component
const EmptyState = ({ scale, onCreatePress }: { scale: number; onCreatePress: () => void }) => (
  <Animated.View
    entering={FadeIn.delay(300).duration(400)}
    style={styles.emptyContainer}
  >
    <Text style={[styles.emptyTitle, { fontSize: 18 * scale }]}>
      No Kundli Reports Yet
    </Text>
    <Text style={[styles.emptySubtitle, { fontSize: 14 * scale }]}>
      Create your first Kundli report to see your birth chart and predictions
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
        Create Kundli
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

const KundliDashboardScreen = ({ navigation }: any) => {
  const { scale } = useResponsiveLayout();
  const { kundlis, loading, searchKundlis, refetch } = useSavedKundlis();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (covers status bar + header + subtitle area)
  const yellowHeaderHeight = 150 * scale + statusBarHeight;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filtered kundlis based on search
  const filteredKundlis = useMemo(() => {
    return searchKundlis(searchQuery);
  }, [searchKundlis, searchQuery]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle create new
  const handleCreateNew = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('KundliGeneration');
  }, [navigation]);

  // Handle card press
  const handleCardPress = useCallback((kundli: SavedKundli) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('KundliReport', { kundliId: kundli.id, kundliData: kundli });
  }, [navigation]);

  // Render kundli card
  const renderKundliCard = useCallback(({ item, index }: { item: SavedKundli; index: number }) => (
    <KundliCard
      kundli={item}
      index={index}
      scale={scale}
      onPress={() => handleCardPress(item)}
    />
  ), [scale, handleCardPress]);

  // Key extractor
  const keyExtractor = useCallback((item: SavedKundli) => item.id, []);

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
              Kundli Reports
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
            // Loading Skeletons
            <View style={{ marginTop: 16 * scale }}>
              {[0, 1, 2].map((index) => (
                <SkeletonCard key={index} scale={scale} />
              ))}
            </View>
          ) : filteredKundlis.length === 0 && !searchQuery ? (
            // Empty State
            <EmptyState scale={scale} onCreatePress={handleCreateNew} />
          ) : (
            // Kundli List
            <FlatList
              data={filteredKundlis}
              renderItem={renderKundliCard}
              keyExtractor={keyExtractor}
              contentContainerStyle={{ paddingTop: 16 * scale, paddingBottom: 200 * scale }}
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
                <Text style={[styles.noResults, { fontSize: 14 * scale }]}>
                  No results found for "{searchQuery}"
                </Text>
              }
            />
          )}
        </View>

        {/* Create New Button */}
        {!loading && (kundlis.length > 0 || searchQuery) && (
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
                Create New Kundli
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
  kundliCard: {
    backgroundColor: '#FFFFFF',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#595959',
    marginTop: 2,
  },
  cardLocation: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
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

export default KundliDashboardScreen;

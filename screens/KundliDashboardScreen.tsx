/**
 * KundliDashboardScreen
 * Displays list of saved Kundli reports with search and create new option
 *
 * Features:
 * - Long-press on card for Share/Delete options
 * - Share generates styled image card
 * - Delete with confirmation
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  ActionSheetIOS,
  ActivityIndicator,
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
import { ChevronLeft, Search, ChevronRight, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useSavedKundlis } from '../src/hooks/useKundliStorage';
import { SavedKundli, KundliReport } from '../src/types/kundli';
import { kundliService } from '../src/services/kundli.service';
import NotificationService from '../src/utils/notificationService';

// Format date for display
const formatDate = (dateString: string, timeString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}, ${timeString}`;
};

// Format date for share card (shorter)
const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Format time for share card (12-hour format)
const formatTime12Hour = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
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
  onLongPress,
}: {
  kundli: SavedKundli;
  index: number;
  scale: number;
  onPress: () => void;
  onLongPress: () => void;
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
        onLongPress={onLongPress}
        delayLongPress={500}
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

// Shareable Kundli Card Component (for image capture)
const ShareableKundliCard = React.forwardRef<View, {
  kundli: SavedKundli;
  reportData: KundliReport | null;
}>(({ kundli, reportData }, ref) => {
  const basicInfo = reportData?.basicInfo;

  return (
    <View
      ref={ref}
      style={shareStyles.container}
      collapsable={false}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={shareStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={shareStyles.header}>
          <Star size={20} color="#FFCF0D" fill="#FFCF0D" />
          <Text style={shareStyles.headerText}>NakshatraTalks</Text>
        </View>

        {/* Divider */}
        <View style={shareStyles.divider} />

        {/* Avatar */}
        <View style={shareStyles.avatarContainer}>
          <View style={shareStyles.avatar}>
            <Text style={shareStyles.avatarText}>{getInitials(kundli.name)}</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={shareStyles.name}>{kundli.name.toUpperCase()}</Text>

        {/* Birth Details Card */}
        <View style={shareStyles.infoCard}>
          <View style={shareStyles.infoRow}>
            <Text style={shareStyles.infoLabel}>Date of Birth</Text>
            <Text style={shareStyles.infoValue}>{formatDateShort(kundli.dateOfBirth)}</Text>
          </View>
          <View style={shareStyles.infoRow}>
            <Text style={shareStyles.infoLabel}>Time of Birth</Text>
            <Text style={shareStyles.infoValue}>{formatTime12Hour(kundli.timeOfBirth)}</Text>
          </View>
          <View style={shareStyles.infoRow}>
            <Text style={shareStyles.infoLabel}>Birth Place</Text>
            <Text style={shareStyles.infoValue} numberOfLines={1}>
              {kundli.birthPlace.name.split(',')[0]}
            </Text>
          </View>
        </View>

        {/* Astrological Details Card */}
        {basicInfo && (
          <View style={shareStyles.infoCard}>
            <View style={shareStyles.infoRow}>
              <Text style={shareStyles.infoLabel}>Nakshatra</Text>
              <Text style={shareStyles.infoValue}>
                {basicInfo.nakshatra?.name || 'N/A'}
                {basicInfo.nakshatra?.pada ? ` (Pada ${basicInfo.nakshatra.pada})` : ''}
              </Text>
            </View>
            <View style={shareStyles.infoRow}>
              <Text style={shareStyles.infoLabel}>Rashi</Text>
              <Text style={shareStyles.infoValue}>
                {basicInfo.rasi?.name || 'N/A'}
              </Text>
            </View>
            <View style={shareStyles.infoRow}>
              <Text style={shareStyles.infoLabel}>Lagna</Text>
              <Text style={shareStyles.infoValue}>
                {basicInfo.lagna?.name || 'N/A'}
              </Text>
            </View>
            {basicInfo.sunSign && (
              <View style={shareStyles.infoRow}>
                <Text style={shareStyles.infoLabel}>Sun Sign</Text>
                <Text style={shareStyles.infoValue}>{basicInfo.sunSign}</Text>
              </View>
            )}
            {basicInfo.moonSign && (
              <View style={shareStyles.infoRow}>
                <Text style={shareStyles.infoLabel}>Moon Sign</Text>
                <Text style={shareStyles.infoValue}>{basicInfo.moonSign}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={shareStyles.footer}>
          <Text style={shareStyles.footerText}>Generated via NakshatraTalks</Text>
        </View>
      </LinearGradient>
    </View>
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
  const { kundlis: localKundlis, loading: localLoading, searchKundlis, refetch: refetchLocal } = useSavedKundlis();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (covers status bar + header + subtitle area)
  const yellowHeaderHeight = 150 * scale + statusBarHeight;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [apiKundlis, setApiKundlis] = useState<SavedKundli[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  // State for share/delete functionality
  const [selectedKundli, setSelectedKundli] = useState<SavedKundli | null>(null);
  const [shareReportData, setShareReportData] = useState<KundliReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Ref for shareable card
  const shareCardRef = useRef<View>(null);

  // Combined loading state
  const loading = localLoading || apiLoading;

  // Fetch kundlis from API
  const fetchFromApi = useCallback(async () => {
    try {
      const { data } = await kundliService.list({ limit: 50 });
      setApiKundlis(data);
    } catch (error) {
      console.warn('Failed to fetch kundlis from API:', error);
      // Keep using local data if API fails
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  // Merge API and local kundlis, removing duplicates by id
  const allKundlis = useMemo(() => {
    const kundliMap = new Map<string, SavedKundli>();

    // Add local kundlis first
    localKundlis.forEach(k => kundliMap.set(k.id, k));

    // API kundlis take priority (update existing or add new)
    apiKundlis.forEach(k => kundliMap.set(k.id, k));

    // Convert to array and sort by creation date (newest first)
    return Array.from(kundliMap.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [localKundlis, apiKundlis]);

  // Filtered kundlis based on search
  const filteredKundlis = useMemo(() => {
    if (!searchQuery.trim()) return allKundlis;
    const query = searchQuery.toLowerCase();
    return allKundlis.filter(k =>
      k.name.toLowerCase().includes(query) ||
      k.birthPlace.name.toLowerCase().includes(query)
    );
  }, [allKundlis, searchQuery]);

  // Handle refresh
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

  // Show action sheet for long press
  const showActionSheet = useCallback((kundli: SavedKundli) => {
    if (isProcessing || refreshing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedKundli(kundli);

    if (Platform.OS === 'ios') {
      const options = ['Share', 'Delete', 'Cancel'];
      const destructiveButtonIndex = 1;
      const cancelButtonIndex = 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: kundli.name,
          message: 'Choose an action',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleShare(kundli);
          } else if (buttonIndex === 1) {
            handleDeleteConfirmation(kundli);
          }
        }
      );
    } else {
      // Android: Use custom action sheet
      NotificationService.actionSheet({
        title: kundli.name,
        message: 'Choose an action',
        options: [
          { text: 'Share', onPress: () => handleShare(kundli) },
          { text: 'Delete', onPress: () => handleDeleteConfirmation(kundli), destructive: true },
        ],
        cancelText: 'Cancel',
      });
    }
  }, [isProcessing, refreshing]);

  // Handle delete confirmation
  const handleDeleteConfirmation = useCallback((kundli: SavedKundli) => {
    NotificationService.confirm({
      title: 'Delete Kundli',
      message: `Are you sure you want to delete "${kundli.name}"'s Kundli? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: () => handleDelete(kundli.id),
    });
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (kundliId: string) => {
    setIsProcessing(true);

    try {
      await kundliService.delete(kundliId);

      // Remove from local state
      setApiKundlis(prev => prev.filter(k => k.id !== kundliId));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      NotificationService.success('Kundli deleted successfully');

      // Also refresh local storage
      refetchLocal();
    } catch (error: any) {
      console.error('Failed to delete kundli:', error);

      if (error.message?.includes('not found') || error.message?.includes('404')) {
        NotificationService.warning('This Kundli was already deleted.', 'Not Found');
        // Refresh the list
        handleRefresh();
      } else {
        NotificationService.error('Unable to delete. Please check your connection and try again.', 'Error');
      }
    } finally {
      setIsProcessing(false);
      setSelectedKundli(null);
    }
  }, [refetchLocal, handleRefresh]);

  // Handle share
  const handleShare = useCallback(async (kundli: SavedKundli) => {
    setIsProcessing(true);
    setIsLoadingReport(true);
    setSelectedKundli(kundli);

    try {
      // Try to fetch report data for astrological details (graceful fallback if fails)
      let reportData: KundliReport | null = null;
      try {
        reportData = await kundliService.getReport(kundli.id);
      } catch (reportError) {
        console.warn('Could not fetch report data, sharing with basic info only:', reportError);
        // Continue without report data - card will show basic info only
      }

      setShareReportData(reportData);
      setIsLoadingReport(false);

      // Wait for the shareable card to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the card as an image
      if (shareCardRef.current) {
        const uri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();

        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${kundli.name}'s Kundli`,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          NotificationService.warning('Sharing is not available on this device.', 'Sharing Unavailable');
        }
      }
    } catch (error: any) {
      console.error('Failed to share kundli:', error);
      NotificationService.error('Unable to generate image. Please try again.', 'Share Failed');
    } finally {
      setIsProcessing(false);
      setIsLoadingReport(false);
      setSelectedKundli(null);
      setShareReportData(null);
    }
  }, []);

  // Handle long press on card
  const handleLongPress = useCallback((kundli: SavedKundli) => {
    showActionSheet(kundli);
  }, [showActionSheet]);

  // Render kundli card
  const renderKundliCard = useCallback(({ item, index }: { item: SavedKundli; index: number }) => (
    <KundliCard
      kundli={item}
      index={index}
      scale={scale}
      onPress={() => handleCardPress(item)}
      onLongPress={() => handleLongPress(item)}
    />
  ), [scale, handleCardPress, handleLongPress]);

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
        {!loading && (allKundlis.length > 0 || searchQuery) && (
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

      {/* Hidden Shareable Card (for image capture) */}
      {selectedKundli && (
        <View style={shareStyles.hiddenContainer}>
          <ShareableKundliCard
            ref={shareCardRef}
            kundli={selectedKundli}
            reportData={shareReportData}
          />
        </View>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2930A6" />
            <Text style={styles.loadingText}>
              {isLoadingReport ? 'Fetching data...' : 'Processing...'}
            </Text>
          </View>
        </View>
      )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#333333',
    marginTop: 12,
  },
});

// Styles for shareable card
const shareStyles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000,
    left: -1000,
  },
  container: {
    width: 400,
    height: 520,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFCF0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 24,
    color: '#1a1a2e',
  },
  name: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    maxWidth: '55%',
    textAlign: 'right',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default KundliDashboardScreen;

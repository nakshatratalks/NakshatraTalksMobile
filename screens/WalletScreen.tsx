/**
 * WalletScreen Component
 * Displays wallet balance, transaction history, and navigation to recharge
 *
 * Design: Premium UI matching app's design language
 * Features:
 * - Balance card with recharge button
 * - Filter tabs (All / Funds Added / Money Spent)
 * - Transaction history list with pull-to-refresh
 * - Bottom navigation bar integration
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  IndianRupee,
  MessageSquare,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Wallet,
} from 'lucide-react-native';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';

import { useWalletData, TransactionFilter } from '../src/hooks/useWalletData';
import { useResponsiveLayout } from '../src/utils/responsive';
import { Transaction } from '../src/types/api.types';
import { BottomNavBar } from '../components/BottomNavBar';
import { TransactionItemSkeleton } from '../components/skeleton';

const { width: screenWidth } = Dimensions.get('window');

// Filter tab labels
const FILTER_TABS: { key: TransactionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recharge', label: 'Funds Added' },
  { key: 'debit', label: 'Money Spent' },
];

interface WalletScreenProps {
  navigation: any;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { scale } = useResponsiveLayout();
  const [refreshing, setRefreshing] = useState(false);

  const {
    balance,
    transactions,
    activeFilter,
    setActiveFilter,
    isSummaryLoading,
    isTransactionsLoading,
    refetch,
    loadMoreTransactions,
  } = useWalletData();

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Navigate to recharge screen
  const handleRecharge = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Recharge');
  }, [navigation]);

  // Navigate back
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Format date for transaction
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string, sessionType?: string) => {
    const iconSize = 18 * scale;

    if (type === 'recharge') {
      return (
        <View style={[styles.txIconContainer, styles.txIconCredit]}>
          <ArrowUpRight size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      );
    }
    if (type === 'refund') {
      return (
        <View style={[styles.txIconContainer, styles.txIconRefund]}>
          <RefreshCw size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      );
    }
    // Debit - show chat or call icon
    return (
      <View style={[styles.txIconContainer, styles.txIconDebit]}>
        {sessionType === 'call' ? (
          <Phone size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
        ) : (
          <MessageSquare size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
        )}
      </View>
    );
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'recharge' || item.type === 'refund';
    const displayAmount = Math.abs(item.amount);
    const sessionType = item.sessionId?.includes('call') ? 'call' : 'chat';

    return (
      <View style={styles.transactionCard}>
        {getTransactionIcon(item.type, sessionType)}

        <View style={styles.txContent}>
          <Text style={[styles.txTitle, { fontSize: 14 * scale }]} numberOfLines={1}>
            {item.type === 'recharge' ? 'Wallet Top-up' :
             item.type === 'refund' ? 'Refund' :
             item.astrologerName || item.description}
          </Text>
          <Text style={[styles.txDate, { fontSize: 11 * scale }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={styles.txRight}>
          <View style={styles.txAmountRow}>
            <Text style={[
              styles.txAmount,
              { fontSize: 15 * scale },
              isCredit ? styles.txAmountCredit : styles.txAmountDebit
            ]}>
              {isCredit ? '+' : '-'} ₹{displayAmount}
            </Text>
          </View>
          <View style={styles.txTypeIndicator}>
            {item.type === 'debit' && (
              sessionType === 'call' ? (
                <Phone size={12 * scale} color="#888888" />
              ) : (
                <MessageSquare size={12 * scale} color="#888888" />
              )
            )}
            {item.type === 'recharge' && (
              <Wallet size={12 * scale} color="#888888" />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Filter Tab Component
  const FilterTab = ({ tab, isActive, isFirst, isLast }: {
    tab: typeof FILTER_TABS[0];
    isActive: boolean;
    isFirst: boolean;
    isLast: boolean;
  }) => {
    const scaleValue = useSharedValue(1);

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scaleValue.value = withSpring(0.96, {}, () => {
        scaleValue.value = withSpring(1);
      });
      setActiveFilter(tab.key);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.filterTabWrapper}
      >
        <Animated.View
          style={[
            styles.filterTab,
            animatedStyle,
            isActive && styles.filterTabActive,
            isFirst && styles.filterTabFirst,
            isLast && styles.filterTabLast,
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { fontSize: 13 * scale },
              isActive && styles.filterTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Yellow Header Background with rounded bottom */}
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        {/* Header Row */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={26 * scale} color="#333333" strokeWidth={2} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>My Wallet</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { fontSize: 13 * scale }]}>Available Balance</Text>
            {isSummaryLoading ? (
              <View style={[styles.balanceSkeleton, { width: 80 * scale, height: 24 * scale }]} />
            ) : (
              <View style={styles.balanceRow}>
                <IndianRupee size={20 * scale} color="#2930A6" strokeWidth={2.5} />
                <Text style={[styles.balanceAmount, { fontSize: 22 * scale }]}>
                  {balance.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.rechargeButton, { paddingHorizontal: 24 * scale, paddingVertical: 10 * scale }]}
            onPress={handleRecharge}
            activeOpacity={0.85}
          >
            <Text style={[styles.rechargeButtonText, { fontSize: 15 * scale }]}>Recharge</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {FILTER_TABS.map((tab, index) => (
            <FilterTab
              key={tab.key}
              tab={tab}
              isActive={activeFilter === tab.key}
              isFirst={index === 0}
              isLast={index === FILTER_TABS.length - 1}
            />
          ))}
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 100 * scale },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2930A6"
            colors={['#2930A6', '#FFCF0D']}
          />
        }
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isTransactionsLoading && transactions.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TransactionItemSkeleton key={i} scale={scale} />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isTransactionsLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Wallet size={48 * scale} color="#CCCCCC" />
              </View>
              <Text style={[styles.emptyText, { fontSize: 17 * scale }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtext, { fontSize: 13 * scale }]}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom Navigation */}
      <BottomNavBar navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    backgroundColor: '#FFCF0D',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#333333',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontFamily: 'Lexend_500Medium',
    color: '#555555',
    marginBottom: 4,
  },
  balanceSkeleton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontFamily: 'Lexend_700Bold',
    color: '#2930A6',
    marginLeft: 4,
  },
  rechargeButton: {
    backgroundColor: '#2930A6',
    borderRadius: 12,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rechargeButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterTabWrapper: {
    flex: 1,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  filterTabFirst: {},
  filterTabLast: {},
  filterTabActive: {
    backgroundColor: '#2930A6',
  },
  filterTabText: {
    fontFamily: 'Lexend_500Medium',
    color: '#666666',
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  skeletonContainer: {
    paddingTop: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  txIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconCredit: {
    backgroundColor: '#22C55E',
  },
  txIconDebit: {
    backgroundColor: '#2930A6',
  },
  txIconRefund: {
    backgroundColor: '#F59E0B',
  },
  txContent: {
    flex: 1,
    marginLeft: 14,
  },
  txTitle: {
    fontFamily: 'Lexend_500Medium',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  txDate: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAmount: {
    fontFamily: 'Lexend_600SemiBold',
  },
  txAmountCredit: {
    color: '#22C55E',
  },
  txAmountDebit: {
    color: '#EF4444',
  },
  txTypeIndicator: {
    marginTop: 4,
    height: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#444444',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    textAlign: 'center',
  },
});

export default WalletScreen;

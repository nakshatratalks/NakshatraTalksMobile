/**
 * Wallet Screen Skeleton Components
 * Loading placeholders for wallet data
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ShimmerEffect } from './ShimmerEffect';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  scale?: number;
}

/**
 * Balance Card Skeleton
 */
export const WalletBalanceSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={[styles.balanceCard, { height: 120 * scale }]}>
      {/* Balance Label */}
      <ShimmerEffect
        style={[styles.shimmer, { width: 100 * scale, height: 14 * scale, borderRadius: 7 * scale }]}
      />
      {/* Balance Amount */}
      <ShimmerEffect
        style={[
          styles.shimmer,
          { width: 150 * scale, height: 36 * scale, borderRadius: 8 * scale, marginTop: 8 * scale },
        ]}
      />
      {/* Pending text */}
      <ShimmerEffect
        style={[
          styles.shimmer,
          { width: 120 * scale, height: 12 * scale, borderRadius: 6 * scale, marginTop: 8 * scale },
        ]}
      />
    </View>
  );
};

/**
 * Stats Row Skeleton
 */
export const WalletStatsSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={[styles.statsRow, { marginHorizontal: 20 * scale }]}>
      <View style={[styles.statCard, { height: 70 * scale, borderRadius: 12 * scale }]}>
        <ShimmerEffect
          style={[styles.shimmer, { width: 80 * scale, height: 12 * scale, borderRadius: 6 * scale }]}
        />
        <ShimmerEffect
          style={[
            styles.shimmer,
            { width: 60 * scale, height: 20 * scale, borderRadius: 6 * scale, marginTop: 8 * scale },
          ]}
        />
      </View>
      <View style={[styles.statCard, { height: 70 * scale, borderRadius: 12 * scale }]}>
        <ShimmerEffect
          style={[styles.shimmer, { width: 100 * scale, height: 12 * scale, borderRadius: 6 * scale }]}
        />
        <ShimmerEffect
          style={[
            styles.shimmer,
            { width: 60 * scale, height: 20 * scale, borderRadius: 6 * scale, marginTop: 8 * scale },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Filter Tabs Skeleton
 */
export const FilterTabsSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={[styles.filterContainer, { marginHorizontal: 20 * scale }]}>
      <ShimmerEffect
        style={[styles.filterTab, { width: (screenWidth - 40) / 3 - 4, height: 40 * scale, borderRadius: 20 * scale }]}
      />
      <ShimmerEffect
        style={[styles.filterTab, { width: (screenWidth - 40) / 3 - 4, height: 40 * scale, borderRadius: 20 * scale }]}
      />
      <ShimmerEffect
        style={[styles.filterTab, { width: (screenWidth - 40) / 3 - 4, height: 40 * scale, borderRadius: 20 * scale }]}
      />
    </View>
  );
};

/**
 * Transaction Item Skeleton
 */
export const TransactionItemSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={[styles.transactionItem, { height: 72 * scale, borderRadius: 12 * scale }]}>
      {/* Icon */}
      <ShimmerEffect
        style={[styles.shimmer, { width: 40 * scale, height: 40 * scale, borderRadius: 12 * scale }]}
      />
      {/* Content */}
      <View style={styles.transactionContent}>
        <ShimmerEffect
          style={[styles.shimmer, { width: 100 * scale, height: 14 * scale, borderRadius: 7 * scale }]}
        />
        <ShimmerEffect
          style={[
            styles.shimmer,
            { width: 80 * scale, height: 12 * scale, borderRadius: 6 * scale, marginTop: 4 * scale },
          ]}
        />
      </View>
      {/* Amount */}
      <View style={styles.transactionRight}>
        <ShimmerEffect
          style={[styles.shimmer, { width: 50 * scale, height: 16 * scale, borderRadius: 8 * scale }]}
        />
        <ShimmerEffect
          style={[
            styles.shimmer,
            { width: 40 * scale, height: 10 * scale, borderRadius: 5 * scale, marginTop: 4 * scale },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Full Wallet Screen Skeleton
 */
export const WalletScreenSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={styles.container}>
      <WalletBalanceSkeleton scale={scale} />
      <WalletStatsSkeleton scale={scale} />
      <FilterTabsSkeleton scale={scale} />
      <View style={{ marginTop: 16 * scale }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TransactionItemSkeleton key={i} scale={scale} />
        ))}
      </View>
    </View>
  );
};

/**
 * Recharge Options Skeleton
 */
export const RechargeOptionsSkeleton: React.FC<SkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={styles.rechargeGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ShimmerEffect
          key={i}
          style={[
            styles.rechargeOption,
            {
              width: (screenWidth - 60) / 3,
              height: 80 * scale,
              borderRadius: 12 * scale,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shimmer: {
    backgroundColor: '#E5E5E5',
  },
  balanceCard: {
    backgroundColor: '#2930A6',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  filterTab: {
    backgroundColor: '#E5E5E5',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  rechargeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 16,
  },
  rechargeOption: {
    backgroundColor: '#E5E5E5',
  },
});

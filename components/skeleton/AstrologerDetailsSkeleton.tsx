import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, StatusBar, Platform } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonCircle } from './SkeletonCircle';
import { SkeletonText } from './SkeletonText';

// Get status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface AstrologerDetailsSkeletonProps {
  scale: number;
}

export const AstrologerDetailsSkeleton: React.FC<AstrologerDetailsSkeletonProps> = ({
  scale,
}) => {
  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFCF0D"
        translucent={false}
      />

      {/* Header Skeleton - extending to status bar */}
      <View style={[styles.header, { height: (200 + STATUS_BAR_HEIGHT) * scale, paddingTop: STATUS_BAR_HEIGHT * scale }]}>
        <SkeletonBox
          width={24 * scale}
          height={24 * scale}
          borderRadius={4}
          style={{ position: 'absolute', top: 58 * scale, left: 18 * scale }}
        />
        <SkeletonText
          width={160 * scale}
          height={18 * scale}
          style={{ position: 'absolute', top: 58 * scale, left: 53 * scale }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 110 * scale }]}
      >
        {/* Profile Card Skeleton */}
        <View
          style={[
            styles.profileCard,
            {
              marginHorizontal: 16 * scale,
              marginBottom: 20 * scale,
              paddingHorizontal: 16 * scale,
              paddingVertical: 16 * scale,
            },
          ]}
        >
          {/* Top Row: Image and Info */}
          <View style={{ flexDirection: 'row', marginBottom: 12 * scale }}>
            {/* Profile Image Skeleton */}
            <SkeletonCircle size={80 * scale} />

            {/* Info Section Skeleton */}
            <View style={{ flex: 1, marginLeft: 12 * scale, justifyContent: 'center' }}>
              {/* Name */}
              <SkeletonText
                width={140 * scale}
                height={18 * scale}
                style={{ marginBottom: 6 * scale }}
              />
              {/* Specialization */}
              <SkeletonText
                width={180 * scale}
                height={11 * scale}
                style={{ marginBottom: 4 * scale }}
              />
              {/* Languages */}
              <SkeletonText
                width={120 * scale}
                height={10 * scale}
                style={{ marginBottom: 4 * scale }}
              />
              {/* Experience */}
              <SkeletonText
                width={90 * scale}
                height={10 * scale}
              />
            </View>
          </View>

          {/* Price Skeleton */}
          <SkeletonText
            width={70 * scale}
            height={12 * scale}
            style={{ marginBottom: 8 * scale }}
          />

          {/* Rating and Orders Skeleton */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 * scale }}>
            <View style={{ flexDirection: 'row', gap: 4 * scale }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonBox
                  key={i}
                  width={16 * scale}
                  height={16 * scale}
                  borderRadius={2}
                />
              ))}
            </View>
            <SkeletonText
              width={60 * scale}
              height={10 * scale}
              style={{ marginLeft: 8 * scale }}
            />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { marginBottom: 16 * scale }]} />

          {/* Action Buttons Skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <SkeletonBox width={40 * scale} height={24 * scale} borderRadius={4} />
            <View style={[styles.verticalDivider, { height: 20 * scale }]} />
            <SkeletonBox width={40 * scale} height={24 * scale} borderRadius={4} />
          </View>
        </View>

        {/* Bio Section Skeleton */}
        <View
          style={[
            styles.bioSection,
            {
              marginHorizontal: 20 * scale,
              marginBottom: 20 * scale,
              padding: 16 * scale,
            },
          ]}
        >
          <SkeletonText width="100%" height={14 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonText width="100%" height={14 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonText width="100%" height={14 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonText width="100%" height={14 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonText width="80%" height={14 * scale} />
        </View>

        {/* Photo Gallery Skeleton */}
        <View style={{ marginBottom: 20 * scale }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 * scale }}
          >
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox
                key={i}
                width={114 * scale}
                height={164 * scale}
                borderRadius={20}
                style={{ marginHorizontal: 5 * scale }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Reviews Section Skeleton */}
        <View style={{ paddingHorizontal: 16 * scale, marginBottom: 30 * scale }}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.reviewCard,
                {
                  marginBottom: 12 * scale,
                  padding: 16 * scale,
                },
              ]}
            >
              {/* Reviewer Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 * scale, gap: 15 }}>
                <SkeletonCircle size={48 * scale} />
                <SkeletonText width={100 * scale} height={18 * scale} />
              </View>

              {/* Rating */}
              <View style={{ flexDirection: 'row', gap: 6 * scale, marginBottom: 12 * scale }}>
                {[1, 2, 3, 4, 5].map((j) => (
                  <SkeletonBox
                    key={j}
                    width={16 * scale}
                    height={16 * scale}
                    borderRadius={2}
                  />
                ))}
              </View>

              {/* Review Text */}
              <View style={{ marginBottom: 12 * scale }}>
                <SkeletonText width="100%" height={12 * scale} style={{ marginBottom: 6 * scale }} />
                <SkeletonText width="100%" height={12 * scale} style={{ marginBottom: 6 * scale }} />
                <SkeletonText width="60%" height={12 * scale} />
              </View>

              {/* Date */}
              <SkeletonText width={120 * scale} height={12 * scale} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFCF0D',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: 0,
    elevation: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 50,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#E1E1E1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 50,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bioSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.09)',
    borderRadius: 16,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 207, 13, 0.3)',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

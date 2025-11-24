import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Phone,
  IndianRupee,
  CheckCircle,
  BadgeCheck,
} from 'lucide-react-native';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useAstrologerDetails } from '../src/hooks/useAstrologerDetails';
import { AstrologerDetailsSkeleton } from '../components/skeleton/AstrologerDetailsSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Get status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface AstrologerDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      astrologerId: string;
    };
  };
}

export default function AstrologerDetailsScreen({
  navigation,
  route,
}: AstrologerDetailsScreenProps) {
  const { astrologerId } = route.params;
  const { scale } = useResponsiveLayout();
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State
  const [bioExpanded, setBioExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch astrologer details
  const { astrologer, loading, error, refetch } = useAstrologerDetails(astrologerId);

  // Entrance animation
  useEffect(() => {
    if (fontsLoaded && !loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded, loading]);

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

  const handleStartChat = () => {
    // TODO: Navigate to chat interface
    console.log('Start chat with:', astrologerId);
  };

  const handleStartCall = () => {
    // TODO: Navigate to call interface
    console.log('Start call with:', astrologerId);
  };

  const toggleBio = () => {
    setBioExpanded(!bioExpanded);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16 * scale}
          color={i <= rating ? '#FFCF0D' : '#FFCF0D'}
          fill={i <= rating ? '#FFCF0D' : 'none'}
        />
      );
    }
    return stars;
  };

  const renderReviewStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16 * scale}
          color={i <= rating ? '#2930A6' : '#2930A6'}
          fill={i <= rating ? '#2930A6' : 'none'}
        />
      );
    }
    return stars;
  };

  if (!fontsLoaded || (loading && !astrologer)) {
    return <AstrologerDetailsSkeleton scale={scale} />;
  }

  if (error || !astrologer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { fontSize: 16 * scale }]}>
          {error || 'Failed to load astrologer details'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { paddingHorizontal: 20 * scale, paddingVertical: 10 * scale }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryButtonText, { fontSize: 14 * scale }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bioText = astrologer.description || astrologer.bio || ''; // Prioritize 'description' (API v2.0.0)
  const shouldShowToggle = bioText.length > 200;
  const displayedBio = bioExpanded || !shouldShowToggle
    ? bioText
    : bioText.substring(0, 200) + '...';

  return (
    <View style={styles.container}>
      {/* Status Bar with light content */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFCF0D"
        translucent={false}
      />

      {/* Header - Yellow Background extending to status bar - Acts as overlay */}
      <View style={[styles.header, { height: (200 + STATUS_BAR_HEIGHT) * scale, paddingTop: STATUS_BAR_HEIGHT * scale }]}>
        <TouchableOpacity
          style={[styles.backButton, { top: 50 * scale, left: 10 * scale }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24 * scale} color="#595959" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { top: 58 * scale, left: 53 * scale, fontSize: 18 * scale }]}>
          Astrologer Profile
        </Text>
      </View>

      {/* Fixed Profile Card - Above yellow overlay */}
      <Animated.View
        style={[
          styles.profileCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            position: 'absolute',
            top: 110 * scale,
            left: 16 * scale,
            right: 16 * scale,
            paddingHorizontal: 16 * scale,
            paddingVertical: 16 * scale,
            zIndex: 1500,
            elevation: 1500,
          },
        ]}
      >
          {/* Top Row: Image, Name, and Verified Badge */}
          <View style={[styles.topRow, { marginBottom: 12 * scale }]}>
            {/* Profile Image */}
            <Image
              source={
                typeof astrologer.image === 'string'
                  ? { uri: astrologer.image }
                  : astrologer.image
              }
              style={[
                styles.profileImage,
                {
                  width: 80 * scale,
                  height: 80 * scale,
                  borderRadius: 40 * scale,
                  borderWidth: 2,
                  borderColor: '#FFCF0D',
                },
              ]}
            />

            {/* Name and Verified Badge */}
            <View style={[styles.nameSection, { marginLeft: 12 * scale }]}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { fontSize: 18 * scale }]} numberOfLines={1}>
                  {astrologer.name}
                </Text>
                {/* Verified Badge - Instagram style */}
                {astrologer.isAvailable && (
                  <View
                    style={[
                      styles.verifiedBadge,
                      {
                        width: 20 * scale,
                        height: 20 * scale,
                        borderRadius: 10 * scale,
                        marginLeft: 6 * scale,
                        transform: [{ rotate: '12deg' }, { scaleX: 0.95 }],
                      },
                    ]}
                  >
                    <BadgeCheck
                      size={20 * scale}
                      fill="#10B981"
                      color="#FFFFFF"
                      strokeWidth={2}
                    />
                  </View>
                )}
              </View>

              {/* Specialization */}
              <Text style={[styles.infoText, { fontSize: 11 * scale, marginTop: 4 * scale }]} numberOfLines={2}>
                {Array.isArray(astrologer.specialization)
                  ? astrologer.specialization.join(', ')
                  : astrologer.specialization}
              </Text>

              {/* Languages */}
              <Text style={[styles.infoText, { fontSize: 10 * scale, marginTop: 2 * scale }]}>
                {Array.isArray(astrologer.languages)
                  ? astrologer.languages.join(', ')
                  : astrologer.languages}
              </Text>

              {/* Experience */}
              <Text style={[styles.infoText, { fontSize: 10 * scale, marginTop: 2 * scale }]}>
                Exp - {astrologer.experience} Years
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={[styles.priceContainer, { marginBottom: 8 * scale, marginLeft: 0 }]}>
            <IndianRupee size={12 * scale} color="#2930A6" />
            <Text style={[styles.priceText, { fontSize: 12 * scale }]}>
              {astrologer.pricePerMinute || astrologer.chatPricePerMinute}/min
            </Text>
          </View>

          {/* Rating and Orders */}
          <View style={[styles.ratingContainer, { marginBottom: 12 * scale, marginLeft: 0 }]}>
            <View style={styles.starsRow}>{renderStars(astrologer.rating)}</View>
            <Text style={[styles.ordersText, { fontSize: 10 * scale, marginLeft: 8 * scale }]}>
              {astrologer.totalCalls || astrologer.calls || 0} orders
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { marginHorizontal: 20 * scale }]} />

          {/* Action Buttons */}
          <View style={[styles.actionsContainer, { paddingHorizontal: 20 * scale, paddingVertical: 16 * scale }]}>
            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={handleStartChat}
              activeOpacity={0.7}
            >
              <MessageSquare size={24 * scale} color="#666666" strokeWidth={2} />
            </TouchableOpacity>

            <View style={[styles.verticalDivider, { height: 20 * scale }]} />

            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={handleStartCall}
              activeOpacity={0.7}
            >
              <Phone size={24 * scale} color="#666666" />
            </TouchableOpacity>
          </View>
      </Animated.View>

      {/* Scrollable Content - Scrolls behind yellow header */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 360 * scale }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2930a6"
            colors={['#2930a6']}
            progressViewOffset={360 * scale}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Bio Section */}
        {bioText && (
          <Animated.View
            style={[
              styles.bioSection,
              {
                opacity: fadeAnim,
                marginHorizontal: 20 * scale,
                marginBottom: 20 * scale,
                padding: 16 * scale,
              },
            ]}
          >
            <Text style={[styles.bioText, { fontSize: 14 * scale, lineHeight: 20 * scale }]}>
              {displayedBio}
              {shouldShowToggle && (
                <Text
                  style={[styles.toggleText, { fontSize: 14 * scale }]}
                  onPress={toggleBio}
                >
                  {' '}
                  {bioExpanded ? 'show less' : 'show more'}
                </Text>
              )}
            </Text>
          </Animated.View>
        )}

        {/* Photo Gallery - Optional */}
        {astrologer.photos && astrologer.photos.length > 0 && (
          <Animated.View
            style={[
              styles.gallerySection,
              {
                opacity: fadeAnim,
                marginBottom: 20 * scale,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.galleryContent, { paddingHorizontal: 10 * scale }]}
            >
              {astrologer.photos.map((photo, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoCard,
                    {
                      width: 114 * scale,
                      height: 164 * scale,
                      marginHorizontal: 5 * scale,
                    },
                  ]}
                >
                  <Image
                    source={typeof photo === 'string' ? { uri: photo } : photo}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Reviews Section */}
        {astrologer.reviews && astrologer.reviews.length > 0 && (
          <Animated.View
            style={[
              styles.reviewsSection,
              {
                opacity: fadeAnim,
                paddingHorizontal: 16 * scale,
                marginBottom: 30 * scale,
              },
            ]}
          >
            {astrologer.reviews.map((review, index) => (
              <View
                key={review.id || index}
                style={[
                  styles.reviewCard,
                  {
                    marginBottom: 12 * scale,
                    padding: 16 * scale,
                  },
                ]}
              >
                {/* Reviewer Info */}
                <View style={[styles.reviewerInfo, { marginBottom: 12 * scale }]}>
                  {review.userImage ? (
                    <Image
                      source={
                        typeof review.userImage === 'string'
                          ? { uri: review.userImage }
                          : review.userImage
                      }
                      style={[styles.reviewerAvatar, { width: 48 * scale, height: 48 * scale }]}
                    />
                  ) : (
                    <View style={[styles.reviewerAvatar, styles.defaultAvatar, { width: 48 * scale, height: 48 * scale }]}>
                      <Text style={[styles.avatarInitial, { fontSize: 20 * scale }]}>
                        {review.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.reviewerName, { fontSize: 18 * scale }]}>
                    {review.userName}
                  </Text>
                </View>

                {/* Rating */}
                <View style={[styles.reviewRating, { marginBottom: 12 * scale }]}>
                  {renderReviewStars(review.rating)}
                </View>

                {/* Review Text */}
                <Text style={[styles.reviewText, { fontSize: 12 * scale, lineHeight: 18 * scale, marginBottom: 12 * scale }]}>
                  {review.comment}
                </Text>

                {/* Date */}
                <Text style={[styles.reviewDate, { fontSize: 12 * scale }]}>
                  {new Date(review.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

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
    zIndex: 1000,
    elevation: 1000,
  },
  backButton: {
    position: 'absolute',
    zIndex: 100,
    elevation: 100,
    padding: 8,
  },
  headerTitle: {
    position: 'absolute',
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
    zIndex: 100,
    elevation: 100,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImage: {
    resizeMode: 'cover',
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#000000',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexShrink: 0,
  },
  infoText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ordersText: {
    fontFamily: 'Lexend_300Light',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#000000',
    opacity: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#000000',
    opacity: 0.5,
  },
  bioSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.09)',
    borderRadius: 16,
  },
  bioText: {
    fontFamily: 'Lexend_400Regular',
    color: '#000000',
  },
  toggleText: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
    textDecorationLine: 'underline',
  },
  gallerySection: {
    overflow: 'visible',
  },
  galleryContent: {
    paddingVertical: 6,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  reviewsSection: {},
  reviewCard: {
    backgroundColor: 'rgba(255, 207, 13, 0.3)',
    borderRadius: 24,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  reviewerAvatar: {
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#FFCF0D',
    backgroundColor: '#FFFFFF',
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2930A6',
  },
  avatarInitial: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
  reviewerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#000000',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 6,
  },
  reviewText: {
    fontFamily: 'Lexend_300Light',
    color: '#404040',
  },
  reviewDate: {
    fontFamily: 'Lexend_500Medium',
    color: '#2930A6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    color: '#EF4444',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2930A6',
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
});

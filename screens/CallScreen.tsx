/**
 * CallScreen Component
 * Handles the entire call flow: calling → queue → active → summary
 * Based on Figma designs for NakshatraTalks
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TextInput,
  ScrollView,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { LibreBodoni_600SemiBold } from '@expo-google-fonts/libre-bodoni';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Star,
  Clock,
  Users,
  IndianRupee,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallFlow } from '../src/hooks/useCallFlow';
import { CallScreenParams, CallScreenState } from '../src/types/call.types';
import { Astrologer } from '../src/types/api.types';
import RatingModal from '../components/RatingModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CallScreen = ({ navigation, route }: any) => {
  const { astrologer } = route.params;

  // Call flow hook
  const {
    state,
    requestData,
    queueData,
    sessionData,
    summaryData,
    countdownSeconds,
    callDurationSeconds,
    isLoading,
    error,
    initiateCall,
    cancelCall,
    joinQueue,
    leaveQueue,
    callFromQueue,
    endCall,
    rateCall,
    goHome,
  } = useCallFlow({
    astrologer: {
      id: astrologer.id,
      name: astrologer.name,
      image: astrologer.image,
      pricePerMinute: astrologer.callPricePerMinute || astrologer.pricePerMinute,
      specialization: astrologer.specialization,
    },
    onError: (errorMsg, code) => {
      console.log('Call error:', errorMsg, code);
    },
    onCallEnded: (summary) => {
      console.log('Call ended:', summary);
    },
  });

  // Local state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [pendingRating, setPendingRating] = useState<{ rating: number; review?: string } | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showQueueOption, setShowQueueOption] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    LibreBodoni_600SemiBold,
  });

  // Start call on mount
  useEffect(() => {
    if (fontsLoaded) {
      initiateCall();
      startAnimations();
    }
  }, [fontsLoaded]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state === 'active') {
        // Don't allow back during active call
        return true;
      }
      handleCancel();
      return true;
    });

    return () => backHandler.remove();
  }, [state]);

  // Show queue option when error indicates astrologer is busy
  useEffect(() => {
    if (error?.toLowerCase().includes('busy')) {
      setShowQueueOption(true);
    }
  }, [error]);

  // Start animations
  const startAnimations = () => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  // Handle cancel
  const handleCancel = async () => {
    if (state === 'calling') {
      await cancelCall();
    } else if (state === 'queue') {
      await leaveQueue();
    }
    navigation.goBack();
  };

  // Handle end call - show rating modal first
  const handleEndCall = async () => {
    setShowRatingModal(true);
  };

  // Handle rating submission from modal
  const handleRatingSubmit = async (rating: number, review?: string) => {
    setPendingRating({ rating, review });
    setShowRatingModal(false);
    // Now actually end the call and transition to summary
    await endCall('user_ended');
  };

  // Handle go home - submit rating to API and navigate
  const handleGoHome = async () => {
    if (pendingRating) {
      await rateCall(pendingRating.rating, pendingRating.review);
    }
    goHome();
    navigation.goBack();
  };

  if (!fontsLoaded) {
    return null;
  }

  // ==================== CALLING STATE ====================
  if (state === 'calling') {
    const ringScale = ringAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });
    const ringOpacity = ringAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    });

    return (
      <LinearGradient
        colors={['#8B7FD4', '#C9B896', '#E8DCC8']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Status Text */}
            <Text style={styles.statusText}>
              {error ? 'Connection Failed' : 'Calling...'}
            </Text>
            <Text style={styles.timerText}>{formatTime(countdownSeconds)}</Text>

            {/* Avatar with rings */}
            <View style={styles.avatarContainer}>
              {/* Animated rings */}
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringOuter,
                  {
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringMiddle,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Image
                  source={{ uri: astrologer.image }}
                  style={styles.avatar}
                />
              </Animated.View>
            </View>

            {/* Name */}
            <Text style={styles.nameText}>{astrologer.name}</Text>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                {showQueueOption && (
                  <TouchableOpacity
                    style={styles.queueButton}
                    onPress={joinQueue}
                  >
                    <Users size={18} color="#fff" />
                    <Text style={styles.queueButtonText}>Join Queue</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bottom buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <PhoneOff size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ==================== QUEUE STATE ====================
  if (state === 'queue') {
    return (
      <LinearGradient
        colors={['#8B7FD4', '#C9B896', '#E8DCC8']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Status Text */}
            <Text style={styles.statusText}>In Queue</Text>

            {/* Queue Position */}
            <View style={styles.queueInfo}>
              <Text style={styles.queuePosition}>
                Position #{queueData?.position || 1}
              </Text>
              <Text style={styles.queueWait}>
                Est. wait: ~{queueData?.estimatedWaitMinutes || 5} min
              </Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringMiddle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Image
                  source={{ uri: astrologer.image }}
                  style={styles.avatar}
                />
              </Animated.View>
            </View>

            {/* Name */}
            <Text style={styles.nameText}>{astrologer.name}</Text>

            {/* Timer */}
            <View style={styles.queueTimerContainer}>
              <Clock size={18} color="#595959" />
              <Text style={styles.queueTimerText}>
                Time remaining: {formatTime(countdownSeconds)}
              </Text>
            </View>

            {/* Bottom buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <X size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ==================== ACTIVE CALL STATE ====================
  if (state === 'active' || state === 'connecting') {
    return (
      <>
        <LinearGradient
          colors={['#8B7FD4', '#C9B896', '#E8DCC8']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <StatusBar style="dark" />
          <SafeAreaView style={styles.safeArea}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Status Text */}
              <Text style={styles.statusText}>Call Active</Text>
              <Text style={styles.timerText}>{formatTime(callDurationSeconds)}</Text>

              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <View style={[styles.ring, styles.ringMiddle, styles.activeRing]} />
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: astrologer.image }}
                    style={styles.avatar}
                  />
                </View>
              </View>

              {/* Name */}
              <Text style={styles.nameText}>{astrologer.name}</Text>

              {/* Cost info */}
              <View style={styles.costContainer}>
                <IndianRupee size={14} color="#595959" />
                <Text style={styles.costText}>
                  {((callDurationSeconds / 60) * (sessionData?.pricePerMinute || astrologer.callPricePerMinute || astrologer.pricePerMinute)).toFixed(2)}
                </Text>
              </View>

              {/* Call controls */}
              <View style={styles.callControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    isMuted && styles.controlButtonActive,
                  ]}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <MicOff size={24} color={isMuted ? '#fff' : '#333'} />
                  ) : (
                    <Mic size={24} color="#333" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.endCallButton]}
                  onPress={handleEndCall}
                >
                  <PhoneOff size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    isSpeakerOn && styles.controlButtonActive,
                  ]}
                  onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  {isSpeakerOn ? (
                    <Volume2 size={24} color={isSpeakerOn ? '#fff' : '#333'} />
                  ) : (
                    <VolumeX size={24} color="#333" />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Rating Modal */}
        <RatingModal
          visible={showRatingModal}
          onSubmit={handleRatingSubmit}
          onClose={() => handleRatingSubmit(3, undefined)}
          sessionType="call"
        />
      </>
    );
  }

  // ==================== SUMMARY STATE ====================
  if (state === 'summary') {
    // Get rating config for display
    const RATING_LABELS = ['Bad', 'Okay', 'Good', 'Very Good', 'Excellent'];
    const ratingValue = pendingRating?.rating || 3;
    const ratingLabel = RATING_LABELS[ratingValue - 1];

    return (
      <View style={styles.summaryContainer}>
        <StatusBar style="dark" />

        {/* Yellow header section */}
        <View style={styles.summaryHeader}>
          {/* Decorative circles */}
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />

          <SafeAreaView>
            <Text style={styles.summaryTitle}>Call Completed</Text>
            <Text style={styles.summarySubtitle}>
              Thanks for taking up the service, We hope you got your clarity!
            </Text>
          </SafeAreaView>
        </View>

        {/* White card section */}
        <View style={styles.summaryCard}>
          {/* Astrologer info */}
          <View style={styles.summaryAstrologerRow}>
            <Image
              source={{ uri: astrologer.image }}
              style={styles.summaryAvatar}
            />
            <Text style={styles.summaryName}>{astrologer.name}</Text>
          </View>

          {/* Duration and cost */}
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Call Duration</Text>
              <Text style={styles.summaryStatValue}>
                {formatTime(summaryData?.durationSeconds || callDurationSeconds)}
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Amount deducted</Text>
              <View style={styles.summaryAmountRow}>
                <IndianRupee size={14} color="#595959" />
                <Text style={styles.summaryStatValue}>
                  {summaryData?.totalCost?.toFixed(0) || '0'}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Display */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  color={star <= ratingValue ? '#FFD700' : '#D1D5DB'}
                  fill={star <= ratingValue ? '#FFD700' : 'transparent'}
                />
              ))}
            </View>
          </View>

          {/* Review Display */}
          {pendingRating?.review && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Your Review</Text>
              <Text style={styles.reviewText}>{pendingRating.review}</Text>
            </View>
          )}
        </View>

        {/* Submit button */}
        <View style={styles.summaryButtonContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Status text
  statusText: {
    fontFamily: 'LibreBodoni_600SemiBold',
    fontSize: 30,
    color: '#595959',
    marginBottom: 8,
  },
  timerText: {
    fontFamily: 'LibreBodoni_600SemiBold',
    fontSize: 24,
    color: '#595959',
    marginBottom: 40,
  },

  // Avatar
  avatarContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  ring: {
    position: 'absolute',
    borderRadius: 200,
  },
  ringOuter: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 207, 13, 0.3)',
  },
  ringMiddle: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255, 207, 13, 0.5)',
  },
  activeRing: {
    backgroundColor: 'rgba(41, 48, 166, 0.2)',
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#FFCF0D',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Name
  nameText: {
    fontFamily: 'LibreBodoni_600SemiBold',
    fontSize: 28,
    color: '#595959',
    marginBottom: 20,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  queueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2930A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  queueButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  // Queue info
  queueInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  queuePosition: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 24,
    color: '#2930A6',
    marginBottom: 4,
  },
  queueWait: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#595959',
  },
  queueTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  queueTimerText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#595959',
  },

  // Cost
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 40,
  },
  costText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 16,
    color: '#595959',
  },

  // Buttons
  bottomButtons: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },

  // Call controls
  callControls: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#2930A6',
  },

  // Summary screen
  summaryContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryHeader: {
    backgroundColor: '#FFCF0D',
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 200,
  },
  circle1: {
    width: 300,
    height: 300,
    bottom: -100,
    left: '50%',
    marginLeft: -150,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: '50%',
    marginLeft: -100,
  },
  summaryTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 40,
    color: '#404040',
    textAlign: 'center',
    marginBottom: 12,
  },
  summarySubtitle: {
    fontFamily: 'Lexend_300Light',
    fontSize: 18,
    color: '#404040',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2930A6',
    padding: 20,
  },
  summaryAstrologerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFCF0D',
    marginRight: 15,
  },
  summaryName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#000',
    flex: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 12,
    color: '#595959',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 12,
    color: '#595959',
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Rating
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#000',
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },

  // Review
  reviewSection: {
    marginBottom: 8,
  },
  reviewLabel: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#000',
    marginBottom: 8,
  },
  reviewText: {
    fontFamily: 'Lexend_300Light',
    fontSize: 12,
    color: '#404040',
    lineHeight: 18,
  },

  // Home button
  summaryButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  homeButton: {
    backgroundColor: '#2930A6',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  homeButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.4,
  },
});

export default CallScreen;

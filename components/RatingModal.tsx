/**
 * RatingModal Component
 * Displays a mood-based rating slider with emoji feedback
 * Used after call/chat sessions to collect user feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { ChevronLeft, Check, MessageSquare } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');

// Rating configuration
const RATING_CONFIG = [
  { value: 1, label: 'Bad', emoji: '🙂', color: '#DC2626' },
  { value: 2, label: 'Okay', emoji: '😐', color: '#7F1D1D' },
  { value: 3, label: 'Good', emoji: '🙂', color: '#6B7280' },
  { value: 4, label: 'Very Good', emoji: '😬', color: '#2563EB' },
  { value: 5, label: 'Excellent', emoji: '😍', color: '#16A34A' },
];

interface RatingModalProps {
  visible: boolean;
  onSubmit: (rating: number, review?: string) => void;
  onClose: () => void;
  sessionType?: 'call' | 'chat';
}

const SLIDER_WIDTH = screenWidth - 80;
const SLIDER_PADDING = 20;
const TRACK_WIDTH = SLIDER_WIDTH - SLIDER_PADDING * 2;

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onSubmit,
  onClose,
  sessionType = 'call',
}) => {
  const [rating, setRating] = useState(3);
  const [review, setReview] = useState('');

  // Animation values
  const emojiScale = useSharedValue(1);
  const sliderPosition = useSharedValue(getPositionForRating(3));

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setRating(3);
      setReview('');
      sliderPosition.value = getPositionForRating(3);
    }
  }, [visible]);

  // Get slider position for a rating value
  function getPositionForRating(ratingValue: number): number {
    const segmentWidth = TRACK_WIDTH / 4;
    return SLIDER_PADDING + (ratingValue - 1) * segmentWidth;
  }

  // Get rating value from slider position
  function getRatingFromPosition(position: number): number {
    const segmentWidth = TRACK_WIDTH / 4;
    const relativePos = position - SLIDER_PADDING;
    const ratingValue = Math.round(relativePos / segmentWidth) + 1;
    return Math.max(1, Math.min(5, ratingValue));
  }

  // Trigger bouncy animation on rating change
  const triggerBounce = useCallback(() => {
    emojiScale.value = withSequence(
      withSpring(1.25, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  }, []);

  // Update rating and animate
  const updateRating = useCallback((newRating: number) => {
    if (newRating !== rating) {
      setRating(newRating);
      triggerBounce();
    }
  }, [rating, triggerBounce]);

  // Pan gesture for slider
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newX = Math.max(
        SLIDER_PADDING,
        Math.min(SLIDER_WIDTH - SLIDER_PADDING, event.x)
      );
      sliderPosition.value = newX;
      const newRating = getRatingFromPosition(newX);
      runOnJS(updateRating)(newRating);
    })
    .onEnd(() => {
      // Snap to nearest rating position
      const snappedPosition = getPositionForRating(rating);
      sliderPosition.value = withSpring(snappedPosition, {
        damping: 15,
        stiffness: 300,
      });
    });

  // Tap gesture for slider dots
  const handleDotPress = (ratingValue: number) => {
    const newPosition = getPositionForRating(ratingValue);
    sliderPosition.value = withSpring(newPosition, {
      damping: 15,
      stiffness: 300,
    });
    updateRating(ratingValue);
  };

  // Animated styles
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderPosition.value - 20 }],
  }));

  // Handle submit
  const handleSubmit = () => {
    onSubmit(rating, review.trim() || undefined);
  };

  // Handle skip (submit with default rating 3)
  const handleSkip = () => {
    onSubmit(3, undefined);
  };

  // Handle back/close (same as skip)
  const handleClose = () => {
    onSubmit(3, undefined);
  };

  const currentConfig = RATING_CONFIG[rating - 1];

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleClose}
                  >
                    <ChevronLeft size={28} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Rating &{'\n'}Review</Text>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                  >
                    <Text style={styles.skipText}>skip</Text>
                  </TouchableOpacity>
                </View>

                {/* Main Title */}
                <Text style={styles.mainTitle}>How was your{'\n'}experience?</Text>

                {/* Emoji Display */}
                <View style={styles.emojiContainer}>
                  <Animated.Text style={[styles.emoji, emojiAnimatedStyle]}>
                    {currentConfig.emoji}
                  </Animated.Text>
                </View>

                {/* Rating Label */}
                <Text style={[styles.ratingLabel, { color: currentConfig.color }]}>
                  {currentConfig.label}
                </Text>

                {/* Custom Slider */}
                <View style={styles.sliderContainer}>
                  <GestureDetector gesture={panGesture}>
                    <View style={styles.sliderTrackContainer}>
                      {/* Track Background */}
                      <View style={styles.sliderTrack} />

                      {/* Dot Indicators */}
                      <View style={styles.dotsContainer}>
                        {RATING_CONFIG.map((config) => (
                          <TouchableOpacity
                            key={config.value}
                            style={[
                              styles.dot,
                              rating === config.value && styles.dotActive,
                            ]}
                            onPress={() => handleDotPress(config.value)}
                          />
                        ))}
                      </View>

                      {/* Animated Thumb */}
                      <Animated.View
                        style={[
                          styles.thumb,
                          { backgroundColor: currentConfig.color },
                          thumbAnimatedStyle,
                        ]}
                      >
                        <Text style={styles.thumbText}>{rating}</Text>
                      </Animated.View>
                    </View>
                  </GestureDetector>
                </View>

                {/* Review Input */}
                <View style={styles.inputContainer}>
                  <MessageSquare size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Describe in detail (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={review}
                    onChangeText={setReview}
                    textAlignVertical="top"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Check size={24} color="#fff" strokeWidth={3} />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#000',
    textDecorationLine: 'underline',
  },

  // Main Title
  mainTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 32,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 40,
  },

  // Emoji
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 120,
  },

  // Rating Label
  ratingLabel: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Slider
  sliderContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sliderTrackContainer: {
    width: SLIDER_WIDTH,
    height: 50,
    justifyContent: 'center',
  },
  sliderTrack: {
    position: 'absolute',
    left: SLIDER_PADDING,
    right: SLIDER_PADDING,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  dotsContainer: {
    position: 'absolute',
    left: SLIDER_PADDING,
    right: SLIDER_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: 'transparent',
  },
  thumb: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 18,
    color: '#fff',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 100,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2930A6',
    paddingVertical: 18,
    borderRadius: 50,
    gap: 8,
  },
  submitButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    color: '#fff',
  },
});

export default RatingModal;

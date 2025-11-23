import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Star, X, IndianRupee } from 'lucide-react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';
import { ChatSession } from '../../src/types/api.types';

const { width: screenWidth } = Dimensions.get('window');

interface SessionEndModalProps {
  visible: boolean;
  session: ChatSession | null;
  totalCost: number;
  duration: number; // in minutes
  remainingBalance?: number;
  onRate: (rating: number, review: string, tags: string[]) => void;
  onClose: () => void;
}

const PREDEFINED_TAGS = ['Helpful', 'Professional', 'Accurate', 'Patient', 'Insightful'];

const SessionEndModal: React.FC<SessionEndModalProps> = ({
  visible,
  session,
  totalCost,
  duration,
  remainingBalance,
  onRate,
  onClose,
}) => {
  const { scale } = useResponsiveLayout();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset state when modal closes
      setRating(0);
      setReview('');
      setSelectedTags([]);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating, review, selectedTags);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              width: screenWidth * 0.9,
              maxHeight: '80%',
              borderRadius: 24 * scale,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { padding: 24 * scale }]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  top: 16 * scale,
                  right: 16 * scale,
                  width: 32 * scale,
                  height: 32 * scale,
                  borderRadius: 16 * scale,
                },
              ]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <X size={20 * scale} color="#595959" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={[styles.title, { fontSize: 24 * scale, marginBottom: 8 * scale }]}>
              Session Ended
            </Text>

            <Text
              style={[styles.subtitle, { fontSize: 14 * scale, marginBottom: 20 * scale }]}
            >
              Thank you for using NakshatraTalks
            </Text>

            {/* Session Summary */}
            <View
              style={[
                styles.summaryContainer,
                {
                  marginBottom: 24 * scale,
                  padding: 16 * scale,
                  borderRadius: 12 * scale,
                },
              ]}
            >
              <View style={[styles.summaryRow, { marginBottom: 12 * scale }]}>
                <Text style={[styles.summaryLabel, { fontSize: 14 * scale }]}>
                  Duration:
                </Text>
                <Text style={[styles.summaryValue, { fontSize: 14 * scale }]}>
                  {formatDuration(duration)}
                </Text>
              </View>

              <View style={[styles.summaryRow, { marginBottom: 12 * scale }]}>
                <Text style={[styles.summaryLabel, { fontSize: 14 * scale }]}>
                  Total Cost:
                </Text>
                <View style={styles.summaryValueRow}>
                  <IndianRupee size={14 * scale} color="#2930A6" />
                  <Text style={[styles.summaryValueBold, { fontSize: 16 * scale }]}>
                    {totalCost.toFixed(2)}
                  </Text>
                </View>
              </View>

              {remainingBalance !== undefined && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontSize: 14 * scale }]}>
                    Remaining Balance:
                  </Text>
                  <View style={styles.summaryValueRow}>
                    <IndianRupee size={14 * scale} color="#28A745" />
                    <Text style={[styles.summaryValue, { fontSize: 14 * scale }]}>
                      {remainingBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Rating Section */}
            <Text style={[styles.sectionTitle, { fontSize: 16 * scale, marginBottom: 12 * scale }]}>
              Rate your experience
            </Text>

            <View style={[styles.starContainer, { marginBottom: 20 * scale, gap: 12 * scale }]}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Star
                    size={40 * scale}
                    fill={star <= rating ? '#FFCF0D' : 'transparent'}
                    color="#FFCF0D"
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Tags */}
            {rating > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontSize: 14 * scale, marginBottom: 12 * scale },
                  ]}
                >
                  What did you like? (Optional)
                </Text>

                <View style={[styles.tagsContainer, { marginBottom: 16 * scale, gap: 8 * scale }]}>
                  {PREDEFINED_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          paddingHorizontal: 16 * scale,
                          paddingVertical: 8 * scale,
                          borderRadius: 20 * scale,
                          backgroundColor: selectedTags.includes(tag)
                            ? '#2930A6'
                            : 'rgba(41, 48, 166, 0.1)',
                        },
                      ]}
                      onPress={() => handleTagToggle(tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          {
                            fontSize: 13 * scale,
                            color: selectedTags.includes(tag) ? '#FFFFFF' : '#2930A6',
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Review Text */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontSize: 14 * scale, marginBottom: 12 * scale },
                  ]}
                >
                  Write a review (Optional)
                </Text>

                <TextInput
                  style={[
                    styles.reviewInput,
                    {
                      minHeight: 80 * scale,
                      borderRadius: 12 * scale,
                      padding: 12 * scale,
                      fontSize: 14 * scale,
                    },
                  ]}
                  value={review}
                  onChangeText={setReview}
                  placeholder="Share your experience..."
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </>
            )}

            {/* Actions */}
            <View style={[styles.actionsContainer, { marginTop: 24 * scale }]}>
              {rating > 0 && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      height: 50 * scale,
                      borderRadius: 25 * scale,
                      marginBottom: 12 * scale,
                    },
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.submitButtonText, { fontSize: 16 * scale }]}>
                    Submit Rating
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.skipButton,
                  {
                    height: 50 * scale,
                    borderRadius: 25 * scale,
                  },
                ]}
                onPress={handleSkip}
                activeOpacity={0.8}
              >
                <Text style={[styles.skipButtonText, { fontSize: 16 * scale }]}>
                  {rating > 0 ? 'Skip' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollContent: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
    textAlign: 'center',
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  summaryValue: {
    fontFamily: 'Lexend_500Medium',
    color: '#000000',
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryValueBold: {
    fontFamily: 'Lexend_700Bold',
    color: '#2930A6',
  },
  sectionTitle: {
    fontFamily: 'Lexend_500Medium',
    color: '#000000',
    alignSelf: 'flex-start',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagText: {
    fontFamily: 'Lexend_500Medium',
  },
  reviewInput: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    fontFamily: 'Lexend_400Regular',
    color: '#000000',
  },
  actionsContainer: {
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#FFCF0D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
  },
});

export default SessionEndModal;

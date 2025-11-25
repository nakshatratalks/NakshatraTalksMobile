import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  MessageSquare,
  Send,
  AlertCircle,
} from 'lucide-react-native';
import { feedbackService } from '../src/services';
import NotificationService from '../src/utils/notificationService';
import { handleApiError } from '../src/utils/errorHandler';

interface FeedbackFormProps {
  scale?: number;
}

// Native-style Material Design Outlined TextField with Icon
const OutlinedTextField = ({
  label,
  value,
  onChangeText,
  icon: Icon,
  error,
  multiline = false,
  keyboardType = 'default' as any,
  autoCapitalize = 'sentences' as any,
  scale = 1,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: any;
  error?: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  scale?: number;
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Scaled Constants
  const INPUT_HEIGHT = 56 * scale;
  const ICON_SIZE = 20 * scale;
  const FONT_SIZE = 16 * scale;

  // Animation values
  const labelPosition = useSharedValue(value ? 1 : 0);
  const focusAnim = useSharedValue(0);

  const isLabelFloating = isFocused || value.length > 0;

  useEffect(() => {
    labelPosition.value = withTiming(isLabelFloating ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isLabelFloating]);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  // Label animation - different translateY for multiline to properly mount on border
  const labelAnimatedStyle = useAnimatedStyle(() => {
    // Non-multiline: label centered in 56px height needs to move ~28px up
    // Multiline: label starts at top:18, needs to move up to border (~-10px from start)
    const targetY = multiline ? -28 * scale : -29 * scale;
    const translateY = interpolate(labelPosition.value, [0, 1], [0, targetY]);
    const translateX = interpolate(labelPosition.value, [0, 1], [0, -2 * scale]);
    const labelScale = interpolate(labelPosition.value, [0, 1], [1, 0.85]);

    return {
      transform: [
        { translateY },
        { translateX },
        { scale: labelScale },
      ],
    };
  });

  const labelColorStyle = useAnimatedStyle(() => {
    const color = error
      ? '#EF4444'
      : interpolateColor(focusAnim.value, [0, 1], ['#6B7280', '#2930A6']);
    return { color };
  });

  const labelBgStyle = useAnimatedStyle(() => ({
    opacity: labelPosition.value,
  }));

  const containerBorderStyle = useAnimatedStyle(() => {
    const borderColorValue = error
      ? '#EF4444'
      : interpolateColor(focusAnim.value, [0, 1], ['#E5E7EB', '#2930A6']);
    const borderWidthValue = interpolate(focusAnim.value, [0, 1], [1, 1.5]);

    return {
      borderColor: borderColorValue,
      borderWidth: borderWidthValue,
    };
  });

  const iconColor = error ? '#EF4444' : isFocused ? '#2930A6' : '#9CA3AF';

  // Dynamic Styles based on scale
  const dynamicStyles = StyleSheet.create({
    container: {
      borderRadius: 12 * scale,
      paddingHorizontal: 16 * scale,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1, // Animated via style prop
    },
    iconWrapper: {
      marginRight: 12 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      width: 24 * scale,
    },
    labelBg: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      height: 10 * scale,
      left: -6 * scale,
      right: -6 * scale,
      top: 4 * scale, // Position to cover the border line behind text
    },
    labelText: {
      fontFamily: 'Lexend_400Regular',
      fontSize: 15 * scale,
    },
    textInput: {
      fontFamily: 'Lexend_400Regular',
      fontSize: FONT_SIZE,
      color: '#111827',
      paddingVertical: 0,
      flex: 1,
    },
  });

  return (
    <View style={{ width: '100%', marginBottom: 20 * scale }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        style={{ width: '100%' }}
      >
        <Animated.View
          style={[
            dynamicStyles.container,
            multiline ? { minHeight: 120 * scale } : { height: INPUT_HEIGHT },
            containerBorderStyle,
          ]}
        >
          <View style={[
            dynamicStyles.iconWrapper, 
            multiline && { paddingTop: 16 * scale, alignSelf: 'flex-start' }
          ]}>
            <Icon size={ICON_SIZE} color={iconColor} />
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Animated.View
              style={[
                { position: 'absolute', left: 0, zIndex: 1 },
                multiline && { top: 18 * scale },
                labelAnimatedStyle,
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[dynamicStyles.labelBg, labelBgStyle]} />
              <Animated.Text style={[dynamicStyles.labelText, labelColorStyle]}>
                {label}
              </Animated.Text>
            </Animated.View>

            <TextInput
              ref={inputRef}
              style={[
                dynamicStyles.textInput,
                multiline && { paddingTop: 16 * scale, paddingBottom: 16 * scale, textAlignVertical: 'top' },
              ]}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              selectionColor="#2930A6"
              cursorColor="#2930A6"
              placeholder="" 
            />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {error && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 * scale, marginTop: 6 * scale, paddingLeft: 4 * scale }}
        >
          <AlertCircle size={14 * scale} color="#EF4444" />
          <Text style={{ fontFamily: 'Lexend_400Regular', fontSize: 12 * scale, color: '#EF4444' }}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Main FeedbackForm Component
export const FeedbackForm: React.FC<FeedbackFormProps> = ({ scale = 1 }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', feedback: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(() => getStyles(scale), [scale]);

  const validateForm = () => {
    const newErrors = { name: '', email: '', feedback: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!feedback.trim()) {
      newErrors.feedback = 'Feedback is required';
    } else if (feedback.trim().length < 10) {
      newErrors.feedback = 'Minimum 10 characters required';
    }

    setErrors(newErrors);

    // Return true only if no errors exist
    return !newErrors.name && !newErrors.email && !newErrors.feedback;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await feedbackService.submitFeedback({ name, email, comments: feedback });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      NotificationService.success('Thank you for your feedback!');

      // Clear form
      setName('');
      setEmail('');
      setFeedback('');
      setErrors({ name: '', email: '', feedback: '' });
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MessageSquare size={24 * scale} color="#2930A6" />
        </View>
        <Text style={styles.title}>Share Feedback</Text>
        <Text style={styles.subtitle}>We value your opinion to improve our services.</Text>
      </View>

      <View style={styles.form}>
        <OutlinedTextField
          label="Full Name"
          value={name}
          onChangeText={(t) => { setName(t); setErrors(e => ({...e, name: ''})) }}
          icon={User}
          error={errors.name}
          scale={scale}
        />
        <OutlinedTextField
          label="Email Address"
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors(e => ({...e, email: ''})) }}
          icon={Mail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          scale={scale}
        />
        <OutlinedTextField
          label="Your Feedback"
          value={feedback}
          onChangeText={(t) => { setFeedback(t); setErrors(e => ({...e, feedback: ''})) }}
          icon={MessageSquare}
          error={errors.feedback}
          multiline
          scale={scale}
        />
      </View>

      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
        style={styles.submitButtonContainer}
      >
         <LinearGradient
          colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#2930A6', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Feedback</Text>
              <Send size={18 * scale} color="#FFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={styles.footer}>Your data is secure with us.</Text>
    </View>
  );
};

const getStyles = (scale: number) => StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24 * scale,
    padding: 24 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 * scale },
        shadowOpacity: 0.06,
        shadowRadius: 16 * scale,
      },
      android: { elevation: 6 },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24 * scale,
  },
  iconCircle: {
    width: 52 * scale,
    height: 52 * scale,
    borderRadius: 26 * scale,
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12 * scale,
  },
  title: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20 * scale,
    color: '#111827',
    marginBottom: 6 * scale,
  },
  subtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14 * scale,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 10 * scale,
  },
  form: {
    // Gap handled by marginBottom in OutlinedTextField to ensure consistent layout
  },
  submitButtonContainer: {
    marginTop: 12 * scale,
    borderRadius: 12 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#2930A6',
        shadowOffset: { width: 0, height: 4 * scale },
        shadowOpacity: 0.2,
        shadowRadius: 10 * scale,
      },
      android: { elevation: 4 },
    }),
  },
  submitButton: {
    height: 52 * scale,
    borderRadius: 12 * scale,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10 * scale,
  },
  submitText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16 * scale,
    color: '#FFFFFF',
  },
  footer: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12 * scale,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20 * scale,
  },
});

export default FeedbackForm;
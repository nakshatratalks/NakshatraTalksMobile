import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import {
  OpenSans_400Regular,
} from '@expo-google-fonts/open-sans';
import {
  Nunito_400Regular,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { LibreBodoni_600SemiBold } from '@expo-google-fonts/libre-bodoni';
import IndiaFlag from '../assets/images/indiaflag.svg';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useAuth } from '../src/contexts/AuthContext';
import { validatePhone, formatPhoneToE164, getPhoneValidationError } from '../src/utils/phoneValidator';
import { handleApiError } from '../src/utils/errorHandler';
import NotificationService from '../src/utils/notificationService';

const BASE_WIDTH = 384;

type SignInScreenProps = {
  onSuccess?: () => void;
};

const SignInScreen = ({ onSuccess }: SignInScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sendOTP, login } = useAuth();

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_700Bold,
    OpenSans_400Regular,
    Nunito_400Regular,
    Nunito_700Bold,
    LibreBodoni_600SemiBold,
  });

  const { cardWidth, scale, breakpoint } = useResponsiveLayout();

  /**
   * Handle Send OTP
   */
  const handleSendOtp = async () => {
    try {
      setErrorMessage(null);

      // Format phone to E.164
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`;

      // Validate phone number
      const validationError = getPhoneValidationError(formattedPhone);
      if (validationError) {
        setErrorMessage(validationError);
        NotificationService.error(validationError, 'Invalid Phone');
        return;
      }

      setLoading(true);
      await sendOTP(formattedPhone);

      setOtpSent(true);
      NotificationService.success('Please check your phone for the OTP code.', 'OTP Sent');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      handleApiError(error);
      setErrorMessage('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Verify OTP
   */
  const handleVerifyOtp = async () => {
    try {
      setErrorMessage(null);

      if (!otp || otp.length !== 6) {
        setErrorMessage('Please enter a valid 6-digit OTP');
        NotificationService.error('Please enter a valid 6-digit OTP', 'Invalid OTP');
        return;
      }

      setLoading(true);

      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`;

      await login(formattedPhone, otp);

      NotificationService.success('Login successful!', 'Success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      handleApiError(error);
      setErrorMessage('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Resend OTP
   */
  const handleResendOtp = async () => {
    setOtp('');
    await handleSendOtp();
  };

  /**
   * Handle Back to Phone Input
   */
  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp('');
    setErrorMessage(null);
  };

  const featureCardMeasures = useMemo(() => {
    const baseWidth = cardWidth - 44 * scale;
    const baseShift =
      breakpoint === 'large'
        ? -12 * scale
        : breakpoint === 'medium'
        ? -8 * scale
        : -6 * scale;
    const availableOffset = Math.max(cardWidth - baseWidth, 0);
    const offsetRatio =
      breakpoint === 'large' ? 0.25 : breakpoint === 'medium' ? 0.2 : 0.16;
    const middleBaseline = baseShift + Math.min(availableOffset, baseWidth * offsetRatio);
    const middleLeft = middleBaseline - 12 * scale;
    const outerLeft = baseShift * 2;

    return {
      baseWidth,
      middleLeft,
      outerLeft,
      stackHeight: breakpoint === 'large' ? 220 * scale : 190 * scale,
    };
  }, [cardWidth, scale, breakpoint]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.outer}>
              <View
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    borderRadius: 50 * scale,
                    paddingHorizontal: 30 * scale,
                  },
                ]}
              >
          {/* Logo */}
          <View style={[styles.logoWrapper, { marginTop: 40 * scale }]}>
            <Image
              source={require('../assets/images/logo.png')}
              style={[
                styles.logo,
                {
                  width: 322 * scale,
                  height: 77 * scale,
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Feature Cards - Staggered Layout */}
          <View
            style={[
              styles.featuresContainer,
              {
                marginTop: 60 * scale,
                height: featureCardMeasures.stackHeight,
              },
            ]}
          >
            {/* Chat with Astrologer */}
            <View
              style={[
                styles.featureCard,
                {
                  position: 'absolute',
                  left: featureCardMeasures.outerLeft,
                  top: 0,
                  width: featureCardMeasures.baseWidth,
                  height: 53 * scale,
                  borderRadius: 36 * scale,
                  paddingHorizontal: 15 * scale,
                  gap: 24 * scale,
                },
              ]}
            >
              <Image
                source={require('../assets/images/icon-chat.png')}
                style={[
                  styles.featureIcon,
                  {
                    width: 39 * scale,
                    height: 35 * scale,
                    borderRadius: 20 * scale,
                  },
                ]}
                resizeMode="cover"
              />
              <Text
                style={[
                  styles.featureText,
                  { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 18 * scale },
                ]}
              >
                Chat with Astrologer
              </Text>
            </View>

            {/* Talk to Astrologer - Shifted Right */}
            <View
              style={[
                styles.featureCard,
                {
                  position: 'absolute',
                  left: featureCardMeasures.middleLeft,
                  top: 63 * scale,
                  width: featureCardMeasures.baseWidth,
                  height: 53 * scale,
                  borderRadius: 36 * scale,
                  paddingHorizontal: 15 * scale,
                  gap: 37 * scale,
                },
              ]}
            >
              <Image
                source={require('../assets/images/icon-talk.png')}
                style={[
                  styles.featureIcon,
                  {
                    width: 39 * scale,
                    height: 35 * scale,
                    borderRadius: 20 * scale,
                  },
                ]}
                resizeMode="cover"
              />
              <Text
                style={[
                  styles.featureText,
                  { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 18 * scale },
                ]}
              >
                Talk to Astrologer
              </Text>
            </View>

            {/* Live sessions */}
            <View
              style={[
                styles.featureCard,
                {
                  position: 'absolute',
                  left: featureCardMeasures.outerLeft,
                  top: 125 * scale,
                  width: featureCardMeasures.baseWidth,
                  height: 53 * scale,
                  borderRadius: 36 * scale,
                  paddingHorizontal: 15 * scale,
                  gap: 46 * scale,
                },
              ]}
            >
              <Image
                source={require('../assets/images/icon-live.png')}
                style={[
                  styles.featureIcon,
                  {
                    width: 39 * scale,
                    height: 35 * scale,
                    borderRadius: 20 * scale,
                  },
                ]}
                resizeMode="cover"
              />
              <Text
                style={[
                  styles.featureText,
                  { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 18 * scale },
                ]}
              >
                Live sessions
              </Text>
            </View>
          </View>

          {/* Divider Line */}
          <View
            style={[
              styles.divider,
              {
                marginTop: 45 * scale,
                height: 2 * scale,
              },
            ]}
          />

          {/* Phone Input or OTP Input */}
          {!otpSent ? (
            <View
              style={[
                styles.phoneInputContainer,
                {
                  marginTop: 50 * scale,
                  height: 51 * scale,
                  borderRadius: 15 * scale,
                  paddingHorizontal: 10 * scale,
                  gap: 9 * scale,
                },
              ]}
            >
              {/* Indian Flag */}
              <View style={[styles.flagContainer, { width: 40 * scale, height: 25 * scale }]}>
                <IndiaFlag width={40 * scale} height={25 * scale} />
              </View>

              {/* +91 */}
              <Text
                style={[
                  styles.countryCode,
                  { fontFamily: 'Nunito_400Regular', fontSize: 18 * scale },
                ]}
              >
                +91
              </Text>

              {/* Dropdown Arrow */}
              <Text style={{ fontSize: 16 * scale, color: '#000' }}>▼</Text>

              {/* Input */}
              <TextInput
                style={[
                  styles.phoneInput,
                  { fontFamily: 'OpenSans_400Regular', fontSize: 14.78 * scale },
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor="#8c8c8c"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!loading}
              />
            </View>
          ) : (
            <>
              {/* OTP Input */}
              <View
                style={[
                  styles.phoneInputContainer,
                  {
                    marginTop: 50 * scale,
                    height: 51 * scale,
                    borderRadius: 15 * scale,
                    paddingHorizontal: 15 * scale,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.otpInput,
                    { fontFamily: 'OpenSans_400Regular', fontSize: 18 * scale },
                  ]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#8c8c8c"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  editable={!loading}
                />
              </View>

              {/* Resend OTP Link */}
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={loading}
                style={{ marginTop: 12 * scale }}
              >
                <Text
                  style={[
                    styles.resendText,
                    { fontFamily: 'Nunito_700Bold', fontSize: 14 * scale },
                  ]}
                >
                  Resend OTP
                </Text>
              </TouchableOpacity>

              {/* Back to Phone Link */}
              <TouchableOpacity
                onPress={handleBackToPhone}
                disabled={loading}
                style={{ marginTop: 8 * scale }}
              >
                <Text
                  style={[
                    styles.backText,
                    { fontFamily: 'Nunito_400Regular', fontSize: 13 * scale },
                  ]}
                >
                  ← Change Phone Number
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Text
              style={[
                styles.errorText,
                { fontFamily: 'Nunito_400Regular', fontSize: 13 * scale, marginTop: 10 * scale },
              ]}
            >
              {errorMessage}
            </Text>
          )}

          {/* Get OTP / Verify OTP Button */}
          <TouchableOpacity
            style={[
              styles.otpButton,
              {
                marginTop: 26 * scale,
                height: 56 * scale,
                borderRadius: 50 * scale,
                paddingHorizontal: 32 * scale,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            activeOpacity={0.8}
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={[
                  styles.otpButtonText,
                  { fontFamily: 'Lexend_700Bold', fontSize: 22 * scale },
                ]}
              >
                {otpSent ? 'Verify OTP' : 'Get OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <View style={[styles.termsContainer, { marginTop: 17 * scale, marginBottom: 30 * scale }]}>
            <Text
              style={[
                styles.termsText,
                { fontFamily: 'Nunito_400Regular', fontSize: 12 * scale, lineHeight: 18 * scale },
              ]}
            >
              By signing up, you agree to our{' '}
              <Text
                style={[
                  styles.termsLink,
                  { fontFamily: 'Nunito_700Bold' },
                ]}
              >
                Terms of Use
              </Text>{' '}
              and{'\n'}
              <Text
                style={[
                  styles.termsLink,
                  { fontFamily: 'Nunito_700Bold' },
                ]}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 322,
    height: 77,
  },
  featuresContainer: {
    width: '100%',
  },
  featureCard: {
    backgroundColor: 'rgba(0, 150, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  featureIcon: {
    width: 39,
    height: 35,
  },
  featureText: {
    fontSize: 18,
    color: '#000',
  },
  divider: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderStyle: 'dashed',
  },
  phoneInputContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ffcf0d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    width: 40,
    height: 25,
    overflow: 'hidden',
  },
  countryCode: {
    fontSize: 18,
    color: '#000',
  },
  phoneInput: {
    flex: 1,
    fontSize: 14.78,
    color: '#000',
  },
  otpButton: {
    width: '100%',
    backgroundColor: '#2930a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpButtonText: {
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.44,
  },
  termsContainer: {
    width: '70%',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#313131',
    textAlign: 'center',
  },
  termsLink: {
    color: '#2930a6',
    textDecorationLine: 'underline',
  },
  otpInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    letterSpacing: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
  },
  resendText: {
    color: '#2930a6',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  backText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default SignInScreen;

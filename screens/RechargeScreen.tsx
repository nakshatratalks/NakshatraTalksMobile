/**
 * RechargeScreen Component
 * Allows users to select an amount and initiate wallet recharge via Razorpay
 *
 * Design: Premium UI matching app's design language
 * Features:
 * - Balance display in header
 * - Predefined amount options in clean grid
 * - Proceed button to initiate payment
 * - Razorpay checkout integration
 * - Success/error handling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { ChevronLeft, IndianRupee, Check, Shield } from 'lucide-react-native';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { useQueryClient } from '@tanstack/react-query';

import { useWalletData } from '../src/hooks/useWalletData';
import { useRazorpay } from '../src/hooks/useRazorpay';
import { useResponsiveLayout } from '../src/utils/responsive';
import { QUERY_KEYS } from '../src/constants/cacheKeys';
import { BottomNavBar } from '../components/BottomNavBar';

const { width: screenWidth } = Dimensions.get('window');

// Calculate card dimensions for 3-column grid
const HORIZONTAL_PADDING = 20;
const CARD_GAP = 14;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - (CARD_GAP * 2)) / 3;

// Predefined amounts
const DEFAULT_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

interface RechargeScreenProps {
  navigation: any;
}

const RechargeScreen: React.FC<RechargeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { scale } = useResponsiveLayout();
  const queryClient = useQueryClient();

  const { balance, rechargeOptions, refreshBalance } = useWalletData();
  const { processPayment, loading: paymentLoading } = useRazorpay();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  // Get amounts to display (from API or defaults)
  const amounts = rechargeOptions.length > 0
    ? rechargeOptions.map((opt) => opt.amount)
    : DEFAULT_AMOUNTS;

  // Navigate back
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle amount selection
  const handleSelectAmount = useCallback((amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(amount);
  }, []);

  // Handle proceed to payment
  const handleProceed = useCallback(async () => {
    if (!selectedAmount) {
      Alert.alert('Select Amount', 'Please select a recharge amount to proceed.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await processPayment(selectedAmount);

    if (result.success) {
      // Refresh wallet balance
      await refreshBalance();

      // Invalidate wallet queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WALLET_BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WALLET_TRANSACTIONS });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Payment Successful! 🎉',
        `₹${selectedAmount} has been added to your wallet.\n\nNew Balance: ₹${result.newBalance?.toFixed(2)}`,
        [
          {
            text: 'Great!',
            onPress: () => {
              setSelectedAmount(null);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (result.error !== 'Payment was cancelled') {
        Alert.alert('Payment Failed', result.error || 'Something went wrong. Please try again.');
      }
    }
  }, [selectedAmount, processPayment, refreshBalance, queryClient, navigation]);

  // Amount Card Component
  const AmountCard = ({ amount, isSelected }: { amount: number; isSelected: boolean }) => {
    const scaleValue = useSharedValue(1);

    const handlePress = () => {
      scaleValue.value = withSpring(0.94, { damping: 15 }, () => {
        scaleValue.value = withSpring(1, { damping: 15 });
      });
      handleSelectAmount(amount);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.amountCard,
            animatedStyle,
            {
              width: CARD_WIDTH,
              height: CARD_WIDTH * 0.75,
            },
            isSelected && styles.amountCardSelected,
          ]}
        >
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Check size={12 * scale} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
          <View style={styles.amountContent}>
            <IndianRupee
              size={18 * scale}
              color={isSelected ? '#2930A6' : '#555555'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.amountText,
                { fontSize: 22 * scale },
                isSelected && styles.amountTextSelected,
              ]}
            >
              {amount}
            </Text>
          </View>
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

          <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>Recharge Wallet</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { fontSize: 13 * scale }]}>Current Balance</Text>
          <View style={styles.balanceRow}>
            <IndianRupee size={22 * scale} color="#2930A6" strokeWidth={2.5} />
            <Text style={[styles.balanceAmount, { fontSize: 26 * scale }]}>
              {balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 * scale }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
          Select Amount to Add
        </Text>

        {/* Amount Grid */}
        <View style={styles.amountGrid}>
          {amounts.map((amount, index) => (
            <View
              key={amount}
              style={[
                styles.amountCardWrapper,
                (index + 1) % 3 !== 0 && { marginRight: CARD_GAP },
              ]}
            >
              <AmountCard amount={amount} isSelected={selectedAmount === amount} />
            </View>
          ))}
        </View>

        {/* Selected Amount Summary */}
        {selectedAmount && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryLabel, { fontSize: 14 * scale }]}>
                Amount to add
              </Text>
              <View style={styles.summaryAmountRow}>
                <IndianRupee size={20 * scale} color="#2930A6" strokeWidth={2.5} />
                <Text style={[styles.summaryAmount, { fontSize: 24 * scale }]}>
                  {selectedAmount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Proceed Button */}
        <View style={styles.proceedContainer}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              { height: 54 * scale },
              !selectedAmount && styles.proceedButtonDisabled,
            ]}
            onPress={handleProceed}
            disabled={!selectedAmount || paymentLoading}
            activeOpacity={0.85}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.proceedButtonText, { fontSize: 17 * scale }]}>
                {selectedAmount ? `Pay ₹${selectedAmount}` : 'Select an amount'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Shield size={14 * scale} color="#888888" />
          <Text style={[styles.securityText, { fontSize: 11 * scale }]}>
            Secured by Razorpay. Your payment details are encrypted.
          </Text>
        </View>
      </ScrollView>

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
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  balanceContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  balanceLabel: {
    fontFamily: 'Lexend_500Medium',
    color: '#555555',
    marginBottom: 6,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#333333',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amountCardWrapper: {
    marginBottom: CARD_GAP,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountCardSelected: {
    borderColor: '#2930A6',
    backgroundColor: '#F0F2FF',
    shadowColor: '#2930A6',
    shadowOpacity: 0.15,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontFamily: 'Lexend_500Medium',
    color: '#333333',
    marginLeft: 2,
  },
  amountTextSelected: {
    color: '#2930A6',
    fontFamily: 'Lexend_600SemiBold',
  },
  summaryContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontFamily: 'Lexend_500Medium',
    color: '#666666',
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryAmount: {
    fontFamily: 'Lexend_700Bold',
    color: '#2930A6',
    marginLeft: 4,
  },
  proceedContainer: {
    marginTop: 24,
  },
  proceedButton: {
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  proceedButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  securityText: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    marginLeft: 6,
  },
});

export default RechargeScreen;

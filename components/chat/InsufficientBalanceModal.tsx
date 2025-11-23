import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { IndianRupee, Wallet, AlertCircle } from 'lucide-react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

interface InsufficientBalanceModalProps {
  visible: boolean;
  shortfall: number;
  minimumRequired: number;
  currentBalance: number;
  pricePerMinute: number;
  onRecharge: () => void;
  onCancel: () => void;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  visible,
  shortfall,
  minimumRequired,
  currentBalance,
  pricePerMinute,
  onRecharge,
  onCancel,
}) => {
  const { scale } = useResponsiveLayout();
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onCancel}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              width: screenWidth * 0.85,
              borderRadius: 24 * scale,
              padding: 24 * scale,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { marginBottom: 16 * scale }]}>
            <View
              style={[
                styles.iconBackground,
                {
                  width: 64 * scale,
                  height: 64 * scale,
                  borderRadius: 32 * scale,
                },
              ]}
            >
              <Wallet size={32 * scale} color="#2930A6" />
              <View
                style={[
                  styles.alertBadge,
                  {
                    width: 24 * scale,
                    height: 24 * scale,
                    borderRadius: 12 * scale,
                    top: -4 * scale,
                    right: -4 * scale,
                  },
                ]}
              >
                <AlertCircle size={16 * scale} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontSize: 22 * scale, marginBottom: 8 * scale }]}>
            Insufficient Balance
          </Text>

          {/* Message */}
          <Text
            style={[styles.message, { fontSize: 15 * scale, marginBottom: 20 * scale }]}
          >
            You need ₹{shortfall.toFixed(2)} more to start this chat
          </Text>

          {/* Balance Details */}
          <View style={[styles.detailsContainer, { marginBottom: 24 * scale }]}>
            <View style={[styles.detailRow, { marginBottom: 12 * scale }]}>
              <Text style={[styles.detailLabel, { fontSize: 14 * scale }]}>
                Current Balance:
              </Text>
              <View style={styles.detailValue}>
                <IndianRupee size={14 * scale} color="#DC3545" />
                <Text style={[styles.detailText, { fontSize: 14 * scale, color: '#DC3545' }]}>
                  {currentBalance.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.detailRow, { marginBottom: 12 * scale }]}>
              <Text style={[styles.detailLabel, { fontSize: 14 * scale }]}>
                Minimum Required:
              </Text>
              <View style={styles.detailValue}>
                <IndianRupee size={14 * scale} color="#2930A6" />
                <Text style={[styles.detailText, { fontSize: 14 * scale }]}>
                  {minimumRequired.toFixed(2)}
                </Text>
                <Text style={[styles.detailSubtext, { fontSize: 12 * scale }]}>
                  (5 min)
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: 14 * scale }]}>Rate:</Text>
              <View style={styles.detailValue}>
                <IndianRupee size={14 * scale} color="#595959" />
                <Text style={[styles.detailText, { fontSize: 14 * scale }]}>
                  {pricePerMinute.toFixed(2)}/min
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.rechargeButton,
                {
                  height: 50 * scale,
                  borderRadius: 25 * scale,
                  marginBottom: 12 * scale,
                },
              ]}
              onPress={onRecharge}
              activeOpacity={0.8}
            >
              <IndianRupee size={20 * scale} color="#2930A6" />
              <Text style={[styles.rechargeButtonText, { fontSize: 16 * scale }]}>
                Recharge ₹{Math.ceil(shortfall)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  height: 50 * scale,
                  borderRadius: 25 * scale,
                },
              ]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { fontSize: 16 * scale }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
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
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconBackground: {
    backgroundColor: '#FFCF0D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  detailSubtext: {
    fontFamily: 'Lexend_400Regular',
    color: '#999999',
  },
  actionsContainer: {
    width: '100%',
  },
  rechargeButton: {
    backgroundColor: '#FFCF0D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
  },
});

export default InsufficientBalanceModal;

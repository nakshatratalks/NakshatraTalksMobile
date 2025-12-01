/**
 * ZodiacGridModal Component
 * Full-screen modal with 4x3 grid of all zodiac signs
 * For quick selection when user knows their sign
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInDown,
  SlideOutDown,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { ZODIAC_SIGNS, ZODIAC_IMAGES, ZodiacSign } from '../../src/constants/zodiac';
import { useResponsiveLayout } from '../../src/utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZodiacGridModalProps {
  visible: boolean;
  selectedSign: string;
  onClose: () => void;
  onSelectSign: (sign: ZodiacSign) => void;
}

const ZodiacGridItem = React.memo(({
  sign,
  isSelected,
  onPress,
  index,
  scale,
}: {
  sign: ZodiacSign;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  scale: number;
}) => {
  const scaleAnim = useSharedValue(1);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.gridItemContainer}
    >
      <Animated.View
        entering={FadeIn.delay(index * 50).duration(300)}
        style={[
          styles.gridItem,
          animatedStyle,
          isSelected && styles.gridItemSelected,
          { width: 75 * scale, height: 95 * scale },
        ]}
      >
        <View style={[
          styles.imageContainer,
          isSelected && styles.imageContainerSelected,
          { width: 55 * scale, height: 55 * scale, borderRadius: 27.5 * scale },
        ]}>
          <Image
            source={ZODIAC_IMAGES[sign.id]}
            style={[styles.zodiacImage, { width: 40 * scale, height: 40 * scale }]}
            resizeMode="contain"
          />
        </View>
        <Text
          style={[
            styles.signName,
            isSelected && styles.signNameSelected,
            { fontSize: 11 * scale, marginTop: 6 * scale },
          ]}
          numberOfLines={1}
        >
          {sign.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

export const ZodiacGridModal: React.FC<ZodiacGridModalProps> = ({
  visible,
  selectedSign,
  onClose,
  onSelectSign,
}) => {
  const { scale } = useResponsiveLayout();

  const handleSelectSign = useCallback((sign: ZodiacSign) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectSign(sign);
    onClose();
  }, [onSelectSign, onClose]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.cubic))}
          style={[styles.modalContent, { paddingHorizontal: 20 * scale }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: 20 * scale }]}>
              Select Your Sign
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24 * scale} color="#595959" />
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {ZODIAC_SIGNS.map((sign, index) => (
              <ZodiacGridItem
                key={sign.id}
                sign={sign}
                isSelected={sign.id === selectedSign}
                onPress={() => handleSelectSign(sign)}
                index={index}
                scale={scale}
              />
            ))}
          </View>

          {/* Footer hint */}
          <Text style={[styles.footerHint, { fontSize: 12 * scale }]}>
            Tap to select your zodiac sign
          </Text>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20,
    color: '#1a1a1a',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  gridItemContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  gridItemSelected: {
    backgroundColor: 'rgba(255, 207, 13, 0.15)',
    borderWidth: 2,
    borderColor: '#FFCF0D',
  },
  imageContainer: {
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainerSelected: {
    backgroundColor: '#FFF9E6',
    shadowColor: '#FFCF0D',
    shadowOpacity: 0.4,
  },
  zodiacImage: {
    width: 40,
    height: 40,
  },
  signName: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 11,
    color: '#595959',
    textAlign: 'center',
  },
  signNameSelected: {
    color: '#2930A6',
    fontFamily: 'Lexend_600SemiBold',
  },
  footerHint: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ZodiacGridModal;

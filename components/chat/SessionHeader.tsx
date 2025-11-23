import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { ChevronLeft, MoreVertical, IndianRupee } from 'lucide-react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';
import NotificationService from '../../src/utils/notificationService';

interface SessionHeaderProps {
  astrologerName: string;
  duration: number; // in seconds
  pricePerMinute: number;
  onBack: () => void;
  onEndSession: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  astrologerName,
  duration,
  pricePerMinute,
  onBack,
  onEndSession,
}) => {
  const { scale } = useResponsiveLayout();
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackPress = () => {
    NotificationService.confirm({
      title: 'End Session?',
      message: 'Are you sure you want to end this session and go back?',
      confirmText: 'End Session',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: () => {
        onEndSession();
        onBack();
      },
    });
  };

  const handleMenuPress = () => {
    NotificationService.confirm({
      title: 'End Session',
      message: 'Do you want to end this chat session?',
      confirmText: 'End Session',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: onEndSession,
    });
  };

  const animateButton = (
    anim: Animated.Value,
    toValue: number,
    callback?: () => void
  ) => {
    Animated.spring(anim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(callback);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View
        style={[
          styles.headerRow,
          {
            paddingHorizontal: 16 * scale,
            paddingTop: 12 * scale,
            paddingBottom: 12 * scale,
            minHeight: 56 * scale,
          },
        ]}
      >
        {/* Back Button */}
        <View style={[styles.leftSection, { width: 40 * scale }]}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { width: 40 * scale, height: 40 * scale },
              ]}
              onPress={handleBackPress}
              onPressIn={() => animateButton(backButtonScale, 0.85)}
              onPressOut={() => animateButton(backButtonScale, 1)}
              activeOpacity={1}
            >
              <ChevronLeft size={24 * scale} color="#595959" strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Astrologer Name */}
        <View style={styles.centerSection}>
          <Text
            style={[styles.astrologerName, { fontSize: 18 * scale }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {astrologerName}
          </Text>
        </View>

        {/* Menu Button */}
        <View style={[styles.rightSection, { width: 40 * scale }]}>
          <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { width: 40 * scale, height: 40 * scale },
              ]}
              onPress={handleMenuPress}
              onPressIn={() => animateButton(menuButtonScale, 0.85)}
              onPressOut={() => animateButton(menuButtonScale, 1)}
              activeOpacity={1}
            >
              <MoreVertical size={20 * scale} color="#595959" strokeWidth={1.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Timer & Price Ribbon */}
      <View
        style={[
          styles.ribbon,
          {
            paddingHorizontal: 16 * scale,
            paddingVertical: 10 * scale,
            marginHorizontal: 16 * scale,
            marginBottom: 8 * scale,
            borderRadius: 12 * scale,
          },
        ]}
      >
        <View style={styles.ribbonContent}>
          {/* Duration */}
          <View style={styles.ribbonItem}>
            <View
              style={[
                styles.activeIndicator,
                {
                  width: 8 * scale,
                  height: 8 * scale,
                  borderRadius: 4 * scale,
                  marginRight: 8 * scale,
                },
              ]}
            />
            <Text style={[styles.ribbonText, { fontSize: 15 * scale }]}>
              {formatDuration(duration)}
            </Text>
          </View>

          <View
            style={[
              styles.ribbonDivider,
              { width: 1 * scale, height: 16 * scale, marginHorizontal: 12 * scale },
            ]}
          />

          {/* Rate */}
          <View style={styles.ribbonItem}>
            <IndianRupee size={14 * scale} color="#2930A6" strokeWidth={2} />
            <Text style={[styles.ribbonTextBold, { fontSize: 15 * scale }]}>
              {pricePerMinute}
            </Text>
            <Text style={[styles.ribbonTextSmall, { fontSize: 13 * scale, marginLeft: 2 * scale }]}>
              /min
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#595959',
    textAlign: 'center',
  },
  ribbon: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.1)',
  },
  ribbonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ribbonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeIndicator: {
    backgroundColor: '#28A745',
  },
  ribbonText: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
  },
  ribbonTextBold: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  ribbonTextSmall: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  ribbonDivider: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default SessionHeader;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Dimensions } from 'react-native';
import { Notifier, NotifierComponents, Easing } from 'react-native-notifier';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

// Color constants matching the app theme
const COLORS = {
  primary: '#2930A6',
  secondary: '#FFCF0D',
  success: '#10B981',
  error: '#DC3545',
  warning: '#FFA500',
  info: '#2930A6',
  text: {
    dark: '#000000',
    medium: '#595959',
    light: '#666666',
  },
  background: {
    white: '#FFFFFF',
    light: '#F8F9FA',
  },
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  swipeEnabled?: boolean;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmColor?: string;
  destructive?: boolean;
}

// ActionSheet configuration
interface ActionSheetOption {
  text: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetConfig {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelText?: string;
  onCancel?: () => void;
}

// Custom notification component
const CustomNotification = ({
  type,
  title,
  message,
  onHide,
}: {
  type: NotificationType;
  title?: string;
  message: string;
  onHide?: () => void;
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { Icon: CheckCircle, color: COLORS.success, bgColor: '#D1FAE5' };
      case 'error':
        return { Icon: AlertCircle, color: COLORS.error, bgColor: '#FEE2E2' };
      case 'warning':
        return { Icon: AlertTriangle, color: COLORS.warning, bgColor: '#FEF3C7' };
      case 'info':
        return { Icon: Info, color: COLORS.info, bgColor: '#DBEAFE' };
      default:
        return { Icon: Info, color: COLORS.info, bgColor: '#DBEAFE' };
    }
  };

  const { Icon, color, bgColor } = getIconAndColor();

  return (
    <View style={styles.notificationContainer}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.contentContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
      {onHide && (
        <TouchableOpacity
          onPress={onHide}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={COLORS.text.light} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Singleton to manage confirmation modal state
class ConfirmationManager {
  private static instance: ConfirmationManager;
  private listeners: Array<(config: ConfirmConfig | null) => void> = [];

  private constructor() {}

  static getInstance(): ConfirmationManager {
    if (!ConfirmationManager.instance) {
      ConfirmationManager.instance = new ConfirmationManager();
    }
    return ConfirmationManager.instance;
  }

  subscribe(listener: (config: ConfirmConfig | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(config: ConfirmConfig) {
    this.listeners.forEach(listener => listener(config));
  }

  hide() {
    this.listeners.forEach(listener => listener(null));
  }
}

// Singleton to manage action sheet state
class ActionSheetManager {
  private static instance: ActionSheetManager;
  private listeners: Array<(config: ActionSheetConfig | null) => void> = [];

  private constructor() {}

  static getInstance(): ActionSheetManager {
    if (!ActionSheetManager.instance) {
      ActionSheetManager.instance = new ActionSheetManager();
    }
    return ActionSheetManager.instance;
  }

  subscribe(listener: (config: ActionSheetConfig | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(config: ActionSheetConfig) {
    this.listeners.forEach(listener => listener(config));
  }

  hide() {
    this.listeners.forEach(listener => listener(null));
  }
}

// Confirmation Modal Component
export const ConfirmationModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  useEffect(() => {
    const manager = ConfirmationManager.getInstance();
    const unsubscribe = manager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  const handleConfirm = () => {
    const onConfirm = config?.onConfirm;
    setConfig(null);
    setTimeout(() => onConfirm?.(), 100);
  };

  const handleCancel = () => {
    const onCancel = config?.onCancel;
    setConfig(null);
    setTimeout(() => onCancel?.(), 100);
  };

  return (
    <>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancel}
        >
          <Pressable
            style={styles.dialogContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.dialogTitle}>{config?.title}</Text>
            <Text style={styles.dialogMessage}>{config?.message}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>
                  {config?.cancelText || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  styles.confirmButton,
                  {
                    backgroundColor: config?.destructive
                      ? COLORS.error
                      : (config?.confirmColor || COLORS.primary)
                  },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>
                  {config?.confirmText || 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// Action Sheet Provider Component
export const ActionSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ActionSheetConfig | null>(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const manager = ActionSheetManager.getInstance();
    const unsubscribe = manager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (config) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [config]);

  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const onCancel = config?.onCancel;
      setConfig(null);
      onCancel?.();
    });
  };

  const handleOptionPress = (option: ActionSheetOption) => {
    // Animate out then call handler
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setConfig(null);
      setTimeout(() => option.onPress(), 50);
    });
  };

  return (
    <>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.actionSheetOverlay}>
          {/* Background overlay */}
          <Animated.View
            style={[
              styles.actionSheetBackdrop,
              { opacity: fadeAnim }
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          {/* Bottom sheet */}
          <Animated.View
            style={[
              styles.actionSheetContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
            {(config?.title || config?.message) && (
              <View style={styles.actionSheetHeader}>
                {config?.title && (
                  <Text style={styles.actionSheetTitle}>{config.title}</Text>
                )}
                {config?.message && (
                  <Text style={styles.actionSheetMessage}>{config.message}</Text>
                )}
              </View>
            )}

            {/* Options */}
            <View style={styles.actionSheetOptions}>
              {config?.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionSheetOption,
                    index > 0 && styles.actionSheetOptionBorder,
                  ]}
                  onPress={() => handleOptionPress(option)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.actionSheetOptionText,
                      option.destructive && styles.actionSheetOptionTextDestructive,
                    ]}
                  >
                    {option.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={handleClose}
              activeOpacity={0.6}
            >
              <Text style={styles.actionSheetCancelText}>
                {config?.cancelText || 'Cancel'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

class NotificationService {
  /**
   * Show a simple notification toast
   */
  static show({ type, title, message, duration = 3000, swipeEnabled = true }: NotificationConfig) {
    Notifier.showNotification({
      title: title || '',
      description: message,
      duration,
      showAnimationDuration: 300,
      showEasing: Easing.bounce,
      hideAnimationDuration: 300,
      hideOnPress: true,
      swipeEnabled,
      Component: ({ onHide }: { onHide?: () => void }) => (
        <CustomNotification type={type} title={title} message={message} onHide={onHide} />
      ),
    });
  }

  /**
   * Show a success notification
   */
  static success(message: string, title?: string, duration?: number) {
    this.show({ type: 'success', title, message, duration });
  }

  /**
   * Show an error notification
   */
  static error(message: string, title?: string, duration?: number) {
    this.show({ type: 'error', title, message, duration: duration || 4000 });
  }

  /**
   * Show a warning notification
   */
  static warning(message: string, title?: string, duration?: number) {
    this.show({ type: 'warning', title, message, duration: duration || 4000 });
  }

  /**
   * Show an info notification
   */
  static info(message: string, title?: string, duration?: number) {
    this.show({ type: 'info', title, message, duration });
  }

  /**
   * Show a confirmation dialog (centered modal)
   */
  static confirm(config: ConfirmConfig) {
    ConfirmationManager.getInstance().show(config);
  }

  /**
   * Show an action sheet (bottom sheet with options)
   */
  static actionSheet(config: ActionSheetConfig) {
    ActionSheetManager.getInstance().show(config);
  }

  /**
   * Hide all notifications
   */
  static hideAll() {
    Notifier.hideNotification();
    ConfirmationManager.getInstance().hide();
    ActionSheetManager.getInstance().hide();
  }

  /**
   * Clear all notifications from queue
   */
  static clearQueue() {
    Notifier.clearQueue();
  }
}

const styles = StyleSheet.create({
  // Notification toast styles
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Lexend-SemiBold',
    color: COLORS.text.dark,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text.medium,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },

  // Centered confirmation modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    backgroundColor: COLORS.background.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  dialogTitle: {
    fontSize: 20,
    fontFamily: 'Lexend-Bold',
    color: COLORS.text.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text.medium,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background.light,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend-SemiBold',
    color: COLORS.text.medium,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend-SemiBold',
    color: COLORS.background.white,
  },

  // Action Sheet styles
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingBottom: 34,
  },
  actionSheetHeader: {
    backgroundColor: COLORS.background.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  actionSheetTitle: {
    fontSize: 14,
    fontFamily: 'Lexend_600SemiBold',
    color: COLORS.text.medium,
    textAlign: 'center',
  },
  actionSheetMessage: {
    fontSize: 13,
    fontFamily: 'Lexend_400Regular',
    color: COLORS.text.light,
    textAlign: 'center',
    marginTop: 4,
  },
  actionSheetOptions: {
    backgroundColor: COLORS.background.white,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  actionSheetOption: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionSheetOptionText: {
    fontSize: 18,
    fontFamily: 'Lexend_500Medium',
    color: COLORS.primary,
  },
  actionSheetOptionTextDestructive: {
    color: COLORS.error,
  },
  actionSheetCancel: {
    backgroundColor: COLORS.background.white,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionSheetCancelText: {
    fontSize: 18,
    fontFamily: 'Lexend_600SemiBold',
    color: COLORS.text.dark,
  },
});

export default NotificationService;

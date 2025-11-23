import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  AppState,
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
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useChatSession } from '../src/hooks/useChatSession';
import { ChatSession, Astrologer, ChatMessage } from '../src/types/api.types';
import SessionHeader from '../components/chat/SessionHeader';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import DateSeparator from '../components/chat/DateSeparator';
import TypingIndicator from '../components/chat/TypingIndicator';
import SessionEndModal from '../components/chat/SessionEndModal';
import { chatService } from '../src/services';
import NotificationService from '../src/utils/notificationService';

interface ChatInterfaceScreenProps {
  navigation: any;
  route: {
    params: {
      session: ChatSession;
      astrologer: Astrologer;
    };
  };
}

const ChatInterfaceScreen: React.FC<ChatInterfaceScreenProps> = ({
  navigation,
  route,
}) => {
  const { session: initialSession, astrologer } = route.params;

  const {
    session,
    messages,
    loading,
    sending,
    duration,
    sessionCost,
    remainingBalance,
    sendMessage,
    endSession,
  } = useChatSession({
    initialSession,
    astrologer,
    onSessionEnd: () => {
      setShowEndModal(true);
    },
  });

  const { scale } = useResponsiveLayout();
  const [showEndModal, setShowEndModal] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inactivityWarningShown = useRef(false);
  const lastContinuationPromptTime = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Entrance animations
  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handle app background/close - end session
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background
        if (session?.status === 'active') {
          console.log('App backgrounded, ending session');
          endSession();
        }
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [session?.status, endSession]);

  // Component unmount cleanup - only when component is actually destroyed
  useEffect(() => {
    return () => {
      // Only end session on actual unmount, not on focus loss
      // This prevents triggering on keyboard open, modal open, etc.
      if (session?.status === 'active') {
        console.log('Component unmounting, ending session');
        endSession();
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Handle hardware/gesture back button
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // If session is not active, allow navigation
      if (session?.status !== 'active') {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation dialog
      NotificationService.confirm({
        title: 'End Session?',
        message: 'Are you sure you want to end this session and go back?',
        confirmText: 'End Session',
        cancelText: 'Cancel',
        destructive: true,
        onConfirm: async () => {
          try {
            await endSession();
          } catch (error) {
            console.error('Error ending session on back:', error);
          } finally {
            // Dispatch the action we blocked earlier
            navigation.dispatch(e.data.action);
          }
        },
      });
    });

    return unsubscribe;
  }, [navigation, session?.status, endSession]);

  // Update last activity time when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setLastActivityTime(Date.now());
      inactivityWarningShown.current = false;
    }
  }, [messages.length]);

  // Inactivity timer - auto-end after 5 minutes of no activity
  useEffect(() => {
    if (session?.status !== 'active') return;

    const inactivityTimer = setInterval(() => {
      const inactiveMinutes = (Date.now() - lastActivityTime) / 1000 / 60;

      // Show warning at 4.5 minutes
      if (inactiveMinutes >= 4.5 && !inactivityWarningShown.current) {
        inactivityWarningShown.current = true;
        NotificationService.warning(
          'Session will end in 30 seconds due to inactivity',
          'Inactivity Warning',
          5000
        );
      }

      // Auto-end at 5 minutes
      if (inactiveMinutes >= 5) {
        console.log('Session auto-ended due to inactivity');
        NotificationService.info(
          'Your session has ended due to inactivity',
          'Session Ended',
          4000
        );
        endSession();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(inactivityTimer);
  }, [session?.status, lastActivityTime, endSession]);

  // Periodic session continuation prompt - every 5 minutes
  useEffect(() => {
    if (session?.status !== 'active') return;

    const continuationTimer = setInterval(() => {
      const timeSinceLastPrompt = (Date.now() - lastContinuationPromptTime.current) / 1000 / 60;

      // Ask every 5 minutes
      if (timeSinceLastPrompt >= 5) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);

        lastContinuationPromptTime.current = Date.now();

        NotificationService.confirm({
          title: 'Continue Session?',
          message: `You've been chatting for ${sessionDuration} minute${
            sessionDuration !== 1 ? 's' : ''
          }. Would you like to continue?`,
          confirmText: 'Continue',
          cancelText: 'End Session',
          onConfirm: () => {
            // Reset activity time to prevent inactivity timeout
            setLastActivityTime(Date.now());
            console.log('User chose to continue session');
          },
          onCancel: async () => {
            console.log('User chose to end session');
            await endSession();
          },
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(continuationTimer);
  }, [session?.status, sessionStartTime, endSession]);

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};

    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for message:', msg.createdAt);
        // Use "Today" as fallback
        if (!groups['Today']) {
          groups['Today'] = [];
        }
        groups['Today'].push(msg);
        return;
      }

      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const dateKey = isToday
        ? 'Today'
        : date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
          });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Flatten messages with date separators
  const renderData: Array<{ type: 'date'; date: string } | { type: 'message'; message: ChatMessage }> = [];

  Object.keys(messageGroups).forEach((dateKey) => {
    renderData.push({ type: 'date', date: dateKey });
    messageGroups[dateKey].forEach((msg) => {
      renderData.push({ type: 'message', message: msg });
    });
  });

  // Handle rating submission
  const handleRating = async (rating: number, review: string, tags: string[]) => {
    try {
      if (session?.id) {
        await chatService.rateSession(session.id, rating, review, tags);
      }
      setShowEndModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error rating session:', error);
      setShowEndModal(false);
      navigation.goBack();
    }
  };

  const handleBack = async () => {
    // This is called after user confirms in SessionHeader
    // End the session before navigating back
    if (session?.status === 'active') {
      try {
        await endSession();
      } catch (error) {
        console.error('Error ending session on back:', error);
      }
    }
    navigation.goBack();
  };

  // Transform snake_case API response to camelCase
  const transformMessage = (msg: any): ChatMessage => {
    return {
      ...msg,
      // Transform snake_case to camelCase
      createdAt: msg.createdAt || msg.created_at,
      senderType: msg.senderType || msg.sender_type,
      senderId: msg.senderId || msg.sender_id,
      sessionId: msg.sessionId || msg.session_id,
      isRead: msg.isRead ?? msg.is_read,
    };
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.date} />;
    }

    const rawMessage = item.message;
    const message = transformMessage(rawMessage);
    const senderType = message.senderType;
    const isUser = senderType === 'user';

    // Debug logging to verify sender identification
    if (__DEV__) {
      console.log('Message:', {
        text: message.message,
        senderType: senderType,
        isUser: isUser,
        createdAt: message.createdAt,
        transformed: message,
      });
    }

    // Check if consecutive message from same sender
    const prevItem = index > 0 ? renderData[index - 1] : null;
    const prevMessage = prevItem?.type === 'message'
      ? transformMessage(prevItem.message)
      : null;
    const prevSenderType = prevMessage?.senderType;
    const isConsecutive =
      prevItem &&
      prevItem.type === 'message' &&
      prevSenderType === senderType;

    return (
      <MessageBubble
        message={message}
        isUser={isUser}
        showTimestamp={true}
        isConsecutive={isConsecutive}
      />
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <SessionHeader
              astrologerName={astrologer.name}
              duration={duration}
              pricePerMinute={session?.pricePerMinute || astrologer.pricePerMinute}
              onBack={handleBack}
              onEndSession={endSession}
            />

            {/* Messages Area */}
            <View style={styles.messagesContainer}>
              {loading && messages.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2930A6" />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={renderData}
                  renderItem={renderItem}
                  keyExtractor={(item, index) =>
                    item.type === 'date'
                      ? `date-${item.date}`
                      : `message-${item.message.id || index}`
                  }
                  contentContainerStyle={[
                    styles.messagesList,
                    {
                      paddingHorizontal: 4 * scale,
                      paddingTop: 12 * scale,
                      paddingBottom: 16 * scale,
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                  ListFooterComponent={showTyping ? <TypingIndicator /> : null}
                />
              )}
            </View>

            {/* Input Area */}
            <MessageInput
              onSend={sendMessage}
              disabled={session?.status !== 'active'}
              sending={sending}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Session End Modal */}
      {session && (
        <SessionEndModal
          visible={showEndModal}
          session={session}
          totalCost={session.totalCost || sessionCost}
          duration={(session.duration || duration / 60)}
          remainingBalance={remainingBalance}
          onRate={handleRating}
          onClose={() => {
            setShowEndModal(false);
            navigation.goBack();
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  messagesList: {
    flexGrow: 1,
  },
});

export default ChatInterfaceScreen;

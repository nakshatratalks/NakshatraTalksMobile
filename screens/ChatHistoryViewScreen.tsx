/**
 * Chat History View Screen
 * Displays past chat messages from a completed session (read-only)
 * Features: Skeleton loading, entrance animations, native mobile UX
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  TouchableOpacity,
  Easing,
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
import {
  ChevronLeft,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useChatHistoryView } from '../src/hooks/useChatHistoryView';
import { ChatMessage } from '../src/types/api.types';
import MessageBubble from '../components/chat/MessageBubble';
import DateSeparator from '../components/chat/DateSeparator';
import { ChatHistoryViewSkeleton } from '../components/skeleton';

interface ChatHistoryViewScreenProps {
  navigation: any;
  route: {
    params: {
      sessionId: string;
      astrologerName: string;
      astrologerImage?: string;
    };
  };
}

const ChatHistoryViewScreen = ({
  navigation,
  route,
}: ChatHistoryViewScreenProps) => {
  const { sessionId, astrologerName, astrologerImage } = route.params;

  const {
    session,
    messages,
    loading,
    error,
  } = useChatHistoryView(sessionId);

  const { scale } = useResponsiveLayout();
  const flatListRef = useRef<FlatList>(null);

  // Screen entrance animations
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-20)).current;
  const summaryScaleAnim = useRef(new Animated.Value(0.9)).current;
  const summaryOpacityAnim = useRef(new Animated.Value(0)).current;
  const messagesSlideAnim = useRef(new Animated.Value(30)).current;
  const messagesOpacityAnim = useRef(new Animated.Value(0)).current;

  // Back button press animation
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Screen entrance animation on mount
  useEffect(() => {
    if (fontsLoaded) {
      // Phase 1: Fade in screen and slide header
      Animated.parallel([
        Animated.timing(screenFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  // Summary card animation when session loads
  useEffect(() => {
    if (session && !loading) {
      Animated.parallel([
        Animated.spring(summaryScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(summaryOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [session, loading]);

  // Messages animation when they load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      Animated.parallel([
        Animated.timing(messagesSlideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(messagesOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [messages, loading]);

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '0 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sec`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};

    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt);

      if (isNaN(date.getTime())) {
        if (!groups['Messages']) {
          groups['Messages'] = [];
        }
        groups['Messages'].push(msg);
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
            month: 'short',
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

  // Transform snake_case API response to camelCase
  const transformMessage = (msg: any): ChatMessage => {
    return {
      ...msg,
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

    // Check if consecutive message from same sender
    const prevItem = index > 0 ? renderData[index - 1] : null;
    const prevMessage = prevItem?.type === 'message'
      ? transformMessage(prevItem.message)
      : null;
    const prevSenderType = prevMessage?.senderType;
    const isConsecutive = Boolean(
      prevItem &&
      prevItem.type === 'message' &&
      prevSenderType === senderType
    );

    return (
      <MessageBubble
        message={message}
        isUser={isUser}
        showTimestamp={true}
        isConsecutive={isConsecutive}
      />
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleBackPressIn = () => {
    Animated.spring(backButtonScale, {
      toValue: 0.9,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleBackPressOut = () => {
    Animated.spring(backButtonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View
          style={[
            styles.container,
            { opacity: screenFadeAnim },
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerContainer,
              { transform: [{ translateY: headerSlideAnim }] },
            ]}
          >
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
              <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    { width: 40 * scale, height: 40 * scale },
                  ]}
                  onPress={handleBack}
                  onPressIn={handleBackPressIn}
                  onPressOut={handleBackPressOut}
                  activeOpacity={1}
                >
                  <ChevronLeft size={24 * scale} color="#595959" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>

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

              {/* Spacer for balance */}
              <View style={{ width: 40 * scale }} />
            </View>

            {/* Session Summary Card */}
            {session && (
              <Animated.View
                style={[
                  styles.summaryCard,
                  {
                    marginHorizontal: 16 * scale,
                    marginBottom: 12 * scale,
                    padding: 12 * scale,
                    borderRadius: 12 * scale,
                    opacity: summaryOpacityAnim,
                    transform: [{ scale: summaryScaleAnim }],
                  },
                ]}
              >
                <View style={styles.summaryRow}>
                  {/* Date */}
                  <View style={styles.summaryItem}>
                    <Calendar size={14 * scale} color="#595959" strokeWidth={2} />
                    <Text style={[styles.summaryText, { fontSize: 12 * scale, marginLeft: 4 * scale }]}>
                      {formatDate(session.startTime)}
                    </Text>
                  </View>

                  <View style={[styles.summaryDivider, { height: 16 * scale, marginHorizontal: 10 * scale }]} />

                  {/* Duration */}
                  <View style={styles.summaryItem}>
                    <Clock size={14 * scale} color="#595959" strokeWidth={2} />
                    <Text style={[styles.summaryText, { fontSize: 12 * scale, marginLeft: 4 * scale }]}>
                      {formatDuration(session.duration)}
                    </Text>
                  </View>

                  <View style={[styles.summaryDivider, { height: 16 * scale, marginHorizontal: 10 * scale }]} />

                  {/* Cost */}
                  <View style={styles.summaryItem}>
                    <IndianRupee size={14 * scale} color="#2930A6" strokeWidth={2} />
                    <Text style={[styles.summaryTextBold, { fontSize: 12 * scale }]}>
                      {session.totalCost?.toFixed(2) || '0.00'}
                    </Text>
                  </View>

                  <View style={[styles.summaryDivider, { height: 16 * scale, marginHorizontal: 10 * scale }]} />

                  {/* Status */}
                  <View style={styles.summaryItem}>
                    <CheckCircle2 size={14 * scale} color="#28A745" strokeWidth={2} />
                    <Text style={[styles.summaryStatusText, { fontSize: 12 * scale, marginLeft: 4 * scale }]}>
                      {session.status === 'completed' ? 'Completed' : session.status}
                    </Text>
                  </View>
                </View>

                {/* Time Range */}
                <View style={[styles.timeRangeRow, { marginTop: 8 * scale }]}>
                  <Text style={[styles.timeRangeText, { fontSize: 11 * scale }]}>
                    {formatTime(session.startTime)} - {formatTime(session.endTime || undefined)}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Messages Area */}
          <View style={styles.messagesContainer}>
            {loading ? (
              <ChatHistoryViewSkeleton scale={scale} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { fontSize: 14 * scale }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { marginTop: 12 * scale, paddingHorizontal: 20 * scale, paddingVertical: 10 * scale, borderRadius: 20 * scale }]}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.retryButtonText, { fontSize: 14 * scale }]}>
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { fontSize: 14 * scale }]}>
                  No messages in this session
                </Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.messagesWrapper,
                  {
                    opacity: messagesOpacityAnim,
                    transform: [{ translateY: messagesSlideAnim }],
                  },
                ]}
              >
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
                      paddingBottom: 24 * scale,
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                />
              </Animated.View>
            )}
          </View>

          {/* Read-only indicator at bottom */}
          <View style={[styles.readOnlyBar, { paddingVertical: 12 * scale, paddingHorizontal: 16 * scale }]}>
            <Text style={[styles.readOnlyText, { fontSize: 12 * scale }]}>
              This is a past conversation. You cannot send new messages.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#595959',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  summaryTextBold: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6',
  },
  summaryStatusText: {
    fontFamily: 'Lexend_500Medium',
    color: '#28A745',
    textTransform: 'capitalize',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  timeRangeRow: {
    alignItems: 'center',
  },
  timeRangeText: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  messagesWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  loadingText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    color: '#DC3545',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2930A6',
  },
  retryButtonText: {
    fontFamily: 'Lexend_500Medium',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  emptyText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  messagesList: {
    flexGrow: 1,
  },
  readOnlyBar: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  readOnlyText: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    textAlign: 'center',
  },
});

export default ChatHistoryViewScreen;

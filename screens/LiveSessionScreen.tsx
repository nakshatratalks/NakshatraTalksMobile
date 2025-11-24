import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  AppState,
  Alert,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import {
  X,
  Send,
  Eye,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveLayout } from '../src/utils/responsive';
import { liveSessionService } from '../src/services';
import { useAuth } from '../src/contexts/AuthContext';
import NotificationService from '../src/utils/notificationService';
import { handleApiError } from '../src/utils/errorHandler';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../src/config/api.config';
import { SkeletonBox } from '../components/skeleton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Live Session interface
interface LiveSession {
  id: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage: string;
  title: string;
  description?: string;
  viewerCount: number;
  startTime: string;
  endTime?: string | null;
  status: 'scheduled' | 'live' | 'ended';
  thumbnailUrl?: string;
  streamUrl?: string;
  twilioRoomSid?: string;
  twilioRoomName?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: 'text' | 'emoji' | 'system';
  createdAt: string;
}

const LiveSessionScreen = ({ navigation, route }: any) => {
  const { sessionId } = route?.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const uiOpacityAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  const { scale } = useResponsiveLayout();

  // Fade in animation on mount
  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [fontsLoaded]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        Animated.timing(keyboardHeightAnim, {
          toValue: height,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        Animated.timing(keyboardHeightAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Load live sessions
  useEffect(() => {
    loadLiveSessions();
  }, []);

  // Setup WebSocket
  useEffect(() => {
    if (sessions.length > 0 && currentIndex < sessions.length) {
      const currentSession = sessions[currentIndex];
      setupWebSocket(currentSession.id);
      joinSession(currentSession.id);
      loadMessages(currentSession.id);
    }

    return () => {
      cleanup();
    };
  }, [currentIndex, sessions.length]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [currentIndex, sessions]);

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setTimeout(() => {
        setRateLimitSeconds(rateLimitSeconds - 1);
        if (rateLimitSeconds === 1) {
          setCanSendMessage(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitSeconds]);

  const handleAppStateChange = async (nextAppState: any) => {
    if (
      appState.current.match(/active/) &&
      nextAppState === 'background' &&
      sessions.length > 0
    ) {
      // App going to background - leave session
      await leaveCurrentSession();
    }
    appState.current = nextAppState;
  };

  const loadLiveSessions = async () => {
    try {
      setLoading(true);
      const liveSessions = await liveSessionService.getLiveSessions(20);

      if (liveSessions.length === 0) {
        NotificationService.error('No live sessions available at the moment');
        navigation.goBack();
        return;
      }

      setSessions(liveSessions);

      // If sessionId was passed, find and set that session as current
      if (sessionId) {
        const index = liveSessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
    } catch (error: any) {
      console.error('Error loading live sessions:', error);
      handleApiError(error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (sessionId: string) => {
    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const socket = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Join room
    socket.emit('live:join-room', {
      sessionId,
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest',
    });

    // Listen for new messages
    socket.on('live:message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Listen for viewer count updates
    socket.on('live:viewer-count', (data: { sessionId: string; viewerCount: number }) => {
      setSessions(prev =>
        prev.map(s =>
          s.id === data.sessionId
            ? { ...s, viewerCount: data.viewerCount }
            : s
        )
      );
    });

    // Listen for session end
    socket.on('live:session-end', (data: { sessionId: string }) => {
      NotificationService.error('This live session has ended');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    });

    // Connection error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  };

  const joinSession = async (sessionId: string) => {
    try {
      const response = await liveSessionService.joinSession(sessionId);
      console.log('Joined session:', response);
      // TODO: Connect to Twilio Video with response.twilioToken
    } catch (error: any) {
      console.error('Error joining session:', error);
      handleApiError(error);
    }
  };

  const leaveCurrentSession = async () => {
    if (sessions.length === 0 || currentIndex >= sessions.length) return;

    const currentSession = sessions[currentIndex];

    try {
      // Emit leave event via socket
      if (socketRef.current) {
        socketRef.current.emit('live:leave-room', {
          sessionId: currentSession.id,
          userId: user?.id || 'guest',
          userName: user?.name || 'Guest',
        });
      }

      // Call leave API
      await liveSessionService.leaveSession(currentSession.id);
    } catch (error: any) {
      console.error('Error leaving session:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const messages = await liveSessionService.getSessionMessages(sessionId, 50);
      setChatMessages(messages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !canSendMessage || sending) return;

    const currentSession = sessions[currentIndex];
    const messageText = chatInput.trim();

    try {
      setSending(true);
      await liveSessionService.sendMessage(currentSession.id, messageText);
      setChatInput('');
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        setRateLimitSeconds(retryAfter);
        setCanSendMessage(false);
        NotificationService.error(`Please wait ${retryAfter} seconds before sending more messages.`);
      } else {
        handleApiError(error);
      }
    } finally {
      setSending(false);
    }
  };

  const cleanup = async () => {
    await leaveCurrentSession();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleClose = async () => {
    await cleanup();
    navigation.goBack();
  };

  // Toggle UI visibility with tap
  const handleScreenTap = () => {
    // Dismiss keyboard if open
    if (keyboardHeight > 0) {
      Keyboard.dismiss();
      return;
    }

    const toValue = uiVisible ? 0 : 1;
    setUiVisible(!uiVisible);

    Animated.timing(uiOpacityAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Format viewer count
  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}k`;
    }
    return count.toString();
  };

  // Handle viewable items change for vertical scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      if (newIndex !== currentIndex) {
        // Leave current session
        leaveCurrentSession();
        setCurrentIndex(newIndex);
        setChatMessages([]);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonBox width="100%" height="100%" borderRadius={0} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  // Render individual live session
  const renderLiveSession = ({ item, index }: { item: LiveSession; index: number }) => (
    <TouchableWithoutFeedback onPress={handleScreenTap}>
      <View style={styles.sessionContainer}>
        {/* Background Video/Image */}
        <Image
          source={
            item.thumbnailUrl
              ? { uri: item.thumbnailUrl }
              : require('../assets/images/astrologer3.jpg')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topGradient}
        />

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}
        />

        {/* Top Info Bar */}
        <Animated.View
          style={[
            styles.topBar,
            {
              paddingHorizontal: 16 * scale,
              paddingTop: 10 * scale,
              opacity: uiOpacityAnim,
            }
          ]}
        >
          <View style={styles.leftTopSection}>
            {/* LIVE Badge */}
            <View style={[styles.liveBadge, {
              paddingHorizontal: 10 * scale,
              paddingVertical: 6 * scale,
              borderRadius: 6 * scale,
            }]}>
              <View style={[styles.liveDot, {
                width: 6 * scale,
                height: 6 * scale,
                borderRadius: 3 * scale,
              }]} />
              <Text style={[styles.liveText, { fontSize: 11 * scale, marginLeft: 4 * scale }]}>
                LIVE
              </Text>
            </View>

            {/* Astrologer Info Card */}
            <View style={[styles.astrologerInfo, {
              paddingHorizontal: 10 * scale,
              paddingVertical: 6 * scale,
              borderRadius: 50 * scale,
              marginLeft: 8 * scale,
            }]}>
              <View style={[styles.astrologerAvatar, {
                width: 32 * scale,
                height: 32 * scale,
                borderRadius: 16 * scale,
              }]}>
                <Image
                  source={
                    item.astrologerImage
                      ? { uri: item.astrologerImage }
                      : require('../assets/images/astrologer1.png')
                  }
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.astrologerDetails}>
                <Text style={[styles.astrologerName, { fontSize: 13 * scale }]} numberOfLines={1}>
                  {item.astrologerName}
                </Text>
                <View style={styles.viewerRow}>
                  <Eye size={10 * scale} color="#FFFFFF" />
                  <Text style={[styles.viewerCount, { fontSize: 11 * scale, marginLeft: 3 * scale }]}>
                    {formatViewerCount(item.viewerCount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, {
              width: 36 * scale,
              height: 36 * scale,
              borderRadius: 18 * scale,
            }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={20 * scale} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Chat Messages */}
        <Animated.View
          style={[
            styles.chatContainer,
            {
              paddingHorizontal: 20 * scale,
              opacity: uiOpacityAnim,
              transform: [
                {
                  translateY: Animated.multiply(keyboardHeightAnim, -1),
                }
              ],
            }
          ]}
        >
          {chatMessages.slice(-3).map((msg, idx) => (
            <ChatMessageItem key={msg.id} message={msg} scale={scale} />
          ))}
        </Animated.View>

        {/* Chat Input */}
        <Animated.View
          style={[
            styles.chatInputContainer,
            {
              opacity: uiOpacityAnim,
              transform: [
                {
                  translateY: Animated.multiply(keyboardHeightAnim, -1),
                }
              ],
            }
          ]}
        >
          <View
            style={[styles.inputKeyboardView, {
              paddingHorizontal: 16 * scale,
              paddingBottom: 20 * scale,
              paddingTop: 12 * scale,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }]}
          >
            <View style={[styles.inputWrapper, {
              height: Math.min(54 * scale, 54),
              borderRadius: 27 * scale,
              paddingHorizontal: 16 * scale,
            }]}>
              <TextInput
                style={[styles.textInput, { fontSize: Math.min(15 * scale, 15) }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Add chat..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                maxLength={500}
                editable={canSendMessage && !sending}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              {rateLimitSeconds > 0 && (
                <Text style={[styles.rateLimitText, { fontSize: 12 * scale }]}>
                  {rateLimitSeconds}s
                </Text>
              )}
              <TouchableOpacity
                style={[styles.sendButton, {
                  width: Math.min(38 * scale, 38),
                  height: Math.min(38 * scale, 38),
                  borderRadius: 19 * scale,
                  opacity: (!canSendMessage || sending || !chatInput.trim()) ? 0.5 : 1,
                }]}
                onPress={handleSendMessage}
                activeOpacity={0.7}
                disabled={!canSendMessage || sending || !chatInput.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={17 * scale} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={sessions}
          renderItem={renderLiveSession}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={screenHeight}
          decelerationRate="fast"
          bounces={false}
          scrollEnabled={sessions.length > 1}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

// Chat Message Item Component
const ChatMessageItem = ({ message, scale }: { message: ChatMessage; scale: number }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.chatMessage,
        {
          marginBottom: 8 * scale,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.messageAvatar, {
        width: 36 * scale,
        height: 36 * scale,
        borderRadius: 18 * scale,
      }]}>
        {message.userAvatar ? (
          <Image
            source={{ uri: message.userAvatar }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#C8B4C8' }]} />
        )}
      </View>
      <View style={styles.messageContent}>
        <Text style={[styles.messageUserName, { fontSize: 13 * scale }]} numberOfLines={1}>
          {message.userName}
        </Text>
        <Text style={[styles.messageText, { fontSize: 13 * scale }]} numberOfLines={2}>
          {message.message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  sessionContainer: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  leftTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  liveDot: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  liveText: {
    fontFamily: 'Lexend_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  astrologerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 48, 166, 0.5)',
    gap: 8,
    maxWidth: screenWidth * 0.5,
  },
  astrologerAvatar: {
    backgroundColor: 'rgba(200, 180, 200, 0.9)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
  },
  astrologerDetails: {
    gap: 2,
    flex: 1,
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerCount: {
    fontFamily: 'Lexend_400Regular',
    color: '#FFFFFF',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 170,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  messageAvatar: {
    backgroundColor: 'rgba(200, 180, 200, 0.8)',
    overflow: 'hidden',
  },
  messageContent: {
    flex: 1,
    gap: 2,
  },
  messageUserName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FFFFFF',
  },
  messageText: {
    fontFamily: 'Lexend_500Medium',
    color: '#FFFFFF',
  },
  chatInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputKeyboardView: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 2,
    borderColor: '#FFCF0D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    width: '100%',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  rateLimitText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FF3939',
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveSessionScreen;

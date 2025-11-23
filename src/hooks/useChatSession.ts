import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatSession, ChatMessage, Astrologer } from '../types/api.types';
import { chatService } from '../services';
import { subscribeToChatMessages } from '../config/supabase.config';
import { handleApiError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../utils/notificationService';

interface UseChatSessionProps {
  initialSession: ChatSession;
  astrologer: Astrologer;
  onSessionEnd?: () => void;
}

interface UseChatSessionReturn {
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  duration: number; // in seconds
  sessionCost: number;
  remainingBalance: number;
  sendMessage: (text: string) => Promise<void>;
  endSession: () => Promise<void>;
  refetchMessages: () => Promise<void>;
}

export const useChatSession = ({
  initialSession,
  astrologer,
  onSessionEnd,
}: UseChatSessionProps): UseChatSessionReturn => {
  const { user, checkAuth } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(initialSession);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0); // in seconds
  const [sessionCost, setSessionCost] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(user?.walletBalance || 0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balanceCheckRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownLowBalanceWarning = useRef(false);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!session?.id) return;

    try {
      setLoading(true);
      const response = await chatService.getMessages(session.id, 100);
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [session?.id]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!session?.id || !text.trim()) return;

      try {
        setSending(true);
        const response = await chatService.sendMessage(session.id, text.trim(), 'text');

        // Message will be added via Supabase subscription
        // But we can add it optimistically for better UX
        if (response.data && !messages.find((m) => m.id === response.data.id)) {
          setMessages((prev) => [...prev, response.data]);
        }
      } catch (err) {
        console.error('Error sending message:', err);
        NotificationService.error('Failed to send message. Please try again.', 'Error');
        handleApiError(err);
      } finally {
        setSending(false);
      }
    },
    [session?.id, messages]
  );

  // End session
  const endSession = useCallback(async () => {
    if (!session?.id) return;

    // Prevent multiple end session calls
    if (session.status !== 'active') {
      console.log('Session already ended, skipping');
      return;
    }

    try {
      // Immediately mark session as ending to prevent duplicate calls
      setSession((prev) => (prev ? { ...prev, status: 'completed' } : prev));

      setLoading(true);
      const endSessionResponse = await chatService.endSession(session.id, {
        endReason: 'user_ended',
      });

      // Update session with end details
      if (endSessionResponse) {
        setSession({
          ...session,
          endTime: endSessionResponse.endTime,
          duration: endSessionResponse.duration,
          totalCost: endSessionResponse.totalCost,
          status: 'completed',
        });
        setRemainingBalance(endSessionResponse.remainingBalance);

        // Refresh auth to update wallet balance
        await checkAuth();
      }

      // Stop timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (balanceCheckRef.current) clearInterval(balanceCheckRef.current);

      // Call the callback
      if (onSessionEnd) onSessionEnd();
    } catch (err: any) {
      console.error('Error ending session:', err);

      // Handle specific error codes
      if (err?.response?.status === 500) {
        console.log('Server error ending session - session may already be ended');
        // Don't show error to user if it's a 500 - session might already be ended
      } else if (err?.response?.status === 404) {
        console.log('Session not found - may already be ended');
      } else {
        // Only show error for other cases
        NotificationService.error('Failed to end session. Please try again.', 'Error');
        handleApiError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [session, onSessionEnd, checkAuth]);

  // Refetch messages
  const refetchMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // Session timer
  useEffect(() => {
    if (!session?.startTime || session.status !== 'active') return;

    // Calculate initial duration if resuming
    const startTime = new Date(session.startTime).getTime();
    const initialDuration = Math.floor((Date.now() - startTime) / 1000);
    setDuration(initialDuration);

    // Start timer
    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setDuration(elapsed);

      // Calculate cost
      const minutes = elapsed / 60;
      const cost = minutes * (session.pricePerMinute || 0);
      setSessionCost(cost);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.startTime, session?.status, session?.pricePerMinute]);

  // Balance monitoring
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    // Check balance every 10 seconds
    balanceCheckRef.current = setInterval(async () => {
      try {
        // Refresh user profile to get updated balance
        await checkAuth();
        const currentBalance = user?.walletBalance || 0;
        setRemainingBalance(currentBalance);

        const pricePerMinute = session.pricePerMinute || 0;
        const warningThreshold = pricePerMinute * 2; // 2 minutes worth
        const criticalThreshold = pricePerMinute / 60; // 1 minute worth

        // Show warning at 2 minutes remaining
        if (
          currentBalance < warningThreshold &&
          currentBalance > criticalThreshold &&
          !hasShownLowBalanceWarning.current
        ) {
          hasShownLowBalanceWarning.current = true;
          const minutesRemaining = Math.floor(currentBalance / pricePerMinute);
          NotificationService.warning(
            `You have approximately ${minutesRemaining} minute${
              minutesRemaining !== 1 ? 's' : ''
            } of balance remaining. Please recharge to continue the session.`,
            'Low Balance Warning',
            5000
          );
        }

        // Auto-end at < 1 minute balance
        if (currentBalance < criticalThreshold) {
          NotificationService.error(
            'Your session has ended due to insufficient balance.',
            'Session Ended',
            5000
          );
          await endSession();
        }
      } catch (err) {
        console.error('Error checking balance:', err);
      }
    }, 10000); // Every 10 seconds

    return () => {
      if (balanceCheckRef.current) clearInterval(balanceCheckRef.current);
    };
  }, [session, user?.walletBalance, checkAuth, endSession]);

  // Fetch initial messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToChatMessages(session.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessage;

        // Deduplicate by ID
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session?.id]);

  return {
    session,
    messages,
    loading,
    sending,
    error,
    duration,
    sessionCost,
    remainingBalance,
    sendMessage,
    endSession,
    refetchMessages,
  };
};

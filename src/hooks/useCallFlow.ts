/**
 * useCallFlow Hook
 * Manages the entire call flow: request → queue → active → summary
 * Uses Supabase real-time subscriptions with polling fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { callService } from '../services/call.service';
import {
  subscribeToCallRequestStatus,
  subscribeToQueueStatus,
  subscribeToCallSession,
} from '../config/supabase.config';
import {
  CallScreenState,
  CallScreenParams,
  CreateCallRequestResponse,
  PollCallRequestStatusResponse,
  QueueEntry,
  ActiveCallSession,
  CallSummary,
  CallErrorCode,
} from '../types/call.types';

interface UseCallFlowOptions {
  astrologer: CallScreenParams['astrologer'];
  onError?: (error: string, code?: CallErrorCode) => void;
  onCallEnded?: (summary: CallSummary) => void;
}

interface UseCallFlowReturn {
  // Current state
  state: CallScreenState;

  // Data for each state
  requestData: CreateCallRequestResponse | null;
  queueData: QueueEntry | null;
  sessionData: ActiveCallSession | null;
  summaryData: CallSummary | null;

  // Timers
  countdownSeconds: number;
  callDurationSeconds: number;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  initiateCall: () => Promise<void>;
  cancelCall: () => Promise<void>;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  callFromQueue: () => Promise<void>;
  endCall: (reason?: string) => Promise<void>;
  rateCall: (rating: number, review?: string) => Promise<void>;
  goHome: () => void;
}

const POLL_INTERVAL = 2000; // 2 seconds
const COUNTDOWN_INTERVAL = 1000; // 1 second

export const useCallFlow = ({
  astrologer,
  onError,
  onCallEnded,
}: UseCallFlowOptions): UseCallFlowReturn => {
  // State
  const [state, setState] = useState<CallScreenState>('calling');
  const [requestData, setRequestData] = useState<CreateCallRequestResponse | null>(null);
  const [queueData, setQueueData] = useState<QueueEntry | null>(null);
  const [sessionData, setSessionData] = useState<ActiveCallSession | null>(null);
  const [summaryData, setSummaryData] = useState<CallSummary | null>(null);

  // Timers
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Loading/Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for intervals and subscriptions
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup intervals and subscriptions
  const clearAllIntervals = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Handle app state changes (pause polling when app is in background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - resume polling if needed
        if (state === 'calling' && requestData) {
          startPolling(requestData.requestId);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [state, requestData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  // Start countdown timer
  const startCountdown = useCallback((seconds: number) => {
    setCountdownSeconds(seconds);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, COUNTDOWN_INTERVAL);
  }, []);

  // Start call duration timer
  const startDurationTimer = useCallback(() => {
    setCallDurationSeconds(0);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, COUNTDOWN_INTERVAL);
  }, []);

  // Poll request status
  const pollRequestStatus = useCallback(async (requestId: string) => {
    try {
      const response = await callService.pollRequestStatus(requestId);

      if (response.status === 'accepted' && response.session) {
        // Astrologer accepted - transition to connecting/active
        clearAllIntervals();

        setSessionData({
          sessionId: response.session.sessionId,
          astrologerId: astrologer.id,
          astrologerName: astrologer.name,
          astrologerImage: astrologer.image,
          twilioToken: response.session.twilioToken,
          twilioRoomName: response.session.twilioRoomName,
          startTime: response.session.startTime,
          pricePerMinute: response.session.pricePerMinute,
          status: 'active',
        });

        setState('active');
        startDurationTimer();
      } else if (response.status === 'rejected') {
        // Astrologer rejected
        clearAllIntervals();
        setError(response.message || 'Call was rejected by the astrologer');
        onError?.(response.message || 'Call rejected', CallErrorCode.ASTROLOGER_BUSY);
      } else if (response.status === 'timeout') {
        // Request timed out
        clearAllIntervals();
        setError('Call request timed out. The astrologer did not respond.');
        onError?.('Request timed out', CallErrorCode.REQUEST_EXPIRED);
      }
    } catch (err: any) {
      console.error('Poll request status error:', err);
    }
  }, [astrologer, clearAllIntervals, startDurationTimer, onError]);

  // Start polling and real-time subscription for request status
  const startPolling = useCallback((requestId: string) => {
    // Clear any existing subscriptions
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Set up Supabase real-time subscription
    unsubscribeRef.current = subscribeToCallRequestStatus(requestId, (payload) => {
      const { new: newData } = payload;
      if (newData) {
        const status = newData.status;

        if (status === 'accepted') {
          // Fetch full session data via API
          pollRequestStatus(requestId);
        } else if (status === 'rejected' || status === 'timeout') {
          clearAllIntervals();
          setError(
            status === 'rejected'
              ? newData.rejection_reason || 'Call was rejected by the astrologer'
              : 'Call request timed out. The astrologer did not respond.'
          );
          onError?.(
            status === 'rejected' ? 'Call rejected' : 'Request timed out',
            status === 'rejected' ? CallErrorCode.ASTROLOGER_BUSY : CallErrorCode.REQUEST_EXPIRED
          );
        }
      }
    });

    // Poll immediately
    pollRequestStatus(requestId);

    // Fallback polling every 2 seconds (in case realtime fails)
    pollIntervalRef.current = setInterval(() => {
      pollRequestStatus(requestId);
    }, POLL_INTERVAL);
  }, [pollRequestStatus, clearAllIntervals, onError]);

  // Initiate call request
  const initiateCall = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate balance first
      const validation = await callService.validateBalance(astrologer.id);

      if (!validation.canStartCall) {
        const shortfall = validation.shortfall || 0;
        setError(`Insufficient balance. Please recharge at least ₹${shortfall.toFixed(0)} to continue.`);
        onError?.('Insufficient balance', CallErrorCode.INSUFFICIENT_BALANCE);
        setIsLoading(false);
        return;
      }

      // Create call request
      const request = await callService.createCallRequest(astrologer.id);
      setRequestData(request);
      setState('calling');

      // Start countdown (60 seconds)
      startCountdown(request.remainingSeconds || 60);

      // Start polling for status
      startPolling(request.requestId);
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.message || 'Failed to initiate call';

      setError(errorMessage);
      onError?.(errorMessage, errorCode);

      // If astrologer is busy, offer to join queue
      if (errorCode === CallErrorCode.ASTROLOGER_BUSY) {
        // Let the UI handle showing queue option
      }
    } finally {
      setIsLoading(false);
    }
  }, [astrologer.id, startCountdown, startPolling, onError]);

  // Cancel call request
  const cancelCall = useCallback(async () => {
    clearAllIntervals();

    if (requestData?.requestId) {
      try {
        await callService.cancelRequest(requestData.requestId);
      } catch (err) {
        console.error('Cancel request error:', err);
      }
    }

    setRequestData(null);
    setState('calling');
  }, [requestData, clearAllIntervals]);

  // Join queue
  const joinQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callService.joinQueue(astrologer.id);

      setQueueData({
        queueId: response.queueId,
        astrologerId: astrologer.id,
        astrologerName: astrologer.name,
        astrologerImage: astrologer.image,
        position: response.position,
        status: 'waiting',
        estimatedWaitMinutes: response.estimatedWaitMinutes,
        expiresAt: response.expiresAt,
        remainingSeconds: response.remainingSeconds,
        createdAt: new Date().toISOString(),
      });

      setState('queue');
      startCountdown(response.remainingSeconds);
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.message || 'Failed to join queue';

      setError(errorMessage);
      onError?.(errorMessage, errorCode);
    } finally {
      setIsLoading(false);
    }
  }, [astrologer, startCountdown, onError]);

  // Leave queue
  const leaveQueue = useCallback(async () => {
    clearAllIntervals();

    if (queueData?.queueId) {
      try {
        await callService.leaveQueue(queueData.queueId);
      } catch (err) {
        console.error('Leave queue error:', err);
      }
    }

    setQueueData(null);
  }, [queueData, clearAllIntervals]);

  // Call from queue (when turn comes)
  const callFromQueue = useCallback(async () => {
    if (!queueData?.queueId) return;

    setIsLoading(true);
    setError(null);

    try {
      const request = await callService.callNowFromQueue(queueData.queueId);
      setRequestData(request);
      setQueueData(null);
      setState('calling');

      startCountdown(request.remainingSeconds || 60);
      startPolling(request.requestId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to initiate call';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [queueData, startCountdown, startPolling, onError]);

  // End call
  const endCall = useCallback(async (reason: string = 'user_ended') => {
    clearAllIntervals();

    if (!sessionData?.sessionId) return;

    setIsLoading(true);

    try {
      const response = await callService.endSession(sessionData.sessionId, reason);

      const summary: CallSummary = {
        sessionId: sessionData.sessionId,
        astrologerId: astrologer.id,
        astrologerName: astrologer.name,
        astrologerImage: astrologer.image,
        duration: response.duration,
        durationSeconds: response.durationSeconds,
        totalCost: response.totalCost,
        remainingBalance: response.remainingBalance,
        startTime: sessionData.startTime,
        endTime: new Date().toISOString(),
      };

      setSummaryData(summary);
      setState('summary');
      onCallEnded?.(summary);
    } catch (err: any) {
      console.error('End call error:', err);
      // Still transition to summary with local data
      const summary: CallSummary = {
        sessionId: sessionData.sessionId,
        astrologerId: astrologer.id,
        astrologerName: astrologer.name,
        astrologerImage: astrologer.image,
        duration: callDurationSeconds,
        durationSeconds: callDurationSeconds,
        totalCost: (callDurationSeconds / 60) * (sessionData.pricePerMinute || astrologer.pricePerMinute),
        remainingBalance: 0,
        startTime: sessionData.startTime,
        endTime: new Date().toISOString(),
      };

      setSummaryData(summary);
      setState('summary');
    } finally {
      setIsLoading(false);
    }
  }, [sessionData, astrologer, callDurationSeconds, clearAllIntervals, onCallEnded]);

  // Rate call
  const rateCall = useCallback(async (rating: number, review?: string) => {
    if (!summaryData?.sessionId) return;

    setIsLoading(true);

    try {
      await callService.rateSession(summaryData.sessionId, { rating, review });
    } catch (err) {
      console.error('Rate call error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [summaryData]);

  // Go home (cleanup)
  const goHome = useCallback(() => {
    clearAllIntervals();
    setRequestData(null);
    setQueueData(null);
    setSessionData(null);
    setSummaryData(null);
    setError(null);
    setState('calling');
  }, [clearAllIntervals]);

  return {
    state,
    requestData,
    queueData,
    sessionData,
    summaryData,
    countdownSeconds,
    callDurationSeconds,
    isLoading,
    error,
    initiateCall,
    cancelCall,
    joinQueue,
    leaveQueue,
    callFromQueue,
    endCall,
    rateCall,
    goHome,
  };
};

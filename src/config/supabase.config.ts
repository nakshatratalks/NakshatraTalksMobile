/**
 * Supabase Configuration
 * Setup for realtime database updates
 */

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// TODO: Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://vckkbwvjczptjwixxvwi.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Subscribe to astrologer availability changes for chat
 * @param callback - Function to call when changes occur
 * @returns Unsubscribe function
 */
export const subscribeToChatAvailability = (
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel('chat-astrologers-availability')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'astrologers',
        filter: 'chat_available=eq.true',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to astrologer availability changes for call
 * @param callback - Function to call when changes occur
 * @returns Unsubscribe function
 */
export const subscribeToCallAvailability = (
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel('call-astrologers-availability')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'astrologers',
        filter: 'call_available=eq.true',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to chat messages for a session
 * @param sessionId - Chat session ID
 * @param callback - Function to call when new messages arrive
 * @returns Unsubscribe function
 */
export const subscribeToChatMessages = (
  sessionId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`chat-messages-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to session status changes
 * @param sessionId - Session ID
 * @param callback - Function to call when session status changes
 * @returns Unsubscribe function
 */
export const subscribeToSessionStatus = (
  sessionId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`session-status-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to wallet balance changes
 * @param userId - User ID
 * @param callback - Function to call when balance changes
 * @returns Unsubscribe function
 */
export const subscribeToWalletBalance = (
  userId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`wallet-balance-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to call request status changes
 * Use this to get real-time updates when astrologer accepts/rejects
 * @param requestId - Call request ID
 * @param callback - Function to call when status changes
 * @returns Unsubscribe function
 */
export const subscribeToCallRequestStatus = (
  requestId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`call-request-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_requests',
        filter: `id=eq.${requestId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to queue position updates
 * Use this to get real-time updates on queue position and when turn comes
 * @param queueId - Queue entry ID
 * @param callback - Function to call when queue status changes
 * @returns Unsubscribe function
 */
export const subscribeToQueueStatus = (
  queueId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`queue-status-${queueId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_queue',
        filter: `id=eq.${queueId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to all queue entries for a user
 * Use this to track multiple queue positions
 * @param userId - User ID
 * @param callback - Function to call when any queue entry changes
 * @returns Unsubscribe function
 */
export const subscribeToUserQueueEntries = (
  userId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`user-queue-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_queue',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Subscribe to call session changes
 * Use this for real-time call session updates (e.g., when call ends)
 * @param sessionId - Call session ID
 * @param callback - Function to call when session changes
 * @returns Unsubscribe function
 */
export const subscribeToCallSession = (
  sessionId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`call-session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_sessions',
        filter: `id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * useLiveSessionData Hook
 * Fetches and manages live session data
 */

import { useState, useEffect } from 'react';
import { liveSessionService } from '../services';
import {
  LiveSession,
  LiveSessionMessage,
} from '../types/liveSession.types';
import { handleApiError } from '../utils/errorHandler';

interface UseLiveSessionDataReturn {
  liveSessions: LiveSession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLiveSessionData = (): UseLiveSessionDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  /**
   * Load live sessions
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch live sessions
      const sessions = await liveSessionService.getLiveSessions();
      setLiveSessions(sessions);
    } catch (err: any) {
      console.error('Error loading live session data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();
  }, []);

  return {
    liveSessions,
    loading,
    error,
    refetch: loadData,
  };
};

/**
 * useLiveSessionMessages Hook
 * Manages real-time messages for a specific live session
 */
interface UseLiveSessionMessagesParams {
  sessionId: string;
}

interface UseLiveSessionMessagesReturn {
  messages: LiveSessionMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useLiveSessionMessages = ({
  sessionId,
}: UseLiveSessionMessagesParams): UseLiveSessionMessagesReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveSessionMessage[]>([]);

  /**
   * Load messages for a session
   */
  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionMessages = await liveSessionService.getSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (err: any) {
      console.error('Error loading session messages:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a message to the live session
   */
  const sendMessage = async (message: string) => {
    try {
      const newMessage = await liveSessionService.sendMessage(sessionId, message);
      setMessages([...messages, newMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  /**
   * Load messages on component mount and set up polling
   */
  useEffect(() => {
    loadMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: loadMessages,
  };
};

/**
 * useChatHistoryView Hook
 * Fetches session details and messages for viewing chat history (read-only)
 */

import { useState, useEffect } from 'react';
import { chatService } from '../services';
import { ChatSession, ChatMessage } from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

interface UseChatHistoryViewReturn {
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useChatHistoryView = (sessionId: string): UseChatHistoryViewReturn => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch session details and messages
   */
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch session details and messages in parallel
      const [sessionResponse, messagesResponse] = await Promise.all([
        chatService.getSessionHistory({ limit: 100 }).then(res => {
          // Find the specific session from the list
          return res.data.find(s => s.id === sessionId) || null;
        }),
        chatService.getMessages(sessionId, 500), // Get up to 500 messages
      ]);

      setSession(sessionResponse);

      // Sort messages by created time (oldest first)
      const sortedMessages = (messagesResponse || []).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      setMessages(sortedMessages);
    } catch (err: any) {
      console.error('Error fetching chat history view data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  return {
    session,
    messages,
    loading,
    error,
    refetch: fetchSessionData,
  };
};

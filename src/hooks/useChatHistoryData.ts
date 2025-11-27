/**
 * useChatHistoryData Hook
 * Fetches user's chat history with astrologers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, astrologerService } from '../services';
import { ChatSession, Astrologer } from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

// Chat history item combining session and astrologer data
export interface ChatHistoryItem {
  id: string;
  astrologerId: string;
  astrologerName: string;
  astrologerImage?: string;
  lastMessageTime: string;
  isOnline: boolean;
  sessionStatus: 'active' | 'completed' | 'cancelled';
  sessionId: string;
}

interface UseChatHistoryDataReturn {
  chatHistory: ChatHistoryItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
}

export const useChatHistoryData = (): UseChatHistoryDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [allChatHistory, setAllChatHistory] = useState<ChatHistoryItem[]>([]);

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Fetch chat history from API
   */
  const fetchChatHistory = async (): Promise<ChatHistoryItem[]> => {
    try {
      // Get all chat sessions (both completed and active)
      const response = await chatService.getSessionHistory({
        limit: 50,
        offset: 0,
      });

      const sessions = response.data || [];

      // Transform sessions to chat history items
      // Group by astrologer and get the most recent session for each
      const astrologerSessionMap = new Map<string, ChatSession>();

      sessions.forEach((session) => {
        const existingSession = astrologerSessionMap.get(session.astrologerId);
        if (!existingSession || new Date(session.startTime) > new Date(existingSession.startTime)) {
          astrologerSessionMap.set(session.astrologerId, session);
        }
      });

      // Get unique astrologer IDs
      const astrologerIds = Array.from(astrologerSessionMap.keys());

      // Fetch astrologer details for all unique astrologers
      const astrologerDetailsPromises = astrologerIds.map(async (id) => {
        try {
          const astrologer = await astrologerService.getAstrologerDetails(id);
          return astrologer;
        } catch (err) {
          console.warn(`Failed to fetch astrologer ${id}:`, err);
          return null;
        }
      });

      const astrologerDetails = await Promise.all(astrologerDetailsPromises);
      const astrologerMap = new Map<string, Astrologer>();

      astrologerDetails.forEach((astrologer) => {
        if (astrologer) {
          astrologerMap.set(astrologer.id, astrologer);
        }
      });

      // Create chat history items
      const historyItems: ChatHistoryItem[] = [];

      astrologerSessionMap.forEach((session, astrologerId) => {
        const astrologer = astrologerMap.get(astrologerId);

        historyItems.push({
          id: `${session.id}-${astrologerId}`,
          astrologerId: astrologerId,
          astrologerName: astrologer?.name || session.astrologerName || 'Unknown',
          astrologerImage: astrologer?.image,
          lastMessageTime: session.endTime || session.startTime,
          isOnline: astrologer?.chatAvailable || astrologer?.isAvailable || false,
          sessionStatus: session.status,
          sessionId: session.id,
        });
      });

      // Sort by last message time (most recent first)
      historyItems.sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      return historyItems;
    } catch (err: any) {
      console.error('Error fetching chat history:', err);
      throw err;
    }
  };

  /**
   * Load chat history data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const history = await fetchChatHistory();
      setAllChatHistory(history);
      setChatHistory(history);
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter chat history based on search query
   */
  const filterChatHistory = (query: string, history: ChatHistoryItem[]) => {
    if (!query.trim()) {
      return history;
    }

    const lowerQuery = query.toLowerCase();
    return history.filter((item) =>
      item.astrologerName.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Handle search query change with debouncing
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (300ms debounce for local filtering)
    debounceTimer.current = setTimeout(() => {
      const filtered = filterChatHistory(query, allChatHistory);
      setChatHistory(filtered);
    }, 300);
  }, [allChatHistory]);

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    chatHistory,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetch: loadData,
  };
};

/**
 * useKundliStorage Hook
 * Manages local storage for Kundli and Kundli Matching reports
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedKundli, SavedMatching } from '../types/kundli';

// Simple UUID generator - no external dependency needed
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Storage keys
const STORAGE_KEYS = {
  SAVED_KUNDLIS: '@kundli_reports',
  SAVED_MATCHINGS: '@matching_reports',
};

/**
 * Hook for managing saved Kundli reports
 */
export const useSavedKundlis = () => {
  const [kundlis, setKundlis] = useState<SavedKundli[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved kundlis on mount
  useEffect(() => {
    loadKundlis();
  }, []);

  const loadKundlis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_KUNDLIS);
      if (data) {
        const parsed = JSON.parse(data) as SavedKundli[];
        // Sort by most recent first
        parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setKundlis(parsed);
      } else {
        setKundlis([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading kundlis:', err);
      setError('Failed to load saved reports');
      setKundlis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveKundli = useCallback(async (kundli: Omit<SavedKundli, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedKundli> => {
    try {
      const now = new Date().toISOString();
      const newKundli: SavedKundli = {
        ...kundli,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      };

      const updatedKundlis = [newKundli, ...kundlis];
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_KUNDLIS, JSON.stringify(updatedKundlis));
      setKundlis(updatedKundlis);
      return newKundli;
    } catch (err) {
      console.error('Error saving kundli:', err);
      throw new Error('Failed to save report');
    }
  }, [kundlis]);

  const updateKundli = useCallback(async (id: string, updates: Partial<SavedKundli>): Promise<SavedKundli | null> => {
    try {
      const index = kundlis.findIndex(k => k.id === id);
      if (index === -1) return null;

      const updatedKundli: SavedKundli = {
        ...kundlis[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const updatedKundlis = [...kundlis];
      updatedKundlis[index] = updatedKundli;

      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_KUNDLIS, JSON.stringify(updatedKundlis));
      setKundlis(updatedKundlis);
      return updatedKundli;
    } catch (err) {
      console.error('Error updating kundli:', err);
      throw new Error('Failed to update report');
    }
  }, [kundlis]);

  const deleteKundli = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updatedKundlis = kundlis.filter(k => k.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_KUNDLIS, JSON.stringify(updatedKundlis));
      setKundlis(updatedKundlis);
      return true;
    } catch (err) {
      console.error('Error deleting kundli:', err);
      throw new Error('Failed to delete report');
    }
  }, [kundlis]);

  const getKundliById = useCallback((id: string): SavedKundli | undefined => {
    return kundlis.find(k => k.id === id);
  }, [kundlis]);

  const searchKundlis = useCallback((query: string): SavedKundli[] => {
    if (!query.trim()) return kundlis;
    const lowerQuery = query.toLowerCase();
    return kundlis.filter(k =>
      k.name.toLowerCase().includes(lowerQuery) ||
      k.birthPlace.name.toLowerCase().includes(lowerQuery)
    );
  }, [kundlis]);

  return {
    kundlis,
    loading,
    error,
    saveKundli,
    updateKundli,
    deleteKundli,
    getKundliById,
    searchKundlis,
    refetch: loadKundlis,
  };
};

/**
 * Hook for managing saved Kundli Matching reports
 */
export const useSavedMatchings = () => {
  const [matchings, setMatchings] = useState<SavedMatching[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved matchings on mount
  useEffect(() => {
    loadMatchings();
  }, []);

  const loadMatchings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MATCHINGS);
      if (data) {
        const parsed = JSON.parse(data) as SavedMatching[];
        // Sort by most recent first
        parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setMatchings(parsed);
      } else {
        setMatchings([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading matchings:', err);
      setError('Failed to load saved reports');
      setMatchings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMatching = useCallback(async (matching: Omit<SavedMatching, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedMatching> => {
    try {
      const now = new Date().toISOString();
      const newMatching: SavedMatching = {
        ...matching,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      };

      const updatedMatchings = [newMatching, ...matchings];
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MATCHINGS, JSON.stringify(updatedMatchings));
      setMatchings(updatedMatchings);
      return newMatching;
    } catch (err) {
      console.error('Error saving matching:', err);
      throw new Error('Failed to save report');
    }
  }, [matchings]);

  const deleteMatching = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updatedMatchings = matchings.filter(m => m.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MATCHINGS, JSON.stringify(updatedMatchings));
      setMatchings(updatedMatchings);
      return true;
    } catch (err) {
      console.error('Error deleting matching:', err);
      throw new Error('Failed to delete report');
    }
  }, [matchings]);

  const getMatchingById = useCallback((id: string): SavedMatching | undefined => {
    return matchings.find(m => m.id === id);
  }, [matchings]);

  const searchMatchings = useCallback((query: string): SavedMatching[] => {
    if (!query.trim()) return matchings;
    const lowerQuery = query.toLowerCase();
    return matchings.filter(m =>
      m.boy.name.toLowerCase().includes(lowerQuery) ||
      m.girl.name.toLowerCase().includes(lowerQuery)
    );
  }, [matchings]);

  return {
    matchings,
    loading,
    error,
    saveMatching,
    deleteMatching,
    getMatchingById,
    searchMatchings,
    refetch: loadMatchings,
  };
};

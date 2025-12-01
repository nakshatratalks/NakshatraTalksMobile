/**
 * HoroscopeCategoryCard Component
 * Displays horoscope content for each category (General, Love, Career, Health)
 * Performance-optimized: No animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export type HoroscopeCategory = 'general' | 'love' | 'career' | 'health';

interface HoroscopeCategoryCardProps {
  category: HoroscopeCategory;
  content: string;
  index: number;
  scale?: number;
  isLast?: boolean;
}

const CATEGORY_TITLES: Record<HoroscopeCategory, string> = {
  general: 'GENERAL',
  love: 'LOVE',
  career: 'CAREER',
  health: 'HEALTH',
};

export const HoroscopeCategoryCard: React.FC<HoroscopeCategoryCardProps> = React.memo(({
  category,
  content,
  scale = 1,
  isLast = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Category Title */}
      <Text style={[styles.categoryTitle, { fontSize: 16 * scale }]}>
        {CATEGORY_TITLES[category]}
      </Text>

      {/* Content */}
      <Text style={[styles.content, { fontSize: 12 * scale, lineHeight: 18 * scale }]}>
        {content}
      </Text>

      {/* Separator */}
      {!isLast && (
        <View style={[styles.separator, { marginTop: 20 * scale }]}>
          <View style={styles.separatorLine} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryTitle: {
    fontFamily: 'LibreBodoni_600SemiBold',
    fontSize: 16,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  content: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#2930A6',
    lineHeight: 18,
  },
  separator: {
    alignItems: 'center',
    marginTop: 20,
  },
  separatorLine: {
    width: '60%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});

export default HoroscopeCategoryCard;

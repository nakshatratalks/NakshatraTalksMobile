import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const { scale } = useResponsiveLayout();

  return (
    <View style={[styles.container, { paddingVertical: 12 * scale, marginVertical: 8 * scale }]}>
      <View
        style={[
          styles.pill,
          {
            paddingHorizontal: 14 * scale,
            paddingVertical: 7 * scale,
            borderRadius: 8 * scale,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: 13 * scale }]}>{date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(225, 230, 235, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#667085',
    textAlign: 'center',
  },
});

export default DateSeparator;

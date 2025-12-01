/**
 * WheelPicker Component
 * iOS-style wheel picker for date and time selection
 * Uses native picker on iOS, custom wheel on Android
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerColumnProps {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

// Single column wheel picker
const WheelPickerColumn: React.FC<WheelPickerColumnProps> = ({
  data,
  selectedIndex,
  onSelect,
  width,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const lastSelectedIndex = useRef(selectedIndex);

  useEffect(() => {
    // Scroll to initial position
    scrollViewRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, []);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

    if (clampedIndex !== lastSelectedIndex.current) {
      lastSelectedIndex.current = clampedIndex;
      Haptics.selectionAsync();
      onSelect(clampedIndex);
    }
  }, [data.length, onSelect]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

    // Snap to exact position
    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });

    onSelect(clampedIndex);
  }, [data.length, onSelect]);

  return (
    <View style={[styles.columnContainer, { width }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
      >
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.item, { height: ITEM_HEIGHT }]}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                onSelect(index);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Date Picker Props
interface DateWheelPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

// Generate date picker data
const generateDays = () => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const generateMonths = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const generateYears = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, i) => String(max - i));

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  value,
  onChange,
  minimumDate = new Date(1920, 0, 1),
  maximumDate = new Date(),
}) => {
  const days = generateDays();
  const months = generateMonths();
  const years = generateYears(minimumDate.getFullYear(), maximumDate.getFullYear());

  const [selectedDay, setSelectedDay] = useState(value.getDate() - 1);
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedYear, setSelectedYear] = useState(
    years.indexOf(String(value.getFullYear()))
  );

  const handleChange = useCallback((day: number, month: number, yearIndex: number) => {
    const year = parseInt(years[yearIndex]);
    const maxDays = new Date(year, month + 1, 0).getDate();
    const adjustedDay = Math.min(day, maxDays - 1);

    const newDate = new Date(year, month, adjustedDay + 1);
    onChange(newDate);
  }, [years, onChange]);

  return (
    <View style={styles.pickerContainer}>
      {/* Selection Indicator */}
      <View style={styles.selectionIndicator} />

      <View style={styles.columnsRow}>
        {/* Day Column */}
        <WheelPickerColumn
          data={days}
          selectedIndex={selectedDay}
          onSelect={(index) => {
            setSelectedDay(index);
            handleChange(index, selectedMonth, selectedYear);
          }}
          width={60}
        />

        {/* Month Column */}
        <WheelPickerColumn
          data={months}
          selectedIndex={selectedMonth}
          onSelect={(index) => {
            setSelectedMonth(index);
            handleChange(selectedDay, index, selectedYear);
          }}
          width={120}
        />

        {/* Year Column */}
        <WheelPickerColumn
          data={years}
          selectedIndex={selectedYear}
          onSelect={(index) => {
            setSelectedYear(index);
            handleChange(selectedDay, selectedMonth, index);
          }}
          width={80}
        />
      </View>
    </View>
  );
};

// Time Picker Props
interface TimeWheelPickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

// Generate time picker data
const generateHours = () => Array.from({ length: 12 }, (_, i) => String(i + 1));
const generateMinutes = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  value,
  onChange,
}) => {
  const hours = generateHours();
  const minutes = generateMinutes();

  const hour24 = value.getHours();
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;

  const [selectedHour, setSelectedHour] = useState(hour12 - 1);
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState(isPM ? 1 : 0);

  const handleChange = useCallback((hour: number, minute: number, period: number) => {
    let hour24 = hour + 1;
    if (period === 1 && hour24 !== 12) hour24 += 12;
    if (period === 0 && hour24 === 12) hour24 = 0;

    const newDate = new Date(value);
    newDate.setHours(hour24);
    newDate.setMinutes(minute);
    onChange(newDate);
  }, [value, onChange]);

  return (
    <View style={styles.pickerContainer}>
      {/* Selection Indicator */}
      <View style={styles.selectionIndicator} />

      <View style={styles.columnsRow}>
        {/* Hour Column */}
        <WheelPickerColumn
          data={hours}
          selectedIndex={selectedHour}
          onSelect={(index) => {
            setSelectedHour(index);
            handleChange(index, selectedMinute, selectedPeriod);
          }}
          width={60}
        />

        {/* Separator */}
        <View style={styles.separator}>
          <Text style={styles.separatorText}>:</Text>
        </View>

        {/* Minute Column */}
        <WheelPickerColumn
          data={minutes}
          selectedIndex={selectedMinute}
          onSelect={(index) => {
            setSelectedMinute(index);
            handleChange(selectedHour, index, selectedPeriod);
          }}
          width={60}
        />

        {/* AM/PM Column */}
        <WheelPickerColumn
          data={periods}
          selectedIndex={selectedPeriod}
          onSelect={(index) => {
            setSelectedPeriod(index);
            handleChange(selectedHour, selectedMinute, index);
          }}
          width={60}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    height: PICKER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnContainer: {
    height: PICKER_HEIGHT,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 18,
    color: '#888888',
  },
  itemTextSelected: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20,
    color: '#2930A6',
  },
  separator: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20,
    color: '#2930A6',
  },
});

export default { DateWheelPicker, TimeWheelPicker };

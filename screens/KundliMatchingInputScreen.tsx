/**
 * KundliMatchingInputScreen
 * Collects Boy's and Girl's birth details for Kundli Matching
 *
 * Performance Optimizations:
 * - Platform-specific DateTimePicker (native dialog on Android, modal on iOS)
 * - Memoized components to prevent unnecessary re-renders
 * - Proper cleanup/destructors for all async operations
 * - AbortController for API calls
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ChevronLeft, User, Calendar, Clock, MapPin, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useResponsiveLayout } from '../src/utils/responsive';
import { useSavedMatchings } from '../src/hooks/useKundliStorage';
import { BirthPlace, SavedKundli } from '../src/types/kundli';
import { placesService } from '../src/services/places.service';
import { matchingService } from '../src/services/matching.service';

// Fallback cities when API is unavailable
const FALLBACK_CITIES: BirthPlace[] = [
  { name: 'Chennai, Tamil Nadu', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { name: 'Mumbai, Maharashtra', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Delhi, Delhi', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
  { name: 'Bangalore, Karnataka', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Hyderabad, Telangana', latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata, West Bengal', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Coimbatore, Tamil Nadu', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata' },
  { name: 'Madurai, Tamil Nadu', latitude: 9.9252, longitude: 78.1198, timezone: 'Asia/Kolkata' },
];

interface PersonDetails {
  name: string;
  dateOfBirth: Date | null;
  timeOfBirth: Date | null;
  birthPlace: BirthPlace | null;
}

// Picker mode type
type PickerMode = 'date' | 'time';

// Platform-specific DateTimePicker configuration
interface DateTimePickerConfig {
  visible: boolean;
  mode: PickerMode;
  value: Date;
  target: 'boy' | 'girl';
}

// Input Field Component - Memoized for performance
const InputField = memo(({
  icon: Icon,
  placeholder,
  value,
  onPress,
  scale,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onPress: () => void;
  scale: number;
}) => (
  <TouchableOpacity
    style={[styles.inputField, {
      height: 50 * scale,
      borderRadius: 25 * scale,
      paddingHorizontal: 16 * scale,
      marginBottom: 12 * scale,
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Icon size={20 * scale} color="#1a1a1a" />
    <Text
      style={[
        styles.inputText,
        { fontSize: 14 * scale, marginLeft: 12 * scale },
        !value && styles.inputPlaceholder,
      ]}
      numberOfLines={1}
    >
      {value || placeholder}
    </Text>
  </TouchableOpacity>
));

InputField.displayName = 'InputField';

// Date/Time formatting utilities - defined outside component to prevent recreation
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Person Details Card Component - Memoized for performance
const PersonDetailsCard = memo(({
  title,
  details,
  onNamePress,
  onDatePress,
  onTimePress,
  onPlacePress,
  scale,
}: {
  title: string;
  details: PersonDetails;
  onNamePress: () => void;
  onDatePress: () => void;
  onTimePress: () => void;
  onPlacePress: () => void;
  scale: number;
}) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[styles.card, { padding: 16 * scale, borderRadius: 16 * scale, marginBottom: 16 * scale }]}
    >
      <Text style={[styles.cardTitle, { fontSize: 16 * scale, marginBottom: 16 * scale }]}>
        {title}
      </Text>

      <Text style={[styles.fieldLabel, { fontSize: 12 * scale }]}>Name</Text>
      <InputField
        icon={User}
        placeholder="Enter the name"
        value={details.name}
        onPress={onNamePress}
        scale={scale}
      />

      <Text style={[styles.fieldLabel, { fontSize: 12 * scale }]}>Birth Date</Text>
      <InputField
        icon={Calendar}
        placeholder="Select the DOB"
        value={formatDate(details.dateOfBirth)}
        onPress={onDatePress}
        scale={scale}
      />

      <Text style={[styles.fieldLabel, { fontSize: 12 * scale }]}>Birth Time</Text>
      <InputField
        icon={Clock}
        placeholder="Select the time of birth"
        value={formatTime(details.timeOfBirth)}
        onPress={onTimePress}
        scale={scale}
      />

      <Text style={[styles.fieldLabel, { fontSize: 12 * scale }]}>Birth Place</Text>
      <InputField
        icon={MapPin}
        placeholder="Select the place of birth"
        value={details.birthPlace?.name || ''}
        onPress={onPlacePress}
        scale={scale}
      />
    </Animated.View>
  );
});

PersonDetailsCard.displayName = 'PersonDetailsCard';

// Name Input Modal - Fixed state sync issue
const NameInputModal = memo(({
  visible,
  value,
  title,
  onClose,
  onSave,
  scale,
}: {
  visible: boolean;
  value: string;
  title: string;
  onClose: () => void;
  onSave: (name: string) => void;
  scale: number;
}) => {
  const [name, setName] = useState(value);
  const inputRef = useRef<TextInput>(null);

  // Sync internal state when value prop changes (fixes stale state on reopen)
  useEffect(() => {
    if (visible) {
      setName(value);
      // Auto-focus with slight delay for modal animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, value]);

  const handleSave = useCallback(() => {
    onSave(name);
    onClose();
  }, [name, onSave, onClose]);

  const handleClose = useCallback(() => {
    setName(value); // Reset to original value on cancel
    onClose();
  }, [value, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.modalContent, { padding: 24 * scale, borderRadius: 20 * scale }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: 18 * scale }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24 * scale} color="#595959" />
            </TouchableOpacity>
          </View>
          <TextInput
            ref={inputRef}
            style={[styles.modalInput, {
              height: 50 * scale,
              borderRadius: 12 * scale,
              paddingHorizontal: 16 * scale,
              fontSize: 16 * scale,
              marginTop: 16 * scale,
            }]}
            placeholder="Enter name"
            placeholderTextColor="#888888"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[styles.modalButton, {
              height: 50 * scale,
              borderRadius: 25 * scale,
              marginTop: 20 * scale,
            }]}
            onPress={handleSave}
          >
            <Text style={[styles.modalButtonText, { fontSize: 16 * scale }]}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

NameInputModal.displayName = 'NameInputModal';

// Location Search Modal - Optimized with proper cleanup
const LocationModal = memo(({
  visible,
  onClose,
  onSelect,
  scale,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: BirthPlace) => void;
  scale: number;
}) => {
  const [search, setSearch] = useState('');
  const [apiCities, setApiCities] = useState<BirthPlace[]>([]);
  const [popularCities, setPopularCities] = useState<BirthPlace[]>(FALLBACK_CITIES);
  const [searchingCities, setSearchingCities] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) {
      setSearch('');
      setApiCities([]);
      setSearchingCities(false);
    }
  }, [visible]);

  // Load popular cities on mount
  useEffect(() => {
    if (visible) {
      const loadPopular = async () => {
        try {
          const cities = await placesService.getPopularCities(10);
          if (isMountedRef.current && cities.length > 0) {
            setPopularCities(cities);
          }
        } catch (error) {
          // Use fallback cities
        }
      };
      loadPopular();
    }
  }, [visible]);

  // Debounced search with AbortController
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (search.trim().length < 2) {
      setApiCities([]);
      setSearchingCities(false);
      return;
    }

    setSearchingCities(true);
    abortControllerRef.current = new AbortController();

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await placesService.searchPlaces(search.trim(), 10);
        if (isMountedRef.current) {
          setApiCities(results);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setApiCities([]);
        }
      } finally {
        if (isMountedRef.current) {
          setSearchingCities(false);
        }
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Display cities - memoized
  const displayedCities = useMemo(() => {
    if (search.trim().length >= 2 && apiCities.length > 0) {
      return apiCities;
    }
    if (search.trim().length >= 2 && apiCities.length === 0 && !searchingCities) {
      const query = search.toLowerCase();
      return popularCities.filter(city =>
        city.name.toLowerCase().includes(query)
      );
    }
    return popularCities;
  }, [search, apiCities, popularCities, searchingCities]);

  // Memoized city selection handler
  const handleCitySelect = useCallback((city: BirthPlace) => {
    Haptics.selectionAsync();
    onSelect(city);
    onClose();
  }, [onSelect, onClose]);

  // Memoized city item renderer
  const renderCityItem = useCallback((city: BirthPlace, index: number) => (
    <TouchableOpacity
      key={`${city.name}-${city.latitude}-${index}`}
      style={[styles.locationItem, { paddingVertical: 14 * scale, paddingHorizontal: 20 * scale }]}
      onPress={() => handleCitySelect(city)}
    >
      <MapPin size={18 * scale} color="#2930A6" />
      <Text style={[styles.locationText, { fontSize: 14 * scale, marginLeft: 12 * scale }]}>
        {city.name}
      </Text>
    </TouchableOpacity>
  ), [scale, handleCitySelect]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.locationModalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.locationModalContent, { borderTopLeftRadius: 24 * scale, borderTopRightRadius: 24 * scale }]}
        >
          <View style={[styles.modalHeader, { padding: 20 * scale }]}>
            <Text style={[styles.modalTitle, { fontSize: 18 * scale }]}>Select Birth Place</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24 * scale} color="#595959" />
            </TouchableOpacity>
          </View>

          <View style={{ position: 'relative', marginHorizontal: 20 * scale }}>
            <TextInput
              style={[styles.locationSearchInput, {
                height: 48 * scale,
                borderRadius: 24 * scale,
                paddingHorizontal: 20 * scale,
                fontSize: 14 * scale,
                paddingRight: searchingCities ? 50 * scale : 20 * scale,
              }]}
              placeholder="Search city..."
              placeholderTextColor="#888888"
              value={search}
              onChangeText={setSearch}
            />
            {searchingCities && (
              <View style={{ position: 'absolute', right: 16 * scale, top: 0, bottom: 0, justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#2930A6" />
              </View>
            )}
          </View>

          <ScrollView style={{ maxHeight: 300 * scale, marginTop: 12 * scale }}>
            {displayedCities.length === 0 && !searchingCities && search.trim().length >= 2 ? (
              <View style={{ paddingVertical: 20 * scale, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Lexend_400Regular', color: '#888888', fontSize: 14 * scale }}>
                  No cities found
                </Text>
              </View>
            ) : (
              displayedCities.map(renderCityItem)
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
});

LocationModal.displayName = 'LocationModal';

const KundliMatchingInputScreen = ({ navigation }: any) => {
  const { scale } = useResponsiveLayout();
  const { saveMatching } = useSavedMatchings();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (wizard-type: compact but consistent)
  const yellowHeaderHeight = 100 * scale + statusBarHeight;

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Boy's details
  const [boyDetails, setBoyDetails] = useState<PersonDetails>({
    name: '',
    dateOfBirth: null,
    timeOfBirth: null,
    birthPlace: null,
  });

  // Girl's details
  const [girlDetails, setGirlDetails] = useState<PersonDetails>({
    name: '',
    dateOfBirth: null,
    timeOfBirth: null,
    birthPlace: null,
  });

  // Modal states
  const [nameModal, setNameModal] = useState<{ visible: boolean; target: 'boy' | 'girl' }>({ visible: false, target: 'boy' });
  const [locationModal, setLocationModal] = useState<{ visible: boolean; target: 'boy' | 'girl' }>({ visible: false, target: 'boy' });

  // Platform-specific picker state (unified for date and time)
  const [pickerConfig, setPickerConfig] = useState<DateTimePickerConfig>({
    visible: false,
    mode: 'date',
    value: new Date(2000, 0, 1),
    target: 'boy',
  });

  // Temp value for iOS picker (confirmed only when "Done" is pressed)
  const [tempPickerValue, setTempPickerValue] = useState<Date>(new Date(2000, 0, 1));

  const [saving, setSaving] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      boyDetails.name.trim().length >= 2 &&
      boyDetails.dateOfBirth !== null &&
      boyDetails.timeOfBirth !== null &&
      boyDetails.birthPlace !== null &&
      girlDetails.name.trim().length >= 2 &&
      girlDetails.dateOfBirth !== null &&
      girlDetails.timeOfBirth !== null &&
      girlDetails.birthPlace !== null
    );
  }, [boyDetails, girlDetails]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Memoized updateDetails function
  const updateDetails = useCallback((target: 'boy' | 'girl', field: keyof PersonDetails, value: any) => {
    if (target === 'boy') {
      setBoyDetails(prev => ({ ...prev, [field]: value }));
    } else {
      setGirlDetails(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  // Format time helper (defined outside to prevent recreation)
  const formatTimeForApi = useCallback((date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  const handleMatch = useCallback(async () => {
    if (!isFormValid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare input for API
      const matchingInput = {
        boy: {
          name: boyDetails.name,
          gender: 'male' as const,
          dateOfBirth: boyDetails.dateOfBirth!.toISOString().split('T')[0], // YYYY-MM-DD
          timeOfBirth: formatTimeForApi(boyDetails.timeOfBirth!),
          birthPlace: boyDetails.birthPlace!,
        },
        girl: {
          name: girlDetails.name,
          gender: 'female' as const,
          dateOfBirth: girlDetails.dateOfBirth!.toISOString().split('T')[0], // YYYY-MM-DD
          timeOfBirth: formatTimeForApi(girlDetails.timeOfBirth!),
          birthPlace: girlDetails.birthPlace!,
        },
      };

      // Try API first, fallback to local storage if API fails
      let saved;
      try {
        saved = await matchingService.generate(matchingInput);
      } catch (apiError) {
        console.warn('API matching generation failed, saving locally:', apiError);
        // Fallback to local storage with mock score
        const boyData: Omit<SavedKundli, 'id'> = {
          name: boyDetails.name,
          gender: 'male',
          dateOfBirth: boyDetails.dateOfBirth!.toISOString(),
          timeOfBirth: formatTimeForApi(boyDetails.timeOfBirth!),
          birthPlace: boyDetails.birthPlace!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const girlData: Omit<SavedKundli, 'id'> = {
          name: girlDetails.name,
          gender: 'female',
          dateOfBirth: girlDetails.dateOfBirth!.toISOString(),
          timeOfBirth: formatTimeForApi(girlDetails.timeOfBirth!),
          birthPlace: girlDetails.birthPlace!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        saved = await saveMatching({
          boy: boyData,
          girl: girlData,
          score: Math.floor(Math.random() * 18) + 18, // Mock score 18-36
          maxScore: 36,
        });
      }

      if (isMountedRef.current) {
        navigation.replace('KundliMatchingReport', {
          matchingId: saved.id,
          matchingData: saved,
        });
      }
    } catch (error) {
      console.error('Error saving matching:', error);
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [isFormValid, boyDetails, girlDetails, saveMatching, navigation, formatTimeForApi]);

  // Open date picker - platform specific
  const openDatePicker = useCallback((target: 'boy' | 'girl') => {
    Haptics.selectionAsync();
    const currentDate = target === 'boy' ? boyDetails.dateOfBirth : girlDetails.dateOfBirth;
    const initialValue = currentDate || new Date(2000, 0, 1);

    setTempPickerValue(initialValue);
    setPickerConfig({
      visible: true,
      mode: 'date',
      value: initialValue,
      target,
    });
  }, [boyDetails.dateOfBirth, girlDetails.dateOfBirth]);

  // Open time picker - platform specific
  const openTimePicker = useCallback((target: 'boy' | 'girl') => {
    Haptics.selectionAsync();
    const currentTime = target === 'boy' ? boyDetails.timeOfBirth : girlDetails.timeOfBirth;
    const initialValue = currentTime || new Date();

    setTempPickerValue(initialValue);
    setPickerConfig({
      visible: true,
      mode: 'time',
      value: initialValue,
      target,
    });
  }, [boyDetails.timeOfBirth, girlDetails.timeOfBirth]);

  // Handle picker change - platform specific behavior
  const handlePickerChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android: picker auto-dismisses, apply value immediately if not cancelled
      setPickerConfig(prev => ({ ...prev, visible: false }));
      if (event.type === 'set' && selectedDate) {
        const field = pickerConfig.mode === 'date' ? 'dateOfBirth' : 'timeOfBirth';
        updateDetails(pickerConfig.target, field, selectedDate);
      }
    } else {
      // iOS: update temp value, user confirms with "Done" button
      if (selectedDate) {
        setTempPickerValue(selectedDate);
      }
    }
  }, [pickerConfig.mode, pickerConfig.target, updateDetails]);

  // Confirm iOS picker selection
  const confirmPickerSelection = useCallback(() => {
    const field = pickerConfig.mode === 'date' ? 'dateOfBirth' : 'timeOfBirth';
    updateDetails(pickerConfig.target, field, tempPickerValue);
    setPickerConfig(prev => ({ ...prev, visible: false }));
  }, [pickerConfig.mode, pickerConfig.target, tempPickerValue, updateDetails]);

  // Close picker without saving (iOS only, Android auto-closes)
  const closePickerModal = useCallback(() => {
    setPickerConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Memoized callbacks for PersonDetailsCard
  const boyCallbacks = useMemo(() => ({
    onNamePress: () => setNameModal({ visible: true, target: 'boy' }),
    onDatePress: () => openDatePicker('boy'),
    onTimePress: () => openTimePicker('boy'),
    onPlacePress: () => setLocationModal({ visible: true, target: 'boy' }),
  }), [openDatePicker, openTimePicker]);

  const girlCallbacks = useMemo(() => ({
    onNamePress: () => setNameModal({ visible: true, target: 'girl' }),
    onDatePress: () => openDatePicker('girl'),
    onTimePress: () => openTimePicker('girl'),
    onPlacePress: () => setLocationModal({ visible: true, target: 'girl' }),
  }), [openDatePicker, openTimePicker]);

  // Close name modal callback
  const closeNameModal = useCallback(() => {
    setNameModal(prev => ({ ...prev, visible: false }));
  }, []);

  // Close location modal callback
  const closeLocationModal = useCallback(() => {
    setLocationModal(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle name save
  const handleNameSave = useCallback((name: string) => {
    updateDetails(nameModal.target, 'name', name);
  }, [nameModal.target, updateDetails]);

  // Handle location select
  const handleLocationSelect = useCallback((place: BirthPlace) => {
    updateDetails(locationModal.target, 'birthPlace', place);
  }, [locationModal.target, updateDetails]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Yellow Background - Extends behind status bar */}
      <View style={[
        styles.headerBackground,
        {
          height: yellowHeaderHeight,
          borderBottomLeftRadius: 28 * scale,
          borderBottomRightRadius: 28 * scale,
        }
      ]} />

      {/* Content with safe area padding */}
      <View style={[styles.mainContent, { paddingTop: statusBarHeight }]}>

        {/* Header Row - On Yellow */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24 * scale} color="#333333" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>
            Kundli Matching
          </Text>

          <View style={styles.headerRight} />
        </View>

        {/* Subtitle - On Yellow */}
        <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
          Enter birth details for matching
        </Text>

        {/* White Content Area */}
        <View style={[styles.whiteContentArea, { marginTop: 12 * scale }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.content}
              contentContainerStyle={{ paddingHorizontal: 20 * scale, paddingTop: 16 * scale, paddingBottom: 120 * scale }}
              showsVerticalScrollIndicator={false}
            >
            {/* Boy's Details */}
            <PersonDetailsCard
              title="Boy's Details"
              details={boyDetails}
              onNamePress={boyCallbacks.onNamePress}
              onDatePress={boyCallbacks.onDatePress}
              onTimePress={boyCallbacks.onTimePress}
              onPlacePress={boyCallbacks.onPlacePress}
              scale={scale}
            />

            {/* Girl's Details */}
            <PersonDetailsCard
              title="Girl's Details"
              details={girlDetails}
              onNamePress={girlCallbacks.onNamePress}
              onDatePress={girlCallbacks.onDatePress}
              onTimePress={girlCallbacks.onTimePress}
              onPlacePress={girlCallbacks.onPlacePress}
              scale={scale}
            />

            {/* Match Button */}
            <View style={[styles.buttonContainer, { paddingHorizontal: 0, paddingBottom: 32 * scale }]}>
              <TouchableOpacity
                style={[
                  styles.matchButton,
                  { height: 56 * scale, borderRadius: 28 * scale },
                  !isFormValid && styles.matchButtonDisabled,
                ]}
                onPress={handleMatch}
                disabled={!isFormValid || saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.matchButtonText, { fontSize: 16 * scale }]}>
                    Match Kundli
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        {/* Name Input Modal */}
        <NameInputModal
          visible={nameModal.visible}
          value={nameModal.target === 'boy' ? boyDetails.name : girlDetails.name}
          title={nameModal.target === 'boy' ? "Boy's Name" : "Girl's Name"}
          onClose={closeNameModal}
          onSave={handleNameSave}
          scale={scale}
        />

        {/* Platform-Specific Date/Time Picker */}
        {Platform.OS === 'ios' ? (
          // iOS: Show picker in a modal with Done button
          <Modal
            visible={pickerConfig.visible}
            transparent
            animationType="fade"
            onRequestClose={closePickerModal}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.pickerModalContent, { padding: 20 * scale, borderRadius: 20 * scale }]}>
                <Text style={[styles.modalTitle, { fontSize: 18 * scale, marginBottom: 16 * scale }]}>
                  {pickerConfig.mode === 'date' ? 'Select Date of Birth' : 'Select Time of Birth'}
                </Text>
                <DateTimePicker
                  value={tempPickerValue}
                  mode={pickerConfig.mode}
                  display="spinner"
                  onChange={handlePickerChange}
                  maximumDate={pickerConfig.mode === 'date' ? new Date() : undefined}
                  textColor="#1a1a1a"
                />
                <TouchableOpacity
                  style={[styles.modalButton, { height: 48 * scale, borderRadius: 24 * scale, marginTop: 16 * scale }]}
                  onPress={confirmPickerSelection}
                >
                  <Text style={[styles.modalButtonText, { fontSize: 16 * scale }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          // Android: Native picker dialog (no modal wrapper needed)
          pickerConfig.visible && (
            <DateTimePicker
              value={pickerConfig.value}
              mode={pickerConfig.mode}
              display="default"
              onChange={handlePickerChange}
              maximumDate={pickerConfig.mode === 'date' ? new Date() : undefined}
            />
          )
        )}

        {/* Location Modal */}
        <LocationModal
          visible={locationModal.visible}
          onClose={closeLocationModal}
          onSelect={handleLocationSelect}
          scale={scale}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFCF0D',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  subtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 2,
  },
  whiteContentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  fieldLabel: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 12,
    color: '#595959',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCF0D',
  },
  inputText: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
  },
  inputPlaceholder: {
    color: '#595959',
  },
  buttonContainer: {
    paddingTop: 16,
  },
  matchButton: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  matchButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  modalButton: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxWidth: 400,
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    maxHeight: '70%',
  },
  locationSearchInput: {
    backgroundColor: '#F5F5F5',
    fontFamily: 'Lexend_400Regular',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
});

export default KundliMatchingInputScreen;

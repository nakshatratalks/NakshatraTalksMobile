/**
 * KundliGenerationScreen
 * 5-step wizard for collecting birth details to generate Kundli
 * Steps: Name → Gender → DOB → Time → Location
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Layout,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { WizardProgressBar } from '../components/kundli/WizardProgressBar';
import { DateWheelPicker, TimeWheelPicker } from '../components/kundli/WheelPicker';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useSavedKundlis } from '../src/hooks/useKundliStorage';
import { KundliWizardData, KundliWizardStep, BirthPlace } from '../src/types/kundli';

// Wizard steps configuration
const STEPS: KundliWizardStep[] = ['name', 'gender', 'dob', 'time', 'location'];

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Others' },
];

// Sample cities for location (will be replaced with actual database)
const SAMPLE_CITIES: BirthPlace[] = [
  { name: 'Chennai, Tamil Nadu', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { name: 'Mumbai, Maharashtra', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Delhi, Delhi', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
  { name: 'Bangalore, Karnataka', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Hyderabad, Telangana', latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata, West Bengal', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Coimbatore, Tamil Nadu', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata' },
  { name: 'Madurai, Tamil Nadu', latitude: 9.9252, longitude: 78.1198, timezone: 'Asia/Kolkata' },
];

const KundliGenerationScreen = ({ navigation }: any) => {
  const { scale } = useResponsiveLayout();
  const { saveKundli } = useSavedKundlis();
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (wizard-type: compact but consistent)
  const yellowHeaderHeight = 100 * scale + statusBarHeight;

  // Current step (0-4)
  const [currentStep, setCurrentStep] = useState(0);

  // Form data
  const [formData, setFormData] = useState<KundliWizardData>({
    name: '',
    gender: null,
    dateOfBirth: null,
    timeOfBirth: null,
    birthPlace: null,
  });

  // UI states
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'android' ? false : true);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'android' ? false : true);
  const [locationSearch, setLocationSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Current step key
  const stepKey = STEPS[currentStep];

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    switch (stepKey) {
      case 'name':
        return formData.name.trim().length >= 2;
      case 'gender':
        return formData.gender !== null;
      case 'dob':
        return formData.dateOfBirth !== null;
      case 'time':
        return formData.timeOfBirth !== null;
      case 'location':
        return formData.birthPlace !== null;
      default:
        return false;
    }
  }, [stepKey, formData]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!locationSearch.trim()) return SAMPLE_CITIES;
    const query = locationSearch.toLowerCase();
    return SAMPLE_CITIES.filter(city =>
      city.name.toLowerCase().includes(query)
    );
  }, [locationSearch]);

  // Handle back
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation]);

  // Handle next
  const handleNext = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save and navigate to report
      setSaving(true);
      try {
        const timeString = formData.timeOfBirth
          ? `${formData.timeOfBirth.getHours().toString().padStart(2, '0')}:${formData.timeOfBirth.getMinutes().toString().padStart(2, '0')}`
          : '12:00';

        const savedKundli = await saveKundli({
          name: formData.name,
          gender: formData.gender!,
          dateOfBirth: formData.dateOfBirth!.toISOString(),
          timeOfBirth: timeString,
          birthPlace: formData.birthPlace!,
        });

        navigation.replace('KundliReport', {
          kundliId: savedKundli.id,
          kundliData: savedKundli,
        });
      } catch (error) {
        console.error('Error saving kundli:', error);
        setSaving(false);
      }
    }
  }, [currentStep, formData, saveKundli, navigation]);

  // Render step content
  const renderStepContent = () => {
    switch (stepKey) {
      case 'name':
        return (
          <Animated.View
            key="name"
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { fontSize: 24 * scale }]}>
              Hello,{'\n'}What's your name?
            </Text>
            <TextInput
              style={[styles.textInput, {
                fontSize: 16 * scale,
                height: 56 * scale,
                borderRadius: 28 * scale,
                paddingHorizontal: 24 * scale,
                marginTop: 32 * scale,
              }]}
              placeholder="Enter your name"
              placeholderTextColor="#888888"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoFocus
              autoCapitalize="words"
            />
          </Animated.View>
        );

      case 'gender':
        return (
          <Animated.View
            key="gender"
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { fontSize: 24 * scale }]}>
              What's your gender?
            </Text>

            {/* Dropdown Trigger */}
            <TouchableOpacity
              style={[styles.dropdownTrigger, {
                height: 56 * scale,
                borderRadius: 28 * scale,
                paddingHorizontal: 24 * scale,
                marginTop: 32 * scale,
              }]}
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownText,
                { fontSize: 16 * scale },
                !formData.gender && styles.dropdownPlaceholder,
              ]}>
                {formData.gender
                  ? GENDER_OPTIONS.find(g => g.value === formData.gender)?.label
                  : 'Select your gender'}
              </Text>
              <ChevronDown
                size={20 * scale}
                color="#595959"
                style={{ transform: [{ rotate: showGenderDropdown ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showGenderDropdown && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={[styles.dropdownOptions, { marginTop: 8 * scale, borderRadius: 16 * scale }]}
              >
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.dropdownOption, {
                      paddingVertical: 14 * scale,
                      paddingHorizontal: 20 * scale,
                    }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFormData({ ...formData, gender: option.value as any });
                      setShowGenderDropdown(false);
                    }}
                  >
                    <View style={[styles.radioCircle, {
                      width: 22 * scale,
                      height: 22 * scale,
                      borderRadius: 11 * scale,
                    }]}>
                      {formData.gender === option.value && (
                        <Check size={14 * scale} color="#2930A6" />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      { fontSize: 16 * scale, marginLeft: 12 * scale },
                      formData.gender === option.value && styles.optionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </Animated.View>
        );

      case 'dob':
        return (
          <Animated.View
            key="dob"
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { fontSize: 24 * scale }]}>
              Enter your DOB
            </Text>

            <View style={{ marginTop: 32 * scale }}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={formData.dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setFormData({ ...formData, dateOfBirth: date });
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                  style={{ height: 200 }}
                />
              ) : (
                <DateWheelPicker
                  value={formData.dateOfBirth || new Date(2000, 0, 1)}
                  onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                />
              )}
            </View>
          </Animated.View>
        );

      case 'time':
        return (
          <Animated.View
            key="time"
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { fontSize: 24 * scale }]}>
              Enter your time of birth
            </Text>

            <View style={{ marginTop: 32 * scale }}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={formData.timeOfBirth || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setFormData({ ...formData, timeOfBirth: date });
                  }}
                  style={{ height: 200 }}
                />
              ) : (
                <TimeWheelPicker
                  value={formData.timeOfBirth || new Date()}
                  onChange={(date) => setFormData({ ...formData, timeOfBirth: date })}
                />
              )}
            </View>
          </Animated.View>
        );

      case 'location':
        return (
          <Animated.View
            key="location"
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { fontSize: 24 * scale }]}>
              Enter your birth location
            </Text>

            {/* Search Input */}
            <TextInput
              style={[styles.textInput, {
                fontSize: 16 * scale,
                height: 56 * scale,
                borderRadius: 28 * scale,
                paddingHorizontal: 24 * scale,
                marginTop: 32 * scale,
              }]}
              placeholder="Search"
              placeholderTextColor="#888888"
              value={locationSearch}
              onChangeText={setLocationSearch}
            />

            {/* City List */}
            <ScrollView
              style={[styles.cityList, { marginTop: 16 * scale, maxHeight: 250 * scale }]}
              showsVerticalScrollIndicator={false}
            >
              {filteredCities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.cityItem, {
                    paddingVertical: 14 * scale,
                    paddingHorizontal: 16 * scale,
                    borderRadius: 12 * scale,
                    marginBottom: 8 * scale,
                  },
                    formData.birthPlace?.name === city.name && styles.cityItemSelected,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFormData({ ...formData, birthPlace: city });
                    setLocationSearch(city.name);
                  }}
                >
                  <Text style={[
                    styles.cityText,
                    { fontSize: 14 * scale },
                    formData.birthPlace?.name === city.name && styles.cityTextSelected,
                  ]}>
                    {city.name}
                  </Text>
                  {formData.birthPlace?.name === city.name && (
                    <Check size={18 * scale} color="#2930A6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Yellow Background - Small accent for hybrid approach */}
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
              Free Kundli Report
            </Text>

            <View style={styles.headerRight} />
          </View>

          {/* Subtitle - On Yellow */}
          <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
            Enter your birth details
          </Text>

          {/* White Content Area */}
          <View style={[styles.whiteContentArea, { marginTop: 12 * scale }]}>
            {/* Progress Bar */}
            <View style={{ paddingTop: 16 * scale }}>
              <WizardProgressBar
                currentStep={currentStep}
                totalSteps={STEPS.length}
                scale={scale}
              />
            </View>

            {/* Step Content */}
            <View style={[styles.contentContainer, { paddingHorizontal: 24 * scale }]}>
              {renderStepContent()}
            </View>
          </View>

          {/* Next Button */}
          <View style={[styles.buttonContainer, { paddingHorizontal: 24 * scale, paddingBottom: 32 * scale }]}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  height: 56 * scale,
                  borderRadius: 28 * scale,
                },
                !isStepValid && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!isStepValid || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.nextButtonText, { fontSize: 16 * scale }]}>
                  {currentStep === STEPS.length - 1 ? 'Generate Kundli' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 24,
    color: '#1a1a1a',
    lineHeight: 32,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownPlaceholder: {
    color: '#888888',
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  radioCircle: {
    borderWidth: 2,
    borderColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#595959',
  },
  optionTextSelected: {
    fontFamily: 'Lexend_500Medium',
    color: '#2930A6',
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
  },
  cityItemSelected: {
    backgroundColor: 'rgba(41, 48, 166, 0.1)',
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  cityText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#595959',
    flex: 1,
  },
  cityTextSelected: {
    fontFamily: 'Lexend_500Medium',
    color: '#2930A6',
  },
  buttonContainer: {
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default KundliGenerationScreen;

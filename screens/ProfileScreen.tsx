/**
 * ProfileScreen Component
 * Displays and allows editing of user profile information
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Edit3,
  Save,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useProfileData } from '../src/hooks/useProfileData';
import { useAuth } from '../src/contexts/AuthContext';
import NotificationService from '../src/utils/notificationService';
import Sidebar from '../components/Sidebar';
import { BottomNavBar } from '../components/BottomNavBar';
import { SkeletonCircle, SkeletonBox, SkeletonText } from '../components/skeleton';

const ProfileScreen = ({ navigation }: any) => {
  // Hooks
  const { userProfile, loading, error, refetch, updateProfile, updating } = useProfileData();
  const { user } = useAuth();
  const { cardWidth, scale } = useResponsiveLayout();

  // Load Fonts
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // State
  const [activeTab, setActiveTab] = useState(4); // Profile tab is 5th (index 4)
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // Form state for editing
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    timeOfBirth: '',
    gender: null as 'male' | 'female' | 'other' | null,
  });

  // Animation - Initialize to final values (no entrance animation - screens stay mounted)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      setEditedProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        placeOfBirth: userProfile.placeOfBirth || '',
        timeOfBirth: userProfile.timeOfBirth || '',
        gender: userProfile.gender || null,
      });
    }
  }, [userProfile]);

  // No mount animation needed - screens stay mounted via Tab Navigator
  // Values are already initialized to final state

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };


  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form
      if (userProfile) {
        setEditedProfile({
          name: userProfile.name || '',
          email: userProfile.email || '',
          dateOfBirth: userProfile.dateOfBirth || '',
          placeOfBirth: userProfile.placeOfBirth || '',
          timeOfBirth: userProfile.timeOfBirth || '',
          gender: userProfile.gender || null,
        });
      }
    }
    setIsEditing(!isEditing);
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editedProfile.name?.trim()) {
        NotificationService.error('Name is required', 'Validation Error');
        return;
      }

      if (editedProfile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
        NotificationService.error('Please enter a valid email', 'Validation Error');
        return;
      }

      await updateProfile(editedProfile);
      NotificationService.success('Profile updated successfully!', 'Success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // Handle date picker
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
      const formattedDate = formatDateForStorage(selectedDate);
      setEditedProfile({ ...editedProfile, dateOfBirth: formattedDate });
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  const handleDateConfirm = () => {
    const formattedDate = formatDateForStorage(tempDate);
    setEditedProfile({ ...editedProfile, dateOfBirth: formattedDate });
    setShowDatePicker(false);
  };

  // Handle time picker
  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setTempTime(selectedTime);
      const formattedTime = formatTimeForStorage(selectedTime);
      setEditedProfile({ ...editedProfile, timeOfBirth: formattedTime });
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
    }
  };

  const handleTimeConfirm = () => {
    const formattedTime = formatTimeForStorage(tempTime);
    setEditedProfile({ ...editedProfile, timeOfBirth: formattedTime });
    setShowTimePicker(false);
  };

  // Handle gender selection
  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    setEditedProfile({ ...editedProfile, gender });
    setShowGenderPicker(false);
  };

  // Format date for storage (YYYY-MM-DD)
  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time for storage (HH:MM AM/PM)
  const formatTimeForStorage = (time: Date): string => {
    let hours = time.getHours();
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Open date picker
  const openDatePicker = () => {
    if (editedProfile.dateOfBirth) {
      const parsedDate = new Date(editedProfile.dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
        setTempDate(parsedDate);
      }
    }
    setShowDatePicker(true);
  };

  // Open time picker
  const openTimePicker = () => {
    if (editedProfile.timeOfBirth) {
      const [time, period] = editedProfile.timeOfBirth.split(' ');
      const [hoursStr, minutes] = time.split(':');
      let hours = parseInt(hoursStr, 10);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const parsedTime = new Date();
      parsedTime.setHours(hours, parseInt(minutes, 10));
      setTempTime(parsedTime);
    }
    setShowTimePicker(true);
  };

  // Wait only for fonts, not for data
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2930A6" />
      </View>
    );
  }

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      const number = phone.substring(3);
      return {
        countryCode: '+91',
        number: number.replace(/(\d{5})(\d{5})/, '$1 $2'),
      };
    }
    return {
      countryCode: '+91',
      number: phone.replace(/(\d{5})(\d{5})/, '$1 $2'),
    };
  };

  const { countryCode, number: formattedNumber } = userProfile ? formatPhoneNumber(userProfile.phone) : { countryCode: '+91', number: '' };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {/* Profile Header Section - Split into Left (Yellow) and Right (White) - FIXED HEIGHT */}
        <View style={[styles.profileHeader, { height: 240 * scale }]}>
          {/* Left Container - Yellow Background with Profile Image and Name */}
          <View style={styles.leftContainer}>
            {/* Title at Top */}
            <Text style={[styles.headerTitle, { fontSize: 18 * scale, marginTop: 50 * scale, marginBottom: 10 * scale, marginLeft: 15 * scale }]}>
              Profile
            </Text>

            {/* Profile Image */}
            {loading || !userProfile ? (
              <SkeletonPlaceholder
                width={90 * scale}
                height={90 * scale}
                borderRadius={45 * scale}
                style={{ marginTop: 10 * scale }}
              />
            ) : (
              <Image
                source={
                  userProfile.profileImage
                    ? { uri: userProfile.profileImage }
                    : require('../assets/images/astrologer1.png')
                }
                style={[styles.profileImage, { width: 90 * scale, height: 90 * scale, borderRadius: 45 * scale }]}
              />
            )}

            {/* User Name */}
            {loading || !userProfile ? (
              <SkeletonPlaceholder
                width={120 * scale}
                height={20 * scale}
                style={{ marginTop: 10 * scale }}
              />
            ) : (
              <Text style={[styles.userName, { fontSize: 16 * scale, marginTop: 10 * scale }]}>
                {userProfile.name || 'User'}
              </Text>
            )}
          </View>

          {/* Right Container - White Background with Contact Information */}
          <View style={styles.rightContainer}>
            {/* Edit/Save Button */}
            <TouchableOpacity
              style={[styles.editButton, { top: 50 * scale, right: 10 * scale }]}
              onPress={isEditing ? handleSave : handleEditToggle}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#2930A6" />
              ) : isEditing ? (
                <Save size={20 * scale} color="#2930A6" />
              ) : (
                <Edit3 size={20 * scale} color="#2930A6" />
              )}
            </TouchableOpacity>

            {/* Contact Info */}
            <View style={[styles.contactInfo, { marginTop: 85 * scale }]}>
              {loading || !userProfile ? (
                <>
                  {/* Skeleton for contact info */}
                  {[1, 2, 3, 4].map((item) => (
                    <View key={item} style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                      <SkeletonPlaceholder width={80 * scale} height={12 * scale} style={{ marginBottom: 4 * scale }} />
                      <SkeletonPlaceholder width={100 * scale} height={10 * scale} />
                    </View>
                  ))}
                </>
              ) : (
                <>
                  {/* Phone Number */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>Phone Number</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]} numberOfLines={1} ellipsizeMode="tail">
                      {countryCode} {formattedNumber}
                    </Text>
                  </View>

                  {/* City/Town */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>City/Town</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]} numberOfLines={1} ellipsizeMode="tail">Chennai</Text>
                  </View>

                  {/* Address */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>Address</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]} numberOfLines={2} ellipsizeMode="tail">
                      No 45, abc nagar, 1st street
                    </Text>
                  </View>

                  {/* Pincode */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>Pincode</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]} numberOfLines={1} ellipsizeMode="tail">600 026</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Birth Details Section - Scrollable */}
        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={[styles.birthDetailsSection, { paddingHorizontal: 20 * scale, paddingTop: 15 * scale, paddingBottom: 100 * scale }]}
          showsVerticalScrollIndicator={false}
        >
          {loading || !userProfile ? (
            <>
              {/* Skeleton for birth details */}
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={[styles.formGroup, { marginTop: item > 1 ? 20 * scale : 0 }]}>
                  <SkeletonPlaceholder width={120 * scale} height={16 * scale} style={{ marginBottom: 12 * scale }} />
                  <SkeletonPlaceholder width={'100%'} height={37 * scale} borderRadius={12 * scale} />
                </View>
              ))}
            </>
          ) : (
            <>
              {/* Date of Birth */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { fontSize: 16 * scale }]}>Date of Birth</Text>
                {isEditing ? (
                <TouchableOpacity
                  onPress={openDatePicker}
                  style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}
                  activeOpacity={0.7}
                >
                  <Calendar size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale, color: editedProfile.dateOfBirth ? '#2930A6' : '#AAAAAA' }]}>
                    {editedProfile.dateOfBirth ? formatDate(editedProfile.dateOfBirth) : 'Select date'}
                  </Text>
                  <ChevronDown size={18 * scale} color="#2930A6" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Calendar size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.inputText, { fontSize: 14 * scale, marginLeft: 12 * scale }]}>
                    {formatDate(userProfile.dateOfBirth)}
                  </Text>
                </View>
              )}
            </View>

            {/* Place of Birth */}
            <View style={[styles.formGroup, { marginTop: 20 * scale }]}>
              <Text style={[styles.formLabel, { fontSize: 14 * scale }]}>Place of Birth</Text>
              {isEditing ? (
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <MapPin size={24 * scale} color="#FFCF0D" />
                  <TextInput
                    style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale }]}
                    value={editedProfile.placeOfBirth}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, placeOfBirth: text })}
                    placeholder="Enter place of birth"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
              ) : (
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <MapPin size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.inputText, { fontSize: 14 * scale, marginLeft: 12 * scale }]}>
                    {userProfile.placeOfBirth || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            {/* Time of Birth */}
            <View style={[styles.formGroup, { marginTop: 20 * scale }]}>
              <Text style={[styles.formLabel, { fontSize: 16 * scale }]}>Time of Birth</Text>
              {isEditing ? (
                <TouchableOpacity
                  onPress={openTimePicker}
                  style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}
                  activeOpacity={0.7}
                >
                  <Clock size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale, color: editedProfile.timeOfBirth ? '#2930A6' : '#AAAAAA' }]}>
                    {editedProfile.timeOfBirth || 'Select time'}
                  </Text>
                  <ChevronDown size={18 * scale} color="#2930A6" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Clock size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.inputText, { fontSize: 14 * scale, marginLeft: 12 * scale }]}>
                    {userProfile.timeOfBirth || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            {/* Gender */}
            <View style={[styles.formGroup, { marginTop: 20 * scale, marginBottom: 20 * scale }]}>
              <Text style={[styles.formLabel, { fontSize: 16 * scale }]}>Gender</Text>
              {isEditing ? (
                <TouchableOpacity
                  onPress={() => setShowGenderPicker(true)}
                  style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}
                  activeOpacity={0.7}
                >
                  <Users size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale, color: editedProfile.gender ? '#2930A6' : '#AAAAAA' }]}>
                    {editedProfile.gender ? editedProfile.gender.charAt(0).toUpperCase() + editedProfile.gender.slice(1) : 'Select gender'}
                  </Text>
                  <ChevronDown size={18 * scale} color="#2930A6" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Users size={24 * scale} color="#FFCF0D" />
                  <Text style={[styles.inputText, { fontSize: 14 * scale, marginLeft: 12 * scale }]}>
                    {userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Not set'}
                  </Text>
                </View>
              )}
            </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        navigation={navigation}
      />

      {/* Date Picker Modal (iOS) */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker (Android) */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Time Picker Modal (iOS) */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={handleTimeConfirm}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker (Android) */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Gender Picker Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={showGenderPicker}
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderPicker(false)}
        >
          <View style={styles.genderPickerContent}>
            <View style={styles.genderPickerHeader}>
              <Text style={styles.genderPickerTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.genderOption, editedProfile.gender === 'male' && styles.genderOptionSelected]}
              onPress={() => handleGenderSelect('male')}
            >
              <Text style={[styles.genderOptionText, editedProfile.gender === 'male' && styles.genderOptionTextSelected]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderOption, editedProfile.gender === 'female' && styles.genderOptionSelected]}
              onPress={() => handleGenderSelect('female')}
            >
              <Text style={[styles.genderOptionText, editedProfile.gender === 'female' && styles.genderOptionTextSelected]}>
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderOption, editedProfile.gender === 'other' && styles.genderOptionSelected]}
              onPress={() => handleGenderSelect('other')}
            >
              <Text style={[styles.genderOptionText, editedProfile.gender === 'other' && styles.genderOptionTextSelected]}>
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Skeleton Placeholder Component
const SkeletonPlaceholder = ({ width, height, borderRadius = 8, style }: any) => {
  if (borderRadius && borderRadius >= (typeof height === 'number' ? height / 2 : 0)) {
    // It's a circle
    return <SkeletonCircle size={typeof width === 'number' ? width : 0} style={style} />;
  }
  return <SkeletonBox width={width} height={height} borderRadius={borderRadius} style={style} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollableContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Lexend_400Regular',
  },
  retryButton: {
    backgroundColor: '#2930A6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Lexend_600SemiBold',
  },
  profileHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  leftContainer: {
    flex: 0.45,
    backgroundColor: '#FFCF0D',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 0,
    justifyContent: 'flex-start',
  },
  rightContainer: {
    flex: 0.55,
    backgroundColor: '#FFFFFF',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 0,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  headerTitle: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
    alignSelf: 'flex-start',
  },
  editButton: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
  },
  cancelButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  contactInfo: {
    flex: 1,
  },
  infoGroup: {
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'Lexend_400Regular',
    color: '#000000',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoValue: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
  },
  birthDetailsSection: {
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontFamily: 'Lexend_400Regular',
    color: '#000000',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: '#FFCF0D',
    paddingHorizontal: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: 'Lexend_500Medium',
    color: '#2930A6',
  },
  inputText: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
  },
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pickerCancelText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#666666',
  },
  pickerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 17,
    color: '#1A1A1A',
  },
  pickerDoneText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#2930A6',
  },
  // Gender Picker Styles
  genderPickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  genderPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  genderPickerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  genderOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 8,
    marginTop: 8,
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(41, 48, 166, 0.1)',
    borderColor: '#2930A6',
    borderWidth: 1,
  },
  genderOptionText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 16,
    color: '#333333',
  },
  genderOptionTextSelected: {
    color: '#2930A6',
    fontFamily: 'Lexend_600SemiBold',
  },
});

export default ProfileScreen;

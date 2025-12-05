/**
 * ProfileScreen Component
 * Displays and allows editing of user profile information
 * Refactored for Premium UI/UX
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
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
  Camera,
  Phone,
  Mail,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useProfileData } from '../src/hooks/useProfileData';
import { useAuth } from '../src/contexts/AuthContext';
import NotificationService from '../src/utils/notificationService';
import Sidebar from '../components/Sidebar';
import { BottomNavBar } from '../components/BottomNavBar';
import { SkeletonCircle, SkeletonBox } from '../components/skeleton';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProfileScreen = ({ navigation }: any) => {
  // Hooks
  const { userProfile, loading, error, refetch, updateProfile, updating } = useProfileData();
  const { user, logout } = useAuth();
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

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const editButtonScale = useRef(new Animated.Value(1)).current;

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

  // Set status bar
  useFocusEffect(
    useCallback(() => {
      if (!sidebarVisible) {
        setStatusBarStyle('dark'); // Dark content for yellow header
      }
    }, [sidebarVisible])
  );

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Animate button
    Animated.sequence([
      Animated.timing(editButtonScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(editButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

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
      // Basic parsing for "HH:MM AM/PM"
      try {
        const [time, period] = editedProfile.timeOfBirth.split(' ');
        const [hoursStr, minutes] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const parsedTime = new Date();
        parsedTime.setHours(hours, parseInt(minutes, 10));
        setTempTime(parsedTime);
      } catch (e) {
        setTempTime(new Date());
      }
    }
    setShowTimePicker(true);
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return { countryCode: '+91', number: '' };
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

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback if invalid
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2930A6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 * scale }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2930A6"
              colors={['#2930A6']}
            />
          }
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#FFCF0D', '#FFD700']}
              style={styles.headerGradient}
            >
              {/* Top Bar */}
              <SafeAreaView edges={['top']} style={styles.topBar}>
                <TouchableOpacity
                  onPress={() => setSidebarVisible(true)}
                  style={styles.menuButton}
                >
                  {/* Menu Icon would go here if needed */}
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>Profile</Text>
                <View style={{ width: 40 }} />
              </SafeAreaView>

              {/* Profile Info */}
              <View style={[styles.profileInfoContainer, { marginTop: 20 * scale }]}>
                <View style={styles.profileImageWrapper}>
                  {loading || !userProfile ? (
                    <SkeletonCircle size={100 * scale} />
                  ) : (
                    <View>
                      <Image
                        source={
                          userProfile.profileImage
                            ? { uri: userProfile.profileImage }
                            : require('../assets/images/astrologer1.png')
                        }
                        style={[styles.profileImage, { width: 100 * scale, height: 100 * scale, borderRadius: 50 * scale }]}
                      />
                      {isEditing && (
                        <TouchableOpacity style={styles.cameraButton}>
                          <Camera size={16 * scale} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {loading || !userProfile ? (
                  <SkeletonBox width={150 * scale} height={24 * scale} style={{ marginTop: 16 * scale }} />
                ) : (
                  <View style={styles.nameContainer}>
                    {isEditing ? (
                      <TextInput
                        style={[styles.nameInput, { fontSize: 20 * scale }]}
                        value={editedProfile.name}
                        onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                        placeholder="Enter Name"
                        placeholderTextColor="rgba(41, 48, 166, 0.6)"
                        selectionColor="#2930A6"
                      />
                    ) : (
                      <Text style={[styles.userName, { fontSize: 20 * scale }]}>
                        {userProfile.name || 'User'}
                      </Text>
                    )}
                    <Text style={[styles.userPhone, { fontSize: 14 * scale }]}>
                      {countryCode} {formattedNumber}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Floating Edit Button */}
            <Animated.View style={[
              styles.floatingEditButtonContainer,
              {
                top: 250 * scale,
                right: 30 * scale,
                transform: [{ scale: editButtonScale }]
              }
            ]}>
              <TouchableOpacity
                style={[styles.floatingEditButton, { backgroundColor: isEditing ? '#4CAF50' : '#2930A6' }]}
                onPress={isEditing ? handleSave : handleEditToggle}
                disabled={updating}
                activeOpacity={0.8}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isEditing ? (
                  <Save size={24 * scale} color="#FFFFFF" />
                ) : (
                  <Edit3 size={24 * scale} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>

            {/* Personal Details Card */}
            <View style={[styles.card, { padding: 20 * scale, borderRadius: 24 * scale }]}>
              <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>Personal Details</Text>

              {/* Email */}
              <View style={[styles.detailRow, { marginTop: 16 * scale }]}>
                <View style={styles.iconContainer}>
                  <Mail size={20 * scale} color="#2930A6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Email Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.detailInput, { fontSize: 14 * scale }]}
                      value={editedProfile.email}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                      placeholder="Enter Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                      {userProfile?.email || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Gender */}
              <View style={[styles.detailRow, { marginTop: 16 * scale }]}>
                <View style={styles.iconContainer}>
                  <Users size={20 * scale} color="#2930A6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Gender</Text>
                  {isEditing ? (
                    <TouchableOpacity onPress={() => setShowGenderPicker(true)}>
                      <Text style={[styles.detailInput, { fontSize: 14 * scale, color: editedProfile.gender ? '#1A1A1A' : '#999' }]}>
                        {editedProfile.gender ? editedProfile.gender.charAt(0).toUpperCase() + editedProfile.gender.slice(1) : 'Select Gender'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                      {userProfile?.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Not set'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Birth Details Card */}
            <View style={[styles.card, { padding: 20 * scale, borderRadius: 24 * scale, marginTop: 20 * scale }]}>
              <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>Birth Details</Text>

              {/* Date of Birth */}
              <View style={[styles.detailRow, { marginTop: 16 * scale }]}>
                <View style={styles.iconContainer}>
                  <Calendar size={20 * scale} color="#2930A6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Date of Birth</Text>
                  {isEditing ? (
                    <TouchableOpacity onPress={openDatePicker}>
                      <Text style={[styles.detailInput, { fontSize: 14 * scale, color: editedProfile.dateOfBirth ? '#1A1A1A' : '#999' }]}>
                        {editedProfile.dateOfBirth ? formatDate(editedProfile.dateOfBirth) : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                      {formatDate(userProfile?.dateOfBirth)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Time of Birth */}
              <View style={[styles.detailRow, { marginTop: 16 * scale }]}>
                <View style={styles.iconContainer}>
                  <Clock size={20 * scale} color="#2930A6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Time of Birth</Text>
                  {isEditing ? (
                    <TouchableOpacity onPress={openTimePicker}>
                      <Text style={[styles.detailInput, { fontSize: 14 * scale, color: editedProfile.timeOfBirth ? '#1A1A1A' : '#999' }]}>
                        {editedProfile.timeOfBirth || 'Select Time'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                      {userProfile?.timeOfBirth || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Place of Birth */}
              <View style={[styles.detailRow, { marginTop: 16 * scale }]}>
                <View style={styles.iconContainer}>
                  <MapPin size={20 * scale} color="#2930A6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Place of Birth</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.detailInput, { fontSize: 14 * scale }]}
                      value={editedProfile.placeOfBirth}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, placeOfBirth: text })}
                      placeholder="Enter City"
                    />
                  ) : (
                    <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                      {userProfile?.placeOfBirth || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { marginTop: 30 * scale, borderRadius: 16 * scale, height: 50 * scale }]}
              onPress={() => {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout },
                ]);
              }}
            >
              <LogOut size={20 * scale} color="#FF4444" />
              <Text style={[styles.logoutText, { fontSize: 16 * scale }]}>Logout</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        navigation={navigation}
      />

      {/* Modals */}
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
        animationType="fade"
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
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderOption, editedProfile.gender === g && styles.genderOptionSelected]}
                onPress={() => handleGenderSelect(g as any)}
              >
                <Text style={[styles.genderOptionText, editedProfile.gender === g && styles.genderOptionTextSelected]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
                {editedProfile.gender === g && <ChevronRight size={20} color="#2930A6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 0,
    zIndex: 1, // Ensure header is below content if needed, but content needs higher zIndex
  },
  headerGradient: {
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 50, // Added padding for flexible height
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#2930A6', // Dark blue for contrast on yellow
  },
  profileInfoContainer: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2930A6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#2930A6', // Dark blue
    textAlign: 'center',
  },
  nameInput: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#2930A6', // Dark blue
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 48, 166, 0.5)',
    paddingBottom: 4,
    minWidth: 150,
  },
  floatingEditButtonContainer: {
    position: 'absolute',
    bottom: -28, // Half of button height (56/2)
    right: 30,
    zIndex: 10,
  },
  floatingEditButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -30, // Pull content up over the header
    zIndex: 2, // Ensure content sits ON TOP of the header
  },
  card: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  userPhone: {
    fontFamily: 'Lexend_400Regular',
    color: '#1A1A1A', // Black for high contrast
    marginTop: 4,
    marginBottom: 10, // Added margin to avoid cramping
    fontWeight: '600',
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Lexend_400Regular',
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Lexend_500Medium',
    color: '#1A1A1A',
  },
  detailInput: {
    fontFamily: 'Lexend_500Medium',
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCDCD',
  },
  logoutText: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#FF4444',
    marginLeft: 10,
  },
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '90%',
    position: 'absolute',
    bottom: '30%',
  },
  genderPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  genderPickerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
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

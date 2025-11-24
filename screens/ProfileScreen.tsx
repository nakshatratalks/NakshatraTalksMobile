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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  // Animate on mount
  useEffect(() => {
    if (fontsLoaded && userProfile) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded, userProfile]);

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
            <View style={[styles.contactInfo, { marginTop: 85 * scale, paddingRight: 10 * scale }]}>
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
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]}>
                      {countryCode} {formattedNumber}
                    </Text>
                  </View>

                  {/* City/Town */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>City/Town</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]}>Chennai</Text>
                  </View>

                  {/* Address */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>Address</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]}>
                      No 45, abc nagar, 1st street
                    </Text>
                  </View>

                  {/* Pincode */}
                  <View style={[styles.infoGroup, { marginBottom: 6 * scale }]}>
                    <Text style={[styles.infoLabel, { fontSize: 13 * scale }]}>Pincode</Text>
                    <Text style={[styles.infoValue, { fontSize: 12 * scale }]}>600 026</Text>
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
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Calendar size={24 * scale} color="#FFCF0D" />
                  <TextInput
                    style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale }]}
                    value={editedProfile.dateOfBirth}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, dateOfBirth: text })}
                    placeholder="DD-MMM-YYYY"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
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
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Clock size={24 * scale} color="#FFCF0D" />
                  <TextInput
                    style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale }]}
                    value={editedProfile.timeOfBirth}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, timeOfBirth: text })}
                    placeholder="HH:MM AM/PM"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
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
                <View style={[styles.inputContainer, { height: 37 * scale, borderRadius: 12 * scale }]}>
                  <Users size={24 * scale} color="#FFCF0D" />
                  <TextInput
                    style={[styles.input, { fontSize: 14 * scale, marginLeft: 12 * scale }]}
                    value={editedProfile.gender || ''}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile, gender: text ? text as 'male' | 'female' | 'other' : null })
                    }
                    placeholder="Male/Female/Other"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
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
    flex: 1,
    backgroundColor: '#FFCF0D',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 0,
    justifyContent: 'flex-start',
  },
  rightContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingLeft: 10,
    paddingTop: 0,
    justifyContent: 'flex-start',
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
});

export default ProfileScreen;

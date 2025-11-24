import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
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
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import { Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import {
  Search,
  SlidersHorizontal,
  User,
  Bell,
  IndianRupee,
  Sun,
  Scroll,
  HeartHandshake,
  MessageCircle,
  Home,
  MessageSquare,
  Phone,
  UserCircle2,
  Mail,
  Star,
  Video,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useHomeData } from '../src/hooks/useHomeData';
import { useAuth } from '../src/contexts/AuthContext';
import { feedbackService } from '../src/services';
import NotificationService from '../src/utils/notificationService';
import { handleApiError } from '../src/utils/errorHandler';
import Sidebar from '../components/Sidebar';

const { width: screenWidth } = Dimensions.get('window');

// Mock data for top rated astrologers (fallback if API fails)
const topRatedAstrologers = [
  {
    id: 1,
    name: 'Chandradev',
    rating: 5.0,
    calls: '2K',
    price: 27,
    image: require('../assets/images/chandradev.png'),
  },
  {
    id: 2,
    name: 'Sanjeevi',
    rating: 4.8,
    calls: '1K',
    price: 27,
    image: require('../assets/images/sanjeevi.png'),
  },
  {
    id: 3,
    name: 'Adhitiya',
    rating: 4.6,
    calls: '2K',
    price: 27,
    image: require('../assets/images/astrologer1.png'),
  },
];

const HomeScreen = ({ navigation }: any) => {
  // API Data Hook
  const {
    userProfile,
    liveSessions: apiLiveSessions,
    topRatedAstrologers: apiTopRatedAstrologers,
    categories,
    banners,
    loading: dataLoading,
    error: dataError,
    refetch,
  } = useHomeData();

  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', comments: '' });
  const [focusedField, setFocusedField] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  // Use API data or fallback to mock data for top rated only (live sessions from API only)
  const displayLiveSessions = apiLiveSessions || [];
  const displayTopRatedAstrologers = apiTopRatedAstrologers.length > 0 ? apiTopRatedAstrologers : topRatedAstrologers;

  // Stagger animation values for cards - recreate when data changes
  const liveCardsAnim = useMemo(
    () => displayLiveSessions.map(() => new Animated.Value(0)),
    [displayLiveSessions.length]
  );
  const topRatedCardsAnim = useMemo(
    () => displayTopRatedAstrologers.map(() => new Animated.Value(0)),
    [displayTopRatedAstrologers.length]
  );

  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    OpenSans_400Regular,
    Poppins_500Medium,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  const { cardWidth, scale } = useResponsiveLayout();

  // Trigger animations on mount
  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger animations for live session cards
      if (displayLiveSessions.length > 0) {
        setTimeout(() => {
          Animated.stagger(
            100,
            liveCardsAnim.map((anim) =>
              Animated.spring(anim, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
              })
            )
          ).start();
        }, 300);
      }

      // Stagger animations for top rated cards
      setTimeout(() => {
        Animated.stagger(
          150,
          topRatedCardsAnim.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            })
          )
        ).start();
      }, 500);
    }
  }, [fontsLoaded]);

  // Search focus animation
  const handleSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };


  // 3D Sidebar animation effect with content fade
  useEffect(() => {
    const SIDEBAR_WIDTH = screenWidth * 0.75;
    if (sidebarVisible) {
      Animated.parallel([
        Animated.timing(screenScale, {
          toValue: 0.85,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: SIDEBAR_WIDTH * 0.8,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacityAnim, {
          toValue: 0.3,
          duration: 350,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(screenScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sidebarVisible]);

  // Form validation
  const validateForm = () => {
    const newErrors = { name: '', email: '', comments: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!comments.trim()) {
      newErrors.comments = 'Comments are required';
      isValid = false;
    } else if (comments.trim().length < 10) {
      newErrors.comments = 'Please provide at least 10 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle pull-to-refresh
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit feedback to API
      await feedbackService.submitFeedback({
        name,
        email: email || undefined,
        comments,
      });

      setIsSubmitting(false);

      // Show success notification
      NotificationService.success('Feedback submitted successfully!');

      // Clear form
      setName('');
      setEmail('');
      setComments('');
      setErrors({ name: '', email: '', comments: '' });
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      setIsSubmitting(false);
      handleApiError(error);
    }
  };


  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Animated.View style={[
        styles.mainContainer,
        {
          transform: [
            { scale: screenScale },
            { translateX: screenTranslateX },
          ],
          opacity: contentOpacityAnim,
          borderRadius: sidebarVisible ? 30 : 0,
          overflow: 'hidden',
        }
      ]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={sidebarVisible ? "light" : "dark"} />

        <Animated.ScrollView
        style={[styles.container, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2930a6"
            colors={['#2930a6']}
          />
        }
      >
        {/* Header Section */}
        <Animated.View style={[styles.header, {
          paddingHorizontal: 20 * scale,
          transform: [{ scale: scaleAnim }],
        }]}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => setSidebarVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.profileCircle, { width: 56 * scale, height: 56 * scale }]}>
              {userProfile?.profileImage ? (
                <Image
                  source={{ uri: userProfile.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <User size={28 * scale} color="#2930A6" />
              )}
            </View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.heyText, { fontSize: 16 * scale }]}>Hey</Text>
              <Text style={[styles.nameText, { fontSize: 16 * scale }]}>
                {userProfile?.name || user?.name || 'Guest'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <AnimatedButton
              style={[styles.walletButton, {
                height: 32 * scale,
                borderRadius: 20 * scale,
                paddingHorizontal: 14 * scale
              }]}
            >
              <IndianRupee size={18 * scale} color="#FFFFFF" />
              <Text style={[styles.walletText, { fontSize: 16 * scale }]}>
                {userProfile?.walletBalance?.toFixed(2) || '0.00'}
              </Text>
            </AnimatedButton>

            <AnimatedButton style={[styles.bellButton, { width: 28 * scale, height: 28 * scale }]}>
              <Bell size={24 * scale} color="#595959" />
            </AnimatedButton>
          </View>
        </Animated.View>

        {/* Logo */}
        <View style={[styles.logoContainer, { marginTop: 20 * scale, marginBottom: 20 * scale }]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={[styles.logo, { width: 283 * scale, height: 68 * scale }]}
            resizeMode="contain"
          />
        </View>

        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              marginHorizontal: 20 * scale,
              marginBottom: 20 * scale,
              height: 48 * scale,
              borderRadius: 100 * scale,
              paddingHorizontal: 16 * scale,
              borderWidth: searchBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
              borderColor: searchBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#2930A6', '#FFCF0D'],
              }),
              shadowOpacity: searchBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
            },
          ]}
        >
          <View style={styles.searchLeft}>
            <Search size={20 * scale} color={searchFocused ? '#FFCF0D' : '#2930A6'} />
            <TextInput
              style={[styles.searchInput, { fontSize: 12 * scale }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search astrologers..."
              placeholderTextColor="#2930A6"
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <SlidersHorizontal size={18 * scale} color="#2930A6" />
          </TouchableOpacity>
        </Animated.View>

        {/* Category Icons */}
        <View style={[styles.categoriesRow, {
          marginHorizontal: 20 * scale,
          marginBottom: 30 * scale
        }]}>
          <CategoryIcon
            iconImage={require('../assets/images/icon-horoscope.png')}
            label="Daily Horoscope"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-kundli.png')}
            label="Kundli"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-kundli-matching.png')}
            label="Kundli Matching"
            scale={scale}
          />
          <CategoryIcon
            iconImage={require('../assets/images/icon-chat-category.png')}
            label="Chat"
            scale={scale}
          />
        </View>

        {/* CTA Banner - Dynamic from API */}
        {(banners && banners.length > 0 ? banners : [{
          id: 'default',
          title: 'Talk to astrologer and\nclear your doubts',
          subtitle: 'Open up to the thing that matters among the people',
          buttonText: 'Chat Now',
          buttonAction: '/chat',
          backgroundColor: null,
          image: null,
          order: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]).slice(0, 1).map((banner) => (
          <View
            key={banner.id}
            style={[styles.ctaBanner, {
              marginHorizontal: 20 * scale,
              marginBottom: 30 * scale,
              height: 115 * scale,
              borderRadius: 16 * scale,
              padding: 16 * scale,
              backgroundColor: banner.backgroundColor || 'rgba(255, 255, 255, 0.5)',
            }]}
          >
            <View style={styles.ctaContent}>
              <Text style={[styles.ctaTitle, { fontSize: 17 * scale, lineHeight: 20 * scale }]}>
                {banner.title}
              </Text>
              {banner.subtitle && (
                <Text style={[styles.ctaSubtitle, { fontSize: 10 * scale, marginTop: 6 * scale }]}>
                  {banner.subtitle}
                </Text>
              )}
              {banner.buttonText && (
                <AnimatedButton
                  style={[styles.chatNowButton, {
                    marginTop: 8 * scale,
                    height: 28 * scale,
                    paddingHorizontal: 16 * scale,
                    borderRadius: 10 * scale
                  }]}
                  onPress={() => console.log('Banner action:', banner.buttonAction)}
                >
                  <Text style={[styles.chatNowText, { fontSize: 14 * scale }]}>
                    {banner.buttonText}
                  </Text>
                </AnimatedButton>
              )}
            </View>
            {banner.image ? (
              <View style={[styles.bannerImage, { width: 193 * scale, height: 115 * scale }]}>
                <Image
                  source={{ uri: banner.image }}
                  style={[{ width: 193 * scale, height: 115 * scale }]}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.bannerImage, { width: 193 * scale, height: 115 * scale }]}>
                <Image
                  source={require('../assets/images/banner-decoration.png')}
                  style={[{ width: 193 * scale, height: 115 * scale }]}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        ))}

        {/* Live Sessions Section - Shows astrologers currently streaming live */}
        {displayLiveSessions.length > 0 && (
          <View style={[styles.section, { marginBottom: 30 * scale }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 * scale, marginBottom: 16 * scale }]}>
              <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Live Astrologers</Text>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => navigation.navigate('LiveSession')}
              >
                <Text style={[styles.viewAll, { fontSize: 10 * scale }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 * scale }}
              snapToInterval={122 * scale}
              decelerationRate="fast"
            >
              {displayLiveSessions.map((session, index) => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  scale={scale}
                  animValue={liveCardsAnim[index]}
                  isLast={index === displayLiveSessions.length - 1}
                  navigation={navigation}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top Rated Astrologers Section */}
        <View style={[styles.section, { marginBottom: 30 * scale, paddingHorizontal: 20 * scale }]}>
          <View style={[styles.sectionHeader, { marginBottom: 16 * scale }]}>
            <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Top Rated Astrologers</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={[styles.viewAll, { fontSize: 10 * scale }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {displayTopRatedAstrologers.map((astrologer, index) => (
            <TopRatedCard
              key={astrologer.id}
              astrologer={astrologer}
              index={index}
              scale={scale}
              animValue={topRatedCardsAnim[index]}
              isLast={index === topRatedAstrologers.length - 1}
            />
          ))}
        </View>

        {/* Feedback Form Section */}
        <View style={[styles.feedbackSection, {
          marginHorizontal: 20 * scale,
          marginBottom: 100 * scale,
          borderRadius: 16 * scale,
          padding: 20 * scale
        }]}>
          <Text style={[styles.feedbackTitle, { fontSize: 16 * scale, marginBottom: 20 * scale }]}>
            Feedback Form
          </Text>

          <View style={[styles.feedbackForm, {
            borderRadius: 12 * scale,
            padding: 25 * scale
          }]}>
            {/* Name Input */}
            <View style={[styles.inputGroup, { marginBottom: 16 * scale }]}>
              <Text style={[styles.inputLabel, { fontSize: 12 * scale, marginBottom: 6 * scale }]}>Name</Text>
              <View style={[
                styles.inputContainer,
                {
                  height: 45 * scale,
                  borderRadius: 10 * scale,
                  paddingHorizontal: 12 * scale,
                  borderColor: errors.name ? '#EF4444' : focusedField === 'name' ? '#2930A6' : '#DDDDDD',
                  borderWidth: focusedField === 'name' ? 2 : 1.5,
                }
              ]}>
                <User size={20 * scale} color={focusedField === 'name' ? '#2930A6' : '#666666'} />
                <TextInput
                  style={[styles.input, { fontSize: 12 * scale, marginLeft: 10 * scale }]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor="#AAAAAA"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
              {errors.name ? (
                <View style={[styles.errorContainer, { marginTop: 4 * scale }]}>
                  <AlertCircle size={12 * scale} color="#EF4444" />
                  <Text style={[styles.errorText, { fontSize: 11 * scale }]}>{errors.name}</Text>
                </View>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={[styles.inputGroup, { marginBottom: 16 * scale }]}>
              <Text style={[styles.inputLabel, { fontSize: 12 * scale, marginBottom: 6 * scale }]}>Email Address</Text>
              <View style={[
                styles.inputContainer,
                {
                  height: 45 * scale,
                  borderRadius: 10 * scale,
                  paddingHorizontal: 12 * scale,
                  borderColor: errors.email ? '#EF4444' : focusedField === 'email' ? '#2930A6' : '#DDDDDD',
                  borderWidth: focusedField === 'email' ? 2 : 1.5,
                }
              ]}>
                <Mail size={20 * scale} color={focusedField === 'email' ? '#2930A6' : '#666666'} />
                <TextInput
                  style={[styles.input, { fontSize: 12 * scale, marginLeft: 10 * scale }]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
              {errors.email ? (
                <View style={[styles.errorContainer, { marginTop: 4 * scale }]}>
                  <AlertCircle size={12 * scale} color="#EF4444" />
                  <Text style={[styles.errorText, { fontSize: 11 * scale }]}>{errors.email}</Text>
                </View>
              ) : null}
            </View>

            {/* Comments Input */}
            <View style={[styles.inputGroup, { marginBottom: 20 * scale }]}>
              <Text style={[styles.inputLabel, { fontSize: 12 * scale, marginBottom: 6 * scale }]}>Comments</Text>
              <View style={[
                styles.textAreaContainer,
                {
                  height: 120 * scale,
                  borderRadius: 10 * scale,
                  padding: 12 * scale,
                  borderColor: errors.comments ? '#EF4444' : focusedField === 'comments' ? '#2930A6' : '#DDDDDD',
                  borderWidth: focusedField === 'comments' ? 2 : 1.5,
                }
              ]}>
                <TextInput
                  style={[styles.textArea, { fontSize: 12 * scale }]}
                  value={comments}
                  onChangeText={(text) => {
                    setComments(text);
                    if (errors.comments) setErrors({ ...errors, comments: '' });
                  }}
                  placeholder="Share your feedback..."
                  placeholderTextColor="#AAAAAA"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('comments')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
              {errors.comments ? (
                <View style={[styles.errorContainer, { marginTop: 4 * scale }]}>
                  <AlertCircle size={12 * scale} color="#EF4444" />
                  <Text style={[styles.errorText, { fontSize: 11 * scale }]}>{errors.comments}</Text>
                </View>
              ) : null}
            </View>

            {/* Submit Button */}
            <AnimatedButton
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                {
                  height: 48 * scale,
                  borderRadius: 10 * scale,
                  paddingHorizontal: 11 * scale,
                  opacity: isSubmitting ? 0.7 : 1,
                }
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitButtonText, { fontSize: 14 * scale }]}>SUBMIT</Text>
              )}
            </AnimatedButton>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, {
        opacity: fadeAnim,
        height: 61 * scale,
        borderRadius: 50 * scale,
        paddingHorizontal: 48 * scale
      }]}>
        <NavItem
          icon={Home}
          isActive={activeTab === 0}
          onPress={() => setActiveTab(0)}
          scale={scale}
        />
        <NavItem
          icon={MessageSquare}
          isActive={activeTab === 1}
          onPress={() => {
            setActiveTab(1);
            navigation.navigate('BrowseChat');
          }}
          scale={scale}
        />
        <NavItem
          icon={Video}
          isActive={activeTab === 2}
          onPress={() => {
            setActiveTab(2);
            navigation.navigate('LiveSession');
          }}
          scale={scale}
        />
        <NavItem
          icon={Phone}
          isActive={activeTab === 3}
          onPress={() => {
            setActiveTab(3);
            navigation.navigate('BrowseCall');
          }}
          scale={scale}
        />
        <NavItem
          icon={UserCircle2}
          isActive={activeTab === 4}
          onPress={() => setActiveTab(4)}
          scale={scale}
        />
      </Animated.View>
      </SafeAreaView>
      </Animated.View>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </>
  );
};

// Live Session Card Component with gradient overlay
const LiveSessionCard = ({ session, index, scale, animValue, isLast, navigation }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const defaultAnimValue = useRef(new Animated.Value(1)).current;
  const safeAnimValue = animValue || defaultAnimValue;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate('LiveSession', { sessionId: session.id });
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.liveAstrologerCard,
          {
            width: 114 * scale,
            height: 164 * scale,
            borderRadius: 20 * scale,
            marginRight: isLast ? 0 : 8 * scale,
            opacity: safeAnimValue,
            transform: [
              { scale: scaleValue },
              {
                translateY: safeAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={
            session.thumbnailUrl
              ? { uri: session.thumbnailUrl }
              : session.astrologerImage
              ? { uri: session.astrologerImage }
              : require('../assets/images/astrologer3.jpg')
          }
          style={styles.liveAstrologerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.liveAstrologerGradient}
        />
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { fontSize: 8 * scale }]}>LIVE</Text>
        </View>
        <Text style={[styles.liveAstrologerName, { fontSize: 16 * scale, paddingHorizontal: 6 * scale }]} numberOfLines={1}>
          {session.astrologerName}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Top Rated Card Component with enhanced design
const TopRatedCard = ({ astrologer, index, scale, animValue, isLast }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const defaultAnimValue = useRef(new Animated.Value(1)).current;
  const safeAnimValue = animValue || defaultAnimValue;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.topRatedCard,
        {
          height: 140 * scale,
          borderRadius: 20 * scale,
          padding: 12 * scale,
          marginBottom: isLast ? 0 : 16 * scale,
          opacity: safeAnimValue,
          transform: [
            { scale: scaleValue },
            {
              translateX: safeAnimValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.topRatedCardInner}
      >
        <View style={[styles.astrologerImageContainer, {
          width: 115 * scale,
          height: 115 * scale,
          borderRadius: 16 * scale
        }]}>
          <Image
            source={typeof astrologer.image === 'string' ? { uri: astrologer.image } : astrologer.image}
            style={styles.topRatedImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.astrologerInfo}>
          <Text
            style={[styles.astrologerName, { fontSize: 17 * scale }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {astrologer.name}
          </Text>
          <View style={[styles.ratingRow, { marginTop: 6 * scale }]}>
            <Star size={16 * scale} fill="#FFCF0D" color="#FFCF0D" />
            <Text style={[styles.ratingText, { fontSize: 13 * scale }]}>{astrologer.rating}</Text>
            <Text style={[styles.callsText, { fontSize: 13 * scale }]}>{astrologer.totalCalls || astrologer.calls} calls</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 4 * scale }]}>
            <IndianRupee size={12 * scale} color="#000000" />
            <Text style={[styles.priceText, { fontSize: 13 * scale }]}>{astrologer.pricePerMinute || astrologer.price}/minute</Text>
          </View>
        </View>

        <AnimatedButton
          style={[styles.chatButton, {
            paddingHorizontal: 16 * scale,
            paddingVertical: 10 * scale,
            borderRadius: 12 * scale
          }]}
        >
          <Text style={[styles.chatButtonText, { fontSize: 13 * scale }]}>Chat</Text>
        </AnimatedButton>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Nav Item Component with active indicator
const NavItem = ({ icon: Icon, isActive, onPress, scale }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const indicatorScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(indicatorScale, {
      toValue: isActive ? 1 : 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Icon
          size={24 * scale}
          color={isActive ? '#2930A6' : '#666666'}
          fill={isActive ? '#2930A6' : 'transparent'}
        />
        <Animated.View
          style={[
            styles.navIndicator,
            {
              transform: [{ scale: indicatorScale }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Button Component with scale effect
const AnimatedButton = ({ children, onPress, style }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Category Icon Component
const CategoryIcon = ({ iconImage, label, scale }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <TouchableOpacity
      style={[styles.categoryButton, { width: 74 * scale }]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.categoryIconCircle,
        {
          width: 74 * scale,
          height: 74 * scale,
          borderRadius: 16 * scale,
          transform: [{ scale: scaleValue }, { rotate: rotation }],
        }
      ]}>
        <Image
          source={iconImage}
          style={{ width: 42 * scale, height: 42 * scale }}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={[styles.categoryLabel, { fontSize: 10 * scale, marginTop: 8 * scale }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(41, 48, 166, 0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  heyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#595959',
  },
  nameText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: '#595959',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletButton: {
    backgroundColor: '#2930A6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  walletText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bellButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 283,
    height: 68,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#2930A6',
    flex: 1,
    paddingVertical: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryButton: {
    alignItems: 'center',
  },
  categoryIconCircle: {
    backgroundColor: '#FFCF0D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 3,
    borderColor: '#FFCF0D',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#FFCF0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 17,
    color: '#371B34',
  },
  ctaSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#371B34',
  },
  chatNowButton: {
    backgroundColor: '#2930A6',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatNowText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bannerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  section: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#000000',
  },
  viewAll: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#666666',
  },
  liveAstrologerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 207, 13, 0.3)',
  },
  liveAstrologerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  liveAstrologerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveAstrologerName: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  topRatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(41, 48, 166, 0.08)',
  },
  topRatedCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  astrologerImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topRatedImage: {
    width: '100%',
    height: '100%',
  },
  astrologerInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  astrologerName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 17,
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#333333',
    marginLeft: 2,
  },
  callsText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#333333',
  },
  chatButton: {
    backgroundColor: '#2930A6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  chatButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  feedbackSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.1)',
  },
  feedbackTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  feedbackForm: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#333333',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#1a1a1a',
  },
  textAreaContainer: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#2930A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 12,
    left: 15,
    right: 15,
    backgroundColor: '#FFCF0D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navItem: {
    padding: 8,
    position: 'relative',
  },
  navIndicator: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2930A6',
  },
});

export default HomeScreen;

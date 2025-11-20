import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Lexend_400Regular, Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { useResponsiveLayout } from '../src/utils/responsive';

type WelcomeScreenProps = {
  onGetStarted?: () => void;
};

const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
    OpenSans_700Bold,
  });

  const { cardWidth, scale } = useResponsiveLayout();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.outer}>
        <View
          style={[
            styles.card,
            {
              width: cardWidth,
              borderRadius: 50 * scale,
              paddingHorizontal: 30 * scale,
              paddingTop: 46 * scale,
              paddingBottom: 40 * scale,
              gap: 30 * scale,
            },
          ]}
        >
          <View style={[styles.logoWrapper, { alignItems: 'center' }]}>
            <Image
              source={require('../assets/images/logo.png')}
              style={[
                styles.logo,
                {
                  width: 322 * scale,
                  height: 77 * scale,
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <Image
            source={require('../assets/images/ganesha.png')}
            style={[
              styles.ganeshaImage,
              {
                width: 316 * scale,
                height: 402 * scale,
                borderBottomLeftRadius: 50 * scale,
                borderBottomRightRadius: 50 * scale,
              },
            ]}
            resizeMode="cover"
          />

          <View
            style={[
              styles.textContainer,
              {
                gap: 18 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.heading,
                {
                  fontFamily: 'Lexend_600SemiBold',
                  fontSize: 48 * scale,
                  lineHeight: 40 * scale,
                },
              ]}
            >
              Connect with{'\n'}wisdom
            </Text>
            <Text
              style={[
                styles.subheading,
                {
                  fontFamily: 'Lexend_400Regular',
                  fontSize: 20 * scale,
                  lineHeight: 25 * scale,
                },
              ]}
            >
              Trusted Astrologers & Instant Solutions
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                height: 56 * scale,
                borderRadius: 50 * scale,
                paddingHorizontal: 32 * scale,
                paddingVertical: 16 * scale,
                marginTop: 20 * scale,
              },
            ]}
            activeOpacity={0.8}
            onPress={onGetStarted}
          >
            <Text
              style={[
                styles.buttonText,
                { fontFamily: 'OpenSans_700Bold', fontSize: 20 * scale },
              ]}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 322,
    height: 77,
  },
  ganeshaImage: {
    width: 316,
    height: 402,
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
    color: '#171717',
  },
  subheading: {
    textAlign: 'center',
    color: '#525252',
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: '#2930A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    width: '100%',
  },
});

export default WelcomeScreen;

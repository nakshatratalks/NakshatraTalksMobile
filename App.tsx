import React, { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'welcome', 'signIn', 'home'

  if (currentScreen === 'home') {
    return <HomeScreen />;
  }

  if (currentScreen === 'signIn') {
    return <SignInScreen onGetOtp={() => setCurrentScreen('home')} />;
  }

  return <WelcomeScreen onGetStarted={() => setCurrentScreen('signIn')} />;
}

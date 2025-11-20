import React, { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';

export default function App() {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return <SignInScreen />;
  }

  return <WelcomeScreen onGetStarted={() => setShowSignIn(true)} />;
}

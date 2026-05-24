import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { SERVER_URL } from '../services/socket';
import { finalizeProfile } from '../services/authApi';
import LandingScreen         from './Auth/LandingScreen';
import LoginScreen           from './Auth/LoginScreen';
import RegisterScreen        from './Auth/RegisterScreen';
import OnboardingScreen      from './Auth/OnboardingScreen';
import ForgotPasswordScreen  from './Auth/ForgotPasswordScreen';
import ResetPasswordScreen   from './Auth/ResetPasswordScreen';

const SCREENS = {
  LANDING:        'landing',
  LOGIN:          'login',
  REGISTER:       'register',
  ONBOARDING:     'onboarding',
  LOADING:        'loading',
  FORGOT_PASSWORD:'forgot_password',
  RESET_PASSWORD: 'reset_password',
};

export default function AuthScreen({ onLogin }) {
  const [screen,       setScreen]       = useState(SCREENS.LANDING);
  const [userId,       setUserId]       = useState(null);
  const [resetEmail,   setResetEmail]   = useState('');

  async function handleLoginSuccess({ userId: id, access }) {
    setUserId(id);
    setScreen(SCREENS.LOADING);
    try {
      const { data: profile } = await axios.get(`${SERVER_URL}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${access}` },
        timeout: 8000,
      });
      // Profile exists — finalize and enter app
      const socketProfile = await finalizeProfile({
        userId:           id,
        display_name:     profile.display_name,
        language:         profile.language        || 'en',
        country:          profile.country         || '',
        connection_types: profile.connection_types || [],
      });
      onLogin(socketProfile);
    } catch (err) {
      // 404 = new user, no profile yet → onboarding
      // network error or anything else → also onboarding (safest fallback)
      if (err.response?.status === 401) {
        // Expired token right after login is unexpected — back to login
        setScreen(SCREENS.LOGIN);
      } else {
        setScreen(SCREENS.ONBOARDING);
      }
    }
  }

  function handleRegisterSuccess({ userId: id }) {
    setUserId(id);
    setScreen(SCREENS.ONBOARDING);
  }

  function handleOnboardingComplete(socketProfile) {
    onLogin(socketProfile);
  }

  switch (screen) {
    case SCREENS.LOADING:
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#5865f2" />
        </View>
      );

    case SCREENS.LANDING:
      return (
        <LandingScreen
          onGetStarted={() => setScreen(SCREENS.REGISTER)}
          onSignIn={()      => setScreen(SCREENS.LOGIN)}
        />
      );

    case SCREENS.LOGIN:
      return (
        <LoginScreen
          onSuccess={handleLoginSuccess}
          onBack={()            => setScreen(SCREENS.LANDING)}
          onGoRegister={() => setScreen(SCREENS.REGISTER)}
          onForgotPassword={() => setScreen(SCREENS.FORGOT_PASSWORD)}
        />
      );

    case SCREENS.FORGOT_PASSWORD:
      return (
        <ForgotPasswordScreen
          onBack={() => setScreen(SCREENS.LOGIN)}
          onCodeSent={email => { setResetEmail(email); setScreen(SCREENS.RESET_PASSWORD); }}
        />
      );

    case SCREENS.RESET_PASSWORD:
      return (
        <ResetPasswordScreen
          email={resetEmail}
          onBack={() => setScreen(SCREENS.FORGOT_PASSWORD)}
          onSuccess={() => setScreen(SCREENS.LOGIN)}
        />
      );

    case SCREENS.REGISTER:
      return (
        <RegisterScreen
          onSuccess={handleRegisterSuccess}
          onBack={()       => setScreen(SCREENS.LANDING)}
          onGoLogin={() => setScreen(SCREENS.LOGIN)}
        />
      );

    case SCREENS.ONBOARDING:
      return (
        <OnboardingScreen
          userId={userId}
          onComplete={handleOnboardingComplete}
        />
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a18', alignItems: 'center', justifyContent: 'center' },
});

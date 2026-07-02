import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { SERVER_URL } from '../services/socket';
import { finalizeProfile, saveWalletState } from '../services/authApi';
import LandingScreen         from './Auth/LandingScreen';
import LoginScreen           from './Auth/LoginScreen';
import RegisterScreen        from './Auth/RegisterScreen';
import OnboardingScreen      from './Auth/OnboardingScreen';
import ForgotPasswordScreen  from './Auth/ForgotPasswordScreen';
import ForgotEmailScreen     from './Auth/ForgotEmailScreen';
import ResetPasswordScreen   from './Auth/ResetPasswordScreen';
import LegalScreen           from './LegalScreen';

const SCREENS = {
  LANDING:        'landing',
  LOGIN:          'login',
  REGISTER:       'register',
  ONBOARDING:     'onboarding',
  LOADING:        'loading',
  FORGOT_PASSWORD:'forgot_password',
  FORGOT_EMAIL:   'forgot_email',
  RESET_PASSWORD: 'reset_password',
};

export default function AuthScreen({ onLogin }) {
  const [screen,       setScreen]       = useState(SCREENS.LANDING);
  const [userId,       setUserId]       = useState(null);
  const [resetEmail,   setResetEmail]   = useState('');
  const [dob,          setDob]          = useState(null);
  const [legalType,    setLegalType]    = useState(null);

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

      // FIX BUG #1: Save wallet state (coin_balance, stripe_account_id, has_bond_pass)
      // so WalletContext can sync server truth on mount
      await saveWalletState({
        coin_balance:      profile.coin_balance || 0,
        stripe_account_id: profile.stripe_account_id || null,
        has_bond_pass:     profile.has_bond_pass || false,
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

  function handleRegisterSuccess({ userId: id, dob: d }) {
    setUserId(id);
    setDob(d);
    setScreen(SCREENS.ONBOARDING);
  }

  function handleOnboardingComplete(socketProfile) {
    onLogin(socketProfile);
  }

  if (legalType) {
    return <LegalScreen type={legalType} onBack={() => setLegalType(null)} />;
  }

  switch (screen) {
    case SCREENS.LOADING:
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF0080" />
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
          onForgotEmail={() => setScreen(SCREENS.FORGOT_EMAIL)}
        />
      );

    case SCREENS.FORGOT_EMAIL:
      return (
        <ForgotEmailScreen
          onBack={() => setScreen(SCREENS.LOGIN)}
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
          onBack={() => setScreen(SCREENS.LANDING)}
          onGoLogin={() => setScreen(SCREENS.LOGIN)}
          onOpenTerms={() => setLegalType('terms')}
          onOpenPrivacy={() => setLegalType('privacy')}
        />
      );

    case SCREENS.ONBOARDING:
      return (
        <OnboardingScreen
          userId={userId}
          dob={dob}
          onComplete={handleOnboardingComplete}
        />
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
});

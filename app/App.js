import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getSocket, disconnectSocket } from './src/services/socket';
import { isAuthenticated, getSavedProfile, logout } from './src/services/authApi';
import { PremiumProvider } from './src/context/PremiumContext';
import { WalletProvider } from './src/context/WalletContext';
import { StreakProvider } from './src/context/StreakContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// ── DEMO MODE — set false before shipping ─────────────────────────────────────
const DEMO_MODE = false;
const DEMO_PROFILE = {
  username:         'BondUser_Demo',
  display_name:     'Bond Demo',
  userId:           'demo_001',
  user_id:          'demo_001',
  country:          '🇺🇸',
  language:         'en',
  connection_types: ['friendship', 'travel'],
  bio:              'Testing out WorldBond — everything from stamps to chats.',
  age:              24,
  ghost_score:      4.2,
  bond_pass:        false,
  photo_url:        null,
  socials:          {},
};
// ─────────────────────────────────────────────────────────────────────────────

function Inner() {
  const { colors, isDark } = useTheme();
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (DEMO_MODE) {
        setUser(DEMO_PROFILE);
        setLoading(false);
        return;
      }
      try {
        const authed  = await isAuthenticated();
        const profile = await getSavedProfile();
        if (authed && profile) {
          setUser(profile);
          const socket = getSocket();
          socket.emit('register', profile);
        }
      } catch {
        // Storage read error — show auth screens
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  function handleLogin(socketProfile) {
    setUser(socketProfile);
    const socket = getSocket();
    socket.emit('register', socketProfile);
  }

  async function handleLogout() {
    await logout();
    disconnectSocket();
    setUser(null);
  }

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <ActivityIndicator size="large" color="#FF0080" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <AppNavigator user={user} onLogout={handleLogout} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PremiumProvider>
          <WalletProvider>
            <StreakProvider>
              <Inner />
            </StreakProvider>
          </WalletProvider>
        </PremiumProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

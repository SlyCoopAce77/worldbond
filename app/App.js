import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getSocket, disconnectSocket } from './src/services/socket';
import { isAuthenticated, getSavedProfile, logout } from './src/services/authApi';
import { PremiumProvider } from './src/context/PremiumContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function Inner() {
  const { colors, isDark } = useTheme();
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const authed  = await isAuthenticated();
        const profile = await getSavedProfile();

        if (authed && profile) {
          // Fully authenticated with a completed profile — auto-login
          setUser(profile);
          const socket = getSocket();
          socket.emit('register', profile);
        }
        // If only one is present (partial state), show auth screens
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
        <ActivityIndicator size="large" color="#1D9BF0" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      {user ? (
        <AppNavigator user={user} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PremiumProvider>
        <Inner />
      </PremiumProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

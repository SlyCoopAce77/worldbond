import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getSocket, disconnectSocket } from './src/services/socket';
import { isAuthenticated, getSavedProfile, logout } from './src/services/authApi';
import { PremiumProvider } from './src/context/PremiumContext';

export default function App() {
  const [user, setUser]       = useState(null);
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
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
        <ActivityIndicator size="large" color="#5865f2" />
      </View>
    );
  }

  return (
    <PremiumProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      {user ? (
        <AppNavigator user={user} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
});

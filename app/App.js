import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getSocket, disconnectSocket } from './src/services/socket';
import { PremiumProvider } from './src/context/PremiumContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('worldbond_user').then(stored => {
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    const socket = getSocket();
    socket.emit('register', userData);
  }

  function handleLogout() {
    disconnectSocket();
    setUser(null);
  }

  if (loading) return null;

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

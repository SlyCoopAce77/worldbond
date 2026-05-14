import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'ko', label: '🇰🇷 Korean' },
  { code: 'zh', label: '🇨🇳 Chinese' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'hi', label: '🇮🇳 Hindi' },
];

const COUNTRIES = [
  '🇺🇸 United States', '🇯🇵 Japan', '🇰🇷 South Korea', '🇨🇳 China',
  '🇬🇧 United Kingdom', '🇫🇷 France', '🇩🇪 Germany', '🇧🇷 Brazil',
  '🇲🇽 Mexico', '🇮🇳 India', '🇦🇺 Australia', '🇨🇦 Canada',
  '🇸🇦 Saudi Arabia', '🇿🇦 South Africa', '🇳🇬 Nigeria',
];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@yourhandle' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@yourhandle' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', placeholder: '@yourhandle' },
  { key: 'snapchat', label: 'Snapchat', icon: '👻', placeholder: 'yourusername' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: '@yourchannel' },
];

export default function AuthScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [socials, setSocials] = useState({});

  const selectedLangLabel = LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'Select Language';
  const filledSocials = Object.values(socials).filter(v => v?.trim()).length;

  async function handleJoin() {
    if (!username.trim()) return Alert.alert('Enter a username');
    if (!selectedCountry) return Alert.alert('Select your country');

    const user = { username: username.trim(), language: selectedLanguage, country: selectedCountry, socials };
    await AsyncStorage.setItem('worldbond_user', JSON.stringify(user));
    onLogin(user);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌍</Text>
          <Text style={styles.title}>WorldBond</Text>
          <Text style={styles.subtitle}>Connect with people around the world</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            maxLength={20}
          />

          <Text style={styles.label}>Your Language</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowLanguages(!showLanguages)}>
            <Text style={styles.pickerText}>{selectedLangLabel}</Text>
            <Text style={styles.arrow}>{showLanguages ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showLanguages && (
            <View style={styles.dropdown}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.dropdownItem, selectedLanguage === lang.code && styles.dropdownItemActive]}
                  onPress={() => { setSelectedLanguage(lang.code); setShowLanguages(false); }}
                >
                  <Text style={styles.dropdownText}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Your Country</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowCountries(!showCountries)}>
            <Text style={styles.pickerText}>{selectedCountry || 'Select Country'}</Text>
            <Text style={styles.arrow}>{showCountries ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCountries && (
            <View style={styles.dropdown}>
              {COUNTRIES.map(country => (
                <TouchableOpacity
                  key={country}
                  style={[styles.dropdownItem, selectedCountry === country && styles.dropdownItemActive]}
                  onPress={() => { setSelectedCountry(country); setShowCountries(false); }}
                >
                  <Text style={styles.dropdownText}>{country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.picker} onPress={() => setShowSocials(!showSocials)}>
            <Text style={styles.pickerText}>
              🔗 Social Media Links {filledSocials > 0 ? `(${filledSocials} added)` : '(optional)'}
            </Text>
            <Text style={styles.arrow}>{showSocials ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showSocials && (
            <View style={styles.socialsBox}>
              {SOCIAL_PLATFORMS.map(p => (
                <View key={p.key} style={styles.socialRow}>
                  <Text style={styles.socialIcon}>{p.icon}</Text>
                  <TextInput
                    style={styles.socialInput}
                    placeholder={p.placeholder}
                    placeholderTextColor="#555"
                    value={socials[p.key] || ''}
                    onChangeText={val => setSocials(s => ({ ...s, [p.key]: val }))}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>Join WorldBond 🌐</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logo: { fontSize: 72 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
  form: { gap: 12 },
  label: { fontSize: 13, color: '#aaa', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a',
  },
  picker: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2a2a4a', flexDirection: 'row', justifyContent: 'space-between',
  },
  pickerText: { color: '#fff', fontSize: 15 },
  arrow: { color: '#888' },
  dropdown: {
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a4a', overflow: 'hidden',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a3a' },
  dropdownItemActive: { backgroundColor: '#6c63ff33' },
  dropdownText: { color: '#fff', fontSize: 15 },
  socialsBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a4a', padding: 12, gap: 10,
  },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  socialIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  socialInput: {
    flex: 1, backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  button: {
    backgroundColor: '#6c63ff', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

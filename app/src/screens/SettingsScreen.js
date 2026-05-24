import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
  Animated, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getAccessToken, logout } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { usePremium } from '../context/PremiumContext';

const SETTINGS_KEY = 'bond_settings';

const DEFAULTS = {
  // Privacy
  showInDiscovery:   true,
  showOnlineStatus:  true,
  readReceipts:      true,
  // Notifications
  notifMatches:      true,
  notifMessages:     true,
  notifBondRequests: true,
  notifEvents:       true,
  notifCalls:        true,
  emailDigest:       false,
  // Discovery
  autoTranslate:     true,
  safeSearch:        true,
  // Who can message
  whoCanMessage:     'everyone', // 'everyone' | 'bonds' | 'nobody'
};

// ─── Section header ───────────────────────────────────────────────────────────
function Section({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ icon, label, sublabel, value, onToggle, disabled }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#1e1e38', true: '#5865f255' }}
        thumbColor={value ? '#5865f2' : '#444'}
        ios_backgroundColor="#1e1e38"
      />
    </View>
  );
}

// ─── Navigation row ───────────────────────────────────────────────────────────
function NavRow({ icon, label, sublabel, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, danger && { backgroundColor: '#e5393518' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: '#e53935' }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Text style={[styles.chevron, danger && { color: '#e53935' }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Radio row ────────────────────────────────────────────────────────────────
function RadioGroup({ label, options, value, onChange }) {
  return (
    <View style={styles.radioGroup}>
      <Text style={styles.radioLabel}>{label}</Text>
      <View style={styles.radioOptions}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.radioBtn, value === opt.value && styles.radioBtnOn]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.radioBtnText, value === opt.value && styles.radioBtnTextOn]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation, onLogout }) {
  const { tier, tierInfo } = usePremium();
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving]     = useState(false);
  const [profile, setProfile]   = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function load() {
      try {
        const [raw, token] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          getAccessToken(),
        ]);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        if (token) {
          const { data } = await axios.get(`${SERVER_URL}/api/profiles/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          });
          setProfile(data);
        }
      } catch {}
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
    load();
  }, []);

  async function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  async function setRadio(key, val) {
    const next = { ...settings, [key]: val };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your profile, matches, messages, and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const token = await getAccessToken();
              await axios.delete(`${SERVER_URL}/api/profiles/me`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              });
              await logout();
              onLogout?.();
            } catch {
              setSaving(false);
              Alert.alert('Error', 'Could not delete account. Contact support@bond.app.');
            }
          },
        },
      ]
    );
  }

  function confirmClearHistory() {
    Alert.alert(
      'Clear Chat History',
      'This removes all your local message history. Messages on other devices are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('bond_chat_history');
            Alert.alert('Done', 'Chat history cleared.');
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await logout(); onLogout?.(); },
      },
    ]);
  }

  const tierColor = tierInfo?.color || '#5865f2';
  const email = profile?.email || '—';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {saving && (
        <View style={styles.savingBanner}>
          <ActivityIndicator size="small" color="#5865f2" />
          <Text style={styles.savingText}>Processing…</Text>
        </View>
      )}

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Account ──────────────────────────────────────────── */}
        <Section title="Account" />
        <Card>
          <NavRow
            icon="👤"
            label="Edit Profile"
            sublabel={profile?.display_name || 'Tap to edit your profile'}
            onPress={() => navigation.navigate('Me')}
          />
          <Divider />
          <NavRow
            icon="✉️"
            label="Email"
            sublabel={email}
            onPress={() => Alert.alert('Change Email', 'Email change is coming soon.')}
          />
          <Divider />
          <NavRow
            icon="🔑"
            label="Change Password"
            onPress={() => Alert.alert('Change Password', 'Password reset email will be sent to ' + email + '.')}
          />
          <Divider />
          <NavRow
            icon="⭐"
            label="Subscription"
            value={tier === 'free' ? 'Free' : tier === 'plus' ? 'Plus' : 'Pro'}
            onPress={() => navigation.navigate('Subscription')}
          />
        </Card>

        {/* ── Privacy ──────────────────────────────────────────── */}
        <Section title="Privacy" />
        <Card>
          <ToggleRow
            icon="🔍"
            label="Show Me in Discovery"
            sublabel="Others can find you on the Discover tab"
            value={settings.showInDiscovery}
            onToggle={() => toggle('showInDiscovery')}
          />
          <Divider />
          <ToggleRow
            icon="🟢"
            label="Show Online Status"
            sublabel="Let others see when you're active"
            value={settings.showOnlineStatus}
            onToggle={() => toggle('showOnlineStatus')}
          />
          <Divider />
          <ToggleRow
            icon="👁️"
            label="Read Receipts"
            sublabel="Show when you've read messages"
            value={settings.readReceipts}
            onToggle={() => toggle('readReceipts')}
          />
          <Divider />
          <RadioGroup
            label="Who can message me"
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'bonds',    label: 'Bonds only' },
              { value: 'nobody',   label: 'Nobody' },
            ]}
            value={settings.whoCanMessage}
            onChange={val => setRadio('whoCanMessage', val)}
          />
        </Card>

        {/* ── Notifications ────────────────────────────────────── */}
        <Section title="Notifications" />
        <Card>
          <ToggleRow
            icon="✨"
            label="New Bonds"
            sublabel="When someone bonds with you"
            value={settings.notifMatches}
            onToggle={() => toggle('notifMatches')}
          />
          <Divider />
          <ToggleRow
            icon="💬"
            label="Messages"
            sublabel="New direct messages"
            value={settings.notifMessages}
            onToggle={() => toggle('notifMessages')}
          />
          <Divider />
          <ToggleRow
            icon="🤝"
            label="Bond Requests"
            sublabel="When someone wants to connect"
            value={settings.notifBondRequests}
            onToggle={() => toggle('notifBondRequests')}
          />
          <Divider />
          <ToggleRow
            icon="🎉"
            label="Events Nearby"
            sublabel="New events matching your interests"
            value={settings.notifEvents}
            onToggle={() => toggle('notifEvents')}
          />
          <Divider />
          <ToggleRow
            icon="📞"
            label="Incoming Calls"
            value={settings.notifCalls}
            onToggle={() => toggle('notifCalls')}
          />
          <Divider />
          <ToggleRow
            icon="📧"
            label="Weekly Email Digest"
            sublabel="Summary of your activity"
            value={settings.emailDigest}
            onToggle={() => toggle('emailDigest')}
          />
        </Card>

        {/* ── Discovery ────────────────────────────────────────── */}
        <Section title="Discovery & Chat" />
        <Card>
          <ToggleRow
            icon="🌐"
            label="Auto-Translate Messages"
            sublabel="Translate incoming messages to your language"
            value={settings.autoTranslate}
            onToggle={() => toggle('autoTranslate')}
          />
          <Divider />
          <ToggleRow
            icon="🛡️"
            label="Safe Search"
            sublabel="Filter inappropriate content"
            value={settings.safeSearch}
            onToggle={() => toggle('safeSearch')}
          />
          <Divider />
          <NavRow
            icon="🚫"
            label="Blocked Users"
            sublabel="Manage your block list"
            onPress={() => Alert.alert('Blocked Users', 'Block list management coming soon.')}
          />
        </Card>

        {/* ── Support ──────────────────────────────────────────── */}
        <Section title="Support" />
        <Card>
          <NavRow
            icon="❓"
            label="Help Center"
            onPress={() => Linking.openURL('https://bond.app/help')}
          />
          <Divider />
          <NavRow
            icon="🐛"
            label="Report a Bug"
            onPress={() => Linking.openURL('mailto:support@bond.app?subject=Bug Report')}
          />
          <Divider />
          <NavRow
            icon="📄"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://bond.app/terms')}
          />
          <Divider />
          <NavRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://bond.app/privacy')}
          />
          <Divider />
          <NavRow
            icon="ℹ️"
            label="App Version"
            value="1.0.0"
            onPress={() => {}}
          />
        </Card>

        {/* ── Danger zone ──────────────────────────────────────── */}
        <Section title="Danger Zone" />
        <Card>
          <NavRow
            icon="🗑️"
            label="Clear Chat History"
            sublabel="Remove local message data"
            onPress={confirmClearHistory}
            danger
          />
          <Divider />
          <NavRow
            icon="🚪"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
          <Divider />
          <NavRow
            icon="⚠️"
            label="Delete Account"
            sublabel="Permanently remove all your data"
            onPress={confirmDelete}
            danger
          />
        </Card>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a18' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12122a', borderRadius: 12, borderWidth: 1, borderColor: '#1e1e38' },
  backIcon:     { color: '#fff', fontSize: 26, lineHeight: 30 },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: '900' },

  savingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#5865f215', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#5865f230' },
  savingText:   { color: '#5865f2', fontSize: 13, fontWeight: '600' },

  scroll:       { paddingHorizontal: 16, paddingTop: 8, gap: 8 },

  sectionHeader:{ color: '#555', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 16, marginBottom: 6, marginLeft: 4 },

  card:         { backgroundColor: '#12122a', borderRadius: 20, borderWidth: 1, borderColor: '#1e1e38', overflow: 'hidden' },
  divider:      { height: 1, backgroundColor: '#1e1e38', marginHorizontal: 16 },

  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#5865f210', alignItems: 'center', justifyContent: 'center' },
  rowLabel:     { color: '#e0e0f0', fontSize: 15, fontWeight: '600' },
  rowSub:       { color: '#555', fontSize: 12, marginTop: 2 },
  rowValue:     { color: '#5865f2', fontSize: 13, fontWeight: '700' },
  chevron:      { color: '#333', fontSize: 22, fontWeight: '300' },

  radioGroup:   { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  radioLabel:   { color: '#e0e0f0', fontSize: 15, fontWeight: '600' },
  radioOptions: { flexDirection: 'row', gap: 8 },
  radioBtn:     { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#0a0a18', borderWidth: 1, borderColor: '#1e1e38', alignItems: 'center' },
  radioBtnOn:   { backgroundColor: '#5865f218', borderColor: '#5865f255' },
  radioBtnText: { color: '#555', fontSize: 13, fontWeight: '700' },
  radioBtnTextOn:{ color: '#5865f2' },
});

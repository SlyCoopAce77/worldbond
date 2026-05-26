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
import { useTheme } from '../context/ThemeContext';

const SETTINGS_KEY = 'bond_settings';

const DEFAULTS = {
  showInDiscovery:   true,
  showOnlineStatus:  true,
  readReceipts:      true,
  notifMatches:      true,
  notifMessages:     true,
  notifBondRequests: true,
  notifEvents:       true,
  notifCalls:        true,
  emailDigest:       false,
  autoTranslate:     true,
  safeSearch:        true,
  whoCanMessage:     'everyone',
};

function Section({ title }) {
  const { colors } = useTheme();
  return <Text style={[s.sectionHeader, { color: colors.textMuted }]}>{title}</Text>;
}

function ToggleRow({ icon, label, sublabel, value, onToggle, disabled }) {
  const { colors } = useTheme();
  return (
    <View style={[s.row, { borderColor: colors.border }]}>
      <View style={[s.rowIcon, { backgroundColor: colors.accentFaint }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: '#E8003D55' }}
        thumbColor={value ? '#E8003D' : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function NavRow({ icon, label, sublabel, value, onPress, danger }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: danger ? '#e5393518' : colors.accentFaint }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: danger ? '#e53935' : colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      <Text style={[s.chevron, { color: danger ? '#e53935' : colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

function RadioGroup({ label, options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={s.radioGroup}>
      <Text style={[s.radioLabel, { color: colors.text }]}>{label}</Text>
      <View style={s.radioOptions}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.radioBtn, { backgroundColor: colors.bg, borderColor: colors.border },
              value === opt.value && { backgroundColor: '#E8003D18', borderColor: '#E8003D55' }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[s.radioBtnText, { color: colors.textMuted },
              value === opt.value && { color: '#E8003D' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Card({ children }) {
  const { colors } = useTheme();
  return <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>;
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
}

export default function SettingsScreen({ navigation, onLogout }) {
  const { tier, tierInfo } = usePremium();
  const { colors, isDark, toggleTheme } = useTheme();
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

  const email = profile?.email || '—';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[s.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {saving && (
        <View style={s.savingBanner}>
          <ActivityIndicator size="small" color="#E8003D" />
          <Text style={s.savingText}>Processing…</Text>
        </View>
      )}

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Appearance ───────────────────────────────────────── */}
        <Section title="Appearance" />
        <Card>
          <ToggleRow
            icon={isDark ? '🌙' : '☀️'}
            label="Dark Mode"
            sublabel={isDark ? 'Dark Mode' : 'Light Mode'}
            value={isDark}
            onToggle={toggleTheme}
          />
        </Card>

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
            onPress={() => navigation.navigate('ChangePassword', { email: profile?.email || '' })}
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
            onPress={() => Linking.openURL('mailto:support@bond.app?subject=Help')}
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
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
          />
          <Divider />
          <NavRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
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

const s = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  backIcon:     { fontSize: 26, lineHeight: 30 },
  headerTitle:  { fontSize: 20, fontWeight: '900' },

  savingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8003D15', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8003D30' },
  savingText:   { color: '#E8003D', fontSize: 13, fontWeight: '600' },

  scroll:       { paddingHorizontal: 16, paddingTop: 8, gap: 8 },

  sectionHeader:{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 16, marginBottom: 6, marginLeft: 4 },

  card:         { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  divider:      { height: 1, marginHorizontal: 16 },

  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel:     { fontSize: 15, fontWeight: '600' },
  rowSub:       { fontSize: 12, marginTop: 2 },
  rowValue:     { color: '#E8003D', fontSize: 13, fontWeight: '700' },
  chevron:      { fontSize: 22, fontWeight: '300' },

  radioGroup:   { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  radioLabel:   { fontSize: 15, fontWeight: '600' },
  radioOptions: { flexDirection: 'row', gap: 8 },
  radioBtn:     { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  radioBtnText: { fontSize: 13, fontWeight: '700' },
});

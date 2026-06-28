import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
  Animated, Linking, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getAccessToken, logout } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { useBondPass } from '../context/PremiumContext';
import { useTheme } from '../context/ThemeContext';

const BOND_PINK    = '#FF0080';
const SETTINGS_KEY = 'bond_settings';

const DEFAULTS = {
  showInDiscovery:   true,
  readReceipts:      true,
  autoBondApproval:  true,
  notifMatches:      true,
  notifMessages:     true,
  notifBondRequests: true,
  notifEvents:       true,
  notifSounds:       true,
  emailDigest:       false,
  autoTranslate:     true,
  safeSearch:        true,
  haptics:           true,
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, colors }) {
  return (
    <Text style={[s.sectionHeader, { color: colors.textMuted }]}>{title}</Text>
  );
}

function IconBadge({ sym, colors, danger }) {
  return (
    <View style={[s.rowIcon, {
      backgroundColor: danger ? '#e5393518' : colors.accentFaint,
    }]}>
      <Text style={[s.rowIconSym, { color: danger ? '#e53935' : colors.accent }]}>
        {sym}
      </Text>
    </View>
  );
}

function ToggleRow({ sym, label, sublabel, value, onToggle, disabled, colors }) {
  return (
    <View style={[s.row, { borderColor: colors.border }]}>
      <IconBadge sym={sym} colors={colors} />
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: BOND_PINK + '55' }}
        thumbColor={value ? BOND_PINK : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function NavRow({ sym, label, sublabel, value, onPress, danger, colors }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <IconBadge sym={sym} colors={colors} danger={danger} />
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: danger ? '#e53935' : colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[s.rowValue, { color: colors.accent }]}>{value}</Text> : null}
      <Text style={[s.chevron, { color: danger ? '#e53935' : colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}


function Card({ children, colors }) {
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

function Divider({ colors }) {
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const HELP_FAQS = [
  {
    q: 'How do I Bond with someone?',
    a: 'Visit their profile and tap the Bond button. Once they accept, you are connected.',
  },
  {
    q: 'What is Bond Pass?',
    a: 'Bond Pass is our premium plan ($4.99/month). It gives you unlimited daily connects, the ability to message anyone, a 75% gift payout rate, and more.',
  },
  {
    q: 'How do coins work?',
    a: 'Bond Coins are earned through gifts from other users, completing challenges, and stamp royalties. You can gift coins to creators you enjoy.',
  },
  {
    q: 'Why can I only message some users?',
    a: 'Free accounts can only message users you are bonded with. Bond Pass removes this restriction — you can message anyone.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Scroll to the bottom of Settings and tap Delete Account. This permanently removes all your data and cannot be undone.',
  },
  {
    q: 'Something is broken — how do I report it?',
    a: 'Tap Report a Bug in Settings, or email us directly at support@worldbond.app. Please describe what happened and what you expected.',
  },
];

export default function SettingsScreen({ navigation, onLogout }) {
  const { hasBondPass } = useBondPass();
  const { colors }      = useTheme();
  const [settings, setSettings]     = useState(DEFAULTS);
  const [saving,   setSaving]       = useState(false);
  const [profile,  setProfile]      = useState(null);
  const [showHelp,         setShowHelp]         = useState(false);
  const [showBlockList,    setShowBlockList]    = useState(false);
  const [blockedUsers,     setBlockedUsers]     = useState([]);
  const [loadingBlocks,    setLoadingBlocks]    = useState(false);
  const fadeAnim                    = useRef(new Animated.Value(0)).current;

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
      'This permanently deletes your profile, bonds, messages, and all data. This cannot be undone.',
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
              Alert.alert('Error', 'Could not delete account. Contact support@worldbond.app.');
            }
          },
        },
      ]
    );
  }

  function confirmClearHistory() {
    Alert.alert(
      'Clear Chat History',
      'Removes all local message history. Messages on other devices are not affected.',
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

  async function openBlockList() {
    setShowBlockList(true);
    setLoadingBlocks(true);
    try {
      const token = await getAccessToken();
      const { data } = await axios.get(`${SERVER_URL}/api/profiles/blocks`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      });
      setBlockedUsers(data.blocked || []);
    } catch {
      Alert.alert('Error', 'Could not load blocked users. Try again.');
    } finally {
      setLoadingBlocks(false);
    }
  }

  async function handleUnblock(userId, displayName) {
    Alert.alert('Unblock', `Unblock ${displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', onPress: async () => {
        try {
          const token = await getAccessToken();
          await axios.delete(`${SERVER_URL}/api/profiles/blocks/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBlockedUsers(prev => prev.filter(u => String(u.user_id) !== String(userId)));
        } catch {
          Alert.alert('Error', 'Could not unblock. Try again.');
        }
      }},
    ]);
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

      {/* ── Header ── */}
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
          <ActivityIndicator size="small" color={BOND_PINK} />
          <Text style={s.savingText}>Processing…</Text>
        </View>
      )}

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Account ── */}
        <Section title="Account" colors={colors} />
        <Card colors={colors}>
          <NavRow
            sym="P"
            label="Edit Profile"
            sublabel={profile?.display_name || 'Tap to update your profile'}
            onPress={() => navigation.navigate('Me')}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="*"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword', { email: profile?.email || '' })}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="S"
            label="Subscription"
            value={hasBondPass ? 'Bond Pass' : 'Free'}
            onPress={() => navigation.navigate('Subscription')}
            colors={colors}
          />
        </Card>

        {/* ── Privacy ── */}
        <Section title="Privacy" colors={colors} />
        <Card colors={colors}>
          <ToggleRow
            sym="·"
            label="Show Me in Discovery"
            sublabel="Others can find you on the Connect tab"
            value={settings.showInDiscovery}
            onToggle={() => toggle('showInDiscovery')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="R"
            label="Read Receipts"
            sublabel="Show when you've read messages"
            value={settings.readReceipts}
            onToggle={() => toggle('readReceipts')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="+"
            label="Auto-Accept Bonds"
            sublabel="Bonds form instantly — turn off to review first"
            value={settings.autoBondApproval}
            onToggle={() => toggle('autoBondApproval')}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="×"
            label="Blocked Users"
            sublabel="Manage your block list"
            onPress={openBlockList}
            colors={colors}
          />
        </Card>

        {/* ── Notifications ── */}
        <Section title="Notifications" colors={colors} />
        <Card colors={colors}>
          <ToggleRow
            sym="B"
            label="New Bonds"
            sublabel="When someone bonds with you"
            value={settings.notifMatches}
            onToggle={() => toggle('notifMatches')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="→"
            label="Messages"
            sublabel="New direct messages"
            value={settings.notifMessages}
            onToggle={() => toggle('notifMessages')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="+"
            label="Bond Requests"
            sublabel="When someone wants to connect"
            value={settings.notifBondRequests}
            onToggle={() => toggle('notifBondRequests')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="E"
            label="Events Nearby"
            sublabel="New events matching your interests"
            value={settings.notifEvents}
            onToggle={() => toggle('notifEvents')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="N"
            label="Notification Sounds"
            sublabel="Play sounds for incoming alerts"
            value={settings.notifSounds}
            onToggle={() => toggle('notifSounds')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="@"
            label="Weekly Email Digest"
            sublabel="Summary of your weekly activity"
            value={settings.emailDigest}
            onToggle={() => toggle('emailDigest')}
            colors={colors}
          />
        </Card>

        {/* ── Accessibility ── */}
        <Section title="Accessibility" colors={colors} />
        <Card colors={colors}>
          <ToggleRow
            sym="~"
            label="Haptic Feedback"
            sublabel="Vibration on taps and interactions"
            value={settings.haptics}
            onToggle={() => toggle('haptics')}
            colors={colors}
          />
        </Card>

        {/* ── Discovery & Chat ── */}
        <Section title="Discovery & Chat" colors={colors} />
        <Card colors={colors}>
          <ToggleRow
            sym="T"
            label="Auto-Translate Messages"
            sublabel="Translate incoming messages to your language"
            value={settings.autoTranslate}
            onToggle={() => toggle('autoTranslate')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            sym="S"
            label="Safe Search"
            sublabel="Filter inappropriate content"
            value={settings.safeSearch}
            onToggle={() => toggle('safeSearch')}
            colors={colors}
          />
        </Card>

        {/* ── Support ── */}
        <Section title="Support" colors={colors} />
        <Card colors={colors}>
          <NavRow
            sym="?"
            label="Help Center"
            onPress={() => setShowHelp(true)}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="!"
            label="Report a Bug"
            onPress={() => {
              Linking.canOpenURL('mailto:support@worldbond.app').then(can => {
                if (can) {
                  Linking.openURL('mailto:support@worldbond.app?subject=Bug Report');
                } else {
                  Alert.alert('Report a Bug', 'Email us at support@worldbond.app and describe what happened.');
                }
              });
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="T"
            label="Terms of Service"
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="P"
            label="Privacy Policy"
            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="v"
            label="App Version"
            value="1.0.0"
            onPress={() => {}}
            colors={colors}
          />
        </Card>

        {/* ── Danger Zone ── */}
        <Section title="Danger Zone" colors={colors} />
        <Card colors={colors}>
          <NavRow
            sym="C"
            label="Clear Chat History"
            sublabel="Remove local message data"
            onPress={confirmClearHistory}
            danger
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="→"
            label="Sign Out"
            onPress={handleLogout}
            danger
            colors={colors}
          />
          <Divider colors={colors} />
          <NavRow
            sym="!"
            label="Delete Account"
            sublabel="Permanently remove all your data"
            onPress={confirmDelete}
            danger
            colors={colors}
          />
        </Card>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ── Blocked Users Modal ── */}
      <Modal visible={showBlockList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBlockList(false)}>
        <SafeAreaView style={s.helpContainer}>
          <View style={s.helpHeader}>
            <Text style={s.helpTitle}>Blocked Users</Text>
            <TouchableOpacity style={s.helpClose} onPress={() => setShowBlockList(false)}>
              <Text style={s.helpCloseTxt}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.blockScroll} showsVerticalScrollIndicator={false}>
            {loadingBlocks ? (
              <ActivityIndicator color={BOND_PINK} style={{ marginTop: 48 }} />
            ) : blockedUsers.length === 0 ? (
              <View style={s.blockEmpty}>
                <Text style={s.blockEmptyTxt}>No blocked users</Text>
                <Text style={s.blockEmptyHint}>Users you block will appear here. You can block someone from their profile.</Text>
              </View>
            ) : (
              blockedUsers.map(u => (
                <View key={u.user_id} style={s.blockRow}>
                  <View style={s.blockAvatar}>
                    <Text style={s.blockAvatarTxt}>{(u.display_name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={s.blockInfo}>
                    <Text style={s.blockName}>{u.display_name || 'Unknown'}</Text>
                    {u.country ? <Text style={s.blockCountry}>{u.country}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={s.unblockBtn}
                    onPress={() => handleUnblock(u.user_id, u.display_name || 'this user')}
                    activeOpacity={0.75}
                  >
                    <Text style={s.unblockTxt}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Help Center Modal ── */}
      <Modal visible={showHelp} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHelp(false)}>
        <SafeAreaView style={s.helpContainer}>
          <View style={s.helpHeader}>
            <Text style={s.helpTitle}>Help Center</Text>
            <TouchableOpacity style={s.helpClose} onPress={() => setShowHelp(false)}>
              <Text style={s.helpCloseTxt}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.helpScroll} showsVerticalScrollIndicator={false}>
            <Text style={s.helpIntro}>Frequently asked questions</Text>
            {HELP_FAQS.map((item, i) => (
              <View key={i} style={s.faqItem}>
                <Text style={s.faqQ}>{item.q}</Text>
                <Text style={s.faqA}>{item.a}</Text>
              </View>
            ))}
            <View style={s.helpContactWrap}>
              <Text style={s.helpContactLabel}>Still need help?</Text>
              <TouchableOpacity
                onPress={() => {
                  Linking.canOpenURL('mailto:support@worldbond.app').then(can => {
                    if (can) {
                      Linking.openURL('mailto:support@worldbond.app?subject=Help');
                    } else {
                      Alert.alert('Contact Support', 'Email us at support@worldbond.app');
                    }
                  });
                }}
                activeOpacity={0.75}
              >
                <Text style={s.helpContactEmail}>support@worldbond.app</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, borderWidth: 1 },
  backIcon:     { fontSize: 26, lineHeight: 30 },
  headerTitle:  { fontSize: 20, fontWeight: '900' },

  savingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: BOND_PINK + '15', paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: BOND_PINK + '30' },
  savingText:   { color: BOND_PINK, fontSize: 13, fontWeight: '600' },

  scroll:       { paddingHorizontal: 16, paddingTop: 8, gap: 8 },

  sectionHeader:{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
                  letterSpacing: 1.2, marginTop: 16, marginBottom: 6, marginLeft: 4 },

  card:         { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  divider:      { height: 1, marginHorizontal: 16 },

  row:          { flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon:      { width: 36, height: 36, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center' },
  rowIconSym:   { fontSize: 14, fontWeight: '900' },
  rowLabel:     { fontSize: 15, fontWeight: '600' },
  rowSub:       { fontSize: 12, marginTop: 2, lineHeight: 17 },
  rowValue:     { fontSize: 13, fontWeight: '700' },
  chevron:      { fontSize: 22, fontWeight: '300' },

  // Help Center Modal
  helpContainer:    { flex: 1, backgroundColor: '#08090d' },
  helpHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e2028' },
  helpTitle:        { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  helpClose:        { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#1C1F23', borderRadius: 10, borderWidth: 1, borderColor: '#2F3336' },
  helpCloseTxt:     { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  helpScroll:       { padding: 20, gap: 16 },
  helpIntro:        { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  faqItem:          { backgroundColor: '#0f1116', borderRadius: 14, borderWidth: 1, borderColor: '#1e2028', padding: 16, gap: 8 },
  faqQ:             { color: '#ffffff', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  faqA:             { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22 },
  helpContactWrap:  { alignItems: 'center', paddingVertical: 24, gap: 8 },
  helpContactLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  helpContactEmail: { color: BOND_PINK, fontSize: 15, fontWeight: '700' },

  // Blocked Users Modal
  blockScroll:    { padding: 16, gap: 2 },
  blockEmpty:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  blockEmptyTxt:  { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  blockEmptyHint: { color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  blockRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e2028' },
  blockAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1F23', alignItems: 'center', justifyContent: 'center' },
  blockAvatarTxt: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  blockInfo:      { flex: 1, gap: 2 },
  blockName:      { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  blockCountry:   { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  unblockBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: BOND_PINK + '60', backgroundColor: BOND_PINK + '12' },
  unblockTxt:     { color: BOND_PINK, fontSize: 13, fontWeight: '700' },
});

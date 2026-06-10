import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated, Modal, FlatList, Pressable, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { register } from '../../services/authApi';

const SCREEN_W = Dimensions.get('window').width;
const ITEM_H   = 48;
const VISIBLE  = 5;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const NOW    = new Date().getFullYear();
// Years from oldest (1924) to newest valid (NOW-18), most recent first
const YEARS  = Array.from({ length: NOW - 1923 }, (_, i) => String(NOW - 18 - i));
// Default index: 1990 is a neutral starting year
const DEFAULT_YEAR_IDX = YEARS.indexOf('1990') >= 0 ? YEARS.indexOf('1990') : 0;

// ── Scroll wheel column ───────────────────────────────────────────────────────
function WheelColumn({ items, selected, onSelect, width }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && selected >= 0) {
      listRef.current.scrollToIndex({ index: selected, animated: false });
    }
  }, []);

  function handleScrollEnd(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    onSelect(Math.max(0, Math.min(idx, items.length - 1)));
  }

  return (
    <View style={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        onMomentumScrollEnd={handleScrollEnd}
        ListHeaderComponent={<View style={{ height: ITEM_H * 2 }} />}
        ListFooterComponent={<View style={{ height: ITEM_H * 2 }} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={wh.item}
            onPress={() => {
              onSelect(index);
              listRef.current?.scrollToIndex({ index, animated: true });
            }}
          >
            <Text style={[wh.itemText, index === selected && wh.itemTextSel]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <View pointerEvents="none" style={wh.selBar} />
    </View>
  );
}

const wh = StyleSheet.create({
  item:        { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText:    { color: '#444', fontSize: 17, fontWeight: '500' },
  itemTextSel: { color: '#fff', fontSize: 19, fontWeight: '700' },
  selBar: {
    position: 'absolute',
    top: ITEM_H * 2, left: 8, right: 8, height: ITEM_H,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#6C47FF55',
    borderRadius: 8, backgroundColor: '#6C47FF12',
  },
});

// ── Password strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#f04747', '#fee75c', '#57c4ff', '#57f287'];
  const label  = labels[score - 1] || '';
  const color  = colors[score - 1] || '#2F3336';

  return (
    <View style={ps.row}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[ps.bar, { backgroundColor: i < score ? color : '#2F3336' }]} />
      ))}
      {label ? <Text style={[ps.label, { color }]}>{label}</Text> : null}
    </View>
  );
}
const ps = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  bar:   { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcAge(monthIdx, dayIdx, yearStr) {
  const dob = new Date(Number(yearStr), monthIdx, Number(DAYS[dayIdx]));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function toISO(monthIdx, dayIdx, yearStr) {
  const m = String(monthIdx + 1).padStart(2, '0');
  const d = DAYS[dayIdx];
  return `${yearStr}-${m}-${d}`;
}

function formatDOB(monthIdx, dayIdx, yearStr) {
  return `${MONTHS[monthIdx]} ${DAYS[dayIdx]}, ${yearStr}`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RegisterScreen({ onSuccess, onBack, onGoLogin }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // DOB picker state
  const [dobStep,  setDobStep]  = useState('closed'); // 'closed' | 'pick' | 'confirm'
  const [dobMonth, setDobMonth] = useState(0);
  const [dobDay,   setDobDay]   = useState(0);
  const [dobYear,  setDobYear]  = useState(DEFAULT_YEAR_IDX);
  const [dobSet,   setDobSet]   = useState(false);
  const [confirmed, setConfirmed] = useState(false); // anti-lying checkbox

  const passwordRef = useRef(null);
  const confirmRef  = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const age = calcAge(dobMonth, dobDay, YEARS[dobYear]);

  function openPicker() {
    setConfirmed(false);
    setDobStep('pick');
  }

  function advanceToConfirm() {
    if (age < 18) {
      setDobStep('closed');
      setDobSet(false);
      setError('You must be 18 or older to join Bond.');
      return;
    }
    setDobStep('confirm');
  }

  function finalizeDOB() {
    setDobSet(true);
    setError('');
    setDobStep('closed');
  }

  async function handleRegister() {
    setError('');
    if (!email.trim())        return setError('Enter your email address');
    if (!email.includes('@')) return setError('Enter a valid email address');
    if (!password)            return setError('Create a password');
    if (password.length < 8)  return setError('Password must be at least 8 characters');
    if (password !== confirm)  return setError('Passwords do not match');
    if (!dobSet)               return setError('Please confirm your date of birth');
    if (age < 18)              return setError('You must be 18 or older to join Bond.');

    setLoading(true);
    try {
      const result = await register(
        email.trim().toLowerCase(),
        password,
        toISO(dobMonth, dobDay, YEARS[dobYear])
      );
      onSuccess(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const confirmState = confirm.length > 0
    ? password === confirm ? 'match' : 'mismatch'
    : 'idle';

  const dobLabel = dobSet
    ? formatDOB(dobMonth, dobDay, YEARS[dobYear])
    : 'Select your date of birth';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            <View style={styles.header}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join Bond — takes less than a minute</Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrap, email.length > 0 && styles.inputWrapFocused]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#536471"
                    value={email}
                    onChangeText={t => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, password.length > 0 && styles.inputWrapFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#536471"
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
                    secureTextEntry={!showPass}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.showHide}>
                    <Text style={styles.showHideText}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                <PasswordStrength password={password} />
              </View>

              {/* Confirm password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[
                  styles.inputWrap,
                  confirmState === 'match'    && styles.inputWrapOk,
                  confirmState === 'mismatch' && styles.inputWrapErr,
                  confirmState === 'idle' && confirm.length === 0 && password.length > 0 && styles.inputWrapFocused,
                ]}>
                  <Text style={styles.inputIcon}>
                    {confirmState === 'match' ? '✅' : confirmState === 'mismatch' ? '❌' : '🔑'}
                  </Text>
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor="#536471"
                    value={confirm}
                    onChangeText={t => { setConfirm(t); setError(''); }}
                    secureTextEntry={!showConfirm}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.showHide}>
                    <Text style={styles.showHideText}>{showConfirm ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Date of Birth{'  '}
                  <Text style={styles.labelBadge}>18+ only</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.inputWrap, styles.dobWrap, dobSet && styles.inputWrapOk]}
                  onPress={openPicker}
                  activeOpacity={0.75}
                >
                  <Text style={styles.inputIcon}>🎂</Text>
                  <Text style={[styles.dobText, dobSet && styles.dobTextSet]}>{dobLabel}</Text>
                  {dobSet && <Text style={styles.dobCheck}>✓</Text>}
                </TouchableOpacity>
                <Text style={styles.dobHint}>
                  Bond is strictly 18+. Your date of birth is permanently stored and verified.
                </Text>
              </View>

            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || !email || !password || !confirm || !dobSet) && styles.submitBtnOff]}
              onPress={handleRegister}
              disabled={loading || !email || !password || !confirm || !dobSet}
              activeOpacity={0.87}
            >
              {loading ? (
                <View style={styles.submitGrad}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <LinearGradient
                  colors={['#6C47FF', '#6C47FF', '#5533DD']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.submitGrad}
                >
                  <Text style={styles.submitText}>Create Account →</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onGoLogin}>
                <Text style={styles.footerLink}> Sign in →</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── DOB Picker Modal ── */}
      <Modal
        visible={dobStep !== 'closed'}
        transparent
        animationType="slide"
        onRequestClose={() => setDobStep('closed')}
      >
        <Pressable style={dob.backdrop} onPress={() => setDobStep('closed')} />

        <View style={dob.sheet}>
          <View style={dob.handle} />

          {dobStep === 'pick' && (
            <>
              <Text style={dob.sheetTitle}>Date of Birth</Text>
              <Text style={dob.sheetSub}>Scroll to your birth date</Text>

              <View style={dob.colHeaders}>
                <Text style={[dob.colLabel, { width: SCREEN_W * 0.28 }]}>Month</Text>
                <Text style={[dob.colLabel, { width: SCREEN_W * 0.22 }]}>Day</Text>
                <Text style={[dob.colLabel, { width: SCREEN_W * 0.30 }]}>Year</Text>
              </View>

              <View style={dob.wheels}>
                <WheelColumn items={MONTHS} selected={dobMonth} onSelect={setDobMonth} width={SCREEN_W * 0.28} />
                <View style={dob.wheelDivider} />
                <WheelColumn items={DAYS}   selected={dobDay}   onSelect={setDobDay}   width={SCREEN_W * 0.22} />
                <View style={dob.wheelDivider} />
                <WheelColumn items={YEARS}  selected={dobYear}  onSelect={setDobYear}  width={SCREEN_W * 0.30} />
              </View>

              <TouchableOpacity style={dob.actionBtn} onPress={advanceToConfirm} activeOpacity={0.87}>
                <LinearGradient colors={['#6C47FF', '#5533DD']} style={dob.actionGrad}>
                  <Text style={dob.actionText}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {dobStep === 'confirm' && (
            <>
              <Text style={dob.sheetTitle}>Confirm Your Age</Text>

              {/* Age summary card */}
              <View style={dob.ageCard}>
                <Text style={dob.ageEmoji}>🎂</Text>
                <Text style={dob.ageDate}>{formatDOB(dobMonth, dobDay, YEARS[dobYear])}</Text>
                <Text style={dob.ageNum}>{age} years old</Text>
              </View>

              {/* Warning */}
              <View style={dob.warningBox}>
                <Text style={dob.warningTitle}>⚠️  Age Verification</Text>
                <Text style={dob.warningText}>
                  Bond is strictly for adults 18 and older. Your date of birth is{' '}
                  <Text style={{ color: '#fff', fontWeight: '700' }}>permanently stored</Text>
                  {' '}and cannot be changed. Providing false information is a violation of our Terms of Service and will result in a{' '}
                  <Text style={{ color: '#f04747', fontWeight: '700' }}>permanent ban</Text>.
                </Text>
              </View>

              {/* Confirm toggle card — full-width tap target */}
              <TouchableOpacity
                style={[dob.confirmCard, confirmed && dob.confirmCardOn]}
                onPress={() => setConfirmed(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[dob.checkbox, confirmed && dob.checkboxOn]}>
                  {confirmed && <Text style={dob.checkmark}>✓</Text>}
                </View>
                <Text style={[dob.checkLabel, confirmed && { color: '#fff' }]}>
                  I confirm this is my real date of birth and I am {age} years old
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[dob.actionBtn, !confirmed && { opacity: 0.4 }]}
                onPress={finalizeDOB}
                disabled={!confirmed}
                activeOpacity={0.87}
              >
                <LinearGradient colors={['#6C47FF', '#5533DD']} style={dob.actionGrad}>
                  <Text style={dob.actionText}>I Confirm My Age</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={dob.backLink} onPress={() => setDobStep('pick')}>
                <Text style={dob.backLinkText}>← Change date</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },
  scroll:          { flexGrow: 1, padding: 24, paddingTop: 16 },

  backBtn:         { marginBottom: 28, alignSelf: 'flex-start' },
  backBtnInner:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336', alignItems: 'center', justifyContent: 'center' },
  backIcon:        { color: '#fff', fontSize: 26, lineHeight: 30 },

  header:          { marginBottom: 32 },
  title:           { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle:        { fontSize: 15, color: '#536471', marginTop: 6 },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0474712', borderWidth: 1, borderColor: '#f0474730', borderRadius: 14, padding: 14, marginBottom: 20 },
  errorIcon:       { fontSize: 16 },
  errorText:       { color: '#f04747', fontSize: 14, flex: 1, lineHeight: 20 },

  form:            { gap: 20 },
  fieldGroup:      { gap: 8 },
  label:           { color: '#536471', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  labelBadge:      { color: '#6C47FF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 16, borderWidth: 1, borderColor: '#2F3336', paddingHorizontal: 16 },
  inputWrapFocused:{ borderColor: '#6C47FF40' },
  inputWrapOk:     { borderColor: '#57f28755' },
  inputWrapErr:    { borderColor: '#f0474755' },
  inputIcon:       { fontSize: 16, marginRight: 10 },
  input:           { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },
  showHide:        { paddingLeft: 8 },
  showHideText:    { color: '#6C47FF', fontSize: 13, fontWeight: '700' },

  dobWrap:         { paddingVertical: 17 },
  dobText:         { flex: 1, color: '#536471', fontSize: 15 },
  dobTextSet:      { color: '#fff', fontWeight: '600' },
  dobCheck:        { color: '#57f287', fontSize: 16, fontWeight: '700' },
  dobHint:         { color: '#333', fontSize: 11, lineHeight: 16 },

  submitBtn:       { borderRadius: 18, overflow: 'hidden', marginTop: 32 },
  submitBtnOff:    { opacity: 0.45 },
  submitGrad:      { paddingVertical: 19, alignItems: 'center', borderRadius: 18, backgroundColor: '#6C47FF' },
  submitText:      { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  terms:           { color: '#2F3336', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  termsLink:       { color: '#6C47FF50' },

  divider:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: '#2F3336' },
  dividerText:     { color: '#2F3336', fontSize: 13, fontWeight: '600' },

  footerRow:       { flexDirection: 'row', justifyContent: 'center', paddingBottom: 24 },
  footerText:      { color: '#555', fontSize: 15 },
  footerLink:      { color: '#6C47FF', fontSize: 15, fontWeight: '700' },
});

const dob = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: '#0e0e1c',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44,
    borderTopWidth: 1, borderColor: '#1e1e3a',
  },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2F3336', alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  sheetSub:   { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 20 },

  colHeaders:  { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  colLabel:    { color: '#444', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  wheels:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  wheelDivider: { width: 1, height: ITEM_H * VISIBLE, backgroundColor: '#1e1e3a' },

  actionBtn:  { borderRadius: 16, overflow: 'hidden', marginTop: 24 },
  actionGrad: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  actionText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Confirm step
  ageCard:    { backgroundColor: '#16162a', borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, marginBottom: 16, borderWidth: 1, borderColor: '#6C47FF33' },
  ageEmoji:   { fontSize: 36 },
  ageDate:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  ageNum:     { color: '#6C47FF', fontSize: 14, fontWeight: '600' },

  warningBox:   { backgroundColor: '#1a1020', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#f0474730' },
  warningTitle: { color: '#f04747', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  warningText:  { color: '#888', fontSize: 12, lineHeight: 18 },

  confirmCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, backgroundColor: '#16162a', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#2F3336' },
  confirmCardOn: { borderColor: '#6C47FF', backgroundColor: '#1a1535' },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#2F3336', backgroundColor: '#16181C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxOn:  { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  checkmark:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  checkLabel:  { flex: 1, color: '#aaa', fontSize: 13, lineHeight: 20 },

  backLink:     { alignItems: 'center', paddingTop: 14 },
  backLinkText: { color: '#444', fontSize: 13 },
});

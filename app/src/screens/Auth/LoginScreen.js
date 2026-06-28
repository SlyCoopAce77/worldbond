import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { login } from '../../services/authApi';
import { WorldWordmark } from '../../components/BondLogo';

const BOND_PINK  = '#FF0080';
const BOND_PINK_D = '#CC0060';

export default function LoginScreen({ onSuccess, onBack, onGoRegister, onForgotPassword, onForgotEmail }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const passwordRef             = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    setError('');
    if (!email.trim())        return setError('Enter your email address');
    if (!email.includes('@')) return setError('Enter a valid email address');
    if (!password)            return setError('Enter your password');

    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      onSuccess(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  return (
    <LinearGradient colors={['#000000', '#010100', '#000000']} style={s.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Nav ── */}
            <View style={s.nav}>
              <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View style={s.backBtn}>
                  <Text style={s.backArrow}>‹</Text>
                </View>
              </TouchableOpacity>
              <WorldWordmark size={18} color="#fff" bondColor={BOND_PINK} bondTextColor={BOND_PINK} />
              <View style={{ width: 40 }} />
            </View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              {/* ── Header ── */}
              <View style={s.header}>
                <Text style={s.title}>Welcome back</Text>
                <Text style={s.subtitle}>Your worlds are waiting.</Text>
              </View>

              {/* ── Error ── */}
              {!!error && (
                <View style={s.errorRow}>
                  <View style={s.errorIcon}>
                    <Text style={s.errorIconText}>!</Text>
                  </View>
                  <Text style={s.errorMsg}>{error}</Text>
                </View>
              )}

              {/* ── Form ── */}
              <View style={s.form}>
                <View style={s.field}>
                  <Text style={s.label}>EMAIL</Text>
                  <View style={[s.inputBox, email.length > 0 && s.inputBoxActive]}>
                    <TextInput
                      style={s.input}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.35)"
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

                <View style={s.field}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>PASSWORD</Text>
                    <TouchableOpacity onPress={onForgotPassword} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={s.forgotLink}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[s.inputBox, password.length > 0 && s.inputBoxActive]}>
                    <TextInput
                      ref={passwordRef}
                      style={s.input}
                      placeholder="Your password"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={password}
                      onChangeText={t => { setPassword(t); setError(''); }}
                      secureTextEntry={!showPass}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                      <Text style={s.eyeText}>{showPass ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ── Sign In ── */}
              <TouchableOpacity
                style={[s.submitWrap, !canSubmit && s.submitOff]}
                onPress={handleLogin}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={s.submitGrad}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={[BOND_PINK, BOND_PINK_D]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.submitGrad}
                  >
                    <Text style={s.submitText}>Sign In</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerLabel}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* ── Footer ── */}
              <View style={s.footerRow}>
                <Text style={s.footerText}>New to WorldBond?</Text>
                <TouchableOpacity onPress={onGoRegister}>
                  <Text style={s.footerLink}> Create account</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={s.forgotEmailBtn} onPress={onForgotEmail}>
                <Text style={s.forgotEmailText}>Forgot your email address?</Text>
              </TouchableOpacity>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 8, paddingBottom: 48 },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 40,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#ffffff09', borderWidth: 1, borderColor: '#ffffff10',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 24, lineHeight: 28, marginTop: -1 },

  // Header
  header:   { marginBottom: 36 },
  title:    { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { color: '#ffffff', opacity: 0.45, fontSize: 15, fontWeight: '400' },

  // Error
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0474710', borderWidth: 1, borderColor: '#f0474730',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 24,
  },
  errorIcon:     { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f04747', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  errorIconText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  errorMsg:      { color: '#f04747', fontSize: 14, flex: 1, lineHeight: 20 },

  // Form
  form:  { gap: 22 },
  field: { gap: 7 },

  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:      { color: '#ffffff', opacity: 0.30, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  forgotLink: { color: BOND_PINK, fontSize: 13, fontWeight: '600' },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d0d0d',
    borderRadius: 16, borderWidth: 1, borderColor: '#1e1e1e',
    paddingHorizontal: 18,
  },
  inputBoxActive: { borderColor: '#FF008050' },
  input:   { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 18 },
  eyeBtn:  { paddingLeft: 10 },
  eyeText: { color: BOND_PINK, fontSize: 13, fontWeight: '600' },

  // Submit
  submitWrap: { borderRadius: 18, overflow: 'hidden', marginTop: 32 },
  submitOff:  { opacity: 0.4 },
  submitGrad: { paddingVertical: 20, alignItems: 'center', borderRadius: 18, backgroundColor: BOND_PINK },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1a1a1a' },
  dividerLabel:{ color: '#ffffff', opacity: 0.25, fontSize: 13, fontWeight: '600' },

  // Footer
  footerRow:      { flexDirection: 'row', justifyContent: 'center', paddingBottom: 8 },
  footerText:     { color: '#ffffff', opacity: 0.40, fontSize: 15 },
  footerLink:     { color: BOND_PINK, fontSize: 15, fontWeight: '700' },
  forgotEmailBtn: { alignItems: 'center', paddingVertical: 14 },
  forgotEmailText:{ color: '#444', fontSize: 13, fontWeight: '500' },
});

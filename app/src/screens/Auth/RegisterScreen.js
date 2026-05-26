import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { register } from '../../services/authApi';

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

export default function RegisterScreen({ onSuccess, onBack, onGoLogin }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const passwordRef                   = useRef(null);
  const confirmRef                    = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleRegister() {
    setError('');
    if (!email.trim())        return setError('Enter your email address');
    if (!email.includes('@')) return setError('Enter a valid email address');
    if (!password)            return setError('Create a password');
    if (password.length < 8)  return setError('Password must be at least 8 characters');
    if (password !== confirm)  return setError('Passwords do not match');

    setLoading(true);
    try {
      const result = await register(email.trim().toLowerCase(), password);
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

              {/* Confirm */}
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

            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || !email || !password || !confirm) && styles.submitBtnOff]}
              onPress={handleRegister}
              disabled={loading || !email || !password || !confirm}
              activeOpacity={0.87}
            >
              {loading ? (
                <View style={styles.submitGrad}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <LinearGradient
                  colors={['#E8003D', '#E8003D', '#C7003A']}
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
    </SafeAreaView>
  );
}

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

  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 16, borderWidth: 1, borderColor: '#2F3336', paddingHorizontal: 16 },
  inputWrapFocused:{ borderColor: '#E8003D40' },
  inputWrapOk:     { borderColor: '#57f28755' },
  inputWrapErr:    { borderColor: '#f0474755' },
  inputIcon:       { fontSize: 16, marginRight: 10 },
  input:           { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },
  showHide:        { paddingLeft: 8 },
  showHideText:    { color: '#E8003D', fontSize: 13, fontWeight: '700' },

  submitBtn:       { borderRadius: 18, overflow: 'hidden', marginTop: 32 },
  submitBtnOff:    { opacity: 0.45 },
  submitGrad:      { paddingVertical: 19, alignItems: 'center', borderRadius: 18, backgroundColor: '#E8003D' },
  submitText:      { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  terms:           { color: '#2F3336', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  termsLink:       { color: '#E8003D50' },

  divider:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: '#2F3336' },
  dividerText:     { color: '#2F3336', fontSize: 13, fontWeight: '600' },

  footerRow:       { flexDirection: 'row', justifyContent: 'center', paddingBottom: 24 },
  footerText:      { color: '#555', fontSize: 15 },
  footerLink:      { color: '#E8003D', fontSize: 15, fontWeight: '700' },
});

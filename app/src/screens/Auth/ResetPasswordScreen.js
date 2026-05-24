import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { SERVER_URL } from '../../services/socket';

export default function ResetPasswordScreen({ email, onBack, onSuccess }) {
  const [code,        setCode]        = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);

  const passRef    = useRef(null);
  const confirmRef = useRef(null);
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleReset() {
    setError('');
    if (code.trim().length !== 6)  return setError('Enter the 6-digit code from your email');
    if (password.length < 8)       return setError('Password must be at least 8 characters');
    if (password !== confirm)      return setError('Passwords do not match');

    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/api/auth/reset-password`, {
        email,
        code:        code.trim(),
        newPassword: password,
      }, { timeout: 10000 });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneWrap}>
          <LinearGradient colors={['#5865f230', '#5865f210']} style={styles.doneIconBg}>
            <Text style={styles.doneIcon}>✅</Text>
          </LinearGradient>
          <Text style={styles.doneTitle}>Password reset!</Text>
          <Text style={styles.doneSub}>Your password has been updated. Sign in with your new password.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onSuccess} activeOpacity={0.87}>
            <LinearGradient
              colors={['#6875f5', '#5865f2', '#4752c4']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.doneBtnGrad}
            >
              <Text style={styles.doneBtnText}>Go to Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.title}>Enter your code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>

              {/* Code input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Reset Code</Text>
                <View style={[styles.inputWrap, styles.codeWrap, code.length > 0 && styles.inputWrapFocused]}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor="#2a2a4a"
                    value={code}
                    onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    keyboardType="number-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => passRef.current?.focus()}
                    autoFocus
                    maxLength={6}
                    textContentType="oneTimeCode"
                  />
                  {code.length === 6 && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </View>

              {/* New password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputWrap, password.length > 0 && styles.inputWrapFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passRef}
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#3a3a5a"
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
              </View>

              {/* Confirm password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrap, confirm.length > 0 && styles.inputWrapFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="Repeat your new password"
                    placeholderTextColor="#3a3a5a"
                    value={confirm}
                    onChangeText={t => { setConfirm(t); setError(''); }}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                  {confirm.length > 0 && password === confirm && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
              </View>

            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (loading || code.length < 6 || !password || !confirm) && styles.submitBtnOff]}
              onPress={handleReset}
              disabled={loading || code.length < 6 || !password || !confirm}
              activeOpacity={0.87}
            >
              {loading ? (
                <View style={styles.submitGrad}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <LinearGradient
                  colors={['#6875f5', '#5865f2', '#4752c4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.submitGrad}
                >
                  <Text style={styles.submitText}>Reset Password</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <View style={styles.hintRow}>
              <Text style={styles.hint}>Didn't get the email? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.hintLink}>Go back and resend</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a18' },
  scroll:    { flexGrow: 1, padding: 24, paddingTop: 16 },

  backBtn:      { marginBottom: 28, alignSelf: 'flex-start' },
  backBtnInner: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { color: '#fff', fontSize: 26, lineHeight: 30 },

  header:         { marginBottom: 28 },
  title:          { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle:       { fontSize: 15, color: '#555577', marginTop: 8, lineHeight: 22 },
  emailHighlight: { color: '#5865f2', fontWeight: '700' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0474712', borderWidth: 1, borderColor: '#f0474730', borderRadius: 14, padding: 14, marginBottom: 20 },
  errorIcon:   { fontSize: 16 },
  errorText:   { color: '#f04747', fontSize: 14, flex: 1, lineHeight: 20 },

  form:       { gap: 20 },
  fieldGroup: { gap: 8 },
  label:      { color: '#555577', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  inputWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e38', paddingHorizontal: 16 },
  inputWrapFocused: { borderColor: '#5865f240' },
  codeWrap:         { justifyContent: 'center' },
  inputIcon:        { fontSize: 16, marginRight: 10 },
  input:            { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },
  codeInput:        { textAlign: 'center', fontSize: 28, fontWeight: '800', letterSpacing: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  checkMark:        { color: '#57f287', fontSize: 18, fontWeight: '800', marginLeft: 8 },
  showHide:         { paddingLeft: 8 },
  showHideText:     { color: '#5865f2', fontSize: 13, fontWeight: '700' },

  submitBtn:    { borderRadius: 18, overflow: 'hidden', marginTop: 32 },
  submitBtnOff: { opacity: 0.45 },
  submitGrad:   { paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  submitText:   { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  hintRow:  { flexDirection: 'row', justifyContent: 'center', paddingVertical: 18 },
  hint:     { color: '#555', fontSize: 13 },
  hintLink: { color: '#5865f2', fontSize: 13, fontWeight: '600' },

  // Done state
  doneWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneIconBg: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneIcon:   { fontSize: 48 },
  doneTitle:  { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  doneSub:    { color: '#666', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  doneBtn:    { width: '100%', borderRadius: 18, overflow: 'hidden' },
  doneBtnGrad:{ paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  doneBtnText:{ color: '#fff', fontSize: 17, fontWeight: '800' },
});

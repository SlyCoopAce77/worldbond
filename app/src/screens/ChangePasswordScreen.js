import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { SERVER_URL } from '../services/socket';

export default function ChangePasswordScreen({ route, navigation }) {
  const email = route.params?.email || '';
  const [step, setStep] = useState('send'); // 'send' | 'code' | 'done'
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  async function sendCode() {
    setError('');
    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/api/auth/forgot-password`, { email }, { timeout: 10000 });
      setStep('code');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitReset() {
    setError('');
    if (code.length !== 6) return setError('Enter the 6-digit code from your email');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/api/auth/reset-password`, {
        email,
        code: code.trim(),
        newPassword,
      }, { timeout: 10000 });
      setStep('done');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired code. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.iconWrap}>
              <LinearGradient colors={['#5865f230', '#5865f210']} style={styles.iconBg}>
                <Text style={styles.icon}>🔑</Text>
              </LinearGradient>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Change Password</Text>
              {step === 'send' && (
                <Text style={styles.subtitle}>{'A 6-digit code will be sent to\n'}{email}</Text>
              )}
              {step === 'code' && (
                <Text style={styles.subtitle}>{'Enter the code sent to\n'}{email}</Text>
              )}
              {step === 'done' && (
                <Text style={styles.subtitle}>Your password has been updated</Text>
              )}
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === 'send' && (
              <>
                <View style={styles.emailBox}>
                  <Text style={styles.emailLabel}>Email</Text>
                  <Text style={styles.emailValue}>{email || '—'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnOff]}
                  onPress={sendCode}
                  disabled={loading}
                  activeOpacity={0.87}
                >
                  {loading ? (
                    <View style={styles.btnGrad}><ActivityIndicator color="#fff" /></View>
                  ) : (
                    <LinearGradient
                      colors={['#6875f5', '#5865f2', '#4752c4']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.btnGrad}
                    >
                      <Text style={styles.btnText}>Send Reset Code</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'code' && (
              <>
                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>6-digit code</Text>
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputIcon}>📬</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="• • • • • •"
                        placeholderTextColor="#3a3a5a"
                        value={code}
                        onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                        keyboardType="number-pad"
                        textContentType="oneTimeCode"
                        autoFocus
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>New password</Text>
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="At least 8 characters"
                        placeholderTextColor="#3a3a5a"
                        value={newPassword}
                        onChangeText={t => { setNewPassword(t); setError(''); }}
                        secureTextEntry
                        returnKeyType="next"
                        autoCapitalize="none"
                      />
                      {newPassword.length >= 8 && <Text style={styles.check}>✓</Text>}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Confirm new password</Text>
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Repeat password"
                        placeholderTextColor="#3a3a5a"
                        value={confirmPassword}
                        onChangeText={t => { setConfirmPassword(t); setError(''); }}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={submitReset}
                        autoCapitalize="none"
                      />
                      {confirmPassword.length > 0 && newPassword === confirmPassword && (
                        <Text style={styles.check}>✓</Text>
                      )}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, (loading || code.length < 6 || newPassword.length < 8) && styles.btnOff]}
                  onPress={submitReset}
                  disabled={loading || code.length < 6 || newPassword.length < 8}
                  activeOpacity={0.87}
                >
                  {loading ? (
                    <View style={styles.btnGrad}><ActivityIndicator color="#fff" /></View>
                  ) : (
                    <LinearGradient
                      colors={['#6875f5', '#5865f2', '#4752c4']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.btnGrad}
                    >
                      <Text style={styles.btnText}>Set New Password</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={sendCode} disabled={loading}>
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'done' && (
              <>
                <View style={styles.successCard}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={styles.successTitle}>Password changed!</Text>
                  <Text style={styles.successSub}>
                    Use your new password the next time you sign in.
                  </Text>
                </View>

                <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.87}>
                  <LinearGradient
                    colors={['#6875f5', '#5865f2', '#4752c4']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.btnGrad}
                  >
                    <Text style={styles.btnText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
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

  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconBg:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#5865f240' },
  icon:     { fontSize: 36 },

  header:   { marginBottom: 28, alignItems: 'center' },
  title:    { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#555577', marginTop: 8, textAlign: 'center', lineHeight: 22 },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0474712', borderWidth: 1, borderColor: '#f0474730', borderRadius: 14, padding: 14, marginBottom: 20 },
  errorIcon:   { fontSize: 16 },
  errorText:   { color: '#f04747', fontSize: 14, flex: 1, lineHeight: 20 },

  emailBox:   { backgroundColor: '#12122a', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1e1e38' },
  emailLabel: { color: '#555577', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  emailValue: { color: '#e0e0f0', fontSize: 15 },

  form:       { gap: 20, marginBottom: 8 },
  fieldGroup: { gap: 8 },
  label:      { color: '#555577', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e38', paddingHorizontal: 16 },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },
  check:      { color: '#4ade80', fontSize: 16, fontWeight: '700' },

  btn:    { borderRadius: 18, overflow: 'hidden', marginTop: 24 },
  btnOff: { opacity: 0.45 },
  btnGrad:{ paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  btnText:{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  successCard:  { backgroundColor: '#12122a', borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#1e1e38', marginBottom: 8 },
  successIcon:  { fontSize: 40, marginBottom: 4 },
  successTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  successSub:   { color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  resendBtn:  { paddingVertical: 16, alignItems: 'center' },
  resendText: { color: '#5865f2', fontSize: 14, fontWeight: '600' },
});

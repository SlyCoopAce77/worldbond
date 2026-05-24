import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { SERVER_URL } from '../../services/socket';

export default function ForgotPasswordScreen({ onBack, onCodeSent }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleSend() {
    setError('');
    if (!email.trim())        return setError('Enter your email address');
    if (!email.includes('@')) return setError('Enter a valid email address');

    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/api/auth/forgot-password`, {
        email: email.trim().toLowerCase(),
      }, { timeout: 10000 });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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

            <View style={styles.iconWrap}>
              <LinearGradient colors={['#5865f230', '#5865f210']} style={styles.iconBg}>
                <Text style={styles.icon}>🔑</Text>
              </LinearGradient>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                {sent
                  ? `We sent a 6-digit code to\n${email.trim().toLowerCase()}`
                  : "Enter your email and we'll send you a reset code"}
              </Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {sent ? (
              <>
                <View style={styles.successCard}>
                  <Text style={styles.successIcon}>📬</Text>
                  <Text style={styles.successTitle}>Check your inbox</Text>
                  <Text style={styles.successSub}>The code expires in 15 minutes. Check your spam folder if you don't see it.</Text>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => onCodeSent(email.trim().toLowerCase())}
                  activeOpacity={0.87}
                >
                  <LinearGradient
                    colors={['#6875f5', '#5865f2', '#4752c4']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.submitGrad}
                  >
                    <Text style={styles.submitText}>Enter Code →</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={handleSend} disabled={loading}>
                  <Text style={styles.resendText}>{loading ? 'Sending…' : 'Resend code'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email address</Text>
                    <View style={[styles.inputWrap, email.length > 0 && styles.inputWrapFocused]}>
                      <Text style={styles.inputIcon}>✉️</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#3a3a5a"
                        value={email}
                        onChangeText={t => { setEmail(t); setError(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        autoFocus
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, (loading || !email) && styles.submitBtnOff]}
                  onPress={handleSend}
                  disabled={loading || !email}
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
                      <Text style={styles.submitText}>Send Reset Code</Text>
                    </LinearGradient>
                  )}
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

  form:        { gap: 20, marginBottom: 8 },
  fieldGroup:  { gap: 8 },
  label:       { color: '#555577', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e38', paddingHorizontal: 16 },
  inputWrapFocused: { borderColor: '#5865f240' },
  inputIcon:   { fontSize: 16, marginRight: 10 },
  input:       { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },

  submitBtn:    { borderRadius: 18, overflow: 'hidden', marginTop: 24 },
  submitBtnOff: { opacity: 0.45 },
  submitGrad:   { paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  submitText:   { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  successCard:  { backgroundColor: '#12122a', borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#1e1e38', marginBottom: 8 },
  successIcon:  { fontSize: 40, marginBottom: 4 },
  successTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  successSub:   { color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  resendBtn:  { paddingVertical: 16, alignItems: 'center' },
  resendText: { color: '#5865f2', fontSize: 14, fontWeight: '600' },
});

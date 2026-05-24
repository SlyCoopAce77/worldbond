import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { login } from '../../services/authApi';

export default function LoginScreen({ onSuccess, onBack, onGoRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const passwordRef             = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your Bond account</Text>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
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
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotLink}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputWrap, password.length > 0 && styles.inputWrapFocused]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Your password"
                    placeholderTextColor="#3a3a5a"
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.showHide}>
                    <Text style={styles.showHideText}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || !email || !password) && styles.submitBtnOff]}
              onPress={handleLogin}
              disabled={loading || !email || !password}
              activeOpacity={0.87}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={['#6875f5', '#5865f2', '#4752c4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.submitGrad}
                >
                  <Text style={styles.submitText}>Sign In</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to Bond?</Text>
              <TouchableOpacity onPress={onGoRegister}>
                <Text style={styles.footerLink}> Create an account →</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0a0a18' },
  scroll:          { flexGrow: 1, padding: 24, paddingTop: 16 },

  backBtn:         { marginBottom: 28, alignSelf: 'flex-start' },
  backBtnInner:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38', alignItems: 'center', justifyContent: 'center' },
  backIcon:        { color: '#fff', fontSize: 26, lineHeight: 30 },

  header:          { marginBottom: 32 },
  title:           { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle:        { fontSize: 15, color: '#555577', marginTop: 6 },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0474712', borderWidth: 1, borderColor: '#f0474730', borderRadius: 14, padding: 14, marginBottom: 20 },
  errorIcon:       { fontSize: 16 },
  errorText:       { color: '#f04747', fontSize: 14, flex: 1, lineHeight: 20 },

  form:            { gap: 20 },
  fieldGroup:      { gap: 8 },
  labelRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:           { color: '#555577', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  forgotLink:      { color: '#5865f2', fontSize: 13, fontWeight: '600' },

  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e38', paddingHorizontal: 16 },
  inputWrapFocused:{ borderColor: '#5865f240' },
  inputIcon:       { fontSize: 16, marginRight: 10 },
  input:           { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 17 },
  showHide:        { paddingLeft: 8 },
  showHideText:    { color: '#5865f2', fontSize: 13, fontWeight: '700' },

  submitBtn:       { borderRadius: 18, overflow: 'hidden', marginTop: 32 },
  submitBtnOff:    { opacity: 0.45 },
  submitGrad:      { paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  submitText:      { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  divider:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: '#1e1e38' },
  dividerText:     { color: '#2a2a4a', fontSize: 13, fontWeight: '600' },

  footerRow:       { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText:      { color: '#555', fontSize: 15 },
  footerLink:      { color: '#5865f2', fontSize: 15, fontWeight: '700' },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { SERVER_URL } from '../../services/socket';
import { finalizeProfile, getAccessToken } from '../../services/authApi';

const { width } = Dimensions.get('window');

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Other'];

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'ko', flag: '🇰🇷', label: 'Korean' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese' },
  { code: 'th', flag: '🇹🇭', label: 'Thai' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
  { code: 'hi', flag: '🇮🇳', label: 'Hindi' },
  { code: 'id', flag: '🇮🇩', label: 'Indonesian' },
];

const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States' }, { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇹🇭', name: 'Thailand' },      { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇬🇧', name: 'United Kingdom' }, { flag: '🇫🇷', name: 'France' },
  { flag: '🇩🇪', name: 'Germany' },        { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇲🇽', name: 'Mexico' },         { flag: '🇮🇳', name: 'India' },
  { flag: '🇦🇺', name: 'Australia' },      { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇨🇳', name: 'China' },          { flag: '🇿🇦', name: 'South Africa' },
  { flag: '🇳🇬', name: 'Nigeria' },        { flag: '🇮🇩', name: 'Indonesia' },
  { flag: '🇵🇭', name: 'Philippines' },    { flag: '🇻🇳', name: 'Vietnam' },
  { flag: '🇸🇬', name: 'Singapore' },      { flag: '🇲🇾', name: 'Malaysia' },
];

const CONNECTION_TYPES = [
  { key: 'dating',     emoji: '❤️',  color: '#e91e63', title: 'Dating',           desc: 'Looking for a romantic connection' },
  { key: 'friendship', emoji: '🤝',  color: '#2196f3', title: 'Friendship',       desc: 'Make genuine friends worldwide' },
  { key: 'travel',     emoji: '✈️',  color: '#ff9800', title: 'Travel Buddy',     desc: 'Find someone to explore with' },
  { key: 'language',   emoji: '💬',  color: '#9c27b0', title: 'Language Exchange', desc: 'Practice languages with natives' },
  { key: 'mentorship', emoji: '🎓',  color: '#4caf50', title: 'Mentorship',       desc: 'Learn from or guide others' },
];

const TOTAL_STEPS = 4;

const STEP_META = [
  { icon: '👤', title: 'About you',     subtitle: 'How others will see you on Bond' },
  { icon: '🌍', title: 'Where are you?', subtitle: 'Helps us find nearby Bonds' },
  { icon: '🎯', title: 'Why are you here?', subtitle: 'Select all that apply' },
  { icon: '✨', title: 'Your vibe',     subtitle: 'A photo and a line about you goes a long way' },
];

// ─── Step progress bar ────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <View style={bar.container}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[bar.seg, i < step && bar.segOn, i === step - 1 && bar.segActive]} />
      ))}
    </View>
  );
}
const bar = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  seg:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1e1e38' },
  segOn:     { backgroundColor: '#5865f2' },
  segActive: { backgroundColor: '#7c87f5' },
});

export default function OnboardingScreen({ userId, onComplete }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge]                 = useState('');
  const [gender, setGender]           = useState('');

  const [country, setCountry]   = useState(null);
  const [city, setCity]         = useState('');
  const [language, setLanguage] = useState('en');

  const [connectionTypes, setConnectionTypes] = useState([]);

  const [bio, setBio]     = useState('');
  const [photo, setPhoto] = useState(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  function animateStep(next) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  }

  function toggleCT(key) {
    setConnectionTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function goNext() {
    if (step === 1) {
      if (!displayName.trim()) return Alert.alert('Missing', 'Enter a display name');
      const n = parseInt(age, 10);
      if (!age || isNaN(n) || n < 18 || n > 100) return Alert.alert('Missing', 'Enter your age (18+)');
      if (!gender) return Alert.alert('Missing', 'Select your gender');
    }
    if (step === 2 && !country) return Alert.alert('Missing', 'Select your country');
    if (step === 3 && connectionTypes.length === 0) return Alert.alert('Missing', 'Choose at least one reason');
    if (step === TOTAL_STEPS) { handleFinish(); return; }
    animateStep(step + 1);
  }

  function goBack() { animateStep(step - 1); }

  async function pickPhoto() {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.85 });
    if (res.assets?.[0]) {
      const a = res.assets[0];
      setPhoto({ uri: a.uri, type: a.type, name: a.fileName || 'photo.jpg' });
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const token   = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      let photoUrl  = null;

      if (photo) {
        const form = new FormData();
        form.append('photo',    { uri: photo.uri, type: photo.type, name: photo.name });
        form.append('userId',   userId);
        form.append('username', displayName.trim());
        form.append('country',  country.name);
        form.append('language', language);
        try {
          const { data } = await axios.post(`${SERVER_URL}/api/photos/upload`, form, {
            headers: { ...headers, 'Content-Type': 'multipart/form-data' },
            timeout: 20000,
          });
          photoUrl = data.imageUrl;
        } catch {}
      }

      await axios.put(`${SERVER_URL}/api/profiles/me`, {
        display_name:     displayName.trim(),
        age:              parseInt(age, 10),
        gender,
        country:          country.name,
        city:             city.trim() || null,
        language,
        connection_types: connectionTypes,
        bio:              bio.trim() || null,
        photo_url:        photoUrl,
      }, { headers, timeout: 10000 });

      const socketProfile = await finalizeProfile({
        userId,
        display_name:     displayName.trim(),
        language,
        country:          `${country.flag} ${country.name}`,
        connection_types: connectionTypes,
      });

      onComplete(socketProfile);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save profile. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const meta = STEP_META[step - 1];

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Progress */}
          <StepBar step={step} />

          {/* Step header */}
          <Animated.View style={[s.stepHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={s.stepIconBadge}>
              <Text style={s.stepIconText}>{meta.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepCount}>Step {step} of {TOTAL_STEPS}</Text>
              <Text style={s.stepTitle}>{meta.title}</Text>
              <Text style={s.stepSub}>{meta.subtitle}</Text>
            </View>
          </Animated.View>

          {/* Step content */}
          <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* ── Step 1: Identity ─────────────────────────────── */}
            {step === 1 && (
              <View style={s.form}>
                <View style={s.field}>
                  <Text style={s.label}>Display Name</Text>
                  <TextInput
                    style={s.input}
                    placeholder="What should people call you?"
                    placeholderTextColor="#3a3a5a"
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={30}
                  />
                </View>

                <View style={s.row}>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={s.label}>Age</Text>
                    <TextInput
                      style={s.input}
                      placeholder="18+"
                      placeholderTextColor="#3a3a5a"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                  <View style={[s.field, { flex: 2 }]}>
                    <Text style={s.label}>Gender</Text>
                    <View style={s.chipRow}>
                      {GENDERS.map(g => (
                        <TouchableOpacity
                          key={g}
                          style={[s.chip, gender === g && s.chipOn]}
                          onPress={() => setGender(g)}
                        >
                          <Text style={[s.chipText, gender === g && s.chipTextOn]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── Step 2: Location ─────────────────────────────── */}
            {step === 2 && (
              <View style={s.form}>
                <View style={s.field}>
                  <Text style={s.label}>Country</Text>
                  <ScrollView style={s.listBox} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {COUNTRIES.map(c => (
                      <TouchableOpacity
                        key={c.name}
                        style={[s.listItem, country?.name === c.name && s.listItemOn]}
                        onPress={() => setCountry(c)}
                      >
                        <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                        <Text style={[s.listItemText, country?.name === c.name && { color: '#fff', fontWeight: '700' }]}>
                          {c.name}
                        </Text>
                        {country?.name === c.name && <Text style={s.check}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>City <Text style={s.optional}>(optional)</Text></Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. Tokyo, Bangkok, New York"
                    placeholderTextColor="#3a3a5a"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Primary Language</Text>
                  <View style={s.langGrid}>
                    {LANGUAGES.map(l => (
                      <TouchableOpacity
                        key={l.code}
                        style={[s.langChip, language === l.code && s.langChipOn]}
                        onPress={() => setLanguage(l.code)}
                      >
                        <Text style={{ fontSize: 15 }}>{l.flag}</Text>
                        <Text style={[s.langText, language === l.code && { color: '#5865f2', fontWeight: '700' }]}>
                          {l.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── Step 3: Connection types ──────────────────────── */}
            {step === 3 && (
              <View style={s.ctList}>
                {CONNECTION_TYPES.map(ct => {
                  const on = connectionTypes.includes(ct.key);
                  return (
                    <TouchableOpacity
                      key={ct.key}
                      style={[s.ctCard, on && { borderColor: ct.color + '88', backgroundColor: ct.color + '12' }]}
                      onPress={() => toggleCT(ct.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.ctIconWrap, { backgroundColor: ct.color + '20', borderColor: ct.color + '40' }]}>
                        <Text style={{ fontSize: 24 }}>{ct.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.ctTitle, on && { color: '#fff' }]}>{ct.title}</Text>
                        <Text style={s.ctDesc}>{ct.desc}</Text>
                      </View>
                      <View style={[s.ctCheck, on && { backgroundColor: ct.color, borderColor: ct.color }]}>
                        {on && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── Step 4: Bio + Photo ───────────────────────────── */}
            {step === 4 && (
              <View style={s.form}>
                <TouchableOpacity style={s.photoBox} onPress={pickPhoto} activeOpacity={0.85}>
                  {photo ? (
                    <>
                      <Image source={{ uri: photo.uri }} style={s.photoPreview} />
                      <View style={s.photoOverlay}>
                        <Text style={{ fontSize: 22 }}>📷</Text>
                        <Text style={s.photoOverlayText}>Change photo</Text>
                      </View>
                    </>
                  ) : (
                    <LinearGradient colors={['#12122a', '#0a0a18']} style={s.photoPlaceholder}>
                      <Text style={{ fontSize: 44 }}>📷</Text>
                      <Text style={s.photoPlaceholderTitle}>Add a profile photo</Text>
                      <Text style={s.photoPlaceholderSub}>Gets 3× more Bonds</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
                {photo && (
                  <TouchableOpacity onPress={() => setPhoto(null)} style={s.removePhoto}>
                    <Text style={s.removePhotoText}>Remove photo</Text>
                  </TouchableOpacity>
                )}

                <View style={s.field}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>Short Bio</Text>
                    <Text style={s.optional}>{bio.length}/200</Text>
                  </View>
                  <TextInput
                    style={[s.input, s.bioInput]}
                    placeholder="What makes you interesting? A joke, a dream, a quirk..."
                    placeholderTextColor="#3a3a5a"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

          </Animated.View>

          {/* ── Buttons ──────────────────────────────────────────── */}
          <View style={s.btnArea}>
            <TouchableOpacity
              style={[s.nextBtn, loading && { opacity: 0.6 }]}
              onPress={goNext}
              disabled={loading}
              activeOpacity={0.87}
            >
              {loading ? (
                <View style={s.nextGrad}><ActivityIndicator color="#fff" /></View>
              ) : (
                <LinearGradient
                  colors={['#6875f5', '#5865f2', '#4752c4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.nextGrad}
                >
                  <Text style={s.nextText}>
                    {step === TOTAL_STEPS ? 'Enter Bond 🫂' : 'Continue →'}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {step === TOTAL_STEPS && !loading && (
              <TouchableOpacity style={s.skipBtn} onPress={handleFinish}>
                <Text style={s.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}

            {step > 1 && !loading && (
              <TouchableOpacity style={s.backBtn} onPress={goBack}>
                <Text style={s.backText}>‹ Back</Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a0a18' },
  scroll:     { flexGrow: 1, padding: 24, paddingTop: 20, paddingBottom: 50 },

  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 28 },
  stepIconBadge:{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#5865f218', borderWidth: 1, borderColor: '#5865f230', alignItems: 'center', justifyContent: 'center' },
  stepIconText: { fontSize: 26 },
  stepCount:  { color: '#5865f2', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  stepTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  stepSub:    { fontSize: 13, color: '#555577', marginTop: 4 },

  content:    {},

  form:       { gap: 22 },
  row:        { flexDirection: 'row', gap: 14 },
  field:      { gap: 8 },
  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:      { color: '#555577', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  optional:   { color: '#333355', fontSize: 12 },

  input:      { backgroundColor: '#12122a', color: '#fff', fontSize: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e1e38' },
  bioInput:   { minHeight: 110, textAlignVertical: 'top' },

  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  chipOn:     { backgroundColor: '#5865f220', borderColor: '#5865f2' },
  chipText:   { color: '#555577', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#5865f2', fontWeight: '700' },

  listBox:    { backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e38', maxHeight: 220 },
  listItem:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a30' },
  listItemOn: { backgroundColor: '#5865f215' },
  listItemText:{ flex: 1, color: '#aaa', fontSize: 15 },
  check:      { color: '#5865f2', fontSize: 16, fontWeight: '800' },

  langGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  langChipOn: { backgroundColor: '#5865f218', borderColor: '#5865f255' },
  langText:   { color: '#555577', fontSize: 13, fontWeight: '600' },

  ctList:     { gap: 10 },
  ctCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#12122a', borderRadius: 18, borderWidth: 1.5, borderColor: '#1e1e38' },
  ctIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  ctTitle:    { color: '#aaa', fontSize: 16, fontWeight: '700' },
  ctDesc:     { color: '#444', fontSize: 13, marginTop: 2 },
  ctCheck:    { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#1e1e38', alignItems: 'center', justifyContent: 'center' },

  photoBox:       { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e38', borderStyle: 'dashed', height: 200 },
  photoPreview:   { width: '100%', height: '100%', resizeMode: 'cover' },
  photoOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoOverlayText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  photoPlaceholder:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  photoPlaceholderTitle:{ color: '#888', fontSize: 16, fontWeight: '700' },
  photoPlaceholderSub:  { color: '#444', fontSize: 13 },
  removePhoto:    { alignItems: 'center', marginTop: 10 },
  removePhotoText:{ color: '#f04747', fontSize: 14 },

  btnArea:    { marginTop: 32, gap: 6 },
  nextBtn:    { borderRadius: 18, overflow: 'hidden' },
  nextGrad:   { paddingVertical: 19, alignItems: 'center', borderRadius: 18, backgroundColor: '#5865f2' },
  nextText:   { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  skipBtn:    { paddingVertical: 14, alignItems: 'center' },
  skipText:   { color: '#333355', fontSize: 15 },
  backBtn:    { paddingVertical: 12, alignItems: 'center' },
  backText:   { color: '#5865f2', fontSize: 15, fontWeight: '700' },
});

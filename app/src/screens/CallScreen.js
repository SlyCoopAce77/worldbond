import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';

const { width, height } = Dimensions.get('window');

function stringToColor(str = '') {
  const palette = ['#7b5ea7', '#1565c0', '#ad1457', '#2e7d32', '#00838f', '#e65100', '#6a1b9a', '#b71c1c'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Pulsing rings ─────────────────────────────────────────────────────────
function PulseRings({ color, active }) {
  const rings = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
  const opacities = [useRef(new Animated.Value(0.5)).current, useRef(new Animated.Value(0.35)).current, useRef(new Animated.Value(0.2)).current];

  useEffect(() => {
    if (!active) return;
    const anims = rings.map((ring, i) =>
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(i * 500),
            Animated.timing(ring, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
            Animated.timing(ring, { toValue: 1,   duration: 0,    useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(i * 500),
            Animated.timing(opacities[i], { toValue: 0,   duration: 1800, useNativeDriver: true }),
            Animated.timing(opacities[i], { toValue: i === 0 ? 0.5 : i === 1 ? 0.35 : 0.2, duration: 0, useNativeDriver: true }),
          ]),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  if (!active) return null;

  return (
    <View style={pr.wrap}>
      {rings.map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            pr.ring,
            {
              borderColor: color + '88',
              transform: [{ scale: ring }],
              opacity: opacities[i],
            },
          ]}
        />
      ))}
    </View>
  );
}
const pr = StyleSheet.create({
  wrap: { position: 'absolute', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5 },
});

// ─── Control button ────────────────────────────────────────────────────────
function CtrlBtn({ icon, label, on, onPress, danger }) {
  return (
    <TouchableOpacity style={ctrl.wrap} onPress={onPress} activeOpacity={0.75}>
      <View style={[
        ctrl.circle,
        on    && ctrl.circleOn,
        danger && ctrl.circleDanger,
      ]}>
        <Text style={ctrl.icon}>{icon}</Text>
      </View>
      <Text style={ctrl.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const ctrl = StyleSheet.create({
  wrap:         { alignItems: 'center', gap: 8, width: 72 },
  circle:       { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffffff18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff22' },
  circleOn:     { backgroundColor: '#ffffff33', borderColor: '#ffffff55' },
  circleDanger: { backgroundColor: '#e5393533', borderColor: '#e5393555' },
  icon:         { fontSize: 24 },
  label:        { color: '#ffffff99', fontSize: 11, fontWeight: '600' },
});

// ─── Animated dots ─────────────────────────────────────────────────────────
function CallingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(d, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.delay((2 - i) * 200),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff88', opacity: d }} />
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function CallScreen({ route, navigation }) {
  const {
    mode, toSocketId, toName, toPhoto,
    callType = 'voice',
    from, callerName, callerCountry, callerPhoto, offer,
  } = route.params || {};

  const socket = getSocket();

  const [status,    setStatus]    = useState(mode === 'incoming' ? 'incoming' : 'calling');
  const [duration,  setDuration]  = useState(0);
  const [muted,     setMuted]     = useState(false);
  const [speaker,   setSpeaker]   = useState(false);
  const [keypad,    setKeypad]    = useState(false);

  const timerRef  = useRef(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const displayName    = mode === 'incoming' ? callerName    : toName;
  const displayCountry = mode === 'incoming' ? callerCountry : '';
  const displayPhoto   = mode === 'incoming' ? callerPhoto   : toPhoto;
  const avatarColor    = stringToColor(displayName || '');
  const isVideo        = callType === 'video';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    socket.on('call_answered', () => {
      setStatus('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });
    socket.on('call_ended', () => endCall(false));

    return () => {
      socket.off('call_answered');
      socket.off('call_ended');
      clearInterval(timerRef.current);
    };
  }, []);

  function acceptCall() {
    socket.emit('answer_call', { toSocketId: from, answer: 'accepted' });
    setStatus('connected');
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }

  function endCall(notify = true) {
    clearInterval(timerRef.current);
    if (notify) socket.emit('end_call', { toSocketId: mode === 'incoming' ? from : toSocketId });
    navigation.goBack();
  }

  function rejectCall() {
    socket.emit('end_call', { toSocketId: from });
    navigation.goBack();
  }

  const pulsing = status === 'calling' || status === 'incoming';

  return (
    <View style={styles.container}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[avatarColor + 'ff', avatarColor + 'aa', '#000000']}
        locations={[0, 0.4, 1]}
        style={styles.bg}
      />
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ── Top area ── */}
        <View style={styles.top}>
          <Text style={styles.callTypeChip}>
            {isVideo ? '📹  Video Call' : '📞  Voice Call'}
          </Text>
        </View>

        {/* ── Avatar + pulse ── */}
        <View style={styles.avatarSection}>
          <View style={styles.pulseContainer}>
            <PulseRings color={avatarColor} active={pulsing} />
            <View style={[styles.avatarRing, { borderColor: avatarColor + '88' }]}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={[avatarColor, avatarColor + '99']} style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{displayName?.[0]?.toUpperCase() || '?'}</Text>
                </LinearGradient>
              )}
            </View>
          </View>

          <Text style={styles.name}>{displayName || 'Unknown'}</Text>
          {displayCountry ? <Text style={styles.country}>{displayCountry}</Text> : null}

          {/* Status */}
          <View style={styles.statusRow}>
            {status === 'calling' && (
              <>
                <Text style={styles.statusText}>Calling </Text>
                <CallingDots />
              </>
            )}
            {status === 'incoming' && (
              <Text style={styles.statusText}>Incoming {isVideo ? 'video' : 'voice'} call</Text>
            )}
            {status === 'connected' && (
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            )}
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controlsArea}>

          {/* Connected controls */}
          {status === 'connected' && (
            <>
              <View style={styles.ctrlRow}>
                <CtrlBtn icon={muted ? '🔇' : '🎤'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(m => !m)} />
                <CtrlBtn icon={isVideo ? '📹' : '🔊'} label={speaker ? 'Speaker Off' : 'Speaker'} on={speaker} onPress={() => setSpeaker(s => !s)} />
                <CtrlBtn icon="⌨️" label="Keypad" on={keypad} onPress={() => setKeypad(k => !k)} />
                <CtrlBtn icon="💬" label="Message" onPress={() => navigation.goBack()} />
              </View>

              <TouchableOpacity style={styles.endBtn} onPress={() => endCall(true)}>
                <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.endBtnGrad}>
                  <Text style={styles.endBtnIcon}>📵</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Outgoing call controls */}
          {status === 'calling' && (
            <>
              <View style={styles.ctrlRow}>
                <CtrlBtn icon={muted ? '🔇' : '🎤'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(m => !m)} />
                <CtrlBtn icon="🔊" label="Speaker" on={speaker} onPress={() => setSpeaker(s => !s)} />
              </View>
              <TouchableOpacity style={styles.endBtn} onPress={() => endCall(true)}>
                <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.endBtnGrad}>
                  <Text style={styles.endBtnIcon}>📵</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Incoming call controls */}
          {status === 'incoming' && (
            <View style={styles.incomingRow}>
              <View style={styles.incomingBtnWrap}>
                <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
                  <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.incomingBtnGrad}>
                    <Text style={styles.incomingBtnIcon}>📵</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.incomingBtnLabel}>Decline</Text>
              </View>

              <View style={styles.incomingBtnWrap}>
                <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
                  <LinearGradient colors={['#43a047', '#2e7d32']} style={styles.incomingBtnGrad}>
                    <Text style={styles.incomingBtnIcon}>{isVideo ? '📹' : '📞'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.incomingBtnLabel}>Accept</Text>
              </View>
            </View>
          )}

        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },
  bg:              { position: 'absolute', width, height },
  overlay:         { position: 'absolute', width, height, backgroundColor: '#00000066' },

  content:         { flex: 1, paddingHorizontal: 24, paddingBottom: 50 },

  top:             { alignItems: 'center', paddingTop: 64 },
  callTypeChip:    { color: '#ffffffcc', fontSize: 14, fontWeight: '600', backgroundColor: '#ffffff18', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ffffff22' },

  avatarSection:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  pulseContainer:  { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  avatarRing:      { width: 130, height: 130, borderRadius: 65, borderWidth: 3, padding: 4, backgroundColor: '#00000033' },
  avatarImg:       { width: '100%', height: '100%', borderRadius: 58 },
  avatarFallback:  { width: '100%', height: '100%', borderRadius: 58, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:   { color: '#fff', fontSize: 56, fontWeight: '800' },

  name:            { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  country:         { color: '#ffffffaa', fontSize: 15, textAlign: 'center' },

  statusRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText:      { color: '#ffffffaa', fontSize: 15 },
  durationText:    { color: '#fff', fontSize: 22, fontWeight: '300', letterSpacing: 2 },

  controlsArea:    { gap: 28, alignItems: 'center' },
  ctrlRow:         { flexDirection: 'row', gap: 20, justifyContent: 'center' },

  endBtn:          { borderRadius: 40, overflow: 'hidden' },
  endBtnGrad:      { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  endBtnIcon:      { fontSize: 32 },

  incomingRow:     { flexDirection: 'row', gap: 64, justifyContent: 'center' },
  incomingBtnWrap: { alignItems: 'center', gap: 10 },
  rejectBtn:       { borderRadius: 40, overflow: 'hidden' },
  acceptBtn:       { borderRadius: 40, overflow: 'hidden' },
  incomingBtnGrad: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  incomingBtnIcon: { fontSize: 32 },
  incomingBtnLabel:{ color: '#ffffffcc', fontSize: 13, fontWeight: '600' },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { getSocket } from '../services/socket';

export default function CallScreen({ route, navigation }) {
  const { mode, toSocketId, toName, callType, from, callerName, callerCountry, offer } = route.params;
  const [callStatus, setCallStatus] = useState(mode === 'incoming' ? 'incoming' : 'calling');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const timerRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on('call_answered', () => {
      setCallStatus('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });

    socket.on('call_ended', () => {
      endCall(false);
    });

    return () => {
      socket.off('call_answered');
      socket.off('call_ended');
      clearInterval(timerRef.current);
    };
  }, []);

  function acceptCall() {
    socket.emit('answer_call', { toSocketId: from, answer: 'accepted' });
    setCallStatus('connected');
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }

  function endCall(notify = true) {
    clearInterval(timerRef.current);
    if (notify) {
      const target = mode === 'incoming' ? from : toSocketId;
      socket.emit('end_call', { toSocketId: target });
    }
    navigation.goBack();
  }

  function rejectCall() {
    socket.emit('end_call', { toSocketId: from });
    navigation.goBack();
  }

  function formatDuration(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const displayName = mode === 'incoming' ? callerName : toName;
  const displayCountry = mode === 'incoming' ? callerCountry : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.callerName}>{displayName}</Text>
        {displayCountry ? <Text style={styles.callerCountry}>{displayCountry}</Text> : null}
        <Text style={styles.callType}>{callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}</Text>

        <Text style={styles.status}>
          {callStatus === 'incoming' && 'Incoming call...'}
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connected' && formatDuration(duration)}
        </Text>
      </View>

      {callStatus === 'connected' && (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, muted && styles.controlBtnActive]} onPress={() => setMuted(!muted)}>
            <Text style={styles.controlBtnText}>{muted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlBtnLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endCallBtn} onPress={() => endCall(true)}>
            <Text style={styles.endCallIcon}>📵</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, speakerOn && styles.controlBtnActive]} onPress={() => setSpeakerOn(!speakerOn)}>
            <Text style={styles.controlBtnText}>🔊</Text>
            <Text style={styles.controlBtnLabel}>{speakerOn ? 'Speaker Off' : 'Speaker'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {callStatus === 'calling' && (
        <View style={styles.callingActions}>
          <TouchableOpacity style={styles.endCallBtn} onPress={() => endCall(true)}>
            <Text style={styles.endCallIcon}>📵</Text>
          </TouchableOpacity>
        </View>
      )}

      {callStatus === 'incoming' && (
        <View style={styles.incomingActions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
            <Text style={styles.incomingBtnIcon}>📵</Text>
            <Text style={styles.incomingBtnLabel}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
            <Text style={styles.incomingBtnIcon}>📞</Text>
            <Text style={styles.incomingBtnLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#6c63ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  callerName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  callerCountry: { color: '#888', fontSize: 14 },
  callType: { color: '#6c63ff', fontSize: 15, marginTop: 4 },
  status: { color: '#aaa', fontSize: 16, marginTop: 8 },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: 50, paddingHorizontal: 20 },
  controlBtn: { alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 20, padding: 16, minWidth: 80 },
  controlBtnActive: { backgroundColor: '#6c63ff33' },
  controlBtnText: { fontSize: 26 },
  controlBtnLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  endCallIcon: { fontSize: 30 },
  callingActions: { alignItems: 'center', paddingBottom: 60 },
  incomingActions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: 60 },
  rejectBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center' },
  incomingBtnIcon: { fontSize: 28 },
  incomingBtnLabel: { color: '#fff', fontSize: 11, marginTop: 3 },
});

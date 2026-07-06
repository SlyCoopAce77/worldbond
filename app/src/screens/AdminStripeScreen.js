import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SERVER_URL } from '../services/socket';
import { authHeader } from '../utils/apiUtils';

const BOND_PINK = '#FF0080';

function fmtUSD(cents) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminStripeScreen({ navigation }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await authHeader();
      const res = await fetch(`${SERVER_URL}/admin/stripe-health`, { headers });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Could not load.'); return; }
      setData(json);
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const safe = data && data.shortfallCents === 0;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Stripe Health</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={BOND_PINK} />}
      >
        {loading && !data ? (
          <ActivityIndicator color={BOND_PINK} size="large" style={{ marginTop: 60 }} />
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : data ? (
          <>
            <View style={[s.statusPill, safe ? s.statusSafe : s.statusWarn]}>
              <Text style={s.statusTxt}>{safe ? 'FULLY COVERED' : 'SHORTFALL RISK'}</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>Stripe available balance</Text>
              <Text style={s.cardVal}>{fmtUSD(data.stripeAvailableCents)}</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>Worst-case liability</Text>
              <Text style={s.cardVal}>{fmtUSD(data.worstCaseLiabilityCents)}</Text>
              <Text style={s.cardNote}>
                If every user with a positive coin balance cashed out today, at the
                highest possible rate (85%). A real worst-case ceiling, not a prediction.
              </Text>
            </View>

            <View style={[s.card, !safe && s.cardWarn]}>
              <Text style={s.cardLabel}>Shortfall</Text>
              <Text style={[s.cardVal, !safe && { color: '#ff5566' }]}>{fmtUSD(data.shortfallCents)}</Text>
              {!safe && (
                <Text style={s.cardNote}>
                  Consider moving more of your Apple payout into Stripe before creators
                  start requesting cash-outs.
                </Text>
              )}
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>Total coins outstanding</Text>
              <Text style={s.cardVal}>{data.totalCoinsOutstanding.toLocaleString()} BC</Text>
            </View>

            <Text style={s.footNote}>
              Coin purchases come in via Apple IAP, not Stripe — this balance only
              changes when you manually transfer funds into your Stripe account.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#08090d' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  back:       { color: BOND_PINK, fontSize: 16, fontWeight: '700' },
  title:      { color: '#fff', fontSize: 17, fontWeight: '800' },
  scroll:     { padding: 20, gap: 14, paddingBottom: 60 },
  error:      { color: '#ff5566', fontSize: 14, textAlign: 'center', marginTop: 40 },
  statusPill: { alignSelf: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, marginBottom: 6 },
  statusSafe: { backgroundColor: '#22c55e15', borderColor: '#22c55e50' },
  statusWarn: { backgroundColor: '#ff556615', borderColor: '#ff556650' },
  statusTxt:  { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  card:       { backgroundColor: '#12131a', borderRadius: 16, padding: 18, gap: 6, borderWidth: 1, borderColor: '#ffffff0f' },
  cardWarn:   { borderColor: '#ff556640' },
  cardLabel:  { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardVal:    { color: '#fff', fontSize: 26, fontWeight: '900' },
  cardNote:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  footNote:   { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});

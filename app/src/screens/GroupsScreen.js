import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { getSocket } from '../services/socket';

const BOND_PINK = '#FF0080';

function CategoryCard({ category, onPress }) {
  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={c.icon}>{category.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={c.name}>{category.name}</Text>
        <Text style={c.desc} numberOfLines={1}>{category.description}</Text>
        <Text style={c.rooms}>{category.rooms.length} rooms</Text>
      </View>
      <Text style={c.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const c = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#12131a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#ffffff0f' },
  icon:    { fontSize: 26 },
  name:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  desc:    { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  rooms:   { color: BOND_PINK, fontSize: 11, fontWeight: '700', marginTop: 4 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 22, fontWeight: '300' },
});

function RoomRow({ label, onPress }) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.8}>
      <Text style={r.hash}>#</Text>
      <Text style={r.label}>{label.replace(/-/g, ' ')}</Text>
      <Text style={r.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#ffffff0a' },
  hash:    { color: BOND_PINK, fontSize: 16, fontWeight: '900' },
  label:   { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20, fontWeight: '300' },
});

export default function GroupsScreen({ navigation, route }) {
  const user = route?.params?.currentUser || route?.params?.user || null;
  const socket = getSocket();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    function onList(list) { setCategories(list || []); }
    socket.on('group_list', onList);
    if (socket.connected) socket.emit('get_groups');
    else socket.once('connect', () => socket.emit('get_groups'));
    return () => socket.off('group_list', onList);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => activeCategory ? setActiveCategory(null) : navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={s.back}>‹ {activeCategory ? 'Categories' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{activeCategory ? activeCategory.name : 'Groups'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {categories.length === 0 ? (
        <ActivityIndicator color={BOND_PINK} size="large" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {activeCategory ? (
            activeCategory.rooms.map(room => (
              <RoomRow
                key={room}
                label={room}
                onPress={() => navigation.navigate('GroupChat', {
                  categoryId: activeCategory.id,
                  categoryName: activeCategory.name,
                  roomName: room,
                  currentUser: user,
                })}
              />
            ))
          ) : (
            categories.map(cat => (
              <CategoryCard key={cat.id} category={cat} onPress={() => setActiveCategory(cat)} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08090d' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  back:      { color: BOND_PINK, fontSize: 15, fontWeight: '700', width: 90 },
  title:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});

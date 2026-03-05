import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchExpenses } from '../api/expenses';
import { Expense } from '../types';
import { COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function HomeScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setExpenses(await fetchExpenses()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo  = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const monthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const sum = (list: Expense[]) => list.reduce((a, e) => a + e.amount, 0);
  const todayAmt = sum(expenses.filter(e => e.created_at.startsWith(todayStr)));
  const weekAmt  = sum(expenses.filter(e => e.created_at >= weekAgo));
  const monthAmt = sum(expenses.filter(e => e.created_at >= monthStr));

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greet}>Good {greet} 👋</Text>
            <Text style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Add')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={s.cards}>
          {[
            { label: 'Today',      amount: todayAmt, color: COLORS.primary },
            { label: 'This Week',  amount: weekAmt,  color: COLORS.success },
            { label: 'This Month', amount: monthAmt, color: COLORS.warning },
          ].map(c => (
            <View key={c.label} style={[s.card, { borderTopColor: c.color }]}>
              <Text style={[s.cardAmt, { color: c.color }]}>{fmt(c.amount)}</Text>
              <Text style={s.cardLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent */}
        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('List')}>
              <Text style={{ color: COLORS.primary, fontSize: 13 }}>See all</Text>
            </TouchableOpacity>
          </View>
          {expenses.length === 0
            ? <Text style={s.empty}>No expenses yet. Tap + to add one!</Text>
            : expenses.slice(0, 6).map(e => <ExpenseRow key={e.id} expense={e} />)
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExpenseRow({ expense: e }: { expense: Expense }) {
  const icon = (CATEGORY_ICONS[e.category] ?? 'ellipsis-horizontal') as any;
  const color = CATEGORY_COLORS[e.category] ?? '#95A5A6';
  return (
    <View style={s.eRow}>
      <View style={[s.eIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={s.eInfo}>
        <Text style={s.eMerchant}>{e.merchant || e.description}</Text>
        <Text style={s.eCat}>{e.category}</Text>
      </View>
      <Text style={s.eAmt}>{fmt(e.amount)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greet:  { fontSize: 20, fontWeight: '700', color: COLORS.text },
  date:   { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cards:  { flexDirection: 'row', gap: 10, marginBottom: 24 },
  card:   { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, borderTopWidth: 3, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardAmt:   { fontSize: 15, fontWeight: '700' },
  cardLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  section:   { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  empty:   { color: COLORS.muted, textAlign: 'center', paddingVertical: 20 },
  eRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  eIcon:   { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  eInfo:   { flex: 1 },
  eMerchant: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  eCat:      { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  eAmt:      { fontSize: 15, fontWeight: '700', color: COLORS.text },
});
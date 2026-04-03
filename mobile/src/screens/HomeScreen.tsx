import React, { useState, useCallback, useRef } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  addExpenseNL,
  fetchExpenses,
  deleteExpense,
} from "../api/expenses";


import { COLORS,  CATEGORY_COLORS,CATEGORY_EMOJI } from "../constants";


import {Expense} from "../types/index"


const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function relativeTime(raw: string): string {
  // SQLite returns "YYYY-MM-DD HH:mm:ss" (UTC) — normalise to ISO
  const ms = Date.now() - new Date(raw.replace(" ", "T") + "Z").getTime();
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(ms / 86_400_000);
  if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (h > 0) return `${h} hr${h > 1 ? "s" : ""} ago`;
  if (m > 0) return `${m} min${m > 1 ? "s" : ""} ago`;
  return "Just now";
}

// ── sub-components ────────────────────────────────────────────────────────────

interface SuccessCardProps {
  expense: Expense;
}
function SuccessCard({ expense: e }: SuccessCardProps) {
  return (
    <View style={s.successCard}>
      <Text style={s.successTitle}>✅ Added Successfully!</Text>
      <View style={s.successRow}>
        <Text style={s.successLabel}>Amount</Text>
        <Text style={s.successValue}>{fmt(e.amount)}</Text>
      </View>
      <View style={s.successRow}>
        <Text style={s.successLabel}>Category</Text>
        <Text style={s.successValue}>
          {CATEGORY_EMOJI[e.category] ?? "📦"} {e.category}
        </Text>
      </View>
      <View style={s.successRow}>
        <Text style={s.successLabel}>Description</Text>
        <Text style={s.successValue}>{e.description}</Text>
      </View>
      {e.merchant && (
        <View style={s.successRow}>
          <Text style={s.successLabel}>Merchant</Text>
          <Text style={s.successValue}>{e.merchant}</Text>
        </View>
      )}
    </View>
  );
}

interface ExpenseItemProps {
  expense: Expense;
  onDelete: (id: number) => void;
  deleting: boolean;
}
function ExpenseItem({ expense: e, onDelete, deleting }: ExpenseItemProps) {
  const emoji = CATEGORY_EMOJI[e.category] ?? "📦";
  const color = CATEGORY_COLORS[e.category] ?? "#95A5A6";

  const confirmDelete = () =>
    Alert.alert(
      "Delete expense?",
      `${emoji} ${e.description} — ${fmt(e.amount)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(e.id) },
      ],
    );

  return (
    <View style={s.item}>
      {/* Left icon */}
      <View style={[s.itemIcon, { backgroundColor: color + "22" }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>

      {/* Middle info */}
      <View style={s.itemInfo}>
        <Text style={s.itemCategory}>{e.category}</Text>
        <Text style={s.itemDesc} numberOfLines={1}>
          {e.description}
        </Text>
        <Text style={s.itemTime}>{relativeTime(e.created_at)}</Text>
      </View>

      {/* Right: amount + delete */}
      <View style={s.itemRight}>
        <Text style={s.itemAmt}>{fmt(e.amount)}</Text>
        {deleting ? (
          <ActivityIndicator
            size="small"
            color={COLORS.danger}
            style={{ marginTop: 6 }}
          />
        ) : (
          <TouchableOpacity
            onPress={confirmDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={COLORS.danger}
              style={{ marginTop: 6 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function AddScreen() {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const successTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // ── data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setExpenses(await fetchExpenses());
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load expenses.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // ── add expense ─────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const expense = await addExpenseNL(text);
      setInput("");
      setExpenses((prev) => [expense, ...prev]);

      // Show success card for 3 s
      setLastAdded(expense);
      successTimer?.current && clearTimeout(successTimer?.current);
      successTimer.current = setTimeout(() => setLastAdded(null), 3000);
    } catch (e: any) {
      Alert.alert(
        "Could not add expense",
        e?.message ?? "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete expense ──────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    // Optimistic: remove immediately
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      await deleteExpense(id);
    } catch (e: any) {
      // Restore on failure
      Alert.alert("Delete failed", e?.message ?? "Could not delete expense.");
      load(); // refetch to restore correct state
    } finally {
      setDeletingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <View>
              {/* ── Header ── */}
              <View style={s.header}>
                <Text style={s.title}>AI Expense Tracker</Text>
                <Text style={s.subtitle}>Add expenses in plain English</Text>
              </View>

              {/* ── Input section ── */}
              <View style={s.inputCard}>
                <TextInput
                  style={s.textInput}
                  placeholder="e.g., Spent 500 on groceries at BigBazaar"
                  placeholderTextColor={COLORS.muted}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  editable={!submitting}
                  multiline={false}
                />
                <TouchableOpacity
                  style={[
                    s.addBtn,
                    (!input.trim() || submitting) && s.addBtnDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!input.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="add" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* ── Success card ── */}
              {lastAdded && <SuccessCard expense={lastAdded} />}

              {/* ── List header ── */}
              <Text style={s.sectionTitle}>Recent Expenses</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🧾</Text>
              <Text style={s.emptyText}>No expenses yet.</Text>
              <Text style={s.emptyHint}>Add your first one above!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onDelete={handleDelete}
              deleting={deletingIds.has(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, paddingBottom: 40 },

  // header
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },

  // input
  inputCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.45 },

  // success card
  successCard: {
    backgroundColor: "#EAFAF1",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E8449",
    marginBottom: 8,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  successLabel: { fontSize: 13, color: COLORS.muted },
  successValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 8,
  },

  // section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },

  // expense item
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemCategory: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  itemDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  itemTime: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  itemRight: { alignItems: "flex-end", minWidth: 64 },
  itemAmt: { fontSize: 15, fontWeight: "800", color: COLORS.text },

  separator: { height: 10 },

  // empty state
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
});

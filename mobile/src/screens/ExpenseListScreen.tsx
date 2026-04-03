import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fetchExpenses, deleteExpense } from "../api/expenses";
import { Expense } from "../types";
import {
  COLORS,
  
  CATEGORY_COLORS,
  CATEGORIES,
  CATEGORY_EMOJI,
} from "../constants";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ExpenseListScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      setExpenses(await fetchExpenses());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = expenses.filter((e) => {
    const matchCat = filter === "All" || e.category === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.merchant.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleDelete = (id: number) => {
    Alert.alert("Delete", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(id);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Expenses</Text>
        <Text style={s.count}>{filtered.length} entries</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons
          name="search"
          size={16}
          color={COLORS.muted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={s.searchInput}
          placeholder="Search merchant or description..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["All", ...CATEGORIES]}
        keyExtractor={(i) => i}
        contentContainerStyle={s.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, filter === item && s.chipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[s.chipTxt, filter === item && s.chipTxtActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No expenses found.</Text>}
          renderItem={({ item: e }) => {
           
            const emoji = CATEGORY_EMOJI[e.category] ?? "📦";

            const color = CATEGORY_COLORS[e.category] ?? "#95A5A6";
            const dt = new Date(e.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
            return (
              <View style={s.item}>
                <View style={[s.icon, { backgroundColor: color + "22" }]}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                <View style={s.info}>
                  <Text style={s.merchant}>{e.merchant || e.description}</Text>
                  <Text style={s.cat}>
                    {e.category} · {dt}
                  </Text>
                </View>
                <Text style={s.amt}>{fmt(e.amount)}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(e.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.danger}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  count: { fontSize: 13, color: COLORS.muted },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  chips: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipTxt: { fontSize: 12, color: COLORS.muted, fontWeight: "500" },
  chipTxtActive: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: "center", color: COLORS.muted, marginTop: 40 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  icon: {
    
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  merchant: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  cat: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  amt: { fontSize: 15, fontWeight: "700", color: COLORS.text },
});

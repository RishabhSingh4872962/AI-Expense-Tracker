import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { addExpenseNL, addExpenseManual } from "../api/expenses";
import {
  COLORS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORIES,
} from "../constants";

type Tab = "smart" | "manual";

export default function AddExpenseScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>("smart");

  // Smart input state
  const [nlInput, setNlInput] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  // Manual input state
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [manLoading, setManLoading] = useState(false);

  useEffect(() => {
    setPreview(null);
  }, []);

  const handleSmartParse = async () => {
    if (!nlInput.trim()) return;
    setNlLoading(true);
    try {
      Keyboard.dismiss();
      const expense = await addExpenseNL(nlInput.trim());
      setPreview(expense);
      setNlInput("");

      setTimeout(() => {
        setPreview(null);
      }, 3000);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setNlLoading(false);
    }
  };

  const handleSmartConfirm = () => {
    Alert.alert("Saved!", `₹${preview.amount} at ${preview.merchant} saved.`, [
      {
        text: "Add Another",
        onPress: () => {
          setNlInput("");
          setPreview(null);
        },
      },
      { text: "Done", onPress: () => navigation.navigate("Home") },
    ]);
  };

  const handleManual = async () => {
    if (!amount || isNaN(Number(amount)))
      return Alert.alert("Enter a valid amount");
    setManLoading(true);
    try {
      await addExpenseManual({
        amount: Number(amount),
        currency: "INR",
        category,
        description: desc,
        merchant,
      });
      Alert.alert("Saved!", "Expense added.", [
        {
          text: "Add Another",
          onPress: () => {
            setAmount("");
            setMerchant("");
            setDesc("");
          },
        },
        { text: "Done", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setManLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.title}>Add Expense</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {(["smart", "manual"] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                  {t === "smart" ? "✨ Smart Input" : "📝 Manual"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Smart Tab */}
          {tab === "smart" && (
            <View style={s.card}>
              <Text style={s.hint}>Describe your expense in plain English</Text>
              <TextInput
                style={s.nlInput}
                placeholder="e.g. spent 850 on lunch at Taj"
                placeholderTextColor={COLORS.muted}
                value={nlInput}
                onChangeText={(t) => {
                  setNlInput(t);
                  setPreview(null);
                }}
                multiline
              />
              <TouchableOpacity
                style={s.btn}
                onPress={handleSmartParse}
                disabled={nlLoading || !nlInput.trim()}
              >
                {nlLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnTxt}>Parse & Save</Text>
                )}
              </TouchableOpacity>

              {/* Preview */}
              {preview && (
                <View style={s.preview}>
                  <Text style={s.previewTitle}>✅ Parsed Successfully</Text>
                  {[
                    ["Amount", `₹${preview.amount}`],
                    ["Merchant", preview.merchant],
                    ["Category", preview.category],
                    ["Description", preview.description],
                  ].map(([k, v]) => (
                    <View key={k} style={s.previewRow}>
                      <Text style={s.previewKey}>{k}</Text>
                      <Text style={s.previewVal}>{v}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[
                      s.btn,
                      { backgroundColor: COLORS.success, marginTop: 12 },
                    ]}
                    onPress={handleSmartConfirm}
                  >
                    <Text style={s.btnTxt}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Manual Tab */}
          {tab === "manual" && (
            <View style={s.card}>
              <Field
                label="Amount (₹)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
              />
              <Field
                label="Merchant"
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Zomato, Amazon"
              />
              <Field
                label="Description"
                value={desc}
                onChangeText={setDesc}
                placeholder="e.g. Lunch, Groceries"
              />

              <Text style={s.label}>Category</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.catChip, category === c && s.catChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[s.catTxt, category === c && s.catTxtActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={s.btn}
                onPress={handleManual}
                disabled={manLoading}
              >
                {manLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnTxt}>Save Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor={COLORS.muted}
        {...props}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabTxt: { fontSize: 14, color: COLORS.muted, fontWeight: "500" },
  tabTxtActive: { color: COLORS.primary, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  hint: { color: COLORS.muted, fontSize: 13, marginBottom: 10 },
  nlInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  preview: {
    marginTop: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  previewKey: { color: COLORS.muted, fontSize: 13 },
  previewVal: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  catChipActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  catTxt: { fontSize: 12, color: COLORS.muted },
  catTxtActive: { color: COLORS.primary, fontWeight: "600" },
});

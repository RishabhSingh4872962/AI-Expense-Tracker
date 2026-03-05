import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { fetchExpenses } from "../api/expenses";
import { Expense } from "../types";
import  { COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

const W = Dimensions.get("window").width - 32;
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (o = 1) => `rgba(108,99,255,${o})`,
  labelColor: () => COLORS.muted,
  propsForLabels: { fontSize: 11 },
};

export default function AnalyticsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setExpenses(await fetchExpenses());
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .slice(0, 10);
  const thisMonth = expenses.filter((e) => e.created_at >= monthStart);
  const total = thisMonth.reduce((a, e) => a + e.amount, 0);

  // Category breakdown for pie chart
  const catMap: Record<string, number> = {};
  thisMonth.forEach((e) => {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
  });
  const pieData = Object.entries(catMap).map(([name, population]) => ({
    name: name.split(" ")[0],
    population,
    color: CATEGORY_COLORS[name] ?? "#95A5A6",
    legendFontColor: COLORS.muted,
    legendFontSize: 12,
  }));

  // Daily spending last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      key: d.toISOString().slice(0, 10),
    };
  });
  const barData = {
    labels: days.map((d) => d.label),
    datasets: [
      {
        data: days.map((d) =>
          expenses
            .filter((e) => e.created_at.startsWith(d.key))
            .reduce((a, e) => a + e.amount, 0),
        ),
      },
    ],
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Analytics</Text>
        <Text style={s.sub}>This Month</Text>

        {/* Total */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Total Spent</Text>
          <Text style={s.totalAmt}>{fmt(total)}</Text>
          <Text style={s.totalCount}>{thisMonth.length} transactions</Text>
        </View>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={W}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>
        )}

        {/* Bar Chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Daily Spending (Last 7 Days)</Text>
          <BarChart
            data={barData}
            width={W - 16}
            height={200}
            chartConfig={chartConfig}
            fromZero
            style={{ borderRadius: 12 }}
            yAxisLabel="₹"
            yAxisSuffix=""
          />
        </View>

        {/* Category breakdown list */}
        {Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => (
            <View key={cat} style={s.catRow}>
              <View
                style={[
                  s.dot,
                  { backgroundColor: CATEGORY_COLORS[cat] ?? "#95A5A6" },
                ]}
              />
              <Text style={s.catName}>{cat}</Text>
              <View style={s.barWrap}>
                <View
                  style={[
                    s.barFill,
                    {
                      width: `${(amt / total) * 100}%` as any,
                      backgroundColor: CATEGORY_COLORS[cat] ?? "#95A5A6",
                    },
                  ]}
                />
              </View>
              <Text style={s.catAmt}>{fmt(amt)}</Text>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.muted, marginTop: 2, marginBottom: 16 },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  totalAmt: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 4,
  },
  totalCount: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catName: { fontSize: 13, color: COLORS.text, width: 110 },
  barWrap: {
    flex: 1,
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 3 },
  catAmt: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    width: 70,
    textAlign: "right",
  },
});

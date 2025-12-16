// app/(tabs)/reports.tsx
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useStore } from "@/context/AppContext";
import { ui } from "@/styles/ui";
import { generateReport } from "@/utils/pdfGenerator";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportCardProps = {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  suffix?: string;
};

function ReportCard({ title, value, icon, color, suffix }: ReportCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText type="subtitle" style={[styles.cardValue, { color }]}>
          {typeof value === "number" ? value.toLocaleString() : value}{" "}
          {suffix ?? ""}
        </ThemedText>
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const { products, transactions } = useStore();

  const inventoryValue = products.reduce(
    (sum, p) => sum + p.stock * (p.salePrice ?? p.price ?? 0),
    0
  );

  const acceptanceTransactions = transactions.filter(
    (t) => t.type === "acceptance"
  );
  const salesTransactions = transactions.filter((t) => t.type === "sale");

  const totalAcceptances = acceptanceTransactions.length;
  const totalSales = salesTransactions.length;

  const totalAcceptanceValue = acceptanceTransactions.reduce(
    (sum, t) => sum + t.total,
    0
  );
  const totalSalesValue = salesTransactions.reduce(
    (sum, t) => sum + t.total,
    0
  );

  const netProfit = totalSalesValue - totalAcceptanceValue;

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <View style={ui.container}>
        <View style={ui.header}>
          <ThemedText type="title" style={ui.title}>
            Hisobotlar
          </ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.sectionTitle}>
            Umumiy statistika
          </ThemedText>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <ReportCard
                title="Qabul soni"
                value={totalAcceptances}
                icon="download-outline"
                color={Colors.light.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ReportCard
                title="Sotuv soni"
                value={totalSales}
                icon="cart-outline"
                color={Colors.light.success}
              />
            </View>
          </View>

          <ThemedText
            style={[styles.sectionTitle, { marginTop: 18 }]}
          >
            Moliyaviy ko'rsatkichlar
          </ThemedText>

          <View style={{ gap: 12 }}>
            <ReportCard
              title="Umumiy qabul"
              value={totalAcceptanceValue}
              icon="download-outline"
              color={Colors.light.info}
              suffix="so'm"
            />
            <ReportCard
              title="Umumiy sotuv"
              value={totalSalesValue}
              icon="cash-outline"
              color={Colors.light.success}
              suffix="so'm"
            />
            <ReportCard
              title="Sof foyda (sotuv - qabul)"
              value={netProfit}
              icon="trending-up-outline"
              color={netProfit >= 0 ? Colors.light.success : Colors.light.error}
              suffix="so'm"
            />
            <ReportCard
              title="Ombor qiymati (sotuv narxi bo'yicha)"
              value={inventoryValue}
              icon="cube-outline"
              color="#7C4DFF"
              suffix="so'm"
            />
          </View>

          <ThemedButton
            style={styles.pdfButton}
            onPress={() => generateReport(products, transactions)}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            PDF Hisobotni Yuklash
          </ThemedButton>

          <ThemedText style={styles.hint}>
            * Foyda oddiy hisob: umumiy sotuv minus umumiy qabul.
          </ThemedText>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderColor: "#f2f2f2",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  pdfButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});

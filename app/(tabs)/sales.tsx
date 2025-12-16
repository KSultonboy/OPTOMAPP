// app/(tabs)/sales.tsx
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Product, useStore } from "@/context/AppContext";
import { printReceipt } from "@/services/printer";
import { ui } from "@/styles/ui";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProductRow = {
  id: string;
  product: Product | null;
  quantity: string;
  price: string;
};

function parsePositive(v: string) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
function getSalePrice(p: Product) {
  return p.salePrice ?? p.price ?? 0;
}
function getAcceptancePrice(p: Product) {
  return p.acceptancePrice ?? p.price ?? 0;
}

export default function SalesScreen() {
  const { products, sellStock } = useStore();

  const [rows, setRows] = useState<ProductRow[]>([
    { id: "1", product: null, quantity: "", price: "" },
  ]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string>("");

  const addRow = () =>
    setRows((r) => [
      ...r,
      { id: Date.now().toString(), product: null, quantity: "", price: "" },
    ]);

  const removeRow = (id: string) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));

  const updateRow = (id: string, patch: Partial<ProductRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const selectProduct = (rowId: string, p: Product) => {
    const sale = getSalePrice(p);
    updateRow(rowId, { product: p, price: String(sale) });
    setPickerOpen(false);
  };

  const total = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const q = parsePositive(r.quantity) ?? 0;
        const p = parsePositive(r.price) ?? 0;
        return sum + q * p;
      }, 0),
    [rows]
  );

  const canSubmit = rows.some(
    (r) => r.product && r.quantity && r.price
  );

  const handleSell = async () => {
    // Validate
    for (const r of rows) {
      if (!r.product && !r.quantity && !r.price) continue;
      if (!r.product)
        return Alert.alert("Xato", "Mahsulot tanlanmagan qator bor");

      const q = parsePositive(r.quantity);
      const p = parsePositive(r.price);

      if (!q) return Alert.alert("Xato", "Miqdor noto'g'ri");
      if (!p) return Alert.alert("Xato", "Sotuv narxi noto'g'ri");

      if (r.product.stock < q) {
        return Alert.alert(
          "Yetarli emas",
          `${r.product.name} zaxirada ${r.product.stock} dona, siz ${q} dona sotmoqchisiz`
        );
      }
    }

    try {
      for (const r of rows) {
        if (!r.product) continue;
        if (!r.quantity || !r.price) continue;

        const q = parsePositive(r.quantity)!;
        const p = parsePositive(r.price)!;

        const ok = await sellStock(r.product.id, q, p);
        if (!ok) {
          return Alert.alert("Xato", `${r.product.name} sotishda xatolik`);
        }
      }

      // Reset form and notify
      setRows([{ id: "1", product: null, quantity: "", price: "" }]);
      Alert.alert("Muvaffaqiyatli", "Sotuv saqlandi");

      // Prepare receipt and attempt to print (best-effort; failures won't block the flow)
      try {
        const saleItems = rows
          .filter((r) => r.product && r.quantity && r.price)
          .map((r) => ({
            name: r.product!.name,
            quantity: parsePositive(r.quantity) ?? 0,
            price: parsePositive(r.price) ?? 0,
            total:
              (parsePositive(r.quantity) ?? 0) * (parsePositive(r.price) ?? 0),
          }));

        const printed = await printReceipt(saleItems, total);
        if (!printed) {
          Alert.alert(
            "Eslatma",
            "Chek chop etilmadi — printer topilmadi yoki xato yuz berdi"
          );
        }
      } catch (e) {
        // Swallow any printing error for now but we could log it
      }
    } catch {
      Alert.alert("Xato", "Sotishda xatolik yuz berdi");
    }
  };

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <View style={{ flex: 1 }}>
        <View style={[ui.header, { paddingHorizontal: 20 }]}>
          <ThemedText type="title" style={ui.title}>
            Sotuv
          </ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
          <ThemedText style={styles.sectionTitle}>Mahsulotlar</ThemedText>

          {rows.map((r, idx) => {
            const rowTotal =
              (parsePositive(r.quantity) ?? 0) *
              (parsePositive(r.price) ?? 0);

            return (
              <View key={r.id} style={styles.rowCard}>
                <View style={styles.rowHeader}>
                  <ThemedText style={styles.rowNo}>
                    {idx + 1}-mahsulot
                  </ThemedText>
                  {rows.length > 1 && (
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => removeRow(r.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={Colors.light.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <ThemedText style={ui.label}>Nomi</ThemedText>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setActiveRowId(r.id);
                    setPickerOpen(true);
                  }}
                >
                  <ThemedText
                    style={!r.product ? { color: "#999" } : undefined}
                  >
                    {r.product ? r.product.name : "Mahsulotni tanlang"}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color="#666" />
                </TouchableOpacity>

                <View style={{ height: 12 }} />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={ui.label}>Miqdor</ThemedText>
                    <TextInput
                      style={ui.input}
                      value={r.quantity}
                      onChangeText={(t) =>
                        updateRow(r.id, { quantity: t })
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={ui.label}>Sotuv narxi (so'm)</ThemedText>
                    <TextInput
                      style={ui.input}
                      value={r.price}
                      onChangeText={(t) => updateRow(r.id, { price: t })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.rowTotal}>
                  <ThemedText style={{ color: "#666", fontWeight: "700" }}>
                    Jami:
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: Colors.light.success,
                      fontWeight: "900",
                    }}
                  >
                    {rowTotal.toLocaleString()} so'm
                  </ThemedText>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.addRow} onPress={addRow}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.light.primary}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={styles.addRowText}>
              Qator qo'shish
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.summary}>
            <ThemedText style={styles.summaryLabel}>
              Umumiy summa:
            </ThemedText>
            <ThemedText
              type="subtitle"
              style={styles.summaryAmount}
            >
              {total.toLocaleString()} so'm
            </ThemedText>
          </View>

          <ThemedButton
            style={[
              styles.sellBtn,
              !canSubmit && styles.disabled,
            ]}
            onPress={handleSell}
            disabled={!canSubmit}
          >
            Sotishni tasdiqlash
          </ThemedButton>
        </View>

        {/* Mahsulot tanlash modal */}
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setPickerOpen(false)}
          >
            <View style={styles.picker}>
              <View style={styles.pickerHeader}>
                <ThemedText type="subtitle">Mahsulot tanlash</ThemedText>
                <TouchableOpacity onPress={() => setPickerOpen(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={products}
                keyExtractor={(i) => i.id}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: "#f2f2f2" }} />
                )}
                renderItem={({ item }) => {
                  const ap = getAcceptancePrice(item);
                  const sp = getSalePrice(item);

                  return (
                    <TouchableOpacity
                      style={styles.item}
                      onPress={() => selectProduct(activeRowId, item)}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText
                          style={{ fontWeight: "800" }}
                        >
                          {item.name}
                        </ThemedText>
                        <ThemedText
                          style={{ color: "#888", fontSize: 12 }}
                        >
                          Zaxira: {item.stock} dona
                        </ThemedText>
                        <ThemedText
                          style={{ color: "#888", fontSize: 12 }}
                        >
                          Qabul: {ap.toLocaleString()} so'm
                        </ThemedText>
                        <ThemedText
                          style={{ color: "#888", fontSize: 12 }}
                        >
                          Sotuv: {sp.toLocaleString()} so'm
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={{
                          fontWeight: "900",
                          color: Colors.light.primary,
                        }}
                      >
                        {sp.toLocaleString()} so'm
                      </ThemedText>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12,
    color: "#666",
    fontSize: 14,
    fontWeight: "800",
  },
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f2f2f2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rowNo: {
    fontWeight: "800",
    color: Colors.light.primary,
    fontSize: 13,
  },
  trashBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#fff0f0",
  },
  dropdown: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  rowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
  },
  addRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 14,
    borderStyle: "dashed",
    backgroundColor: "#f8f4ff",
  },
  addRowText: {
    color: Colors.light.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
  },
  summaryAmount: {
    fontSize: 18,
    color: Colors.light.primary,
    fontWeight: "900",
  },
  sellBtn: {
    backgroundColor: Colors.light.success,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  disabled: {
    backgroundColor: "#ccc",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "70%",
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  item: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

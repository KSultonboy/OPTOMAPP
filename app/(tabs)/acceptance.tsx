// app/(tabs)/acceptance.tsx
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { Product, useStore } from "@/context/AppContext";
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

function parsePositive(v: string) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getAcceptancePrice(p: Product) {
  return p.acceptancePrice ?? p.price ?? 0;
}
function getSalePrice(p: Product) {
  return p.salePrice ?? p.price ?? 0;
}

export default function AcceptanceScreen() {
  const { products, addStock, transactions } = useStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const total = useMemo(() => {
    const q = parsePositive(qty) ?? 0;
    const p = parsePositive(price) ?? 0;
    return q * p;
  }, [qty, price]);

  const recent = useMemo(
    () => transactions.filter((t) => t.type === "acceptance").slice(0, 5),
    [transactions]
  );

  const submit = async () => {
    if (!selectedProduct) return Alert.alert("Xato", "Mahsulot tanlang");
    const q = parsePositive(qty);
    const p = parsePositive(price);
    if (!q) return Alert.alert("Xato", "Miqdor noto'g'ri");
    if (!p) return Alert.alert("Xato", "Qabul narxi noto'g'ri");

    try {
      await addStock(selectedProduct.id, q, p, notes.trim() || undefined);
      setSelectedProduct(null);
      setQty("");
      setPrice("");
      setNotes("");
      Alert.alert("Saqlandi", "Qabul muvaffaqiyatli kiritildi");
    } catch {
      Alert.alert("Xato", "Qabul qilishda xatolik yuz berdi");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <View style={ui.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={ui.header}>
            <ThemedText type="title" style={ui.title}>
              Qabul qilish
            </ThemedText>
          </View>

          <View style={ui.card}>
            <ThemedText style={ui.label}>Mahsulot</ThemedText>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setPickerOpen(true)}
            >
              <ThemedText style={!selectedProduct ? { color: "#999" } : undefined}>
                {selectedProduct ? selectedProduct.name : "Mahsulotni tanlang"}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={ui.label}>Miqdor</ThemedText>
                <TextInput
                  style={ui.input}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={ui.label}>Qabul narxi (so'm)</ThemedText>
                <TextInput
                  style={ui.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={{ height: 12 }} />

            <ThemedText style={ui.label}>Umumiy summa</ThemedText>
            <ThemedText
              type="subtitle"
              style={[styles.total, { color: Colors.light.info }]}
            >
              {total.toLocaleString()} so'm
            </ThemedText>

            <View style={{ height: 12 }} />

            <ThemedText style={ui.label}>Izoh (ixtiyoriy)</ThemedText>
            <TextInput
              style={[ui.input, { minHeight: 90, textAlignVertical: "top" }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Qo'shimcha izoh..."
              placeholderTextColor="#999"
              multiline
            />

            <View style={{ height: 14 }} />

            <ThemedButton
              style={{ backgroundColor: Colors.light.success, borderRadius: 14, paddingVertical: 14 }}
              onPress={submit}
              disabled={!selectedProduct || !qty || !price}
            >
              Saqlash
            </ThemedButton>
          </View>

          {!!recent.length && (
            <View style={{ marginTop: 18 }}>
              <ThemedText style={styles.sectionTitle}>
                So‘nggi qabul qilinganlar
              </ThemedText>

              <View style={{ gap: 10 }}>
                {recent.map((t) => (
                  <ThemedView key={t.id} style={styles.recentCard}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.recentName}>
                        {t.productName}
                      </ThemedText>
                      <ThemedText style={styles.recentMeta}>
                        {t.quantity} × {t.price.toLocaleString()} ={" "}
                        {t.total.toLocaleString()} so'm
                      </ThemedText>
                      {!!t.notes && (
                        <ThemedText style={styles.recentNotes}>
                          {t.notes}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText style={styles.recentDate}>
                      {formatDate(t.date)}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

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
                      onPress={() => {
                        setSelectedProduct(item);
                        setPrice(String(ap));
                        setPickerOpen(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: "700" }}>
                          {item.name}
                        </ThemedText>
                        <ThemedText style={{ color: "#888", fontSize: 12 }}>
                          Zaxira: {item.stock} dona
                        </ThemedText>
                        <ThemedText style={{ color: "#888", fontSize: 12 }}>
                          Qabul: {ap.toLocaleString()} so'm
                        </ThemedText>
                        <ThemedText style={{ color: "#888", fontSize: 12 }}>
                          Sotuv: {sp.toLocaleString()} so'm
                        </ThemedText>
                      </View>
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
  total: {
    marginTop: 6,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 4,
  },
  recentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  recentName: {
    fontWeight: "800",
    marginBottom: 4,
  },
  recentMeta: {
    color: "#666",
    fontSize: 13,
  },
  recentNotes: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
  },
  recentDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    minWidth: 110,
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

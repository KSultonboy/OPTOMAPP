// app/(tabs)/index.tsx
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Product, useStore } from "@/context/AppContext";
import { ui } from "@/styles/ui";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function parsePositiveNumber(v: string) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getAcceptancePrice(p: Product) {
  return p.acceptancePrice ?? p.price ?? 0;
}

function getSalePrice(p: Product) {
  return p.salePrice ?? p.price ?? 0;
}

export default function WarehouseScreen() {
  const { products, addProduct, deleteProduct, updateProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModal, setIsAddModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newAcceptancePrice, setNewAcceptancePrice] = useState("");
  const [newSalePrice, setNewSalePrice] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAcceptancePrice, setEditAcceptancePrice] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  // Ombordagi umumiy qiymatni SOTUV narxi bo'yicha hisoblaymiz
  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.stock * getSalePrice(p),
        0
      ),
    [products]
  );

  const stockColor = (stock: number) =>
    stock === 0
      ? Colors.light.error
      : stock < 5
        ? Colors.light.warning
        : Colors.light.success;

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditAcceptancePrice(String(getAcceptancePrice(p) || ""));
    setEditSalePrice(String(getSalePrice(p) || ""));
    setIsEditModal(true);
  };

  const closeEdit = () => {
    setIsEditModal(false);
    setEditId(null);
    setEditName("");
    setEditAcceptancePrice("");
    setEditSalePrice("");
  };

  const handleAdd = async () => {
    const name = newName.trim();
    const ap = parsePositiveNumber(newAcceptancePrice);
    const sp = parsePositiveNumber(newSalePrice);

    if (!name) return Alert.alert("Xato", "Mahsulot nomini kiriting");
    if (!ap) return Alert.alert("Xato", "Qabul narxini to'g'ri kiriting");
    if (!sp) return Alert.alert("Xato", "Sotuv narxini to'g'ri kiriting");

    try {
      await addProduct(name, ap, sp);
      setNewName("");
      setNewAcceptancePrice("");
      setNewSalePrice("");
      setIsAddModal(false);
    } catch {
      Alert.alert("Xato", "Mahsulot qo'shishda xato yuz berdi");
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const name = editName.trim();
    const ap = parsePositiveNumber(editAcceptancePrice);
    const sp = parsePositiveNumber(editSalePrice);

    if (!name) return Alert.alert("Xato", "Mahsulot nomini kiriting");
    if (!ap) return Alert.alert("Xato", "Qabul narxini to'g'ri kiriting");
    if (!sp) return Alert.alert("Xato", "Sotuv narxini to'g'ri kiriting");

    try {
      await updateProduct(editId, {
        name,
        acceptancePrice: ap,
        salePrice: sp,
      });
      closeEdit();
    } catch {
      Alert.alert("Xato", "Mahsulotni yangilashda xato");
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const acceptancePrice = getAcceptancePrice(item);
    const salePrice = getSalePrice(item);

    return (
      <View style={styles.productCard}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.productName}>{item.name}</ThemedText>
          <ThemedText style={styles.priceRow}>
            Qabul:{" "}
            <ThemedText style={styles.priceValue}>
              {acceptancePrice.toLocaleString()} so'm
            </ThemedText>
          </ThemedText>
          <ThemedText style={styles.priceRow}>
            Sotuv:{" "}
            <ThemedText style={styles.priceValue}>
              {salePrice.toLocaleString()} so'm
            </ThemedText>
          </ThemedText>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: stockColor(item.stock) + "18" },
            ]}
          >
            <ThemedText
              style={[styles.stockText, { color: stockColor(item.stock) }]}
            >
              {item.stock} dona
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil" size={18} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { marginLeft: 8, backgroundColor: "#fff0f0" }]}
              onPress={() => {
                Alert.alert("Tasdiqlash", "Mahsulotni o'chirmoqchimisiz?", [
                  { text: "Bekor qilish", style: "cancel" },
                  {
                    text: "O'chirish",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteProduct(item.id);
                      } catch {
                        Alert.alert("Xato", "Mahsulotni o'chirishda xato");
                      }
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="trash" size={18} color="#c62828" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <View style={ui.container}>
        <View style={ui.header}>
          <View>
            <ThemedText type="title" style={ui.title}>
              Ombor
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Jami qiymat (sotuv narxi bo'yicha):{" "}
              {totalValue.toLocaleString()} so'm
            </ThemedText>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModal(true)}>
            <Ionicons name="add" size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Qidirish..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Mahsulot topilmadi</ThemedText>
            </View>
          }
        />

        {/* Add Modal */}
        <Modal
          visible={isAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddModal(false)}
        >
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Yangi mahsulot</ThemedText>
                <TouchableOpacity onPress={() => setIsAddModal(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <ThemedText style={ui.label}>Nomi</ThemedText>
              <TextInput
                style={ui.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Mahsulot nomi"
                placeholderTextColor="#999"
              />

              <View style={{ height: 12 }} />

              <ThemedText style={ui.label}>Qabul narxi (so'm)</ThemedText>
              <TextInput
                style={ui.input}
                value={newAcceptancePrice}
                onChangeText={setNewAcceptancePrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />

              <View style={{ height: 12 }} />

              <ThemedText style={ui.label}>Sotuv narxi (so'm)</ThemedText>
              <TextInput
                style={ui.input}
                value={newSalePrice}
                onChangeText={setNewSalePrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />

              <View style={{ height: 14 }} />

              <ThemedButton
                style={{ backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 14 }}
                onPress={handleAdd}
              >
                Qo'shish
              </ThemedButton>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={isEditModal}
          transparent
          animationType="slide"
          onRequestClose={closeEdit}
        >
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Mahsulotni tahrirlash</ThemedText>
                <TouchableOpacity onPress={closeEdit}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <ThemedText style={ui.label}>Nomi</ThemedText>
              <TextInput
                style={ui.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Mahsulot nomi"
                placeholderTextColor="#999"
              />

              <View style={{ height: 12 }} />

              <ThemedText style={ui.label}>Qabul narxi (so'm)</ThemedText>
              <TextInput
                style={ui.input}
                value={editAcceptancePrice}
                onChangeText={setEditAcceptancePrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />

              <View style={{ height: 12 }} />

              <ThemedText style={ui.label}>Sotuv narxi (so'm)</ThemedText>
              <TextInput
                style={ui.input}
                value={editSalePrice}
                onChangeText={setEditSalePrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />

              <View style={{ height: 14 }} />

              <ThemedButton
                style={{ backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 14 }}
                onPress={handleSaveEdit}
              >
                Saqlash
              </ThemedButton>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f4f6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f2f2f2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceRow: {
    fontSize: 13,
    color: "#666",
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  iconBtn: {
    backgroundColor: "#f4f4f4",
    padding: 8,
    borderRadius: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
});

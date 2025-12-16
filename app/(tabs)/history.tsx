// app/(tabs)/history.tsx
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Transaction, useStore } from "@/context/AppContext";
import { ui } from "@/styles/ui";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const { transactions, deleteTransaction, updateTransactionNotes } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const data = useMemo(() => {
    // eng so'nggisi yuqorida
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const getTypeText = (type: string) => (type === "sale" ? "Sotuv" : type === "acceptance" ? "Qabul" : type);
  const getTypeColor = (type: string) => (type === "sale" ? Colors.light.success : type === "acceptance" ? Colors.light.primary : "#9E9E9E");
  const getTypeIcon = (type: string) => (type === "sale" ? "arrow-up-circle" : type === "acceptance" ? "arrow-down-circle" : "ellipse-outline");

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const openEdit = (t: Transaction) => {
    setEditId(t.id);
    setEditNotes(t.notes || "");
    setEditOpen(true);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.typeRow}>
          <Ionicons name={getTypeIcon(item.type) as any} size={22} color={getTypeColor(item.type)} style={styles.typeIcon} />
          <View>
            <ThemedText style={styles.typeText}>{getTypeText(item.type)}</ThemedText>
            <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <ThemedText style={[styles.amount, { color: getTypeColor(item.type) }]}>
            {item.type === "sale" ? "+" : "-"}
            {item.total.toLocaleString()} so'm
          </ThemedText>

          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "#fff0f0" }]}
              onPress={() => {
                Alert.alert("Tasdiqlash", "Tranzaksiyani o'chirmoqchimisiz?", [
                  { text: "Bekor qilish", style: "cancel" },
                  {
                    text: "O'chirish",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteTransaction(item.id);
                      } catch {
                        Alert.alert("Xato", "Tranzaksiyani o'chirishda xato");
                      }
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="trash" size={18} color="#c62828" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => openEdit(item)}>
              <Ionicons name="pencil" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sep} />

      <View>
        <View style={styles.itemRow}>
          <ThemedText style={styles.itemName}>{item.productName}</ThemedText>
          <ThemedText style={styles.itemMeta}>
            {item.quantity} dona × {item.price.toLocaleString()}
          </ThemedText>
        </View>

        {!!item.notes && (
          <View style={styles.noteBox}>
            <Ionicons name="document-text-outline" size={14} color="#888" />
            <ThemedText style={styles.noteText}> {item.notes}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <View style={ui.container}>
        <View style={ui.header}>
          <ThemedText type="title" style={ui.title}>Tarix</ThemedText>
        </View>

        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Hozircha tarix yo'q</ThemedText>
            </View>
          }
        />

        <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <ThemedText type="subtitle">Izohni tahrirlash</ThemedText>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[ui.input, { minHeight: 110, textAlignVertical: "top" }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Izoh..."
                placeholderTextColor="#999"
                multiline
              />

              <View style={{ height: 12 }} />

              <ThemedButton
                style={{ backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 14 }}
                onPress={async () => {
                  if (!editId) return;
                  try {
                    await updateTransactionNotes(editId, editNotes.trim());
                    setEditOpen(false);
                  } catch {
                    Alert.alert("Xato", "Izohni yangilashda xato");
                  }
                }}
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
  card: {
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 10 },
  typeIcon: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 6 },
  typeText: { fontWeight: "900", fontSize: 16, color: "#333" },
  dateText: { color: "#888", fontSize: 12, marginTop: 2 },
  amount: { fontWeight: "900", fontSize: 15 },
  iconBtn: { padding: 8, borderRadius: 12, backgroundColor: "#f4f4f4" },
  sep: { height: 1, backgroundColor: "#f2f2f2", marginVertical: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontWeight: "700", fontSize: 15, color: "#444" },
  itemMeta: { fontSize: 13, color: "#888" },
  noteBox: { flexDirection: "row", alignItems: "flex-start", marginTop: 10, backgroundColor: "#f9f9f9", padding: 10, borderRadius: 12 },
  noteText: { fontSize: 13, color: "#666", fontStyle: "italic" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
});

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useStore } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const { login } = useStore();
    const [pin, setPin] = useState("");

    const handleLogin = async () => {
        try {
            const ok = await login(pin);
            if (ok) router.replace("/(tabs)");
            else {
                Alert.alert("Xato", "Noto'g'ri PIN kod");
                setPin("");
            }
        } catch (e: any) {
            Alert.alert(
                "Serverga ulanish xatosi",
                e?.message || "Network request failed. IP/PORT ni tekshiring."
            );
        }
    };

    const handleNumberPress = (num: string) => {
        if (pin.length < 4) setPin((p) => p + num);
    };

    const handleDelete = () => setPin((p) => p.slice(0, -1));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed" size={48} color={Colors.light.primary} />
                </View>

                <ThemedText type="title" style={styles.title}>Xush kelibsiz</ThemedText>
                <ThemedText style={styles.subtitle}>Kirish uchun PIN kodni kiriting</ThemedText>

                <View style={styles.pinDisplay}>
                    {[0, 1, 2, 3].map((i) => (
                        <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                    ))}
                </View>

                <View style={styles.keypad}>
                    {[
                        ["1", "2", "3"],
                        ["4", "5", "6"],
                        ["7", "8", "9"],
                        ["", "0", "del"],
                    ].map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((item, colIndex) => {
                                if (item === "") return <View key={colIndex} style={styles.key} />;
                                if (item === "del") {
                                    return (
                                        <TouchableOpacity key={colIndex} style={styles.key} onPress={handleDelete}>
                                            <Ionicons name="backspace-outline" size={24} color="#333" />
                                        </TouchableOpacity>
                                    );
                                }
                                return (
                                    <TouchableOpacity key={colIndex} style={styles.key} onPress={() => handleNumberPress(item)}>
                                        <ThemedText style={styles.keyText}>{item}</ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.loginButton, pin.length !== 4 && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={pin.length !== 4}
                >
                    <ThemedText style={styles.loginButtonText}>Kirish</ThemedText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    content: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.light.primary + "20",
        alignItems: "center", justifyContent: "center", marginBottom: 24,
    },
    title: { marginBottom: 8, color: "#333" },
    subtitle: { color: "#666", marginBottom: 40 },
    pinDisplay: { flexDirection: "row", gap: 20, marginBottom: 40 },
    pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.primary },
    pinDotFilled: { backgroundColor: Colors.light.primary },
    keypad: { width: "100%", maxWidth: 300, marginBottom: 30 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    key: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center" },
    keyText: { fontSize: 24, fontWeight: "600", color: "#333" },
    loginButton: { width: "100%", maxWidth: 300, backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: "center" },
    disabledButton: { opacity: 0.5 },
    loginButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
